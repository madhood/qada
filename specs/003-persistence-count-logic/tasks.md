---
description: 'Task list for feature 003 — Local Persistence & Count Logic'
---

# Tasks: Local Persistence & Count Logic

**Input**: Design documents from `/specs/003-persistence-count-logic/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/module-contracts.md, quickstart.md

**Tests**: INCLUDED. The project constitution requires the count/derivation logic to be
tested (FR-014 / SC-007), so persistence + store + calc test tasks are part of this list.

**Organization**: Tasks are grouped by user story so each story is an independently testable
increment. All three stories are P1 and share the same store files, so US2/US3 build on the
store hydration done in US1 — this is called out in Dependencies.

> **Implementer note (build for a low-end AI — keep it simple)**: Every path and signature is
> spelled out. When in doubt, **copy the exact shapes** from
> [contracts/module-contracts.md](contracts/module-contracts.md) and
> [data-model.md](data-model.md), then make `src/lib/storage/persistence.test.ts` pass. Do not
> invent new APIs, do not change any existing public store signature, and add **no new npm
> dependency** (persistence uses the built-in `localStorage`).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different file, no dependency on an incomplete task)
- **[Story]**: US1 / US2 / US3 (setup, foundational, and polish tasks have no story label)

## Path Conventions

Single web app; all source under `src/` at the repository root. Import across modules with the
`#/` alias (e.g. `#/lib/storage/persistence`).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm the test environment; add nothing new.

- [ ] T001 Confirm the Vitest test environment is jsdom (which provides `localStorage`) in `vite.config.ts`; if a `test` block is missing, add `test: { environment: 'jsdom', globals: true }`. Add **no** new runtime dependency (this feature uses the built-in Web Storage API only). Verify `npm run test` runs the existing `calc.test.ts` / `store.test.ts` files.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The shared `src/lib/storage/` persistence layer. Every user story depends on it.

**⚠️ CRITICAL**: No user-story task may begin until this phase is complete.

- [ ] T002 [P] Create `src/lib/storage/progressRecord.ts` — export the `ProgressRecord` interface, `SCHEMA_VERSION = 1`, `STORAGE_KEY = 'qada.progress.v1'`, and `DEFAULT_RECORD` exactly as written in [data-model.md](data-model.md) §Entities. Import `PrayerKey` from `#/features/counters/types`. Types and constants only — no logic.
- [ ] T003 [P] Create `src/lib/storage/status.ts` — reactive storage-status store mirroring the Spec 001 counters-store pattern (module `let status`, `Set` of listeners, `useSyncExternalStore`). Export `StorageStatus`, `getStatus()`, `subscribe(listener)`, `markUnavailable()` (idempotent set to `'unavailable'`), and `useStorageStatus()` per [contracts/module-contracts.md](contracts/module-contracts.md) §4. Starts `'ok'`. No dependency on other new files.
- [ ] T004 Create `src/lib/storage/migrate.ts` — implement `parseRecord(value: unknown): ProgressRecord` and `migrate(value: unknown): ProgressRecord` per [contracts/module-contracts.md](contracts/module-contracts.md) §2 and the validation table in [data-model.md](data-model.md) §Validation. Include local helpers `toCount(n): number` (`Number.isFinite` → `Math.max(0, Math.trunc(n))`, else `0`) and `toDebt(n): number | null` (`null` stays `null`, number → clamped count, any other type → `null`). Never throw; unknown/absent version → coerce via `parseRecord` and set `version = SCHEMA_VERSION`; unrecognisable → `DEFAULT_RECORD`. Depends on T002.
- [ ] T005 Create `src/lib/storage/persistence.ts` — implement `isStorageAvailable()`, `loadRecord()`, `saveRecord(record)`, `updateRecord(patch)`, and `subscribeExternal(listener)`, plus the `SaveResult` type, exactly per [contracts/module-contracts.md](contracts/module-contracts.md) §3. `loadRecord` = read `STORAGE_KEY` → `JSON.parse` in try/catch → `migrate(...)`; any failure → `DEFAULT_RECORD`. `saveRecord`/`updateRecord` wrap writes in try/catch and return `{ ok: false, reason: 'unavailable' }` on throw. `updateRecord` does synchronous load → shallow-merge `patch` → set `version` + `updatedAt = new Date().toISOString()` → `saveRecord`. `subscribeExternal` attaches a `window` `'storage'` listener filtered to `STORAGE_KEY`. Depends on T002, T004.

