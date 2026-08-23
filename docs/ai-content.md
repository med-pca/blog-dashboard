# AI blog generation

Autonomous blog-draft generation. An administrator writes one editorial brief
("the master prompt") and a cadence; the backend then finds an original topic,
writes the article with OpenAI, sanitises it and stores it **as a draft**.
Publishing always stays a manual decision — nothing ever goes live on its own.

This feature shares the OpenAI layer in `src/ai/` with the chatbot and the project
auto-fill, but stays operationally separate:
different keys, different queue. Turning one off does not affect the other.

Each deployed instance (pulserecipe.com, cookwithvibe.com, nextstoptips.com …)
keeps its own database, Redis, campaigns, drafts and logs. There is no shared
tenant store.

---

## 1. Getting an OpenAI key

1. Sign in at <https://platform.openai.com/api-keys>.
2. **Create new secret key**, scope it to the project you bill this site from.
3. Copy the key once — it is not shown again.

The key is read only by `backend/src/ai-content/providers/openai.provider.ts`.
It is never returned by an endpoint, never sent to the frontend, and it is
stripped from every error message before that message reaches
`ai_generation_jobs`, `app_logs` or Sentry (`lib/errors.ts → redactSecrets`).

Never commit a real key. `backend/.env` is gitignored; `backend/.env.example`
carries placeholders only.

## 2. Environment variables

| Variable | Default | Meaning |
| --- | --- | --- |
| `AI_CONTENT_ENABLED` | `false` | Master switch. `true` starts the scheduler and the BullMQ worker. |
| `OPENAI_API_KEY` | — | **Required only when `AI_CONTENT_ENABLED=true`.** Boot fails fast otherwise. |
| `OPENAI_MODEL` | `gpt-5-nano` | Model used for both topic ideas and the article. |
| `AI_DAILY_MAX_PER_CAMPAIGN` | `100` | Hard ceiling per campaign per local day, whatever `dailyTarget` says. |
| `AI_WORKER_CONCURRENCY` | `1` | BullMQ worker concurrency. Keep at 1: generations are meant to be spread out. |
| `AI_DEFAULT_INTERVAL_MINUTES` | `20` | Interval a new campaign starts with. |
| `AI_MAX_ATTEMPTS` | `3` | Attempts per job before a transient failure becomes final. |
| `AI_REQUEST_TIMEOUT_MS` | `120000` | Timeout for one OpenAI call. |
| `AI_COST_INPUT_PER_MTOK` | — | Optional USD/1M input tokens override for the cost estimate. |
| `AI_COST_OUTPUT_PER_MTOK` | — | Optional USD/1M output tokens override. |

With `AI_CONTENT_ENABLED=false` the backend boots normally, the admin screens
stay usable (campaigns can be created and edited), and no worker, no queue
connection and no OpenAI client are created.

### Local setup

```bash
# backend/.env  (gitignored)
AI_CONTENT_ENABLED=true
AI_IMAGE_ENABLED=true
OPENAI_IMAGE_MODEL=gpt-image-2
AI_IMAGE_SIZE=1536x1024
AI_IMAGE_QUALITY=medium
OPENAI_API_KEY=sk-proj-...
OPENAI_MODEL=gpt-5-nano
```

Then run the migrations and start the backend as usual.

### Coolify variables to add

Add these to the application's environment in Coolify, then redeploy. Only the
first two are strictly needed; the rest have working defaults.

```
AI_CONTENT_ENABLED=true
OPENAI_API_KEY=sk-proj-...
OPENAI_MODEL=gpt-5-nano
AI_DAILY_MAX_PER_CAMPAIGN=100
AI_WORKER_CONCURRENCY=1
AI_DEFAULT_INTERVAL_MINUTES=20
AI_MAX_ATTEMPTS=3
AI_REQUEST_TIMEOUT_MS=120000
```

`docker-compose.yml` passes all of them through to the `backend` service with
the same defaults, so an instance that sets nothing behaves exactly as before.

## 3. Migrations

