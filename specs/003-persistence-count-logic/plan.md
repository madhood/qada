# Implementation Plan: Local Persistence & Count Logic

**Branch**: `003-persistence-count-logic` | **Date**: 2026-07-03 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/003-persistence-count-logic/spec.md`

**Audience note**: This plan is written to be followed by a low-capability implementer. Every
file path, function signature, and rule is spelled out. When in doubt, copy the shapes in
[contracts/module-contracts.md](contracts/module-contracts.md) exactly and make the tests in
`persistence.test.ts` pass. This feature adds durability + correctness **behind** the existing
Spec 001 (counters) and Spec 002 (debt) store seams without changing their public APIs.

## Summary

Persist the complete Progress Record — the five prayer completed counts, the fast count, and the
prayer/fast debt — to the device using a single **versioned JSON snapshot in `localStorage`**, so
everything survives restarts and works fully offline. The in-memory reactive stores from Specs
001/002 become the fast source of truth that **hydrates from** and **writes through** to this
snapshot on every change. Writes are synchronous read‑modify‑merge‑write, which makes rapid
`+`/`−` taps atomic and correct by construction (no lost/doubled counts, never negative). On load
the snapshot is validated and, if missing/unreadable/invalid, the app recovers to a safe zero
state. A `storage` event listener keeps multiple tabs consistent. If storage is unavailable or a
write fails, a gentle banner tells the person their progress may not be saved on this device
rather than losing it silently. The constitution-required count/derivation logic (min, surplus,
remaining, completion %, y/m/d) is already implemented in Specs 001/002 calc and is covered by
tests; this feature adds persistence tests and a shared record schema that Spec 005 (Drive sync)
will reuse unchanged.

## Technical Context

**Language/Version**: TypeScript 6 (strict), React 19

**Primary Dependencies**: TanStack Start + TanStack Router, Vite 8, Tailwind CSS v4, shadcn/ui
(for the banner's controls). **No new runtime dependency** — persistence uses the built-in Web
Storage API (`localStorage`).

**Storage**: `localStorage`, one versioned key `qada.progress.v1` holding a single JSON
`ProgressRecord`. Synchronous access → atomic per-operation read‑modify‑write. This replaces the
purely in-memory seams of Specs 001/002; their store public APIs stay identical (drop-in).

**Testing**: Vitest + jsdom (already configured; jsdom provides `localStorage`). New
`src/lib/storage/persistence.test.ts` plus the existing `counters/calc.test.ts`,
`counters/store.test.ts`, and `debt/calc.test.ts` together satisfy FR-014 / SC-007.

**Target Platform**: Static, client-rendered SPA on Cloudflare Pages free tier. No server runtime.

**Project Type**: Single web application (frontend only).

**Performance Goals**: Every tap stays instant (in-memory update first, synchronous localStorage
write is a few-hundred-byte JSON string — negligible). No network on any operation.

**Constraints**:
- Data MUST persist offline and across restarts (FR-001, FR-002).
- Increments/decrements MUST be atomic; rapid taps MUST net exactly; no value ever negative
  (FR-003, FR-004, FR-005).
- Display MUST always equal stored value once an op settles (FR-006).
- Invalid/corrupt/missing stored data MUST recover safely without crashing (FR-011).
- Storage-unavailable or failed writes MUST surface a gentle message, never silent loss (FR-012).
- Older data MUST remain readable or be migrated (FR-013); multiple tabs MUST NOT corrupt the
  total (FR-015). All banner text via i18n, RTL/LTR + a11y safe (constitution V).

**Scale/Scope**: One shared storage module (~4 files), edits to 2 existing stores, 1 banner
component, ~4 i18n keys, 1 root-shell mount. Values up to tens of thousands of days — plain JS
integers, safe.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | How this plan complies |
|-----------|------------------------|
| I. Worshipper-Centered Intuitive UX | Persistence is invisible when it works; the only new UI is a calm, non-alarming banner shown solely when storage truly fails. |
| II. User-Owned Data in Google Drive | Implements the **local-first** half of Principle II: on-device source of truth, fully offline. Drive backup is Spec 005 and will reuse this exact record shape; nothing here blocks it, nothing leaves the browser. |
| III. Static-Only, Serverless-Free | `localStorage` is a browser API; no backend, no serverless. Builds to static assets. |
| IV. Security & Privacy by Default | Worship data stays on the device; no network, no third parties, no tokens, no telemetry. |
| V. Universal Language, Direction & Accessibility | Banner copy via `t()`; Tailwind logical utilities; the banner is announced accessibly (`role="status"`); keyboard-operable if it has a dismiss control. |
| VI. Focused Scope — Installable, Nothing Extraneous | On-mission (never lose the record). **Zero new dependencies** (native Web Storage). Any banner button composes the existing shadcn `Button`. Supports the PWA offline promise (Spec 007). |

**shadcn/ui gate**: The only new UI is `StorageStatusBanner`; any interactive element (e.g. a
dismiss button) uses the shadcn `Button` primitive; verified RTL+LTR; no hardcoded strings.

**Storage-engine decision (records a revision)**: Specs 001/002 offhandedly anticipated
IndexedDB here. This plan deliberately uses `localStorage` instead — the constitution explicitly
permits "IndexedDB/local storage", and for a handful of integers synchronous Web Storage gives
atomic rapid-tap correctness with far simpler code and no write-queue race surface. See
[research.md](research.md) §1.

**Initial gate result**: PASS (no violations). **Complexity Tracking**: none required.

## Project Structure

### Documentation (this feature)

```text
specs/003-persistence-count-logic/
├── plan.md              # This file
├── research.md          # Phase 0 output (decisions + rationale)
├── data-model.md        # Phase 1 output (ProgressRecord schema, validation, migration)
├── contracts/
│   └── module-contracts.md   # Phase 1 output (exact persistence/store/banner signatures)
├── quickstart.md        # Phase 1 output (how to run & validate)
└── checklists/
    └── requirements.md  # Spec quality checklist (already present)
