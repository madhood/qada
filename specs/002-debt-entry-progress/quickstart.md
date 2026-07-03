# Quickstart & Validation: Debt Entry & Progress

How to run feature 002 and prove it satisfies the spec. Assumes Spec 001 is in place (counters
store seeded `40/41/40/42/40`, fasts `30`).

## Prerequisites

```bash
npm install                 # ensures shadcn Radix deps are present
npx shadcn@latest add input label progress   # adds the primitives this feature composes
npm run generate-routes     # picks up src/routes/debt.tsx
```

## Run

```bash
npm run dev                 # http://localhost:3000  → open /debt
npm run test                # runs calc.test.ts (constitution-required count logic)
npm run check && npm run lint
npm run build && npm run preview   # static output (Constitution III)
```

## Manual validation script

Map each check to the spec. All must pass.

| #   | Action                                                                                        | Expected                                                                                        | Spec ref                      |
| --- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ----------------------------- |
| 1   | Open `/debt` with no prior debt                                                               | Encouraging empty state prompts "set your debt"; no error/blank numbers                         | FR-017, edge "no debt"        |
| 2   | Enter prayer=500, fast=30, Save; reload `/debt`                                               | Both values persist and show as current debt                                                    | FR-002/003/005, US1-AS1       |
| 3   | With debt 500 & completed salah 40 (seed)                                                     | Prayers progress shows completed 40, remaining 460, 8% complete                                 | FR-008/009, SC-002 pattern    |
| 4   | Set prayer debt to 100 (≤ completed via a higher completed) or fast debt 30 with completed 30 | Category shows fully-met, congratulatory non-boastful copy, remaining 0                         | FR-010, US2-AS3               |
| 5   | Use estimator: From `2020-01-01` Until `2020-01-31`, Calculate                                | Proposes 30 days; "Use it" fills the prayer-days input; you still Save explicitly               | FR-004, US1-AS2               |
| 6   | Estimator: end date before start                                                              | Gentle inline message; no estimate produced                                                     | FR-014, edge "reversed range" |
| 7   | Estimator: a future end date                                                                  | Gentle "future date" message; no estimate                                                       | FR-014                        |
| 8   | Enter debt `abc`, `-5`, `3.5`, or blank; Save                                                 | Each rejected with a gentle inline message; nothing saved                                       | FR-013, SC-006                |
| 9   | Enter debt `0`, Save                                                                          | Accepted; category shows neutral "nothing to make up" (not a failure)                           | FR-015, edge "zero debt"      |
| 10  | Edit prayer debt 500→600, Save; check home counters                                           | Completed counts unchanged; remaining recalculates to 480                                       | FR-006/007, SC-003, US3-AS1   |
| 11  | Open the home screen (`/`)                                                                    | No debt or remaining information anywhere; only a nav link to `/debt`                           | FR-011, SC-005                |
| 12  | Keyboard only: Tab through inputs, estimator, Save, and both nav links                        | Every control reachable, labeled, and operable; validity shown by text+icon (not color alone)   | FR-018/019                    |
| 13  | Set root `dir="rtl"`                                                                          | Layout mirrors via logical utilities; no clipped elements; no hardcoded strings outside `en.ts` | FR-018                        |
| 14  | Very large debt (e.g., 4000 days)                                                             | Debt/remaining render readably in y/m/d (e.g., "11 years, 1 month, 10 days")                    | FR-016, edge "very large"     |

## Success-criteria coverage

- **SC-001** (record both debts < 90s, no instructions): checks 2 & 5.
- **SC-002** (500 debt / 120 completed → 380 remaining, 24%): `remaining`/`completionPercent`
  unit tests + check 3 (numbers vary with the live completed count).
- **SC-003** (edits never change completed): check 10.
- **SC-004** (never negative, never >100%): unit tests (`remaining`, `completionPercent` cap) +
  checks 3, 4.
- **SC-005** (debt on 0 other screens): check 11.
- **SC-006** (100% invalid inputs/ranges rejected): checks 6, 7, 8.
- **SC-007** (≥85% understand progress on first view): validated in usability testing, not
  automated here.
