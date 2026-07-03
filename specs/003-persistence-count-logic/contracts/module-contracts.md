# Phase 1 Contracts: Local Persistence & Count Logic

Exact interfaces to implement. Match names and signatures precisely. Everything is client-side
TypeScript/React. Import from `src/*` via the `#/` alias. This feature adds durability behind the
existing Spec 001/002 store seams **without changing their public APIs**.

---

## 1. `src/lib/storage/progressRecord.ts` (schema + constants)

Export `ProgressRecord`, `SCHEMA_VERSION`, `STORAGE_KEY`, `DEFAULT_RECORD` exactly as defined in
data-model.md. No logic here — types and constants only.

---

## 2. `src/lib/storage/migrate.ts` (validation + migration — unit tested)

```ts
import type { ProgressRecord } from '#/lib/storage/progressRecord'

/**
 * Coerce an unknown (already JSON.parsed) value into a valid ProgressRecord.
 * Applies the data-model validation table; never throws; never returns negatives.
 * Missing/invalid shape => DEFAULT_RECORD. Missing prayer keys => 0. Bad numbers => clamped.
 */
export function parseRecord(value: unknown): ProgressRecord

/**
 * Version-aware entry point. version === SCHEMA_VERSION -> validate via parseRecord.
 * Older/absent/unknown version -> best-effort field map through parseRecord, set version.
 * Unrecognisable -> DEFAULT_RECORD.
 */
export function migrate(value: unknown): ProgressRecord
```

Helper (may be local, not exported): `toCount(n: unknown): number` → `Number.isFinite` check then
`Math.max(0, Math.trunc(n))`, else `0`; `toDebt(n: unknown): number | null` → `null` when `null`,
else clamped count, else `null`.

---

## 3. `src/lib/storage/persistence.ts` (Web Storage I/O)

```ts
import type { ProgressRecord } from '#/lib/storage/progressRecord'

export type SaveResult = { ok: true } | { ok: false; reason: 'unavailable' }

/** True if localStorage can be written+read (probe with a temp key in try/catch). */
export function isStorageAvailable(): boolean

/** Read + JSON.parse + migrate. Any failure => DEFAULT_RECORD. Never throws. */
export function loadRecord(): ProgressRecord

/** JSON.stringify + setItem in try/catch. Returns {ok:false,'unavailable'} on any throw. */
export function saveRecord(record: ProgressRecord): SaveResult

/**
 * Synchronous read-modify-merge-write of one or more top-level slices.
 * Loads the current record, shallow-merges `patch` (prayers is replaced wholesale by callers),
 * sets version = SCHEMA_VERSION and updatedAt = new Date().toISOString(), then saveRecord.
 * Returns the SaveResult. This is the atomic unit used by both stores.
 */
export function updateRecord(
  patch: Partial<Pick<ProgressRecord, 'prayers' | 'fasts' | 'prayerDebt' | 'fastDebt'>>,
): SaveResult

/**
 * Subscribe to same-device cross-tab changes. Attaches a window 'storage' listener filtered to
 * STORAGE_KEY and calls `listener` when another tab writes. Returns an unsubscribe function.
 */
export function subscribeExternal(listener: () => void): () => void
```

Rules:
- `updateRecord` callers pass their whole slice (counters → `{ prayers, fasts }`; debt →
  `{ prayerDebt, fastDebt }`), so the merge never partially updates a nested prayers object.
- No validation of caller input beyond the merge (callers already clamp via existing rules); load
  always re-validates.

---

## 4. `src/lib/storage/status.ts` (reactive storage-status)

```ts
export type StorageStatus = 'ok' | 'unavailable'

export function getStatus(): StorageStatus
export function subscribe(listener: () => void): () => void
/** Set to 'unavailable' (idempotent); called when a save fails or storage probe fails. */
export function markUnavailable(): void
/** React hook; re-renders on change. Built on useSyncExternalStore. */
export function useStorageStatus(): StorageStatus
```

Same shape as the Spec 001 counters store. Starts `'ok'`; flips to `'unavailable'` and stays.

---

## 5. Store edits (public APIs UNCHANGED)

### `src/features/counters/store.ts`

- Replace the hard-coded `INITIAL_STATE` seed: initialise `state` from
  `const r = loadRecord()` → `{ prayers: r.prayers, fasts: r.fasts }`.
