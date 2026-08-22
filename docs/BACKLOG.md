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
