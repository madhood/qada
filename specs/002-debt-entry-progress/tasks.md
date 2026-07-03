---
description: 'Task list for feature implementation'
---

# Tasks: Debt Entry & Progress

**Input**: Design documents from `specs/002-debt-entry-progress/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/module-contracts.md, quickstart.md

**Tests**: Only the constitution-required `calc.ts` unit tests (debt count logic: remaining, percent, day-range, validation) are included. The spec requests no component/integration tests.

**Organization**: Tasks are grouped by user story so each can be built and tested independently.

**Implementation note (low-end friendly)**: Keep code simple — plain exported functions, no classes, no clever abstractions. Copy the exact signatures from `contracts/module-contracts.md`. Mirror the shapes already used in Spec 001 (`src/features/counters/*`). One task = one file (or one small edit). Every user-facing string goes through `t()`; never write English in JSX.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- All paths are relative to the repo root (`D:\work\Back to web\Qada`)

## Path Conventions

- Single frontend project. Feature code under `src/features/debt/`; shared shadcn primitives under `src/components/ui/`; shared i18n under `src/i18n/`.
- Import via the `#/` alias (maps to `src/`). This feature **reads** Spec 001's counters store/calc and never writes to them.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create folders and add the shadcn primitives this feature composes.

- [x] T001 Create the feature source folders: `src/features/debt/` and `src/features/debt/components/` (empty directories, filled by later tasks)
- [x] T002 Add the shadcn primitives by running `npx shadcn@latest add input label progress`, producing `src/components/ui/input.tsx`, `src/components/ui/label.tsx`, and `src/components/ui/progress.tsx` (first-party source; must later pass lint/Prettier). `button.tsx` already exists — do not re-add it.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Types, pure logic, store, i18n keys, and the route shell that ALL user stories depend on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T003 [P] Create type definitions in `src/features/debt/types.ts`: `DebtState` (`prayerDebt: number | null`, `fastDebt: number | null`), `INITIAL_DEBT = { prayerDebt: null, fastDebt: null }`, `CategoryKey = 'prayer' | 'fast'`, `CategoryProgress`, `DebtCountError`, `DateRangeError`, `DebtCountResult`, `DateRangeResult` — exact shapes in data-model.md.
- [x] T004 [P] Add all `debt.*`, `progress.*`, and `nav.*` keys to `src/i18n/en.ts` exactly as listed in contracts §3 (`nav.debt`, `nav.home`, `debt.heading`, `debt.prayer.label`, `debt.fast.label`, `debt.save`, `debt.saved`, `debt.estimator.*`, `debt.error.*`, `progress.heading`, `progress.prayer.heading`, `progress.fast.heading`, `progress.completed`, `progress.remaining`, `progress.percent`, `progress.empty`, `progress.nothingOwed`, `progress.fullyMet`). Do not touch existing keys.
- [x] T005 [P] Implement the pure functions in `src/features/debt/calc.ts` per contracts §1: `remaining(debt, completed)`, `completionPercent(debt, completed)`, `daysInRange(startISO, endISO)` (UTC-midnight day diff), `validateDebtCount(raw)`, `validateDateRange(startISO, endISO, todayISO)`. Plain functions only; no dependency on the store or React.
- [x] T006 Write the constitution-required unit tests in `src/features/debt/calc.test.ts` covering every case in contracts §1 (`remaining` incl. null/clamp; `completionPercent` incl. null/cap/rounding — 500/120→24, 100/120→100, 3/1→33; `daysInRange` 30/0/366; `validateDebtCount` empty/abc/-5/3.5/0/500; `validateDateRange` with today `'2026-07-03'`). The test file can be authored alongside T005, but its run step (`npx vitest run src/features/debt/calc.test.ts` — must be green) requires T005 implemented first.
- [x] T007 Implement the in-memory reactive store in `src/features/debt/store.ts` per contracts §2: `getState`, `subscribe`, `setPrayerDebt`, `setFastDebt`, `saveDebt(next: Partial<DebtState>)` (merges into current state), and `useDebt()` on `useSyncExternalStore`; seed with `INITIAL_DEBT`; immutable updates that notify listeners. No validation, no rendering, never reads/writes the counters store (depends on T003). Copy the structure of `src/features/counters/store.ts`.
- [x] T008 Create the `src/features/debt/DebtScreen.tsx` shell: `<main dir={useDirection()}>` with a responsive column, a `t('nav.home')` `<Link to="/">` back link, an `<h1>` `t('debt.heading')`, and a single shared `aria-live="polite"` region (placeholder for the form and progress; filled by story phases). Use Tailwind logical utilities only (depends on T004).
- [x] T009 Wire the route in `src/routes/debt.tsx` with `createFileRoute('/debt')({ component: DebtScreen })`, then run `npm run generate-routes`. Add a `<Link to="/debt">` navigation affordance labeled `t('nav.debt')` to `src/features/counters/HomeScreen.tsx` that shows NO debt numbers (FR-011) (depends on T008).

**Checkpoint**: Foundation ready — logic tested, store live, `/debt` renders the shell with a home↔debt nav. User stories can now begin.

---

## Phase 3: User Story 1 - Record how many prayers/fasts I owe (Priority: P1) 🎯 MVP

**Goal**: On `/debt`, the person enters missed-prayer and missed-fast debt (by number or by a date-range estimate) and saves it; the saved debt persists across reopen.

**Independent Test**: Enter prayer=500 and fast=30 (or use the estimator for prayers), Save, reload `/debt`, and confirm the saved values are shown; invalid inputs are rejected with a gentle message.

### Implementation for User Story 1

- [x] T010 [P] [US1] Create `src/features/debt/components/DateRangeEstimator.tsx` (`onAccept: (days: number) => void`): two shadcn `Input type="date"` fields with shadcn `Label`s (`debt.estimator.start` / `debt.estimator.end`), a `debt.estimator.compute` `Button`. On click call `validateDateRange(start, end, todayISO)` where `todayISO = new Date().toISOString().slice(0,10)`; on error render the mapped `t('debt.error.*')` (text + a lucide icon, not color alone); on success show `t('debt.estimator.proposal', { days })` and a `debt.estimator.accept` button that calls `onAccept(days)` (contracts §4, depends on T002, T004, T005).
- [x] T011 [US1] Create `src/features/debt/components/DebtEntryForm.tsx` (no props): read `useDebt()` and seed two local input strings from `prayerDebt`/`fastDebt` (blank when null). Render shadcn `Label`+`Input` for `debt.prayer.label` and `debt.fast.label`, embed `<DateRangeEstimator onAccept={(days) => setPrayerInput(String(days))} />`, and a `debt.save` `Button`. On Save: run `validateDebtCount` on each field; if either invalid, render its `t('debt.error.*')` inline and save nothing; if both valid, call `store.saveDebt({ prayerDebt, fastDebt })` and announce `t('debt.saved')` in the shared aria-live region (contracts §4, depends on T007, T009, T010).
- [x] T012 [US1] In `src/features/debt/DebtScreen.tsx`, render `<DebtEntryForm />` under the heading and pass the shared aria-live setter so the "Saved" announcement uses the one live region (depends on T008, T011).

**Checkpoint**: Entering and saving debt works and persists (in-memory this feature; IndexedDB is Spec 003) — MVP recording works. US1 acceptance scenarios AS1/AS2 verifiable.

---

## Phase 4: User Story 2 - See remaining progress (completed vs. debt) (Priority: P1)

**Goal**: The progress view shows, for prayers and fasts separately, completed / remaining / percent complete — encouragingly, never negative, with an empty state when no debt is set and a "fully met" state when completed ≥ debt. None of this appears on the home screen.

**Independent Test**: With debt saved and Spec 001 seed counts (salahMin 40, fasts 30), open `/debt` and verify prayers show completed 40 / remaining (debt−40) / percent, fasts show fully-met at debt 30; with no debt, an encouraging empty state shows instead of numbers; the home screen shows no debt info.

### Implementation for User Story 2

- [x] T013 [P] [US2] Create `src/features/debt/components/CategoryProgress.tsx` (`category`, `debt: number | null`, `completed: number`): compute `remaining()` and `completionPercent()` and derive `status` per the data-model decision table. Render by status — `unset` → `t('progress.empty')`; `nothing-owed` → `t('progress.nothingOwed')`; `fully-met` → `t('progress.fullyMet')` + shadcn `<Progress value={100} />`; `in-progress` → `<Progress value={percent} />`, `t('progress.percent', { n: percent })`, plus completed and remaining rendered via the reused `#/features/counters/components/ProgressHeader` (y/m/d) wrapped in `t('progress.completed')` / `t('progress.remaining')` (contracts §4, depends on T002, T005; reuses Spec 001 ProgressHeader).
- [x] T014 [US2] Create `src/features/debt/components/ProgressView.tsx` (no props): read `useDebt()` and `useCounters()`; compute `completedPrayer = salahMin(counters)` (from `#/features/counters/calc`) and `completedFast = counters.fasts`; render `t('progress.heading')`, then `<CategoryProgress category="prayer" debt={debt.prayerDebt} completed={completedPrayer} />` and `<CategoryProgress category="fast" debt={debt.fastDebt} completed={completedFast} />` (depends on T007, T013).
- [x] T015 [US2] In `src/features/debt/DebtScreen.tsx`, render `<ProgressView />` below the entry form and confirm the whole screen stays responsive and RTL/LTR safe; verify (by reading `src/features/counters/HomeScreen.tsx`) that the home screen still shows no debt/remaining numbers — only the `nav.debt` link from T009 (depends on T012, T014).

**Checkpoint**: Both P1 stories complete — recording debt and seeing completed/remaining/percent work together (SC-002 pattern, SC-005). US2 acceptance scenarios AS1–AS4 verifiable.

---

## Phase 5: User Story 3 - Adjust my debt later without losing progress (Priority: P2)

**Goal**: Re-editing debt replaces only the edited value, never alters completed counts, and remaining/percent recalculate immediately.

**Independent Test**: With debt 500/30 and completed counts present, change prayer debt to 600, Save, and confirm completed is untouched, remaining becomes 480, percent recalculates, and the fast debt is unchanged; lowering prayer debt below completed shows fully-met with remaining 0.

### Implementation for User Story 3

- [x] T016 [US3] In `src/features/debt/components/DebtEntryForm.tsx`, confirm Save uses `store.saveDebt({ prayerDebt, fastDebt })` writing only debt fields (never any counters call), and that editing one category and saving leaves the other category's stored value intact (merge semantics from T007). Add a brief `t('debt.saved')` confirmation on every successful save (edit or first entry) (depends on T011).
- [x] T017 [US3] Verify live recalculation: because `ProgressView` reads `useDebt()` + `useCounters()`, saving a new debt must update remaining/percent without a reload. Manually confirm the debt-500→600 and debt-500→100 transitions from data-model.md render correctly in `CategoryProgress` (no code change expected unless a bug is found) (depends on T014, T016).

**Checkpoint**: All three stories independently functional; SC-003 (edits never change completed) and SC-004 (never negative / never >100%) hold.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final verification against the spec and quality gates.

- [x] T018 [P] Verify accessibility (FR-019): keyboard-only Tab reaches and operates every input, the estimator's Calculate/Use-it buttons, Save, and both nav links; all inputs have associated `<Label>`s; the estimator conveys validity by text + icon, not color alone.
- [x] T019 [P] Verify direction/RTL safety (FR-018): temporarily set `dir="rtl"` on the root and confirm the debt screen mirrors via logical utilities (no `pl-*`/`pr-*`/`left`/`right`, no clipped elements) and that no hardcoded user-facing strings exist outside `src/i18n/en.ts` (including the added shadcn primitives).
- [x] T020 Run the full quickstart.md manual validation script (all 14 checks) covering both entry methods, validation, empty state, zero debt, fully-met, very-large debt, and "no debt info on home".
- [x] T021 Run and pass the quality gates: `npm run test` (calc tests green), `npm run check` (Prettier), `npm run lint`, and `npm run build` (static output — Constitution III).

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately.
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories.
- **User Stories (Phase 3–5)**: All depend on Foundational. US1 and US2 are both P1 (MVP); US3 (P2) follows.
- **Polish (Phase 6)**: Depends on all targeted user stories being complete.

### User Story Dependencies

- **US1 (P1)**: Starts after Foundational. Independent — records debt on its own.
- **US2 (P1)**: Starts after Foundational. Reads the debt store US1 writes, but is independently testable (empty state renders even before any debt is saved).
- **US3 (P2)**: Refines the US1 entry form (merge-save + confirmation) and relies on US2's `ProgressView` for the live recalculation check.

### Within Each User Story

- Shared components/logic before the components that consume them.
- `DebtScreen` composition tasks (T012, T015) come after the pieces they mount.

### Parallel Opportunities

- Setup: T001 then T002 (T002 runs a CLI that writes files).
- Foundational: T003, T004, T005 can run in parallel (distinct files); T006 waits on T005; T007 waits on T003; T008 waits on T004; T009 waits on T008.
- US1: T010 parallel until T011 consumes it; T012 waits on T011.
- US2: T013 parallel; T014 waits on T013; T015 waits on T014.
- Polish: T018 and T019 parallel; T020 then T021 last.

---

## Parallel Example: Foundational Phase

```bash
# After Setup, launch these together (different files, no shared deps):
Task: "Create type definitions in src/features/debt/types.ts"
Task: "Add debt.*/progress.*/nav.* keys to src/i18n/en.ts"
Task: "Implement pure functions in src/features/debt/calc.ts"
# calc.test.ts (T006) can be authored alongside, but run it only after calc.ts (T005) exists.
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 — both P1)

