# Quickstart & Validation: Home Screen Counters

How to run the feature and verify it satisfies the spec. Run all commands from the repo root
(`D:\work\Back to web\Qada`).

## Prerequisites

- Node + npm installed, dependencies installed (`npm install` if `node_modules` is missing).

## Run the unit tests (count logic)

```bash
npm run test
```

Expected: the `calc.test.ts` suite passes — all `formatYmdParts`, `salahMin`, `surplus`, and
`clampNonNegative` cases from [contracts/module-contracts.md](contracts/module-contracts.md) are
green. This is the constitution-required proof that the count logic is correct.

Run a single file while developing:

```bash
npx vitest run src/features/counters/calc.test.ts
```

## Run the app

```bash
npm run dev        # starts on http://localhost:3000
```

If you added or renamed any file under `src/routes/`, regenerate the route tree:

```bash
npm run generate-routes
```

## Manual validation script (maps to spec acceptance scenarios)

Open http://localhost:3000 and confirm each item. Seed data is `40 / 41 / 40 / 42 / 40` and
fasts `30`.

| # | Spec ref | Action | Expected result |
|---|----------|--------|-----------------|
| 1 | US2 AS1 / SC-004 | Load the screen | Salah header reads **"1 month, 10 days"**; surpluses read **0 / 1 / 0 / 2 / 0**. |
| 2 | US2 AS2 / SC-003 | View on a 320px-wide viewport (devtools) | Salah + fast sections both fully visible; **no scrolling** (vertical or horizontal). |
| 3 | US2 AS3 | Look at the fast section | Shows progress in y/m/d ("1 month"); **no raw number**. |
| 4 | US1 AS1 / SC-002 | Tap `+` on Fajr once | Fajr surplus becomes **1**; an encouraging message appears; **no confirm prompt**. |
| 5 | US1 AS3 / FR-007 | Tap `+` several times | The encouragement message **varies** (no immediate repeat). |
| 6 | US3 AS1 | Tap `−` on any prayer | A **kind confirmation** dialog appears before any change. |
| 7 | US3 AS4 / SC-004 | From seed, confirm `−` on Fajr | Header becomes **"1 month, 9 days"**; surpluses become **0 / 2 / 1 / 3 / 1**. |
| 8 | US3 AS3 | Open `−` dialog, press Cancel / Esc | Nothing changes; dialog closes. |
| 9 | FR-010 | Decrement a counter down to 0, try again | Value stays **0**; decrement is disabled / does nothing. No negatives. |
| 10 | FR-017 | Tab through the screen; operate `+`/`−`/dialog with keyboard only | All controls reachable and operable; buttons have clear labels (check with a screen reader or the accessibility inspector). |
| 11 | FR-016 | Inspect DOM / temporarily set `dir="rtl"` on the root | Layout mirrors correctly (start/end, not left/right); no clipped or hardcoded-side elements. |
| 12 | FR-015 | Anywhere on the home screen | **No** debt / remaining / missed-days info is shown. |

## Build check (static output — Constitution III)

```bash
npm run build && npm run preview
```

Expected: builds to static assets and the preview serves the same working home screen with no
server runtime required.

## Lint & format gates

```bash
npm run check      # prettier --check
npm run lint       # eslint
```

Both must pass before the feature is considered done.

## Notes

- This feature keeps state in memory only; refreshing the page resets to seed data. Durable
  persistence is Spec 003, and Drive backup is Spec 005 — do not add storage here.
- If any manual check fails, fix the source under `src/features/counters/` or `src/i18n/` and
  re-run; do not modify `src/routeTree.gen.ts` by hand (it is generated).