```

### Source Code (repository root)

```text
src/
├── lib/
│   └── storage/
│       ├── progressRecord.ts     # NEW: ProgressRecord type, SCHEMA_VERSION, STORAGE_KEY, DEFAULT_RECORD
│       ├── migrate.ts            # NEW: parseRecord (validate+clamp) and migrate (version upgrades)
│       ├── persistence.ts        # NEW: loadRecord, saveRecord, updateRecord, subscribeExternal, isStorageAvailable
│       ├── status.ts             # NEW: reactive storage-status (getStatus/subscribe/useStorageStatus)
│       └── persistence.test.ts   # NEW: required unit tests (validate/migrate/roundtrip/unavailable)
├── features/
│   ├── counters/
│   │   └── store.ts              # EDIT: hydrate from loadRecord; write-through updateRecord; cross-tab refresh
│   ├── debt/
│   │   └── store.ts              # EDIT: hydrate from loadRecord; write-through updateRecord; cross-tab refresh
│   └── storage/
│       └── StorageStatusBanner.tsx  # NEW: gentle "may not be saved on this device" banner
├── i18n/
│   └── en.ts                     # EDIT: add storage.* keys
└── routes/
    └── __root.tsx                # EDIT: mount <StorageStatusBanner/> in the app shell
```

**Reused / unchanged**:
- `src/features/counters/calc.ts` + `calc.test.ts` — derivation (min, surplus, y/m/d) already
  implemented & tested; this feature does not change the math (FR-007/008/010, FR-014).
- `src/features/debt/calc.ts` + `calc.test.ts` — remaining/completion already implemented &
  tested (FR-009).
- `src/features/counters/store.test.ts` — SC-007 rapid-tap net correctness (extend to assert the
  persisted value matches after a burst).
- Public store APIs (`useCounters`, `incrementPrayer`, …, `useDebt`, `saveDebt`, …) stay identical
  so Specs 001/002 components need no changes.

**Structure Decision**: A single shared persistence layer under `src/lib/storage/` owns the
record schema, validation, migration, and Web Storage I/O. Both feature stores depend on it and
write only their own slice via a synchronous merge, so the two features never clobber each other.
Import via the `#/` alias.

## Complexity Tracking

No constitution violations — this section is intentionally empty.

## Phase 0 — Research

See [research.md](research.md). Resolves: storage engine (localStorage vs IndexedDB), the
single-snapshot vs per-slice key layout, atomic rapid-tap correctness via synchronous RMW,
validation/recovery strategy on load, schema versioning/migration, cross-tab consistency via the
`storage` event, the storage-unavailable UX, and the first-run default (clean zero state,
superseding the 001/002 dev seeds). No open `NEEDS CLARIFICATION` remain.

## Phase 1 — Design & Contracts

Artifacts produced:
- [data-model.md](data-model.md) — the `ProgressRecord` schema (version, prayers, fasts,
  prayerDebt, fastDebt, updatedAt), `DEFAULT_RECORD`, validation rules (non-negative integers;
  null-only-for-debt), and the migration/versioning approach with worked recovery examples.
- [contracts/module-contracts.md](contracts/module-contracts.md) — exact signatures for the
  persistence module, the status store, the two store edits (hydrate + write-through + cross-tab),
  the banner props, and the new `storage.*` i18n keys.
- [quickstart.md](quickstart.md) — commands to run dev/test and a manual validation script mapping
  each acceptance scenario and success criterion to a check (offline reload, rapid-tap net,
  corrupted-data recovery, unavailable-storage banner, two-tab consistency).

**Post-design Constitution re-check**: PASS. No backend, no new dependency, all strings in i18n,
data stays on-device, count math unchanged. No new complexity.

## Phase 2 — Next

Run `/speckit-tasks` to generate the dependency-ordered task list from these artifacts.
