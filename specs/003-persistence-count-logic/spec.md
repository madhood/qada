# Feature Specification: Local Persistence & Count Logic

**Feature Branch**: `003-persistence-count-logic`

**Created**: 2026-07-02

**Status**: Draft

**Input**: User description: "Spec 003 — Local Persistence & Count Logic"

## User Scenarios & Testing _(mandatory)_

### User Story 1 - My progress is still here when I come back (Priority: P1)

A Muslim records make-up prayers and fasts and sets their debt, then closes the app (or their
device restarts, or they lose their internet connection). When they return — even with no
network — every count and debt value is exactly as they left it.

**Why this priority**: A record of worship that disappears is worse than no record at all. The
whole product promise ("your progress is never lost") depends on durable, offline-available
local storage. Nothing else in the app has value if data does not persist.

**Independent Test**: Record some counts and a debt, fully close/reopen the app while offline,
and confirm all values are restored unchanged — delivering the "my progress survives" value on
its own.

**Acceptance Scenarios**:

1. **Given** counts of 40 / 41 / 40 / 42 / 40 and a prayer debt of 500, **When** the app is
   fully closed and reopened, **Then** all counts and the debt are restored to exactly those
   values.
2. **Given** the device has no network connection, **When** the person opens the app and
   records a prayer, **Then** the action succeeds and is saved locally without requiring
   connectivity.
3. **Given** a recorded set of values, **When** the device or browser restarts unexpectedly,
   **Then** on next open the last saved values are present with no data loss.

---

### User Story 2 - My taps are always counted correctly (Priority: P1)

The person taps `+` and `−` rapidly, double-taps, or taps while the app is briefly busy. Every
intended action is counted exactly once — never lost, never doubled — and the displayed numbers
always match what was actually saved.

**Why this priority**: An inaccurate count undermines trust in the record and could cause a
person to make up too few or too many prayers. Correctness of the counting operations is as
essential as persistence itself.

**Independent Test**: Perform a known sequence of rapid `+`/`−` actions and confirm the final
saved counts equal the exact net of those actions, with the display matching storage.

**Acceptance Scenarios**:

1. **Given** a prayer count of 40, **When** the person taps `+` ten times within three seconds,
   **Then** the saved count is exactly 50 with no lost or duplicated increments.
2. **Given** any counter, **When** an increment or decrement is in progress and the app is
   closed immediately after, **Then** the operation is either fully applied or not applied at
   all — never a partial or corrupted value.
3. **Given** a count of 0, **When** a decrement is attempted, **Then** the stored value remains
   0 (never negative), consistent with the home-screen rules.

---

### User Story 3 - Derived numbers are always correct (Priority: P1)

Whenever counts change, the derived values the person sees — overall salah progress (the
minimum across the five prayers), each prayer's surplus, remaining debt, and the
years/months/days formatting — are recomputed correctly for any combination of inputs,
including zero and very large numbers.

**Why this priority**: The derived numbers are what the person actually reads and trusts. If
the minimum, surplus, or y/m/d conversion is wrong for some input, the app misleads the user
about their standing before Allah.

**Independent Test**: Feed a range of count/debt combinations (including zeros and large
values) and verify each derived output matches the defined rules exactly.

**Acceptance Scenarios**:

1. **Given** counts of 40 / 41 / 40 / 42 / 40, **When** derived values are computed, **Then**
   salah progress = 40 days ("1 month, 10 days") and surpluses = 0 / 1 / 0 / 2 / 0.
2. **Given** a completed value of 730 days, **When** it is formatted, **Then** it renders as
   "2 years, 10 days" (30-day month, 360-day year; non-zero units only).
3. **Given** a prayer debt of 500 and completed salah progress of 120, **When** remaining is
   computed, **Then** remaining = 380 and completion = 24%, clamped so remaining is never
   negative and completion never exceeds 100%.
4. **Given** all counts and debt are 0, **When** derived values are computed, **Then** progress
   renders as "0 days", all surpluses are 0, and remaining is 0 with no errors.

---

### Edge Cases

- **Storage unavailable or blocked**: If on-device storage cannot be read or written (e.g.,
  private-mode restrictions or exhausted quota), the person is shown a clear, gentle message
  explaining their progress may not be saved on this device, rather than silently losing data.
- **Corrupted or partially written data**: If stored data is unreadable or fails validation on
  load, the app recovers to a safe, consistent state (e.g., last valid snapshot or a clean
  zero state) and never crashes or shows garbage numbers.
- **Concurrent tabs/windows**: If the app is open in two places on the same device, updates do
  not silently clobber each other into an inconsistent total.
- **Schema evolution**: Data saved by an older version of the app remains readable (or is
  safely migrated) after an app update, without losing the person's counts or debt.
- **Very large values**: Counts and debts up to a lifetime of missed obligations (tens of
  thousands of days) are stored and computed without overflow or precision loss.