**Checkpoint**: Storage layer exists and compiles. Stories can now begin.

---

## Phase 3: User Story 1 - My progress is still here when I come back (Priority: P1) 🎯 MVP

**Goal**: The Progress Record persists to `localStorage`, hydrates on startup, writes through on
every change, survives restart/offline, recovers safely from corrupt/missing data, converges
across tabs, and warns (never silently loses) when storage is blocked.

**Independent Test**: Record counts + a debt, close and reopen the tab while offline → every value
restored exactly (quickstart checks 1–3); corrupt the stored string → app loads a clean zero
state, no crash (check 6); block `setItem` → a calm banner appears and the tap still works
in-session (check 13); two tabs converge (check 12).

- [ ] T006 [US1] Create `src/lib/storage/persistence.test.ts` (Vitest + jsdom `localStorage`, cleared between cases) covering everything in [contracts/module-contracts.md](contracts/module-contracts.md) §8: `parseRecord` (valid round-trip; non-object → DEFAULT; missing `prayers` → DEFAULT; missing prayer key → filled `0`; `-3`→`0`, `2.9`→`2`; string debt → `null`; `null` debt kept); `migrate` (`version:1` validates; absent/`0`/unknown → coerced with `version` set to `1`; garbage → DEFAULT); `saveRecord`+`loadRecord` round-trip equal; `loadRecord` on `'{ not json'` → `DEFAULT_RECORD`; `updateRecord` disjoint-merge (writing `{ prayerDebt: 500 }` leaves `prayers`/`fasts` intact and vice-versa); unavailable path (monkeypatch `Storage.prototype.setItem` to throw → returns `{ ok: false, reason: 'unavailable' }`, does not throw). Depends on T002–T005.
- [ ] T007 [P] [US1] Edit `src/features/counters/store.ts` per [contracts/module-contracts.md](contracts/module-contracts.md) §5: replace the hard-coded `INITIAL_STATE` seed with `const r = loadRecord()` → `{ prayers: r.prayers, fasts: r.fasts }`; after every mutation (`incrementPrayer`/`decrementPrayer`/`incrementFast`/`decrementFast`) call `const res = updateRecord({ prayers: state.prayers, fasts: state.fasts })` and `if (!res.ok) markUnavailable()`; once at module load call `subscribeExternal(() => setState({ prayers: loadRecord().prayers, fasts: loadRecord().fasts }))`. Keep `getState`/`subscribe`/`useCounters` and all four mutator signatures identical. Import from `#/lib/storage/persistence` and `#/lib/storage/status`.
- [ ] T008 [P] [US1] Edit `src/features/debt/store.ts` per [contracts/module-contracts.md](contracts/module-contracts.md) §5: initialise `state` from `loadRecord()` → `{ prayerDebt, fastDebt }`; after `setPrayerDebt`/`setFastDebt`/`saveDebt` call `updateRecord({ prayerDebt: state.prayerDebt, fastDebt: state.fastDebt })` and `if (!res.ok) markUnavailable()`; add a module-load `subscribeExternal(...)` that refreshes `{ prayerDebt, fastDebt }` from `loadRecord()`. Keep `getState`/`subscribe`/`useDebt`/`setPrayerDebt`/`setFastDebt`/`saveDebt` signatures identical.
- [ ] T009 [P] [US1] Add the two `storage.*` keys to `src/i18n/en.ts` exactly as in [contracts/module-contracts.md](contracts/module-contracts.md) §7: `'storage.unavailable.title'` = "Progress may not be saved" and `'storage.unavailable.body'` = "This device is blocking storage, so your changes might not be kept after you close the app. Your counts still work for now." No English text anywhere but `en.ts`.
- [ ] T010 [US1] Create `src/features/storage/StorageStatusBanner.tsx` per [contracts/module-contracts.md](contracts/module-contracts.md) §6: no props; reads `useStorageStatus()`; returns `null` when `'ok'`; when `'unavailable'` renders a calm banner with `role="status"`, a lucide icon + text (not color-only), text via `t('storage.unavailable.title')` / `t('storage.unavailable.body')`, Tailwind **logical** utilities (e.g. `ps-`/`pe-`, `text-start`). If you add a dismiss control, use the shadcn `Button`. Depends on T003 (status) and T009 (i18n keys).
- [ ] T011 [US1] Mount `<StorageStatusBanner />` once in `src/routes/__root.tsx`, inside the `<body>` shell above the router outlet (near line 38, before `{children}`), so it shows on every screen when storage fails. Depends on T010.

