---

description: "Task list for feature implementation"
---

# Tasks: Home Screen Counters

**Input**: Design documents from `specs/001-home-screen-counters/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/module-contracts.md, quickstart.md

**Tests**: The constitution-required `calc.ts` unit tests (count logic) plus a store rapid-tap consistency test for SC-007 are included. No component/integration tests are requested by the spec.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- All paths are relative to the repo root (`D:\work\Back to web\Qada`)

## Path Conventions

- Single frontend project. Feature code under `src/features/counters/`; shared i18n under `src/i18n/`.
- Import via the `#/` or `@/` alias (both map to `src/`).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and test tooling

- [ ] T001 Create the feature source folders: `src/features/counters/`, `src/features/counters/components/`, and `src/i18n/` (empty directories, filled by later tasks)
- [ ] T002 Add a `test` block to `vite.config.ts` with `environment: 'jsdom'` and `globals: true` so `npm run test` runs the calc unit tests (snippet in research.md §7)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Types, pure logic, store, i18n seam, and shared building blocks that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T003 [P] Create type definitions in `src/features/counters/types.ts`: `PrayerKey`, `PRAYER_ORDER`, `ProgressState`, `YmdPart` (exact shapes in data-model.md)
- [ ] T004 [P] Create the English message dictionary in `src/i18n/en.ts` with every key listed in contracts §4 (`app.title`, `salah.heading`, `fast.heading`, `prayer.*`, `ymd.zero`, `unit.{year,month,day}.{one,other}`, `action.increment`, `action.decrement`, `confirm.*`, `praise.1`…`praise.5`)
- [ ] T005 Create the i18n seam in `src/i18n/index.ts`: `t(key, vars?)` (replaces `{var}` placeholders), `plural(unit, n)` (picks `.one`/`.other`, fills `{n}`), `useDirection()` (returns `'ltr'`), and `LOCALE = 'en'` (depends on T004)
- [ ] T006 [P] Implement pure functions in `src/features/counters/calc.ts`: `salahMin`, `surplus`, `clampNonNegative`, `formatYmdParts` (30-day month / 360-day year; `[]` for 0; throws on negative) per contracts §1
- [ ] T007 Write the constitution-required unit tests in `src/features/counters/calc.test.ts` covering every case in contracts §1 (`formatYmdParts` 0/10/40/39/360/730; `salahMin`; `surplus` for 40/41/40/42/40 and 39/41/40/42/40; `clampNonNegative`). The test file can be authored in parallel with T006, but its run step (`npx vitest run src/features/counters/calc.test.ts` — must be green) requires T006 to be implemented first
- [ ] T008 Implement the in-memory reactive store in `src/features/counters/store.ts`: `getState`, `subscribe`, `incrementPrayer`, `decrementPrayer` (clamped), `incrementFast`, `decrementFast` (clamped), and `useCounters()` on `useSyncExternalStore`; seed with `INITIAL_STATE` (`40/41/40/42/40`, fasts `30`); immutable updates that notify listeners (depends on T003, T006)
- [ ] T009 [P] Implement the reusable `src/features/counters/components/CounterButton.tsx` (`kind`, `label`, `onPress`, `disabled?`): renders a `<button>` with `aria-label = t('action.increment'|'action.decrement', { label })`, aria-hidden lucide `Plus`/`Minus` icon, ~44×44px touch target (depends on T005)
- [ ] T010 Create the `src/features/counters/HomeScreen.tsx` shell: `<main dir={useDirection()}>` with `h-dvh flex flex-col overflow-hidden` and a single shared `aria-live="polite"` encouragement region (placeholder for sections; filled by story phases) (depends on T005)
- [ ] T011 Wire the route in `src/routes/index.tsx` to render `HomeScreen` via `createFileRoute('/')({ component: HomeScreen })`, add `dir="ltr"` in `src/routes/__root.tsx`, then run `npm run generate-routes` (depends on T010)

**Checkpoint**: Foundation ready — logic tested, store live, route renders the shell. User stories can now begin.

---

## Phase 3: User Story 1 - Record a completed make-up prayer (Priority: P1) 🎯 MVP

**Goal**: Tapping `+` on a prayer row increments that prayer's count by one (no confirm) and shows a rotating encouragement message.

**Independent Test**: Tap `+` on any prayer row and confirm its surplus number increases by one and an encouraging message appears, with no confirmation prompt.

### Implementation for User Story 1

