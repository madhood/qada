# Phase 1 Contracts: Debt Entry & Progress

These are the exact interfaces to implement. Match names and signatures precisely. Everything
here is client-side TypeScript/React. Import from `src/*` using the `#/` alias. This feature
**reads** Spec 001's counters store and calc; it never mutates them.

---

## 1. `src/features/debt/calc.ts` (pure functions — unit tested)

```ts
import type { DebtCountResult, DateRangeResult } from '#/features/debt/types'

/** Remaining make-up owed. null debt => 0. Never negative. */
export function remaining(debt: number | null, completed: number): number

/**
 * Whole-number completion percent, 0..100.
 * debt === null  -> null (empty state)
 * debt === 0     -> null ("nothing owed")
 * debt > 0       -> min(Math.round((completed / debt) * 100), 100)
 */
export function completionPercent(
  debt: number | null,
  completed: number,
): number | null

/**
 * Whole days elapsed from start to end, using UTC midnight of each ISO date (YYYY-MM-DD).
 * round((endUTC - startUTC) / 86_400_000). Assumes already-valid, non-future, ordered dates.
 */
export function daysInRange(startISO: string, endISO: string): number

/**
 * Parse a raw debt-count string. Accepts a non-negative integer (0 allowed).
 * Rejects empty/whitespace, non-numeric, negative, and non-integer values.
 */
export function validateDebtCount(raw: string): DebtCountResult

/**
 * Validate a date range against `today` (an ISO YYYY-MM-DD string, injected for testability).
 * Rejects empty endpoints, end-before-start, and any date after `today`.
 * On success returns { ok: true, days: daysInRange(start, end) }.
 */
export function validateDateRange(
  startISO: string,
  endISO: string,
  todayISO: string,
): DateRangeResult
```

**Required test cases** (`calc.test.ts`) — must all pass:

- `remaining`: `(null, 120)`→0; `(500, 120)`→380; `(100, 120)`→0; `(0, 0)`→0; `(500, 500)`→0.
- `completionPercent`: `(null, 120)`→null; `(0, 0)`→null; `(500, 120)`→24; `(100, 120)`→100
  (capped); `(3, 1)`→33 (rounded); `(500, 500)`→100.
- `daysInRange`: `('2020-01-01','2020-01-31')`→30; `('2020-01-01','2020-01-01')`→0;
  `('2020-01-01','2021-01-01')`→366.
- `validateDebtCount`: `''`→`{ok:false,'empty'}`; `'abc'`→`'not-a-number'`; `'-5'`→`'negative'`;
  `'3.5'`→`'not-integer'`; `'0'`→`{ok:true,0}`; `'500'`→`{ok:true,500}`.
- `validateDateRange` (today = `'2026-07-02'`): `('2020-01-01','2020-01-31',today)`→`{ok:true,30}`;
  `('2020-02-01','2020-01-01',today)`→`'end-before-start'`; `('2020-01-01','2999-01-01',today)`→
  `'future-date'`; `('','2020-01-01',today)`→`'empty'`.

---

## 2. `src/features/debt/store.ts` (in-memory reactive store — Spec 003 swaps for IndexedDB)

```ts
import type { DebtState } from '#/features/debt/types'

/** Read the current debt (do not mutate the returned object). */
export function getState(): DebtState

/** Subscribe to changes; returns an unsubscribe function. */
export function subscribe(listener: () => void): () => void

/** Replace one category's debt (whole value). Pass a non-negative integer or null. */
export function setPrayerDebt(days: number | null): void
export function setFastDebt(days: number | null): void

/** Replace both at once (used by the form's single Save). */
export function saveDebt(next: Partial<DebtState>): void

/** React hook returning the current debt; re-renders on change. Built on useSyncExternalStore. */
export function useDebt(): DebtState
```

Rules:

- Seed with `INITIAL_DEBT` (`{ prayerDebt: null, fastDebt: null }`) from data-model.md.
- Immutable updates (new `DebtState` object) then notify listeners, matching Spec 001's store so
  `useSyncExternalStore` detects changes by reference.
- The store performs **no** validation and **no** rendering; callers pass already-validated
  values. The store never reads or writes the counters store.

---

## 3. i18n keys (add to `src/i18n/en.ts`; text only lives here)

Add these keys (English values shown; no English text may appear outside `en.ts`):

