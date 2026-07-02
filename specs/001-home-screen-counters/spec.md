# Feature Specification: Home Screen Counters

**Feature Branch**: `001-home-screen-counters`

**Created**: 2026-07-02

**Status**: Draft

**Input**: User description: "Spec 001 — Home Screen Counters"

## Clarifications

### Session 2026-07-02

- Q: How should completed counts convert into years / months / days? → A: 30-day month,
  360-day year (1 month = 30 days, 1 year = 12 months = 360 days).
- Q: Which units should the years/months/days header show? → A: Non-zero units only, largest
  to smallest, omitting leading and interior zero units.
- Q: What happens when `−` would reduce a prayer at the current minimum (lowering the header)?
  → A: Allow it with the standard (kind) confirmation — treated as mistake-correction.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Record a completed make-up prayer (Priority: P1)

A Muslim who is making up missed obligatory prayers opens the app and, after praying one
of the five daily prayers as a make-up (qada), taps the `+` for that prayer to record it.
The recorded count increases and the person receives an encouraging acknowledgement.

**Why this priority**: Recording completed make-up prayers is the core purpose of the app.
Without it, nothing else has value. This single capability is a usable product on its own.

**Independent Test**: Open the home screen, tap `+` on any prayer row, and confirm the
prayer's surplus number increases by one and an encouraging message appears — delivering the
core "I made up a prayer and it's saved" value with no other feature present.

**Acceptance Scenarios**:

1. **Given** the five prayer counts are 40 / 41 / 40 / 42 / 40 (fajr/dhuhr/asr/maghrib/isha),
   **When** the person taps `+` on fajr, **Then** fajr's count becomes 41, its surplus
   updates from 0 to 1, and an encouraging congratulation/du'a message is shown, with no
   confirmation prompt.
2. **Given** any prayer row is displayed, **When** the person taps `+` repeatedly,
   **Then** each tap increments that prayer's count by exactly one and each tap is reflected
   immediately in the surplus number.
3. **Given** a `+` tap has been registered, **When** the encouraging message appears,
   **Then** it varies between taps (messages rotate rather than repeating identically).

---

### User Story 2 - View overall make-up progress at a glance (Priority: P1)

The person opens the app and immediately sees, without scrolling or navigating, how much of
their make-up prayer obligation is completed, expressed in an intuitive years / months / days
format, plus a separate view of their make-up fasting progress.

**Why this priority**: "How much have I done / how far along am I?" is the question that keeps
a user motivated and returning. The at-a-glance summary is what makes the tool feel intuitive
and rewarding, and it must be present alongside the recording action for the MVP to deliver
its promise.

**Independent Test**: Open the home screen with known counts and verify the salah progress
header and the fast progress both render in years/months/days within a single viewport with
no scrolling.

**Acceptance Scenarios**:

1. **Given** the five prayer counts are 40 / 41 / 40 / 42 / 40, **When** the home screen is
   shown, **Then** the salah progress header reads "1 month, 10 days" (derived from the lowest
   of the five counts, 40 days) and each prayer row shows its surplus: 0 / 1 / 0 / 2 / 0.
2. **Given** the salah and fast sections are both present, **When** the home screen is shown
   on any supported screen size, **Then** both sections fit within one viewport with no
   vertical or horizontal scrolling.
3. **Given** a make-up fast count exists, **When** the home screen is shown, **Then** the fast
   section shows its progress in years/months/days and does **not** display a raw number.

---

### User Story 3 - Correct an over-counted prayer (Priority: P2)

The person realizes they recorded a prayer by mistake (e.g., a double tap, or they had not
actually completed it) and reduces the count using the `−` control, protected by a gentle
confirmation so it cannot happen accidentally.

**Why this priority**: Accurate records matter for peace of mind, and mistakes will happen.
Correction is essential but secondary to recording and viewing progress, and it must feel
safe and never shaming.

**Independent Test**: Tap `−` on a prayer row, confirm the kind confirmation dialog, and
verify the count decreases by one and the header/surplus update accordingly.

**Acceptance Scenarios**:

