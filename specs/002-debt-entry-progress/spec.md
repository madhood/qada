# Feature Specification: Debt Entry & Progress

**Feature Branch**: `002-debt-entry-progress`

**Created**: 2026-07-02

**Status**: Draft

**Input**: User description: "Spec 002 — Debt Entry & Progress"

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Record how many prayers/fasts I owe (Priority: P1)

A Muslim who wants to make up missed obligations needs to first tell the app how much they
owe. On a dedicated screen (separate from the home screen), they enter their missed-prayer
debt and missed-fast debt — either by typing a known number of missed days or by estimating
it from a date range (e.g., from when they became accountable until they began praying
regularly). The debt is saved.

**Why this priority**: Without a recorded debt there is no target to make up against and no
way to show remaining progress. Establishing the debt is the entry point for the whole
make-up journey, so it is the highest priority for this feature.

**Independent Test**: Open the debt screen, enter a missed-prayer count and a missed-fast
count (by number or by date range), save, reopen the screen, and confirm the saved debt is
shown — delivering the "the app knows what I owe" value on its own.

**Acceptance Scenarios**:

1. **Given** the debt screen with no prior debt, **When** the person enters 500 missed prayer
   days and 30 missed fast days and saves, **Then** both values are stored and shown as the
   current debt when the screen is reopened.
2. **Given** the debt screen, **When** the person chooses to estimate by date range and
   provides a start date and an end date, **Then** the app calculates the number of days in
   that range and offers it as the missed-prayer-days debt for the person to accept or adjust
   before saving.
3. **Given** a saved debt, **When** the person edits the debt value and saves again, **Then**
   the new debt replaces the old one and their previously recorded completed counts (from the
   home screen) are unchanged.

---

### User Story 2 - See remaining progress (completed vs. debt) (Priority: P1)

The person wants to see how far they have come: how many make-up prayers and fasts they have
completed versus how many they still owe, and how much remains. This completed-vs-debt view
appears only on this progress screen (never on the home screen), is framed encouragingly, and
is something the person opens intentionally.

**Why this priority**: The sense of progress toward a finish line is the core motivator for
sustained make-up. Pairing the recorded debt with completed counts turns raw numbers into a
meaningful "you are X% of the way there" story that keeps users going.

**Independent Test**: With a known debt and known completed counts, open the progress view and
verify it shows completed, remaining, and overall progress with encouraging framing.

**Acceptance Scenarios**:

1. **Given** a recorded prayer debt of 500 days and 120 completed make-up prayer days, **When**
   the person opens the progress view, **Then** it shows 120 completed, 380 remaining, and an
   overall completion indication (e.g., "24% complete") in an encouraging tone.
2. **Given** a recorded fast debt and completed fast count, **When** the person opens the
   progress view, **Then** it shows completed, remaining, and progress for fasting separately
   from prayers.
3. **Given** completed counts equal or exceed the recorded debt, **When** the person opens the
   progress view, **Then** it shows the obligation as fully met with a congratulatory,
   non-boastful message and remaining shown as 0 (never negative).
4. **Given** the home screen, **When** it is displayed, **Then** no debt or remaining-count
   information appears there (debt/remaining is exclusive to this progress screen).

---

### User Story 3 - Adjust my debt later without losing progress (Priority: P2)

As the person remembers more accurately, discovers a miscalculation, or gets guidance from a
scholar, they revisit the debt screen and adjust the missed-prayer or missed-fast amounts. Any
completed progress they have already recorded is preserved and simply re-measured against the
new debt.

**Why this priority**: Real-world debt estimates change over time. Allowing safe adjustment
keeps the record trustworthy, but it is a refinement of the core entry flow rather than the
first thing a user needs.

**Independent Test**: With existing debt and completed counts, change the debt value, save, and
confirm completed counts are untouched while remaining/progress recalculates.

**Acceptance Scenarios**:

1. **Given** a debt of 500 prayer days with 120 completed, **When** the person increases the
   debt to 600 and saves, **Then** completed stays 120, remaining becomes 480, and progress
   recalculates.
2. **Given** a debt of 500 prayer days with 120 completed, **When** the person decreases the
   debt to 100 (below completed), **Then** completed stays 120, remaining shows 0, and the
   obligation is shown as fully met.
3. **Given** any debt adjustment, **When** it is saved, **Then** the change is confirmed to the
   person and no completed count is altered as a side effect.

---

### Edge Cases

- **No debt entered yet**: The progress view invites the person to set their debt first
  (encouraging empty state) rather than showing an error or blank numbers.
- **Zero debt**: A debt of 0 is valid (person owes nothing of that type); the progress view
  reflects "nothing to make up" for that category without implying failure.
- **Completed exceeds debt**: Remaining is clamped at 0 and never displayed as negative;
  progress never exceeds 100%.
- **Invalid or empty input**: Non-numeric, negative, or blank debt entries are rejected with a
  gentle inline message; nothing is saved until the input is valid.
- **Reversed / invalid date range**: An end date before the start date (or a future date) is
  rejected with a kind message and no estimate is produced.
- **Very large debt**: A lifetime of missed obligations (thousands of days) is accepted and
  displayed readably in the same years/months/days convention used elsewhere.
- **Debt reduced while progress view open**: After saving a new debt, any open progress view
  reflects the updated remaining/progress immediately.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The system MUST provide a dedicated debt screen, separate from the home screen,
  for entering and editing missed-prayer debt and missed-fast debt.
