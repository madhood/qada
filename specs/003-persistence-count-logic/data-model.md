# Phase 1 Data Model: Local Persistence & Count Logic

All types are client-side TypeScript. Import via the `#/` alias. This feature persists the
combined data owned by Specs 001 (counters) and 002 (debt) as one record; it adds no new
user-facing data (per the spec's Assumptions).

## Entities

### ProgressRecord (the persisted snapshot — the local source of truth)

```ts
// src/lib/storage/progressRecord.ts
import type { PrayerKey } from '#/features/counters/types'

export interface ProgressRecord {
  version: number // SCHEMA_VERSION; enables migration
  prayers: Record<PrayerKey, number> // five completed counts, non-negative integers
  fasts: number // completed fast days, non-negative integer
  prayerDebt: number | null // null = not recorded yet; else non-negative integer
  fastDebt: number | null // null = not recorded yet; else non-negative integer
  updatedAt: string // ISO timestamp; auxiliary metadata only (never used in math)
}

export const SCHEMA_VERSION = 1
export const STORAGE_KEY = 'qada.progress.v1'

export const DEFAULT_RECORD: ProgressRecord = {
  version: SCHEMA_VERSION,
  prayers: { fajr: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 },
  fasts: 0,
  prayerDebt: null,
  fastDebt: null,
  updatedAt: '1970-01-01T00:00:00.000Z',
}
```

**Relationship to existing types**:
- `prayers` + `fasts` are exactly Spec 001's `ProgressState` fields.
- `prayerDebt` + `fastDebt` are exactly Spec 002's `DebtState` fields.
- The counters store owns/writes `prayers` + `fasts`; the debt store owns/writes `prayerDebt` +
  `fastDebt`. Disjoint keys ⇒ merged writes never clobber the other feature.

### Counter Operation (unit of consistency — conceptual)

A single increment or decrement of one counter. Realised as: mutate in-memory slice → call
`updateRecord(patch)` (synchronous load → merge → save). Atomic per operation; never negative
(clamped by the existing `clampNonNegative` before it reaches the store).

### Derived Values (computed, not stored — unchanged from Specs 001/002)

- Salah progress = `salahMin(prayers)`; per-prayer `surplus`; `formatYmdParts(days)` →
  years/months/days (30-day month, 360-day year, non-zero units) — `#/features/counters/calc`.
- `remaining(debt, completed)` = `max(debt − completed, 0)`; `completionPercent` =
  `min(round(completed/debt·100), 100)` for `debt > 0` — `#/features/debt/calc`.
- These are recomputed on demand from the record; this feature does not re-implement them.

## Validation rules (`parseRecord`, in `src/lib/storage/migrate.ts`)

Given an unknown parsed value, produce a valid `ProgressRecord` or fall back:

| Condition on input                                   | Result                                             |
| ---------------------------------------------------- | -------------------------------------------------- |
| not a non-null object                                | `DEFAULT_RECORD`                                    |
| missing/!object `prayers`                            | `DEFAULT_RECORD`                                    |
| any of the five prayer keys missing                  | fill that key with `0`                             |
| a prayer/`fasts` value not a non-negative integer    | clamp: `Math.max(0, Math.trunc(Number(n) || 0))`  |
| `prayerDebt`/`fastDebt` is `null`                    | keep `null`                                        |
| `prayerDebt`/`fastDebt` is a number                  | clamp to non-negative integer                      |
| `prayerDebt`/`fastDebt` any other type               | `null`                                             |
| `version` missing or not `SCHEMA_VERSION`            | route through `migrate` (see below)               |
| `JSON.parse` throws / read throws                    | `DEFAULT_RECORD`                                    |

Invariants after `parseRecord`: all five prayers present and ≥ 0 integers; `fasts` ≥ 0 integer;
debts are `null` or ≥ 0 integers; `version === SCHEMA_VERSION`. These guarantee FR-005 (never
negative) and FR-011 (safe consistent state).

## Migration (`migrate`, FR-013)

```text
migrate(raw):
  if raw.version === SCHEMA_VERSION -> validate fields (as above) and return
  else (older/unknown/absent):
    best-effort map known fields (prayers/fasts/prayerDebt/fastDebt) through the same clamps,
    set version = SCHEMA_VERSION
    if the shape is unrecognisable -> DEFAULT_RECORD
```

For v1 there are no prior versions; the branch exists so a future v2 adds one `case` without
touching `loadRecord` or the stores. The in-blob `version` is authoritative (the `v1` key suffix
is a convenience only).

## State transitions & write path

```text
startup:   loadRecord() -> validated ProgressRecord -> counters store hydrates {prayers,fasts},
           debt store hydrates {prayerDebt,fastDebt}

user op:   incrementPrayer('fajr')
             -> in-memory prayers.fajr += 1 (immutable), notify React
             -> updateRecord({ prayers, fasts })   // load -> merge -> save (sync, atomic)
             -> if SaveResult.ok === false -> status store = 'unavailable' (banner shows)

other tab: window 'storage' event on our key
             -> each store re-reads its slice via loadRecord() -> updates in-memory -> notify

recover:   corrupted/missing string on load -> DEFAULT_RECORD (zeros) -> app renders cleanly
```

## Worked examples (must match tests)

| Stored raw string                                             | loadRecord() result                                  |
| ------------------------------------------------------------- | ---------------------------------------------------- |
| (absent)                                                      | `DEFAULT_RECORD` (all zeros, debts null)             |
| `{"version":1,"prayers":{fajr:40,dhuhr:41,asr:40,maghrib:42,isha:40},"fasts":30,"prayerDebt":500,"fastDebt":30,...}` | restored exactly (SC-001, US1-AS1) |
| `"{ not json"` (invalid JSON)                                 | `DEFAULT_RECORD` (FR-011)                            |
| `{"prayers":{fajr:-3,...},"fasts":2.9,...}` (bad numbers)     | clamped: `fajr 0`, `fasts 2`; debts per rules        |
| `{"prayers":{fajr:5}}` (missing keys, no version)             | other prayers `0`, `fasts 0`, debts `null`, `version 1` |
| very large: `fasts: 40000`                                    | kept as `40000` (no overflow; edge "very large")     |