1. **Given** the five prayer counts are 41 / 41 / 40 / 42 / 40, **When** the person taps `−`
   on fajr, **Then** a confirmation dialog appears with encouraging, non-shaming wording
   before any change is made.
2. **Given** the confirmation dialog is shown, **When** the person confirms the reduction of
   fajr, **Then** fajr's count becomes 40 and the surplus/header recalculate immediately.
3. **Given** the confirmation dialog is shown, **When** the person cancels, **Then** no count
   changes and the dialog closes.
4. **Given** the counts are 40 / 41 / 40 / 42 / 40 (header "1 month, 10 days"; surpluses
   0 / 1 / 0 / 2 / 0), **When** the person confirms a `−` on fajr, **Then** counts become
   39 / 41 / 40 / 42 / 40, the header reads "1 month, 9 days", and surpluses become
   0 / 2 / 1 / 3 / 1.

---

### Edge Cases

- **All counts at zero**: The salah header shows a zero-progress state (e.g., "0 days") and
  all surpluses are 0; the screen still renders cleanly and encouragingly.
- **Reducing the lowest count**: Confirming a `−` on a prayer whose count equals the current
  minimum lowers the overall minimum, so the salah header decreases. This is permitted (it
  corrects a genuine mistake) and always passes through the confirmation dialog.
- **Reducing at zero**: `−` cannot take any count below zero; when a count is already 0 the
  reduce action is unavailable or produces no change (no negative counts, no error shown).
- **Very large counts**: A lifetime of missed prayers can be large (thousands of days /
  several years); the years/months/days header and surplus numbers must remain readable and
  fit their space.
- **Rapid tapping**: Fast repeated `+`/`−` taps are each counted exactly once with no lost or
  double-counted taps and no visual desync between count and surplus.
- **Unequal surpluses**: Prayer counts are independent, so surpluses commonly differ across
  the five prayers; the display must handle any combination.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The home screen MUST present two sections — a salah (five daily prayers) section
  and a make-up fasting section — both visible together within a single viewport with no
  scrolling on any supported screen size.
- **FR-002**: The salah section MUST display a progress header derived from the **lowest** of
  the five prayer completed-counts, formatted as years / months / days.
- **FR-002a**: Years / months / days conversion MUST use a fixed 30-day month and a 360-day
  year (1 month = 30 days, 1 year = 12 months = 360 days). Example: 40 days → 1 month, 10 days;
  730 days → 2 years, 0 months, 10 days.
- **FR-002b**: The years / months / days display MUST show only non-zero units, ordered
  largest to smallest, omitting both leading and interior zero units (e.g., 40 days →
  "1 month, 10 days"; 10 days → "10 days"; 730 days → "2 years, 10 days"). A total of zero
  MUST render as "0 days". This formatting rule applies to both the salah header and the fast
  progress.
- **FR-003**: The salah section MUST list all five prayers (fajr, dhuhr, asr, maghrib, isha),
  each as its own row.
- **FR-004**: Each prayer row MUST display that prayer's **surplus**, defined as its completed
  count minus the current minimum across the five prayers, as a read-only number.
- **FR-005**: Each prayer row MUST provide a `+` control and a `−` control.
- **FR-006**: Tapping `+` on a prayer MUST increase that prayer's completed count by exactly
  one, with no confirmation prompt.
- **FR-007**: Each `+` action MUST show an encouraging congratulation or du'a message, and the
  messages MUST rotate/vary rather than repeat the same text every time.
- **FR-008**: Tapping `−` on a prayer MUST require an explicit confirmation, presented with
  encouraging, non-shaming wording, before the count is reduced.
- **FR-009**: Confirming a `−` MUST decrease that prayer's completed count by exactly one;
  cancelling MUST leave all counts unchanged.
- **FR-010**: The system MUST NOT allow any prayer count to go below zero.
- **FR-011**: Prayer counts MUST be display-only via the surplus number; they MUST NOT be
  directly editable by typing a value — changes happen only through `+` and `−`.
