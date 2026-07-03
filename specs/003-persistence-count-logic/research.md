# Phase 0 Research: Local Persistence & Count Logic

All decisions below resolve the Technical Context. No `NEEDS CLARIFICATION` remain.

## 1. Storage engine: localStorage over IndexedDB

- **Decision**: Use the Web Storage API (`localStorage`) as the on-device source of truth. Specs
  001/002 anticipated IndexedDB here; this plan revises that to `localStorage`.
- **Rationale**: The entire Progress Record is a handful of integers (~a few hundred bytes).
  `localStorage` is **synchronous**, so an increment is a single atomic read‑modify‑merge‑write
  with no async window — rapid `+`/`−` taps net exactly and can never interleave into a lost or
  doubled update (FR-003, FR-004). A whole-string `setItem` is atomic (never a partial record).
  The constitution explicitly allows "IndexedDB/local storage", so this is compliant. Far less
  code for a low-capability implementer.
- **Alternatives considered**: **IndexedDB** — transactional and better for large/complex data,
  but its async read‑modify‑write requires a serializing write queue to keep rapid taps correct,
  adding race surface and boilerplate unjustified for tiny data. Revisit only if the data model
  grows well beyond counters. **In-memory only** — rejected: violates the whole feature (no
  durability).

## 2. One versioned snapshot, not per-field keys

- **Decision**: Store the complete record under a single key `qada.progress.v1` as one JSON
  object `ProgressRecord` (see data-model.md). Each feature store writes only its own slice via a
  synchronous `updateRecord(patch)` that loads the current record, merges the patch, and saves.
- **Rationale**: A single object write is atomic and trivially consistent — there is never a
  moment where prayers are saved but the debt is not. Because counters own `prayers`/`fasts` and
  debt owns `prayerDebt`/`fastDebt` (disjoint keys), the merge means the two features never
  clobber each other's data. One key also makes migration and Drive-sync (Spec 005) a single blob.
- **Alternatives considered**: A key per field/feature (rejected — multi-key writes are not
  atomic together and complicate migration and the future single-blob Drive sync).

## 3. Rapid-tap correctness (FR-003, FR-004, SC-002)

- **Decision**: The in-memory reactive store stays the fast path and is updated first
  (immutable object, notify listeners). Immediately after, the store calls `updateRecord` to
  persist synchronously. Since JS on one tab is single-threaded and `localStorage` is
  synchronous, ten taps in three seconds apply as ten ordered atomic writes → saved value is the
  exact net.
- **Rationale**: No debounce/batch is needed for correctness; each op fully settles before the
  next runs. Display equals storage the instant an op returns (FR-006).
- **Alternatives considered**: Debounced/batched persistence (rejected — introduces a window
  where a close/refresh loses the last taps, and complicates the "display equals storage"
  guarantee for no benefit at this data size).

## 4. Validation & safe recovery on load (FR-011, edge: corrupted data)

- **Decision**: `loadRecord()` reads the raw string, `JSON.parse` in a try/catch, then
  `parseRecord(value)`:
  - If the value is not an object, is missing `prayers`, or has the wrong shape → return
    `DEFAULT_RECORD` (clean zero state).
  - Otherwise coerce each numeric field with a non-negative-integer clamp (`Math.max(0,
    Math.trunc(n))`; non-finite → 0); ensure all five prayer keys exist (missing → 0); `prayerDebt`
    / `fastDebt` accept `null` or a clamped non-negative integer.
  Any thrown error anywhere in load → `DEFAULT_RECORD`. The app never crashes or shows garbage.
- **Rationale**: Best-effort coercion preserves as much real data as possible while guaranteeing
  a consistent, non-negative result (FR-005, FR-011). Falling back to zero (not the dev seed) is
  the correct "safe consistent state".
- **Alternatives considered**: Reject-whole-record on any bad field (rejected — loses good data
  unnecessarily); a JSON-schema library (rejected — new dependency for a tiny hand-written check).

## 5. Schema versioning & migration (FR-013, SC-006)

