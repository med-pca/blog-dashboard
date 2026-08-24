# Backlog

Deferred work, with enough context to pick each item up without re-deriving it.

---

## Rebuild the Budget Planner as a real meal-cost calculator

**Status:** removed from the site on 2026-08-23, kept here for a later rewrite.
**Priority:** after AdSense approval — it is an enhancement, not a blocker.

### Why it was removed

The page at `/tasarruf-hesaplayici` and its hero widget were the solar
calculator inherited from the RenEl Enerji codebase, with the output labels
renamed to cooking terms. The maths underneath was never rewritten, so the
numbers it produced were meaningless — and in one case actively misleading.

Measured output of the shipped version, "Home Cooking" profile:

| Budget entered | "Weekly Cook Sessions" | "Average Prep Time" | "Estimated Yearly Savings" | Actual yearly budget |
| -------------- | ---------------------- | ------------------- | -------------------------- | -------------------- |
| $200 / month   | 0.6                    | ~3 min              | $2,400                     | $2,400               |
| $300 / month   | 1.1                    | ~6 min              | $3,600                     | $3,600               |
| $600 / month   | 1.7                    | ~9 min              | $7,200                     | $7,200               |
| $1,200 / month | 2.8                    | ~14 min             | $14,400                    | $14,400              |

What each field actually was:

- **Weekly Cook Sessions** — `systemKwp`, the peak power of a photovoltaic
  array in kilowatts. Hence the decimals.
- **Recipes In Your Plan** — `panelCount`, the number of 550 W solar panels.
- **Average Prep Time** — `roofArea`, the required roof surface in m².
- **Estimated Yearly Servings** — `annualProduction`, kWh generated per year.
- **Estimated Yearly Savings** — always **exactly 100 % of the annual budget**.
  The model sizes the array to cover the full annual consumption, so production
  always exceeds it, `remainingMonthlyKwh` falls to 0, and the "saving" becomes
  the entire bill. On a food site this told every visitor they would eat for free.

The three "Cooking Style" profiles were Turkish electricity tariffs
(`mesken` = residential, `ticarethane` = commercial, `sanayi` = industrial),
priced in TL/kWh from the July 2026 EPDK schedule, displayed behind a `$` sign.

### What was removed

| File | Action |
| ---- | ------ |
| `frontend/src/pages/TasarrufHesaplayici.jsx` | deleted |
| `frontend/src/lib/gesCalc.ts` | deleted |
| `frontend/src/lib/gesCalc.test.ts` | deleted (11 tests) |
| `frontend/src/components/Hero.jsx` | embedded widget + mobile CTA removed |
| `frontend/src/App.jsx` | route removed, plus the orphaned `open-chat` listener the calculator was the only dispatcher of |
| `frontend/src/components/Navbar.jsx` | "Tools" dropdown group removed (held only this link) |
| `frontend/src/components/Footer.jsx` | "Budget Planner" link removed |
| `backend/src/sitemap/sitemap.service.ts` | `/tasarruf-hesaplayici` removed from `STATIC_URLS` |
| `frontend/public/llms.txt` | entry removed |

Last commit containing the original files: `b1cb2fc`.
Recover with `git show b1cb2fcontend/src/lib/gesCalc.ts`.

### If it gets rebuilt

Build it from real cooking maths, not renamed solar maths:

- Inputs that mean something for a household: number of people, meals cooked at
  home per week, monthly grocery budget.
- Outputs that follow from those inputs: cost per serving, cost per meal,
  budget split across proteins / produce / pantry staples.
- No savings claim unless there is a defensible baseline to compare against —
  a savings figure is a financial promise and is the single thing that made the
  old version indefensible.
- Give it 300–600 words of surrounding copy explaining what it does, how to use
  it, and its assumptions. A tool page with no text around it is the most common
  AdSense rejection reason for utility pages.
- Re-add the route, the nav entry, the footer link, the `STATIC_URLS` entry and
  the `llms.txt` line — the list above is the complete set of touch points.

---

## Chatbot: leftovers from the removed WhatsApp handoff

**Status:** handoff removed on 2026-08-24. The chatbot now answers on the site
and never points anyone to another channel. What is listed here is what was
deliberately *not* removed with it.

### Kept for compatibility

- **`chat_leads.status` is still `character varying(20)`.** Only the values
  moved (`whatsapp` -> `assisted`, in migration
  `1785300000000-ChatLeadStatusTerminology`); the column type, its default and
  every index are untouched, so the release needs no schema change and rolls
  back with the migration's `down()`. If the status set is ever frozen, this is
  the place to turn it into an enum — `contact_requested` (17 chars) is the
  longest value the code can write today.
- **`contact_requested` is declared but never written.** It exists in
  `ChatLeadStatus`, in the admin filter and in the row renderer so the taxonomy
  is complete, but nothing emits it: the chatbot has no contact-form event.
  Wiring it means adding a chat event (`POST /api/chat/event`, which only
  accepts `type: 'open'` today) fired when a visitor leaves the chat for
  `/contact`, then calling a `markContactRequested(sessionId)` on
  `ChatLeadService`. Until then the admin's "went to the contact form" label is
  unreachable and the funnel has three steps, not four.

### Intentionally untouched legacy

- **`frontend/src/lib/whatsapp.ts`** (`WHATSAPP_ENABLED = false`, `WA_NUMBER`,
  `waLink`) and its test still exist. The chatbot no longer imports any of it,
  but `Footer.jsx`, `WhyUs.jsx`, `pages/neden-biz/NedenBizDetay.jsx` and
  `pages/projeler/ProjeDetay.jsx` still gate legacy call-to-action buttons on
  the flag. Removing the module means removing those four call sites too —
  a separate decision about the marketing pages, not about the chatbot.
  The re-enable warning at the top of that file (the Privacy Policy disclosure)
  still applies to those pages.
- **`frontend/nginx.conf.template`** maps a `whatsapp` user-agent to a
  rate-limit bucket. It matches crawlers hitting the site, has nothing to do
  with the chatbot, and stays.

### Language handling changed with it

The old prompt forced English and `ChatService` enforced it with a Turkish-leak
filter plus an LLM judge. The assistant now answers in the reader's language, so
the enforcement compares the reply against the reader's last message instead:
the deterministic filter only runs when the reader wrote English (that is the
"aylik" leak it was built for), and the judge decides every other pair. The
known gap: a Latin-script language the filter cannot tell apart from English
(Spanish, French, ...) is treated as English by the cheap pre-filter, so a reply
in that language is only cleared by the judge. If a non-English reader ever
reports getting the fixed fallback message, that pre-filter gate is the first
thing to look at.