- **FR-012**: The fasting section MUST display make-up fasting progress in years / months /
  days and MUST provide `+` and `−` controls, with **no** raw number shown.
- **FR-013**: `−` in the fasting section MUST follow the same confirmation and non-negative
  rules as prayers (FR-008, FR-009, FR-010); `+` MUST follow the same no-confirmation and
  encouragement rules (FR-006, FR-007).
- **FR-014**: The salah header, each surplus, and the fast progress MUST recalculate and
  update immediately after any `+` or `−` that changes a count.
- **FR-015**: Missed-days (debt) information MUST NOT appear anywhere on the home screen; the
  home screen shows completed progress only.
- **FR-016**: All user-facing text on the home screen (labels, headers, messages, confirmation
  copy) MUST be provided through the internationalization layer with no hardcoded strings, and
  MUST render correctly in both right-to-left and left-to-right layouts.
- **FR-017**: Every interactive control (`+`, `−`, confirmation actions) MUST be operable by
  touch and keyboard and MUST carry an accessible label.

### Key Entities _(include if feature involves data)_

- **Prayer Counter**: Represents one of the five daily prayers (fajr, dhuhr, asr, maghrib,
  isha). Key attribute: completed count (non-negative whole number of made-up prayers of that
  type). Derived, not stored: surplus = completed count − minimum completed count across the
  five.
- **Salah Progress (derived)**: The overall make-up prayer progress, equal to the minimum of
  the five prayer counts, expressed to the user as years / months / days.
- **Fast Counter**: Represents make-up fasting. Key attribute: completed count (non-negative
  whole number of days). Presented to the user only as years / months / days, never as a raw
  number.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: A first-time user can record a completed make-up prayer within 5 seconds of the
  home screen appearing, without instructions.
- **SC-002**: Recording a completed prayer (`+`) takes exactly one interaction (a single tap)
  with no confirmation step.
- **SC-003**: On every supported screen size (from a 320px-wide phone to a desktop), both the
  salah and fasting sections are fully visible at once with no scrolling.
- **SC-004**: For the reference counts 40 / 41 / 40 / 42 / 40, the salah header reads
  "1 month, 10 days" and surpluses read 0 / 1 / 0 / 2 / 0; after a confirmed `−` on fajr the
  header reads "1 month, 9 days" and surpluses read 0 / 2 / 1 / 3 / 1.
- **SC-005**: In usability testing, at least 90% of new users correctly interpret the salah
  header and surplus numbers on first view without help.
- **SC-006**: 100% of `−` (reduce) actions are preceded by a confirmation, and no count can be
  driven below zero across any sequence of interactions.
- **SC-007**: Counts and derived displays stay consistent (no lost, doubled, or desynced taps)
  under rapid repeated tapping of at least 10 taps in 3 seconds.

## Assumptions

- **Month length for formatting** (resolved — see Clarifications): Years/months/days formatting
  uses a fixed 30-day month and 360-day year; only non-zero units are shown, largest to
  smallest. This is a display convention only. See FR-002a / FR-002b.
- **Reducing below the minimum is allowed** (resolved — see Clarifications): A confirmed `−` on
  a prayer at the current minimum is permitted and lowers the overall header, treated as
  correcting a mistake. The standard kind confirmation applies (no extra warning). See FR-008
  and the "Reducing the lowest count" edge case.
- **Scope boundary**: This spec covers only the home screen's counters, controls, and derived
  displays. Entering/estimating missed-days debt (Spec 002), persistence and detailed count
  logic/testing (Spec 003), sign-in (Spec 004), and Drive sync (Spec 005) are out of scope
  here and specified separately. Counts are assumed to be available from local state provided
  by those later specs.
- **Single user, single device view**: The home screen reflects the current device's local
  state; multi-device conflict handling is addressed by the sync spec, not here.
- **Encouragement content source**: A rotating set of congratulation/du'a messages exists (its
  full curation is Spec 009); this spec assumes at least a minimal set is available so `+`
  feedback can rotate.
- **Fasting is tracked as whole days**: The fast counter is a count of days, formatted the same
  way as salah progress.