**Checkpoint**: Data persists, restores offline, recovers from corruption, converges across tabs,
and warns on failure. US1 is independently demoable (quickstart checks 1–3, 6, 12, 13).

---

## Phase 4: User Story 2 - My taps are always counted correctly (Priority: P1)

**Goal**: Prove rapid `+`/`−` taps net exactly, operations are atomic, no value goes negative,
and the displayed number always equals the stored value. The mechanism (synchronous
read-modify-merge-write) is already delivered by `updateRecord` (T005) and the counters
write-through (T007); this story verifies it.

**Independent Test**: Run a known `+`/`−` sequence and assert the saved count equals the exact
net and matches the in-memory value (quickstart check 4); decrement at 0 stays 0 in storage
(check 5).

- [ ] T012 [US2] Extend `src/features/counters/store.test.ts` per [contracts/module-contracts.md](contracts/module-contracts.md) §8: seed `localStorage['qada.progress.v1']` (or the store) to a `fajr` count of 40, call `incrementPrayer('fajr')` 10 times synchronously, then assert **both** `getState().prayers.fajr === 50` **and** `loadRecord().prayers.fajr === 50` (SC-002 + FR-006 display==storage). Add a case: from a count of 0, `decrementPrayer('fajr')` leaves both in-memory and `loadRecord()` at 0 (FR-005, never negative). Reset `localStorage` between cases.

**Checkpoint**: Rapid-tap net correctness and never-negative behaviour are proven against storage.

---

## Phase 5: User Story 3 - Derived numbers are always correct (Priority: P1)

**Goal**: The derived values (salah minimum, per-prayer surplus, years/months/days formatting,
remaining debt, completion %) are correct for the full input matrix including zeros and very
large values. The math lives in the existing, unchanged Spec 001/002 `calc.ts`; this story
confirms/extends the tests so the matrix in the spec is covered.

**Independent Test**: Feed the count/debt matrix from the spec and confirm each derived output
matches the rule (quickstart checks 8–11, 14).

- [ ] T013 [P] [US3] Verify and, if any case is missing, extend `src/features/counters/calc.test.ts` to assert: counts 40/41/40/42/40 → salah progress 40 days rendered "1 month, 10 days" and surpluses 0/1/0/2/0 (US3-AS1); 730 days → "2 years, 10 days" (US3-AS2, 30-day month / 360-day year, non-zero units only); all-zero → "0 days", all surpluses 0 (US3-AS4); a `fasts`/completed value of ≥ 10,000 (e.g. 40000) formats without overflow/precision loss (edge "very large").
- [ ] T014 [P] [US3] Verify and, if any case is missing, extend `src/features/debt/calc.test.ts` to assert: debt 500, completed 120 → remaining 380 and completion 24% (US3-AS3); remaining is clamped `max(debt − completed, 0)` (never negative) and completion `min(..., 100)` (never > 100%) (FR-009, SC-004); debt 0 / all-zero → remaining 0 with no error (US3-AS4).

**Checkpoint**: All derived outputs are test-covered across the spec matrix.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Prove the whole feature green and validate against the quickstart.