- **FR-002**: The person MUST be able to enter missed-prayer debt as a direct count of missed
  days.
- **FR-003**: The person MUST be able to enter missed-fast debt as a direct count of missed
  days.
- **FR-004**: The system MUST offer a date-range estimator that, given a start date and end
  date, computes the number of days between them and proposes it as a missed-prayer-days debt
  the person can accept or adjust before saving.
- **FR-005**: The system MUST persist the entered debt so it is available when the screen or
  app is reopened.
- **FR-006**: The system MUST allow the person to edit a previously saved debt, replacing the
  prior value on save.
- **FR-007**: Editing or re-entering debt MUST NOT modify any previously recorded completed
  counts (prayers or fasts) from the home screen.
- **FR-008**: The system MUST provide a progress view showing, for prayers and for fasts
  separately: amount completed, amount remaining, and an overall completion indication.
- **FR-009**: Remaining MUST be computed as debt minus completed and MUST be clamped to a
  minimum of 0 (never negative); overall completion MUST never exceed 100%.
- **FR-010**: When completed meets or exceeds debt for a category, the progress view MUST show
  that obligation as fully met with an encouraging, non-shaming, non-boastful message.
- **FR-011**: Debt and remaining information MUST appear only on this progress/debt screen and
  MUST NOT appear on the home screen.
- **FR-012**: The progress view and all debt-entry copy MUST use encouraging, non-shaming
  language consistent with the app's tone.
- **FR-013**: The system MUST reject invalid debt input (non-numeric, negative, or empty) with
  a gentle inline message and MUST NOT save until the input is valid.
- **FR-014**: The system MUST reject an invalid date range (end before start, or a future date)
  with a gentle message and produce no estimate.
- **FR-015**: A debt of zero MUST be accepted as valid for either category.
- **FR-016**: Debt and remaining amounts that are shown in years/months/days MUST use the same
  formatting convention defined for the home screen (30-day month, 360-day year; non-zero
  units, largest to smallest).
- **FR-017**: When no debt has been set, the progress view MUST show an encouraging empty state
  prompting the person to set their debt, not an error.
- **FR-018**: All user-facing text MUST be provided through the internationalization layer with
  no hardcoded strings and MUST render correctly in both right-to-left and left-to-right
  layouts.
- **FR-019**: All inputs and controls MUST be operable by touch and keyboard and MUST carry
  accessible labels; the date-range estimator MUST be usable without relying on color alone.

### Key Entities _(include if feature involves data)_

- **Prayer Debt**: The total missed obligatory prayers the person owes, stored as a
  non-negative whole number of days, independent from completed counts. Editable over time.
- **Fast Debt**: The total missed fasts the person owes, stored as a non-negative whole number
  of days, independent from completed counts. Editable over time.
- **Debt Estimate Input (transient)**: A start date and end date used only to compute a
  proposed debt-in-days; not necessarily stored after the resulting number is accepted.
- **Progress (derived)**: For each category, completed (from the home-screen counters),
  remaining = max(debt − completed, 0), and overall completion percentage = min(completed ÷
  debt, 100%) when debt > 0.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: A new user can record both their prayer debt and fast debt within 90 seconds of
  opening the debt screen for the first time, without instructions.
- **SC-002**: For a debt of 500 prayer days and 120 completed, the progress view shows 120
  completed, 380 remaining, and 24% complete.
- **SC-003**: 100% of debt edits leave previously recorded completed counts unchanged.
- **SC-004**: Remaining is never shown as a negative number and overall completion never
  exceeds 100% across any sequence of debt/completed values.
- **SC-005**: Debt and remaining information appears on 0 screens other than the dedicated
  debt/progress screen (in particular, never on the home screen).
- **SC-006**: 100% of invalid debt inputs and invalid date ranges are rejected without saving,
  each accompanied by a clear, gentle message.
- **SC-007**: In usability testing, at least 85% of users correctly understand their remaining
  amount and overall progress on first view without help.

## Assumptions

- **Both entry methods are in scope** (phased-plan open question 3): the debt screen supports
  both a direct manual count and a date-range estimator. The estimator proposes a day count
  the person can override, so it never silently overrides the person's own knowledge. Finer
  estimator inputs (accountability age, gender-specific adjustments, menstrual-day deductions
  for women's prayers, travel/illness exemptions) are deferred to `/speckit-clarify` or a later
  refinement.
- **Fasts tracked as whole days** (phased-plan open question 4): fast debt is a single count of
  days for v1; a per-Ramadan breakdown is out of scope here and deferred to clarify/later.
- **Completed counts are owned by Spec 001**: this feature reads completed prayer/fast counts
  from the home-screen counters and never writes to them. It only creates and edits debt and
  derives progress.
- **Persistence and sync are owned by later specs**: local persistence and count/derivation
  correctness (Spec 003), sign-in (Spec 004), and Drive sync (Spec 005) provide storage; this
  spec assumes debt is saved to and read from that local state.
- **Prayer debt is a single aggregate**: missed prayers are tracked as one total day count
  (each missed day ≈ the five daily prayers), not split per prayer type, consistent with the
  home screen deriving overall salah progress from the minimum across prayers.
- **Overall completion for prayers** is measured against the aggregate prayer debt using the
  overall completed salah progress (the minimum across the five prayer counts) as "completed".
- **Percentage rounding**: completion percentage is shown as a whole number, rounded to the
  nearest percent, and capped at 100%.