- After every mutation (`incrementPrayer`/`decrementPrayer`/`incrementFast`/`decrementFast`), call
  `const res = updateRecord({ prayers: state.prayers, fasts: state.fasts })`; if `!res.ok` call
  `markUnavailable()`.
- Once (module load), `subscribeExternal(() => { const r = loadRecord(); setState({ prayers:
  r.prayers, fasts: r.fasts }) })` so other tabs refresh this tab. `setState` already notifies.
- `getState`, `subscribe`, `useCounters`, and all four mutators keep identical signatures.

### `src/features/debt/store.ts`

- Initialise `state` from `loadRecord()` → `{ prayerDebt, fastDebt }`.
- After `setPrayerDebt`/`setFastDebt`/`saveDebt`, call `updateRecord({ prayerDebt, fastDebt })`;
  on `!res.ok` call `markUnavailable()`.
- `subscribeExternal` to refresh `{ prayerDebt, fastDebt }` from `loadRecord()` on cross-tab change.
- `getState`, `subscribe`, `useDebt`, `setPrayerDebt`, `setFastDebt`, `saveDebt` unchanged.

**Import direction**: stores depend on `#/lib/storage/*`. `src/lib/storage/*` MUST NOT import from
any feature store (no cycles).

---

## 6. `src/features/storage/StorageStatusBanner.tsx` (gentle warning)

```ts
// No props. Reads useStorageStatus(); renders null when 'ok'.
// When 'unavailable': a calm banner with role="status", text via t('storage.unavailable.title')
// and t('storage.unavailable.body'). Uses Tailwind logical utilities; no color-only signalling
// (include a lucide icon + text). If a dismiss control is added, use the shadcn Button.
```

Mounted once in `src/routes/__root.tsx` inside the document body shell (above the router outlet),
so it appears on every screen when storage fails.

---

## 7. i18n keys (add to `src/i18n/en.ts`)

- `storage.unavailable.title` = "Progress may not be saved"
- `storage.unavailable.body` = "This device is blocking storage, so your changes might not be kept after you close the app. Your counts still work for now."

No English text may appear outside `en.ts`.

---

## 8. Tests — `src/lib/storage/persistence.test.ts` (constitution-required, FR-014/SC-003/SC-006)

Must cover (using jsdom `localStorage`, cleared between cases):
- `parseRecord`: valid record round-trips; non-object → DEFAULT; missing `prayers` → DEFAULT;
  missing prayer key → filled 0; negative/float numbers → clamped (`-3`→0, `2.9`→2); string debt →
  null; `null` debt kept.
- `migrate`: `version:1` validates; absent/`version:0`/unknown → coerced with version set to 1;
  garbage → DEFAULT.
- `saveRecord`+`loadRecord`: write then read yields an equal record (SC-001 shape).
- `loadRecord` on `localStorage['qada.progress.v1'] = '{ not json'` → DEFAULT_RECORD (FR-011).
- `updateRecord`: merging `{ prayerDebt: 500 }` leaves existing `prayers`/`fasts` intact; merging
  `{ prayers, fasts }` leaves debts intact (disjoint-slice guarantee, FR-015 basis).
- Unavailable path: monkeypatch `localStorage.setItem` to throw → `saveRecord`/`updateRecord`
  return `{ ok: false, reason: 'unavailable' }` and do not throw (FR-012).

Extend `src/features/counters/store.test.ts`: after 10 synchronous `incrementPrayer` on a seeded
count of 40, assert both the in-memory value **and** `loadRecord().prayers` equal 50 (SC-002 +
FR-006 display==storage).

---

## Definition of done for this contract set

1. `npm run test` passes (new `persistence.test.ts` + extended `store.test.ts` + existing calc
   tests all green).
2. `npm run dev`: record counts/debt, reload the tab (and toggle offline) → values restored;
   open a second tab, change a value, and the first tab converges.
3. Manual checks in quickstart.md all pass (offline reload, rapid-tap net, corrupted-data
   recovery, unavailable-storage banner, two-tab consistency, very-large values).
4. `npm run check` (Prettier) and `npm run lint` pass; Spec 001/002 components still work with no
   changes to their store APIs.