- [ ] T015 Run `npm run test` and confirm all suites pass: new `src/lib/storage/persistence.test.ts`, extended `src/features/counters/store.test.ts`, and existing `calc.test.ts` files (FR-014 / SC-007).
- [ ] T016 [P] Run `npm run check` and `npm run lint`; fix any Prettier/ESLint issues (no semicolons, single quotes, trailing commas). Do **not** hand-edit `src/routeTree.gen.ts`.
- [ ] T017 Run `npm run build && npm run preview` and confirm the app builds to static assets with no server runtime (Constitution III).
- [ ] T018 Execute the manual validation script in [quickstart.md](quickstart.md) (checks 1–15): offline reload restore, rapid-tap net, decrement-at-zero, corrupted-data recovery, unavailable-storage banner, two-tab convergence, very-large values, and schema-version coercion. All checks must pass.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: no dependencies.
- **Foundational (Phase 2)**: after Setup. **Blocks all user stories.** Within it: T002 and T003 are parallel; T004 needs T002; T005 needs T002 + T004.
- **US1 (Phase 3)**: after Foundational. Delivers the MVP.
- **US2 (Phase 4)**: after Foundational; its test exercises the counters write-through from **T007 (US1)**, so run T007 first.
- **US3 (Phase 5)**: after Foundational; tests the unchanged `calc.ts`, so it can run any time after Setup, but is listed last by priority order.
- **Polish (Phase 6)**: after all desired stories.

### User Story Dependencies

- **US1 (P1)**: depends only on Foundational. Independently testable and demoable = the MVP.
- **US2 (P1)**: logically depends on US1's counters store edit (T007) for the write-through it asserts against.
- **US3 (P1)**: independent of US1/US2 (verifies pre-existing `calc.ts`); no code change unless a matrix case is missing.

### Within Each Story

- Write/extend the story's tests, then make them pass.
- Foundational modules (Phase 2) before any store edit.
- `store.ts` edits (T007/T008) before the banner mount validation.

### Parallel Opportunities

- **Phase 2**: T002 ∥ T003 (different files).
- **US1**: T007 ∥ T008 ∥ T009 (three different files); T006 can be written in parallel with the store edits it will validate.
- **US3**: T013 ∥ T014 (different test files).
- **Polish**: T016 ∥ others where safe.

---

## Parallel Example: Foundational + US1

```bash
# Phase 2 — schema and status stores in parallel:
Task: "T002 Create src/lib/storage/progressRecord.ts"
Task: "T003 Create src/lib/storage/status.ts"

# US1 — store edits and i18n in parallel (different files):
Task: "T007 Edit src/features/counters/store.ts (hydrate + write-through + cross-tab)"
Task: "T008 Edit src/features/debt/store.ts (hydrate + write-through + cross-tab)"
Task: "T009 Add storage.* keys to src/i18n/en.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 only)

1. Phase 1 Setup.
2. Phase 2 Foundational (the `src/lib/storage/` layer — blocks everything).
3. Phase 3 US1 (hydrate + write-through + cross-tab + recovery + banner).
4. **STOP and VALIDATE**: quickstart checks 1–3, 6, 12, 13. This alone delivers the core promise: "your progress is never lost."
5. Demo.

### Incremental Delivery

1. Setup + Foundational → storage layer ready.
2. US1 → durable, offline, recoverable, cross-tab, warned-on-failure persistence (MVP).
3. US2 → prove rapid-tap net + never-negative against storage.
4. US3 → confirm derived-number correctness matrix.
5. Polish → full test/build/quickstart pass.

---

## Notes

- **No new dependency**; persistence is the built-in `localStorage`.
- **Public store APIs are frozen** — Spec 001/002 components must keep working unchanged.
- `src/lib/storage/*` MUST NOT import any feature store (no cycles); stores depend on storage.
- The first-run default is a **clean zero state** (`DEFAULT_RECORD`) — the old 40/41/40/42/40 dev seed is intentionally retired.
- Commit after each task or logical group; never hand-edit `src/routeTree.gen.ts`.
