# Phase 1 Data Model: Debt Entry & Progress

All types are client-side TypeScript. Import via the `#/` alias. This feature owns **debt** and
**derived progress**; it reads (never writes) the completed counts owned by Spec 001.

## Entities

### DebtState (owned by this feature, persisted by Spec 003)

```ts
// src/features/debt/types.ts
export interface DebtState {
  /** Missed obligatory-prayer debt, in whole days. null = not recorded yet; 0 = recorded, owes none. */
  prayerDebt: number | null
  /** Missed-fast debt, in whole days. null = not recorded yet; 0 = recorded, owes none. */
  fastDebt: number | null
}

export const INITIAL_DEBT: DebtState = { prayerDebt: null, fastDebt: null }
```

**Validation** (enforced before a value enters the store):

- `prayerDebt` / `fastDebt`, when set, are **non-negative integers** (`0` allowed). `null` only
  ever means "not yet recorded" (drives the empty state, FR-017).
- Values are replaced wholesale on save (FR-006); editing one category does not touch the other.

### CategoryKey

```ts
export type CategoryKey = 'prayer' | 'fast'
```

### CategoryProgress (derived — never stored)

```ts
export interface CategoryProgress {
  category: CategoryKey
  debt: number | null // null => empty state for this category
  completed: number // read from Spec 001 counters
  remaining: number // max(debt - completed, 0); 0 when debt is null
  /** Whole-number percent 0..100 when debt > 0; null when debt is null OR debt === 0. */
  percent: number | null
  /** UX state selector for messaging/rendering. */
  status: 'unset' | 'nothing-owed' | 'in-progress' | 'fully-met'
}
```

`status` decision table:

| Condition                       | status         | Meaning / copy                               |
| ------------------------------- | -------------- | -------------------------------------------- |
| `debt === null`                 | `unset`        | Empty state — invite the person to set debt  |
| `debt === 0`                    | `nothing-owed` | Neutral "nothing to make up" (not a failure) |
| `debt > 0 && completed >= debt` | `fully-met`    | Congratulatory, non-boastful; remaining = 0  |
| `debt > 0 && completed < debt`  | `in-progress`  | Show completed / remaining / percent         |

### DebtValidation (transient — form/estimator only)

```ts
export type DebtCountError =
  'empty' | 'not-a-number' | 'negative' | 'not-integer'
export type DateRangeError = 'empty' | 'end-before-start' | 'future-date'

export type DebtCountResult =
  { ok: true; value: number } | { ok: false; error: DebtCountError }

export type DateRangeResult =
  { ok: true; days: number } | { ok: false; error: DateRangeError }
```

### Reused from Spec 001 (read-only)

- `ProgressState` from `#/features/counters/types` — the source of completed counts.
- `salahMin(state)` → completed salah days; `state.fasts` → completed fast days.
- `formatYmdParts(days)` and `ProgressHeader` — render any day count as localized y/m/d (FR-016).

## Derivation rules

Given `DebtState` and the Spec 001 counters `ProgressState`:

```text
completedPrayer  = salahMin(counters)          // min across the five prayer counts
completedFast    = counters.fasts

remaining(debt, completed) = debt === null ? 0 : max(debt - completed, 0)

completionPercent(debt, completed):
    debt === null        -> null          // empty state
    debt === 0           -> null          // "nothing owed"
    debt > 0             -> min(round((completed / debt) * 100), 100)
```

## Worked examples (must match tests & SC-002)

| debt   | completed | remaining | percent | status         |
| ------ | --------- | --------- | ------- | -------------- |
| `null` | 120       | 0         | `null`  | `unset`        |
| 0      | 0         | 0         | `null`  | `nothing-owed` |
| 500    | 120       | 380       | 24      | `in-progress`  |
| 500    | 120→600   | 480       | 20      | `in-progress`  | (debt raised to 600)                       |
| 500    | 120       | 0         | 100     | `fully-met`    | (debt lowered to 100; completed 120 ≥ 100) |
| 500    | 500       | 0         | 100     | `fully-met`    |
| 3      | 1         | 2         | 33      | `in-progress`  | (round(33.33) = 33)                        |

`daysInRange` examples (estimator proposal):

| start        | end          | days |
| ------------ | ------------ | ---- |
| `2020-01-01` | `2020-01-31` | 30   |
| `2020-01-01` | `2020-01-01` | 0    |
| `2020-01-01` | `2021-01-01` | 366  | (2020 is a leap year) |

## State transitions

`DebtState` changes only via the entry form save (or the accepted estimator proposal):

```text
{ null, null }  --save prayer=500, fast=30-->  { 500, 30 }
{ 500, 30 }     --edit prayer=600 & save--->   { 600, 30 }   // fast untouched, completed untouched
{ 600, 30 }     --edit prayer=100 & save--->   { 100, 30 }   // remaining clamps to 0 if completed >= 100
```

Completed counts (Spec 001) are never mutated by any transition here.