- [ ] T012 [P] [US1] Create the encouragement rotation module `src/features/counters/messages.ts`: `ENCOURAGEMENT_KEYS` (≥5, referencing `praise.*`) and `nextEncouragementKey()` (module-level index that wraps; never returns the same key twice in a row) per contracts §3
- [ ] T013 [US1] Create `src/features/counters/components/PrayerRow.tsx` (`prayer` prop): reads `useCounters()`, renders `t('prayer.${prayer}')`, the read-only surplus number (`surplus(state, prayer)`), and an increment `CounterButton` whose `onPress` calls `store.incrementPrayer(prayer)` then publishes `t(nextEncouragementKey())` to the shared live region; also render a decrement `CounterButton` (wired in US3) (depends on T008, T009, T012)
- [ ] T014 [US1] Create `src/features/counters/components/SalahSection.tsx` rendering `t('salah.heading')` and one `PrayerRow` per key in `PRAYER_ORDER` (depends on T013)
- [ ] T015 [US1] In `src/features/counters/HomeScreen.tsx`, render `SalahSection`, provide the encouragement setter to `PrayerRow` (via context/props/tiny store — implementer's choice, exactly one live region), and auto-clear the message after ~3s without shifting layout (depends on T010, T014)

**Checkpoint**: `+` on any prayer increments its surplus and shows a rotating message — MVP recording works.

---

## Phase 4: User Story 2 - View overall make-up progress at a glance (Priority: P1)

**Goal**: On load, the salah progress header (from the lowest of the five counts) and the fast progress both render in years/months/days within one no-scroll viewport; the fast section shows no raw number.

**Independent Test**: Load the home screen with seed counts and verify the salah header reads "1 month, 10 days", surpluses read 0/1/0/2/0, the fast section shows "1 month" (no number), and both sections fit one viewport with no scrolling down to 320px.

### Implementation for User Story 2

- [ ] T016 [P] [US2] Create `src/features/counters/components/ProgressHeader.tsx` (`days` prop): computes `formatYmdParts(days)` and renders localized text — empty → `t('ymd.zero')`; otherwise map each part to `plural(part.unit, part.value)` joined by `", "` (contracts §4 header rule) (depends on T006, T005)
- [ ] T017 [US2] Add `<ProgressHeader days={salahMin(state)} />` under the heading in `src/features/counters/components/SalahSection.tsx` (depends on T014, T016)
- [ ] T018 [P] [US2] Create `src/features/counters/components/FastSection.tsx`: renders `t('fast.heading')`, `<ProgressHeader days={state.fasts} />` (NO raw number), and increment `CounterButton` calling `store.incrementFast()` with encouragement (decrement `CounterButton` rendered, wired in US3; disabled at 0) (depends on T008, T009, T016, T012)
- [ ] T019 [US2] In `src/features/counters/HomeScreen.tsx`, add `FastSection` and finalize the no-scroll layout (`h-dvh`, `flex flex-col`, `overflow-hidden`, `min-h-0`, fluid spacing) so both sections stay fully visible with no vertical/horizontal scroll from 320px upward (depends on T015, T018)

**Checkpoint**: Both P1 stories complete — recording and at-a-glance progress work together in one viewport (SC-003, SC-004).

---

## Phase 5: User Story 3 - Correct an over-counted prayer (Priority: P2)

**Goal**: `−` on a prayer or the fast, behind a kind non-shaming confirmation, decreases the count by one; cancel changes nothing; counts never go below zero.

**Independent Test**: Tap `−` on a prayer, confirm the kind dialog, and verify the count decreases by one and the header/surplus update; cancel/Esc leaves everything unchanged; at 0 the control is disabled.

### Implementation for User Story 3

- [ ] T020 [P] [US3] Create `src/features/counters/components/ConfirmDialog.tsx` (`open`, `label`, `onConfirm`, `onCancel`): wraps native `<dialog>`, `showModal()` when open, localized Confirm/Cancel buttons (`confirm.*`), Esc/backdrop → `onCancel`, initial focus on Cancel (contracts §5) (depends on T005)
- [ ] T021 [US3] Wire decrement in `src/features/counters/components/PrayerRow.tsx`: decrement `CounterButton` opens `ConfirmDialog`; on confirm call `store.decrementPrayer(prayer)`; disable the button when `state.prayers[prayer] === 0` (depends on T013, T020)
- [ ] T022 [US3] Wire decrement in `src/features/counters/components/FastSection.tsx`: decrement `CounterButton` opens `ConfirmDialog`; on confirm call `store.decrementFast()`; disable when `state.fasts === 0` (depends on T018, T020)

**Checkpoint**: All three stories independently functional; SC-004 reduce transition (header "1 month, 9 days", surpluses 0/2/1/3/1) verifiable.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final verification against the spec and quality gates

- [ ] T023 [P] Verify accessibility (FR-017): keyboard-only Tab reaches and operates every `+`/`−` and both dialog buttons; all controls carry clear labels
- [ ] T024 [P] Verify direction/RTL safety (FR-016): temporarily set `dir="rtl"` on the root; confirm layout mirrors via logical properties (no `pl-*`/`pr-*`/`left`/`right`, no clipped elements) and no hardcoded user-facing strings exist outside `src/i18n/en.ts`
- [ ] T025 [P] Add a store consistency test in `src/features/counters/store.test.ts` for SC-007: apply 10 synchronous `incrementPrayer` calls (and a mixed increment/decrement sequence) and assert the resulting count equals the exact net number of applied operations — no lost, doubled, or desynced taps (depends on T008)
- [ ] T026 Run the full quickstart.md manual validation script (all 12 checks) and the build check (`npm run build && npm run preview` — static output, Constitution III)
- [ ] T027 Run and pass the quality gates: `npm run test`, `npm run check` (Prettier), and `npm run lint`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately.
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories.
- **User Stories (Phase 3–5)**: All depend on Foundational. US1 and US2 are both P1 (MVP); US3 (P2) follows.
- **Polish (Phase 6)**: Depends on all targeted user stories being complete.

### User Story Dependencies

- **US1 (P1)**: Starts after Foundational. Independent — recording works on its own.
- **US2 (P1)**: Starts after Foundational. Shares `SalahSection` with US1 (US1 creates it, T017 adds its header) and the `HomeScreen` layout; still independently testable via the progress display.
- **US3 (P2)**: Starts after US1/US2 exist because it wires `−` into `PrayerRow` (T013) and `FastSection` (T018); the `ConfirmDialog` itself (T020) has no story dependencies.

### Within Each User Story

- Shared components/logic before the components that consume them.
- `HomeScreen` composition tasks come after the sections they mount.

### Parallel Opportunities

- Setup: none marked (T002 edits one config file).
- Foundational: T003, T004, T006, T009 can run in parallel (distinct files); T007 (test authoring) can also start in parallel, but its run step waits on T006; T005 waits on T004; T008 waits on T003/T006; T010 waits on T005; T011 waits on T010.
- US1: T012 parallel with the rest until T013 consumes it.
- US2: T016 and T018 parallel (distinct files) before their HomeScreen/SalahSection wiring.
- US3: T020 parallel; T021 and T022 edit different files and can run in parallel once T020 is done.
- Polish: T023, T024, and T025 parallel (distinct concerns/files); T026 and T027 run last.

---

## Parallel Example: Foundational Phase

```bash
# After Setup, launch these together (different files, no shared deps):
Task: "Create type definitions in src/features/counters/types.ts"
Task: "Create the English dictionary in src/i18n/en.ts"
Task: "Implement pure functions in src/features/counters/calc.ts"
Task: "Implement CounterButton in src/features/counters/components/CounterButton.tsx"
# calc.test.ts (T007) can be authored alongside these, but run it only after calc.ts (T006) exists.
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 — both P1)

1. Complete Phase 1: Setup.
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories; includes the required calc tests).
3. Complete Phase 3 (US1) and Phase 4 (US2) — together they deliver "record a prayer and see progress at a glance."
4. **STOP and VALIDATE**: quickstart checks 1–5 (view + record) pass; SC-003/SC-004 hold.
5. Deploy/demo the MVP.

### Incremental Delivery

1. Setup + Foundational → foundation ready.
2. US1 + US2 → MVP (record + view).
3. US3 → safe correction via kind confirm.
4. Polish → a11y, RTL, quickstart, and gates.

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks.
- Tests are limited to `calc.test.ts` (constitution-required count logic) and `store.test.ts` (SC-007 rapid-tap consistency); the spec requested no component/integration tests.
- Never hand-edit `src/routeTree.gen.ts` — regenerate with `npm run generate-routes`.
- State is in-memory only this feature; refresh resets to seed. Persistence is Spec 003.
- Commit after each task or logical group; stop at any checkpoint to validate a story independently.
