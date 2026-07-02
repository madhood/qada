# Phase 1 Data Model: Home Screen Counters

This feature has a tiny, in-memory data model. All numbers are **non-negative integers**.

## Types (define in `src/features/counters/types.ts`)

```ts
// The five daily prayers, in canonical display order.
export type PrayerKey = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha'

export const PRAYER_ORDER: readonly PrayerKey[] = [
  'fajr',
  'dhuhr',
  'asr',
  'maghrib',
  'isha',
] as const

// The complete on-screen state. Owned by the store; later specs persist it.
export interface ProgressState {
  // completed make-up count per prayer, in days (non-negative integer)
  prayers: Record<PrayerKey, number>
  // completed make-up fasting count, in days (non-negative integer)
  fasts: number
}

// One unit of the years/months/days breakdown (only non-zero units are emitted).
export interface YmdPart {
  unit: 'year' | 'month' | 'day'
  value: number // >= 1
}
```

## Initial / seed state

For this feature (no persistence yet), seed the store with the spec's worked example so the
screen is demonstrable and matches SC-004:

```ts
const INITIAL_STATE: ProgressState = {
  prayers: { fajr: 40, dhuhr: 41, asr: 40, maghrib: 42, isha: 40 },
  fasts: 30,
}
```

Spec 003 will replace this seed with data loaded from storage; the shape stays identical.

## Derivations (pure, computed on demand — never stored)

Let `p = state.prayers`.

| Derived value      | Definition                                            | Example (40/41/40/42/40)                    |
| ------------------ | ----------------------------------------------------- | ------------------------------------------- |
| `salahMin`         | `Math.min(p.fajr, p.dhuhr, p.asr, p.maghrib, p.isha)` | `40`                                        |
| `surplus(key)`     | `p[key] - salahMin` (always ≥ 0)                      | fajr 0, dhuhr 1, asr 0, maghrib 2, isha 0   |
| salah header parts | `formatYmdParts(salahMin)`                            | `[{month,1},{day,10}]` → "1 month, 10 days" |
| fast header parts  | `formatYmdParts(state.fasts)`                         | for 30 → `[{month,1}]` → "1 month"          |

## Mutations (via the store — see contracts/module-contracts.md)

| Action                 | Effect                        | Rules                                                         |
| ---------------------- | ----------------------------- | ------------------------------------------------------------- |
| `incrementPrayer(key)` | `p[key] += 1`                 | No confirm. Triggers encouragement rotation. (FR-006, FR-007) |
| `decrementPrayer(key)` | `p[key] = max(0, p[key] - 1)` | Only after confirmation. Never below 0. (FR-008–FR-010)       |
| `incrementFast()`      | `fasts += 1`                  | Same as prayer `+`. (FR-013)                                  |
| `decrementFast()`      | `fasts = max(0, fasts - 1)`   | Only after confirmation. Never below 0. (FR-013)              |

After any mutation the store notifies subscribers; components re-read derived values, so header
and surpluses update immediately (FR-014).

## Validation rules

- Counts are integers ≥ 0. `decrement*` clamps at 0 (FR-010). No direct text editing of counts
  exists in the UI (FR-011), so out-of-range input is not reachable through normal use.
- `surplus(key)` is guaranteed ≥ 0 because `salahMin` is the minimum of all prayer counts.
- `formatYmdParts` is total for all `days ≥ 0`; `days === 0` yields `[]` (rendered as the
  localized "0 days").

## Worked transition (SC-004 acceptance)

Start `40 / 41 / 40 / 42 / 40` → header "1 month, 10 days", surpluses `0/1/0/2/0`.
Confirm `decrementPrayer('fajr')` → `39 / 41 / 40 / 42 / 40`:

- new `salahMin = 39` → header parts `[{month,1},{day,9}]` → "1 month, 9 days"
- surpluses: fajr `0`, dhuhr `2`, asr `1`, maghrib `3`, isha `1` → `0/2/1/3/1`