- **Clock changes**: Changing the device clock does not corrupt stored counts (counts are not
  time-derived; only optional timestamps, if any, are affected).

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: All persistent app data — per-prayer completed counts, completed fast count, and
  prayer/fast debt — MUST be stored on the device so it is available across app restarts.
- **FR-002**: Reading and writing this data MUST work fully offline, with no network
  dependency.
- **FR-003**: Every increment or decrement MUST be applied atomically — an interrupted
  operation MUST leave the stored value either fully updated or unchanged, never partial or
  corrupted.
- **FR-004**: A sequence of rapid `+`/`−` actions MUST result in a saved value equal to the
  exact net of those actions, with no lost or double-counted operations.
- **FR-005**: No stored count or debt MUST ever be negative.
- **FR-006**: The value shown to the person MUST always reflect what is actually saved (display
  and storage never diverge after an operation settles).
- **FR-007**: The system MUST compute overall salah progress as the minimum of the five prayer
  completed counts.
- **FR-008**: The system MUST compute each prayer's surplus as its completed count minus that
  minimum.
- **FR-009**: The system MUST compute remaining debt as max(debt − completed, 0) and overall
  completion as min(completed ÷ debt, 100%) for debt > 0.
- **FR-010**: The system MUST format day totals as years/months/days using a 30-day month and
  360-day year, showing only non-zero units largest-to-smallest, with a total of zero shown as
  "0 days" — consistent with Specs 001 and 002.
- **FR-011**: On load, the system MUST validate stored data and, if it is missing, unreadable,
  or invalid, recover to a safe consistent state without crashing or displaying incorrect
  numbers.
- **FR-012**: If on-device storage is unavailable or a write fails, the system MUST inform the
  person with a clear, gentle message rather than silently discarding their action.
- **FR-013**: Data written by earlier versions of the app MUST remain readable after updates,
  or be migrated without loss of counts or debt.
- **FR-014**: The count and derivation logic (increment/decrement, minimum, surplus,
  remaining, completion percentage, and years/months/days formatting) MUST be covered by
  automated tests, per the project constitution's requirement for tested count logic.
- **FR-015**: Concurrent updates from more than one open instance on the same device MUST NOT
  produce an inconsistent stored total.

### Key Entities _(include if feature involves data)_

- **Progress Record**: The complete on-device set of the person's data — the five prayer
  completed counts, the completed fast count, and prayer/fast debt — persisted as the local
  source of truth. Non-negative whole numbers only.
- **Counter Operation**: A single atomic change (increment or decrement) to one counter, the
  unit of consistency for correctness guarantees.
- **Derived Values (computed, not stored)**: Minimum salah progress, per-prayer surplus,
  remaining debt, completion percentage, and years/months/days formatting — recomputed from the
  Progress Record on demand.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: After recording data and fully closing/reopening the app while offline, 100% of
  counts and debt values are restored exactly.
- **SC-002**: For 10 `+` taps in 3 seconds on a count of 40, the saved result is exactly 50 in
  100% of trials (no lost or doubled taps).
- **SC-003**: Across a defined test matrix of count/debt inputs (including 0 and values ≥
  10,000 days), 100% of derived outputs (minimum, surplus, remaining, completion %, y/m/d
  format) match the specified rules.
- **SC-004**: No sequence of operations can drive any stored value negative or produce a
  completion percentage above 100%.
- **SC-005**: When storage is unavailable, 100% of affected actions surface a clear message and
  0% result in a silent data loss with no indication.
- **SC-006**: After an app update, 100% of data saved by the prior version is still present (or
  migrated) with no loss of counts or debt.
- **SC-007**: Automated tests cover the counter and derivation logic, and the suite passes
  before release.

## Assumptions

- **Local storage is the source of truth for v1**: this spec covers on-device persistence and
  correctness only. Backing data up to the user's Google Drive is owned by Spec 005 (sync); the
  two must agree on the same data shape, but cloud behavior is out of scope here.
- **No accounts required for local persistence**: local storage works before sign-in;
  associating data with a Google account and syncing is deferred to Specs 004–005.
- **Data shape is shared**: the Progress Record's fields (five prayer counts, fast count,
  prayer/fast debt) are exactly those defined by Specs 001 and 002; this spec adds durability
  and correctness, not new user-facing data.
- **Single-device correctness only**: cross-device conflict resolution is a sync concern (Spec
  005); here "concurrent" means multiple tabs/windows on the same device.
- **Storage capacity is ample**: the data is small (a handful of counters), so normal device
  storage limits are not a functional constraint under expected use; quota-exhaustion is still
  handled gracefully as an edge case.
- **Optional timestamps**: if the record stores a last-updated timestamp to aid future sync, it
  is auxiliary metadata and does not affect counts; counts are never derived from the clock.