- `nav.debt` = "Debt & progress", `nav.home` = "Back to counters"
- `debt.heading` = "Your make-up debt"
- `debt.prayer.label` = "Missed prayers (days)", `debt.fast.label` = "Missed fasts (days)"
- `debt.save` = "Save", `debt.saved` = "Saved"
- `debt.estimator.heading` = "Estimate from dates"
- `debt.estimator.start` = "From", `debt.estimator.end` = "Until"
- `debt.estimator.compute` = "Calculate days"
- `debt.estimator.proposal` = "That's {days} days — use this?", `debt.estimator.accept` = "Use it"
- `debt.error.empty` = "Please enter a number.", `debt.error.not-a-number` = "Please enter a whole number of days."
- `debt.error.negative` = "Days can't be negative.", `debt.error.not-integer` = "Please enter whole days only."
- `debt.error.end-before-start` = "The end date is before the start date."
- `debt.error.future-date` = "That date is in the future."
- `progress.heading` = "Your progress"
- `progress.prayer.heading` = "Prayers", `progress.fast.heading` = "Fasts"
- `progress.completed` = "{days} done", `progress.remaining` = "{days} to go", `progress.percent` = "{n}% complete"
- `progress.empty` = "Set your debt to see how far you've come."
- `progress.nothingOwed` = "Nothing to make up here — may Allah accept."
- `progress.fullyMet` = "You've completed this, alhamdulillah."

`t()` replaces `{var}` placeholders; `plural(unit, n)` is reused from Spec 001 for any y/m/d text.

---

## 4. Components (props contracts)

All are function components. Text comes from `t()` — never literal user-facing strings in JSX.
Use Tailwind **logical** utilities (`ps-*`, `pe-*`, `ms-*`, `me-*`, `text-start`, `text-end`).
Compose shadcn primitives from `#/components/ui/*`.

```ts
// DebtScreen.tsx — no props
// Route component for '/'debt'. <main dir={useDirection()}> with a back link to '/'.
// Stacks <DebtEntryForm/> and <ProgressView/>. Responsive, RTL/LTR safe.

// DebtEntryForm.tsx — no props
// Reads useDebt(); local input state for prayer & fast day counts (seeded from stored values).
// Uses shadcn Input + Label + Button. On Save: run validateDebtCount on each field; if valid,
// call store.saveDebt({ prayerDebt, fastDebt }) and announce t('debt.saved') in an aria-live
// region; if invalid, render the mapped t('debt.error.*') inline (text + icon, not color alone).
// Embeds <DateRangeEstimator onAccept={(days) => setPrayerDebtInput(days)} />.

interface DateRangeEstimatorProps {
  onAccept: (days: number) => void // fill the prayer-days input; person still saves explicitly
}
// DateRangeEstimator.tsx
// Two shadcn Input type="date" (start/end) with Labels. On "Calculate days":
// validateDateRange(start, end, todayISO); on error show t('debt.error.*'); on success show
// t('debt.estimator.proposal', { days }) with an "Use it" button that calls onAccept(days).
// todayISO = new Date().toISOString().slice(0,10).

interface CategoryProgressProps {
  category: 'prayer' | 'fast'
  debt: number | null
  completed: number
}
// CategoryProgress.tsx
// Derives remaining()/completionPercent() and the status (see data-model). Renders per status:
//   unset        -> t('progress.empty')
//   nothing-owed -> t('progress.nothingOwed')
//   fully-met    -> t('progress.fullyMet') + <Progress value={100}/> + remaining 0
//   in-progress  -> shadcn <Progress value={percent}/>, t('progress.percent',{n:percent}),
//                   completed & remaining shown via <ProgressHeader days={...}/> (y/m/d) wrapped
//                   in t('progress.completed'/'progress.remaining') — reuse Spec 001 ProgressHeader.

// ProgressView.tsx — no props
// Reads useDebt() and useCounters(); computes completedPrayer = salahMin(counters),
// completedFast = counters.fasts. Renders t('progress.heading') and:
//   <CategoryProgress category="prayer" debt={debt.prayerDebt} completed={completedPrayer}/>
//   <CategoryProgress category="fast"   debt={debt.fastDebt}   completed={completedFast}/>
```

---

## 5. shadcn primitives (added, first-party source)

Add via `npx shadcn@latest add input label progress` → `src/components/ui/{input,label,progress}.tsx`.
Verify each in RTL+LTR, preserve Radix accessibility, ensure they pass `npm run lint` / Prettier.
`Progress` (Radix) must expose `role="progressbar"` with `aria-valuenow/min/max`.

---

## 6. Route wiring

`src/routes/debt.tsx`:

```tsx
import { createFileRoute } from '@tanstack/react-router'
import { DebtScreen } from '#/features/debt/DebtScreen'

export const Route = createFileRoute('/debt')({ component: DebtScreen })
```

Then run `npm run generate-routes`. No route params, no loaders, no server functions (static —
Constitution III). Add a `<Link to="/debt">` (label `t('nav.debt')`) on `HomeScreen` that shows
no debt numbers; `DebtScreen` has a `<Link to="/">` back (label `t('nav.home')`).

---

## Definition of done for this contract set

1. `npm run test` passes (all `calc.test.ts` cases green).
2. `npm run dev` → `/debt` shows the entry form + progress; saving 500/30 then viewing progress
   with Spec 001 seed (salahMin 40, fasts 30) shows prayers 40/500 (8%) and fasts 30/30 fully-met.
3. Manual checks in quickstart.md all pass (both entry methods, validation, empty state,
   fully-met, no debt info on home, keyboard operable, no hardcoded strings, RTL mirrors).
4. `npm run check` (Prettier) and `npm run lint` pass.