1. Complete Phase 1: Setup (folders + shadcn input/label/progress).
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories; includes the required calc tests).
3. Complete Phase 3 (US1) and Phase 4 (US2) — together they deliver "record my debt and see how far I've come."
4. **STOP and VALIDATE**: quickstart checks 1–5, 8–9, 11 pass; SC-002 pattern and SC-005 hold.
5. Deploy/demo the MVP.

### Incremental Delivery

1. Setup + Foundational → foundation ready.
2. US1 + US2 → MVP (record debt + view progress).
3. US3 → safe later adjustment without losing progress.
4. Polish → a11y, RTL, quickstart, and gates.

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks.
- Keep it simple: plain functions, immutable object updates, one file per task. Mirror Spec 001's `src/features/counters/*` patterns exactly.
- Tests are limited to `calc.test.ts` (constitution-required debt count logic); the spec requested no component/integration tests.
- This feature only READS Spec 001's counters (`salahMin`, `state.fasts`) — never mutate them (protects SC-003).
- Never hand-edit `src/routeTree.gen.ts` — regenerate with `npm run generate-routes`.
- Debt is in-memory only this feature; refresh resets to "not set". Persistence is Spec 003.
- Commit after each task or logical group; stop at any checkpoint to validate a story independently.

---

## Phase 7: Convergence

