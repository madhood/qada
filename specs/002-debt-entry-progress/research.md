# Phase 0 Research: Debt Entry & Progress

All decisions below resolve the Technical Context. No `NEEDS CLARIFICATION` remain.

## 1. Debt store shape and the "not set vs. zero" distinction

- **Decision**: A new in-memory reactive store `src/features/debt/store.ts` holding
  `DebtState = { prayerDebt: number | null; fastDebt: number | null }`, seeded to
  `{ prayerDebt: null, fastDebt: null }`. `null` means "no debt recorded yet"; a stored `0`
  means "recorded, and owes nothing". Same seam pattern as Spec 001's counters store
  (`getState` / `subscribe` / `useDebt` on `useSyncExternalStore`; immutable updates).
- **Rationale**: FR-017 requires an encouraging **empty state** when no debt has been set, while
  FR-015 makes an explicit `0` a valid saved value. These are two distinct states, so a nullable
  field is the minimal way to tell them apart. Mirroring Spec 001's store keeps Spec 003's
  IndexedDB swap drop-in.
- **Alternatives considered**: A sentinel `-1` for "unset" (rejected — conflates with numeric
  domain, easy to leak into math); a separate `hasDebt` boolean (rejected — redundant state that
  can desync from the value).

## 2. Reading completed counts from Spec 001

- **Decision**: This feature **reads only**. Completed salah = `salahMin(countersState)` (the
  minimum across the five prayer counts, per Spec 001 and this spec's Assumptions). Completed
  fasts = `countersState.fasts`. Both obtained via `useCounters()` from
  `#/features/counters/store`. This feature never calls any counters mutation.
- **Rationale**: FR-007/SC-003 require that editing debt never alters completed counts. Keeping a
  strict read-only dependency guarantees this by construction. The spec's Assumptions explicitly
  define "completed prayers" as the overall salah progress (the min across prayers).
- **Alternatives considered**: Copying completed counts into the debt store (rejected — creates a
  second source of truth that can drift and risks accidental writes).

## 3. Day-range counting convention (estimator)

- **Decision**: `daysInRange(startISO, endISO)` returns the number of whole days elapsed from
  start to end = `round((endUTC − startUTC) / 86_400_000)`, using UTC midnight of each date to
  avoid DST/timezone drift. Example: `2020-01-01` → `2020-01-31` = 30. The result is only a
  **proposal**; the person accepts or overrides it before saving (FR-004).
- **Rationale**: A plain elapsed-days count is predictable and easy to explain, and since the
  person can adjust it, exact fence-post semantics are not safety-critical. UTC-midnight math
  removes locale/DST edge cases. Deferred estimator refinements (accountability age, menstrual
  deductions, travel/illness) are out of scope per the spec's Assumptions.
- **Alternatives considered**: Inclusive-both-ends (`+1`) count (rejected — overstates by a day
  and is less intuitive as "days between"); a full date library like date-fns (rejected —
  unnecessary dependency for one subtraction; Principle VI).

## 4. Validation rules

- **Decision**:
  - `validateDebtCount(raw: string)` → accepts only a non-negative integer (`0` allowed);
    rejects empty, non-numeric, negative, and non-integer with a specific error code. Nothing is
    saved until valid (FR-013, FR-015).
  - `validateDateRange(startISO, endISO)` → rejects empty, end-before-start, and any future date
    (compared to "today") with a specific error code; otherwise returns the proposed day count
    (FR-014). Error codes map to gentle i18n messages; validity/invalidity is shown with text +
    an icon, never color alone (FR-019).
- **Rationale**: Centralising validation in pure functions makes it unit-testable
  (constitution-required) and keeps components thin.
- **Alternatives considered**: HTML5 `min`/`required` only (rejected — inconsistent cross-browser
  messaging, not localizable, can't express "no future dates" cleanly).

## 5. Remaining, percent, and messaging

- **Decision**:
  - `remaining(debt, completed) = max(debt − completed, 0)` — never negative (FR-009).
  - `completionPercent(debt, completed)`: when `debt > 0`, `min(round(completed / debt × 100),
100)` (whole number, capped, per Assumptions & FR-009); when `debt === 0`, return a sentinel
    meaning "nothing to make up"; caller treats `debt === null` as the empty state.
  - Messaging split: `debt === null` → empty-state prompt (FR-017); `debt === 0` → neutral
    "nothing to make up for this category" (edge case, non-failure); `debt > 0 && completed >=
debt` → congratulatory, non-boastful "fully met" (FR-010) with remaining shown as 0.
- **Rationale**: These three end states are visually and tonally different in the spec; encoding
  them explicitly prevents a "0%"/"100%" ambiguity and keeps copy encouraging.
- **Alternatives considered**: Treating `debt === 0` the same as "fully met" (rejected — implies
  an accomplishment where none was owed).

## 6. Date input: native inputs over a date-picker component

- **Decision**: The estimator uses two `<input type="date">` fields rendered through the shadcn
  `Input` primitive (styled, labeled). No calendar/date-picker component or date library is added.
- **Rationale**: Native date inputs are keyboard- and touch-accessible, localized by the browser,
  and free of extra bundle weight — directly satisfying Principles V and VI. A rich date picker
  would add a heavy dependency for a secondary, override-able estimate.
- **Alternatives considered**: shadcn/react-day-picker Calendar + Popover (rejected for v1 —
  dependency weight and RTL/a11y surface not justified for an optional estimator).

## 7. shadcn primitives to add

- **Decision**: Add `input`, `label`, and `progress` via `npx shadcn@latest add input label
progress` into `src/components/ui/`. `button` already exists. Each becomes first-party source
  that must pass lint/Prettier and be verified in RTL+LTR.
- **Rationale**: The screen needs labeled text/number/date inputs (Input + Label) and an
  accessible completion indicator (Radix Progress exposes `role="progressbar"` with aria values).
  Reusing these primitives satisfies the constitution's shadcn mandate without new deps beyond the
  Radix packages they pull in.
- **Alternatives considered**: Hand-rolled `<input>`/`<progress>` (rejected — violates the
  constitution's shadcn "UI components" standard adopted in v1.3.0).

## 8. Screen composition and routing

- **Decision**: A single route `/debt` (`src/routes/debt.tsx`) renders `DebtScreen`, which stacks
  the entry form and the progress view on one screen (the spec uses "debt screen" and "progress
  screen" for the same destination — FR-011 says debt/remaining live on "this progress/debt
  screen"). `HomeScreen` gets one navigation link to `/debt`; `/debt` links back to `/`. Run
  `npm run generate-routes` after adding the route file.
- **Rationale**: One screen is the simplest design meeting the need (Principle VI) and keeps the
  entry action and its resulting progress in a single, coherent view.
- **Alternatives considered**: Two separate routes `/debt` + `/progress` (rejected — extra
  navigation and duplicated layout for no user benefit at v1).