- **Decision**: `ProgressRecord.version` (number), `SCHEMA_VERSION = 1`. `migrate(raw)` inspects
  `raw.version`: equal → validate & use; **older/unknown** → run best-effort field mapping (for
  v1 there are no priors, so unknown/absent version is treated as "coerce with parseRecord"); if
  mapping is impossible → `DEFAULT_RECORD`. The migration seam exists now so future versions add
  a case without touching callers.
- **Rationale**: Guarantees old data stays readable after updates without loss, and gives a clear
  place to add upgrades later. Keeping the version in the blob (not just the key name) makes the
  future Drive-synced blob self-describing.
- **Alternatives considered**: Encoding version only in the key (`...v1`, `...v2`) (rejected —
  harder to migrate a loaded blob and to sync; we keep both the key suffix and an in-blob field,
  in-blob wins for logic).

## 6. Cross-tab consistency (FR-015, edge: concurrent tabs)

- **Decision**: `persistence.subscribeExternal(cb)` attaches a `window` `storage` event listener
  filtered to our key; on fire, each feature store re-reads its slice via `loadRecord()` and
  updates its in-memory state (notifying React). Each write is a fresh load→merge→save, so a tab
  merges the latest persisted record before writing.
- **Rationale**: The `storage` event fires in *other* tabs on every write, so all tabs converge
  to the last saved record. Because features write disjoint slices with a merge, a prayers write
  in tab A and a debt write in tab B never produce an inconsistent total (FR-015). Within the
  same slice across tabs, last-writer-wins on the same device is acceptable; true multi-device
  conflict resolution is Spec 005.
- **Alternatives considered**: `BroadcastChannel` (rejected — extra API for no gain over the
  `storage` event, which we already need); locking (rejected — over-engineered for same-device
  single-slice writes).

## 7. Storage-unavailable UX (FR-012, SC-005, edge: blocked/quota)

- **Decision**: `saveRecord`/`updateRecord` wrap writes in try/catch and return a `SaveResult`
  (`{ ok: true }` or `{ ok: false; reason: 'unavailable' }`). A tiny reactive `status.ts` store
  flips to `'unavailable'` on the first failed write (or when `isStorageAvailable()` is false at
  startup). `StorageStatusBanner` (mounted in `__root.tsx`) reads `useStorageStatus()` and shows a
  calm, non-shaming `t('storage.unavailable.*')` message with `role="status"`. In-memory state
  still updates so the current session keeps working; the person is simply warned it may not
  persist.
- **Rationale**: Satisfies "never silently lose data" while keeping the app usable. Detecting via
  a real write attempt (not just feature-detection) catches private-mode and quota cases.
- **Alternatives considered**: Throwing/blocking the action (rejected — punishes the user for a
  device limitation); a modal (rejected — too heavy; a passive banner is kinder and less
  interruptive, Principle I).

## 8. First-run default = clean zero state (supersedes 001/002 dev seeds)

- **Decision**: `DEFAULT_RECORD` = all five prayers `0`, `fasts 0`, `prayerDebt null`, `fastDebt
  null`, `version 1`, `updatedAt` set at write time. The stores now hydrate from storage, so a
  brand-new user starts at zero; the `40/41/40/42/40` / `fasts 30` seeds used in Specs 001/002
  were development placeholders and are intentionally retired by real persistence.
- **Rationale**: A real first-run user owes/has nothing recorded yet; zero is the correct,
  honest starting point and matches the FR-011 "clean zero state" recovery. The 001/002 acceptance
  numbers were *preconditions for testing*, not required defaults, and remain reproducible by
  entering them.
- **Alternatives considered**: Keeping the demo seed as the default (rejected — ships fake
  progress to real users); a build-time flag to seed in dev only (deferred — not needed; tests set
  their own preconditions by writing `localStorage`).

## 9. `updatedAt` timestamp is auxiliary (edge: clock changes)

- **Decision**: `updatedAt` (ISO string) is written on each save purely as metadata to aid future
  Drive-sync conflict ordering. No count or derived value is ever computed from the clock.
- **Rationale**: Changing the device clock cannot corrupt counts (FR / edge "clock changes"),
  because counts are stored numbers, not time-derived. The field is safe to ignore on load.
- **Alternatives considered**: Omitting the timestamp (acceptable, but including it now avoids a
  schema bump when Spec 005 needs it; it costs nothing and is non-authoritative).