- [X] T022 Fix the `{days}` placeholder interpolation in `src/features/debt/components/CategoryProgress.tsx` (the `t('progress.completed', { days: '' })` / `t('progress.remaining', { days: '' })` calls at the `fully-met` and `in-progress` branches): the day count is currently rendered as a separate JSX element hardcoded to appear after the translated text, ignoring where `{days}` sits in the translation string. Rework so the rendered day count's position is driven by the translation itself (not fixed JSX order), so a future language needs only a new translation resource, no code change, per FR-018 (partial). Resolved by adding a local `splitAroundDays(key)` helper that calls `t(key)` with no vars (leaving `{days}` literal) and splits the returned string on `{days}`, rendering `<ProgressHeader>` between the before/after text — the day count's position is now fully translation-driven.
- [X] T023 Reconcile the aria-live announcement architecture: `src/features/debt/DebtScreen.tsx` has no shared `aria-live="polite"` region as `plan.md` (T008/T012) specified; `src/features/debt/components/DebtEntryForm.tsx` instead owns a local `aria-live` paragraph. Either update `plan.md` to document the local-announcement pattern as the accepted design, or move the live region up into `DebtScreen` and pass a setter down to match the original plan, per plan: aria-live architecture (partial). Resolved by keeping the local `aria-live` region in `DebtEntryForm.tsx` as the accepted design — it already satisfies the announcement requirement with less complexity than threading a setter through `DebtScreen` (Constitution Principle I: prefer the simpler alternative). No code change; `plan.md` has no literal aria-live prose to reconcile (the "shared region" wording was scoped to the now-historical, frozen T008/T012 task descriptions only).