The schema is managed by migrations only; `synchronize` is never enabled.

```bash
cd backend
npm run migration:show     # what is pending
npm run migration:run      # apply
npm run migration:revert   # roll back the last one
```

`1784700000000-CreateAiContent` creates `ai_content_campaigns` and
`ai_generation_jobs`, and adds `blog_posts.aiGenerated`. Its `down()` reverses
all three. In production the backend applies pending migrations on boot
(`migrationsRun: true`), so a Coolify redeploy is enough.

## 4. The worker

There is no separate worker process. The BullMQ worker is started inside the
backend container by `AiGenerationProcessor.onModuleInit()`, and only when
`AI_CONTENT_ENABLED=true` and a key is present. Queue name:
`ai-blog-generation`, on the same Redis the rest of the app uses.

On boot the log line tells you which state you are in:

```
[AiContentConfig] AI content generation enabled (model=gpt-5-nano, concurrency=1)
[AiGenerationProcessor] AI generation worker listening on "ai-blog-generation" (concurrency 1)
```

or

```
[AiContentConfig] AI content generation disabled — scheduler and worker are not started
```

## 5. Creating a campaign

Admin panel → **AI Campaigns** → **New Campaign**.

| Field | Notes |
| --- | --- |
| Name | Free text, for your own reference. |
| Main instruction | The standing brief. At least 20 characters, at most 4000. |
| Language / Tone | Passed to the model verbatim. |
| Keywords | Up to 20, at most 60 characters each. |
| Target length | 500–3000 words. |
| Articles per day | 1 … `AI_DAILY_MAX_PER_CAMPAIGN`. |
| Interval | Minimum 5 minutes. |
| Start / End hour | Local window. End hour 24 means midnight. Overnight windows are not supported. |
| Timezone | IANA zone; drives both the window and the daily counter reset. |
| Active | Paused campaigns never schedule anything. |

An example brief:

```
Write simple, budget-friendly family recipes in English.
Use ingredients that are easy to find in the United States.
Produce original, detailed recipes.
Avoid recipes that already exist on the site.
Do not invent statistics, testimonials or quotes.
```

### The window warning

The form computes, live:

```
requiredMinutes  = (dailyTarget - 1) x intervalMinutes
availableMinutes = (endHour - startHour) x 60
```

40 articles × 20 minutes needs **780 minutes (13 h)** between the first and the
last launch; an 08:00–22:00 window offers 840 minutes, so it fits with the last
article starting around 21:00. Add generation time and the campaign occupies
roughly 13 h 20 m of the day.

If the window is too short the form shows how long is needed, how long is
available, and suggests either a shorter interval or fewer articles. It is a
**warning, not a block** — and concurrency is never raised automatically to
compensate.

## 6. Starting small, then scaling to 40/day

1. Create the campaign with **Articles per day = 2**, **Interval = 20**, and
   leave it **paused**.
2. Open the campaign and press **Generate one test draft**. This produces a
   single draft, does **not** move the daily counter, and works even while the
   campaign is paused.
3. Review the draft under **Blog** (it carries an **AI Draft** badge). Check
   tone, length, factual restraint and formatting. Adjust the main instruction
   and repeat until you are happy.
4. **Resume** the campaign and let it run a day at 2/day. Read **AI Generation
   Logs** for failures and token cost.
5. Raise `dailyTarget` gradually — 5, then 10, then 20 — checking the cost line
   on the campaign page each time.
6. For 40/day set **Articles per day = 40**, **Interval = 20**, and a window of
   at least 13 hours (for example 08:00–22:00). The form confirms the plan fits
   before you save.

Budget check: the campaign page reports input tokens, output tokens and the
estimated cost, all derived from the token counts the provider actually
reported for each run — not from a guess.

## 7. Stopping generation immediately

In order of escalation:

1. **Pause the campaign** — admin panel → AI Campaigns → the pause button, or
   the **Pause** button on the campaign page. No new jobs are scheduled, and a
   job already in flight is cancelled when it starts rather than producing a
   draft.
2. **Stop every campaign at once** — set `AI_CONTENT_ENABLED=false` in Coolify
   and redeploy. The scheduler returns immediately and the worker is not
   started. Campaigns keep their settings; nothing is lost.
3. **Revoke the key** — delete it at platform.openai.com. Runs then fail with
   `AUTH_REJECTED` and are recorded, without retrying.

Nothing above deletes drafts already created; they simply stay unpublished.

## 8. Reading the logs

Admin panel → **AI Campaigns** → **Generation logs** (or the **View logs**
button on a campaign, which arrives pre-filtered).

Each row is one generation attempt: campaign, topic, status, trigger
(`scheduled` / `manual` / `retry` / `test`), attempt count, planned/started/
finished times, duration, model, input and output tokens, estimated cost, the
draft it created, and the error when it failed. Filters: campaign, status,
trigger type and date range. Pagination is done in the database, 25 per page.

Failure codes you will actually see:

| Code | Kind | Meaning |
| --- | --- | --- |
| `RATE_LIMITED` | transient | OpenAI 429. Retried with exponential backoff. |
| `UPSTREAM_5xx` / `TIMEOUT` | transient | Upstream error or timeout. Retried. |
| `OUTPUT_TRUNCATED` | transient | Reply hit the token ceiling. Retried. |
| `AUTH_REJECTED` | permanent | Key rejected. Not retried. |
| `INVALID_JSON` | permanent | Reply was not valid JSON for the schema. Not retried. |
| `EMPTY_CONTENT` / `CONTENT_TOO_SHORT` / `INVALID_HTML` | permanent | Body did not survive validation or sanitising. |
| `TOPIC_EXHAUSTED` | permanent | No original topic after three rounds. Broaden the brief. |
| `DUPLICATE_TITLE` | permanent | Finished article drifted onto an existing one. |
| `CAMPAIGN_PAUSED` / `DAILY_TARGET_REACHED` | cancelled | Conditions changed while the job waited. |
| `WORKER_LOST` | failed | Worker was interrupted; the slot was released by the reaper. |

A failed or cancelled row can be re-run with the **Retry** button. That creates
a **new** job row with `triggerType=retry`, so the original failure stays
readable.

## 9. Behaviour after a restart

- The scheduler creates jobs with a deterministic queue id derived from the
  campaign and its pending `nextGenerationAt`, unique in the database. A restart
  re-plans the identical job instead of a second one.
- Two backends ticking at the same minute are serialised by a Redis lock, and by
  the unique constraint underneath it.
- A backlog is never replayed. If the backend was down for five hours, the
  campaign resumes with **one** job and then goes back to its normal interval.
- A worker killed mid-generation leaves a `running` row; the scheduler's reaper
  releases it (`WORKER_LOST`) so the campaign is not stuck. The budget is at
  least 30 minutes and grows with `AI_MAX_ATTEMPTS`, so a job that is still
  backing off between retries is never reaped.
- The daily counter resets on the campaign's own timezone, not the server's.
- A retry never counts as a new article: the counter only moves when a draft is
  actually created.

## 10. Guarantees worth knowing

- **Drafts only.** `published: false`, `publishedAt: null`, `coverImage: null`
  are forced on write; the model's JSON schema has no publication field at all.
- **No duplicates.** Topics are normalised (lowercase, accents stripped,
  punctuation removed) and compared against every post title and slug, plus
  queued/running/succeeded jobs and this campaign's recent failures, using a
  trigram similarity score — not exact equality.
- **Sanitised HTML.** Generated bodies are narrowed to
  `p h2 h3 ul ol li strong em blockquote a` before they even reach the blog
  service, which sanitises again on write.
- **Slug safety.** Reserved slugs are rejected, collisions get `-2`, `-3` … and
  a concurrent insert is retried rather than lost.
- **No secrets in the database.** Errors are redacted before storage.
- **No images, no web search** in this version. Briefs should ask for evergreen
  content.
