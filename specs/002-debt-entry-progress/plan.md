# Implementation Plan: Debt Entry & Progress

**Branch**: `002-debt-entry-progress` | **Date**: 2026-07-02 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/002-debt-entry-progress/spec.md`

**Audience note**: This plan is written to be followed by a low-capability implementer. Every
file path, function signature, and formula is spelled out. When in doubt, copy the shapes in
[contracts/module-contracts.md](contracts/module-contracts.md) exactly and make the tests in
`calc.test.ts` pass. This feature builds directly on Spec 001's counters store and calc.

## Summary

Add a dedicated **Debt & Progress** screen (route `/debt`), separate from the home screen. The
person records how much they owe — missed-prayer debt and missed-fast debt — either by typing a
day count or by estimating from a start/end date range. The saved debt is combined with the
completed counts already owned by Spec 001 (salah progress = the minimum across the five prayer
counts; fasts = the fast count) to derive, per category, **completed / remaining / percent
complete**, shown encouragingly and never negatively. Debt lives in a new in-memory reactive
store that mirrors Spec 001's store shape so Spec 003 can swap it for IndexedDB with no API
change. All debt/remaining info is confined to this screen (never the home screen). UI is built
on shadcn/ui primitives (Button, Input, Label, Progress) per the constitution.

## Technical Context

**Language/Version**: TypeScript 6 (strict), React 19

**Primary Dependencies**: TanStack Start + TanStack Router (file-based routing), Vite 8,
Tailwind CSS v4, shadcn/ui (Radix primitives: `@radix-ui/react-*`; `class-variance-authority`,
`clsx`, `tailwind-merge` — already installed), lucide-react (icons)

**Storage**: In-memory reactive debt store (module-level state + `useSyncExternalStore`),
identical seam pattern to Spec 001's counters store. Spec 003 replaces it with IndexedDB behind
the same public API. Completed counts are **read** from Spec 001's counters store; this feature
never writes to it.

**Testing**: Vitest + @testing-library/react, jsdom (already configured in `vite.config.ts`).
Pure debt calc functions (remaining, percent, day-range, validation) are unit-tested —
constitution-required count logic.

**Target Platform**: Static, client-rendered SPA served from Cloudflare Pages free tier. No
server runtime, no serverless functions.

**Project Type**: Single web application (frontend only).

**Performance Goals**: Instant local interaction (no network on save or recalculation). Screen
usable within a few seconds on a mid-range phone over 3G.

**Constraints**:

- No hardcoded user-facing strings; all text via the i18n `t()` helper; layout works in both
  RTL and LTR using Tailwind logical utilities (`ps-*`/`pe-*`/`ms-*`/`me-*`/`text-start`) —
  never `pl-*`/`pr-*`/`left`/`right` (FR-018).
- Every input/control touch- and keyboard-operable with accessible labels; the date-range
  estimator MUST NOT rely on color alone to convey validity (FR-019).
- Debt/remaining information MUST appear only on `/debt`, never on the home screen (FR-011,
  SC-005).

**Scale/Scope**: One screen (~6 small components), 5 pure functions, 1 store, ~20 new i18n keys,
3 added shadcn primitives. Debt may reach tens of thousands of days (a lifetime) — plain JS
integers are safe well beyond this.

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design._

| Principle                                           | How this plan complies                                                                                                                                                                                                                                                      |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| I. Worshipper-Centered Intuitive UX                 | One simple form + a clear completed/remaining/percent story; encouraging empty state; congratulatory (non-boastful) "fully met" copy; gentle inline validation, never shaming.                                                                                              |
| II. User-Owned Data in Google Drive                 | No backend. Debt stays on-device (in-memory now; IndexedDB in Spec 003; Drive in Spec 005). Store API is the seam; nothing leaves the browser.                                                                                                                              |
| III. Static-Only, Serverless-Free                   | `/debt` is a client route; no loaders/server functions. Builds to static assets.                                                                                                                                                                                            |
| IV. Security & Privacy by Default                   | No network calls, no third parties, no tokens, no telemetry in this feature.                                                                                                                                                                                                |
| V. Universal Language, Direction & Accessibility    | All copy via `t()`; Tailwind logical utilities only; responsive; number + native date inputs are keyboard/touch operable with `<label>`; validity conveyed by text+icon, not color alone.                                                                                   |
| VI. Focused Scope — Installable, Nothing Extraneous | On-mission (record debt, show make-up progress). UI composed from existing shadcn/Radix primitives; date range uses two native `<input type="date">` (via shadcn Input) rather than adding a heavy date-picker dependency. PWA install is Spec 007; nothing here blocks it. |

**shadcn/ui gate (constitution "UI components")**: All new interactive UI composes shadcn
first-party primitives copied into `src/components/ui` (Button exists; add Input, Label,
Progress). Each is verified in RTL+LTR, keeps Radix accessibility, and carries no hardcoded
strings. No new UI dependency beyond the Radix packages the added primitives pull in.

**Initial gate result**: PASS (no violations). **Complexity Tracking**: none required.

## Project Structure

### Documentation (this feature)

```text
specs/002-debt-entry-progress/
├── plan.md              # This file
├── research.md          # Phase 0 output (decisions + rationale)
├── data-model.md        # Phase 1 output (state shape + derivations)
├── contracts/
│   └── module-contracts.md   # Phase 1 output (exact function/component/store signatures)
├── quickstart.md        # Phase 1 output (how to run & validate)
└── checklists/
    └── requirements.md  # Spec quality checklist (already present)
```

### Source Code (repository root)

```text
src/
├── routes/
│   └── debt.tsx                  # NEW: createFileRoute('/debt')({ component: DebtScreen })
├── components/ui/
│   ├── button.tsx                # EXISTS (shadcn)
│   ├── input.tsx                 # NEW: shadcn add input
│   ├── label.tsx                 # NEW: shadcn add label
│   └── progress.tsx              # NEW: shadcn add progress
└── features/
    └── debt/
        ├── types.ts              # NEW: DebtState, CategoryKey, CategoryProgress, DebtValidation
        ├── calc.ts               # NEW: pure fns (remaining, completionPercent, daysInRange, validateDebtCount, validateDateRange)
        ├── calc.test.ts          # NEW: Vitest unit tests for calc.ts (constitution-required)
        ├── store.ts              # NEW: in-memory reactive debt store + useDebt() hook
        ├── DebtScreen.tsx        # NEW: top-level layout composing entry + progress
        └── components/
            ├── DebtEntryForm.tsx     # NEW: prayer & fast day-count inputs + Save
            ├── DateRangeEstimator.tsx# NEW: start/end date → proposed prayer-days (accept/adjust)
            ├── ProgressView.tsx      # NEW: renders a CategoryProgress for prayers and for fasts
            └── CategoryProgress.tsx  # NEW: completed / remaining / percent + Progress bar + y/m/d
```

**Reused from Spec 001 (do not duplicate)**:

- `#/features/counters/store` — `useCounters()` / `getState()` to read completed counts.
- `#/features/counters/calc` — `salahMin(state)` (completed salah days) and `formatYmdParts`.
- `#/features/counters/components/ProgressHeader` — render a day count as localized y/m/d.
- `#/i18n` — `t()`, `plural()`, `useDirection()`; extend `src/i18n/en.ts` with `debt.*` keys.
- `#/lib/cn` — class merge helper used by shadcn primitives.

**Navigation**: Add a single link/button on `HomeScreen` (label via `t('nav.debt')`, e.g. a
lucide icon + text) that routes to `/debt`. This is a navigation affordance only — it displays
**no** debt or remaining numbers, so FR-011/SC-005 hold. `/debt` provides a back link to `/`.

**Structure Decision**: Single frontend project. New feature code is grouped under
`src/features/debt/` (self-contained, mirrors `src/features/counters/`); shared shadcn primitives
live under `src/components/ui/`. Import via the `#/` alias (maps to `src/`).

## Complexity Tracking

No constitution violations — this section is intentionally empty.

## Phase 0 — Research

See [research.md](research.md). Resolves: debt store shape & "not set vs zero" modelling, how
completed is read from Spec 001, the day-range counting convention, percentage rounding/cap,
the fully-met vs. zero-debt messaging split, the choice of native date inputs over a date-picker
dependency, and which shadcn primitives to add. No open `NEEDS CLARIFICATION` remain — the spec's
Assumptions already fix single-aggregate prayer debt, whole-day fasts, whole-percent rounding,
and both entry methods in scope.

## Phase 1 — Design & Contracts

Artifacts produced:

- [data-model.md](data-model.md) — `DebtState` (`prayerDebt`/`fastDebt` as `number | null`),
  `CategoryProgress`, derivation rules (remaining = max(debt − completed, 0); percent =
  clampedRound), validation rules, and the worked example numbers (debt 500 / completed 120 →
  380 remaining, 24%).
- [contracts/module-contracts.md](contracts/module-contracts.md) — exact signatures for every
  pure function, the debt store hook, and every component's props, plus the new `debt.*` i18n
  keys and the route wiring.
- [quickstart.md](quickstart.md) — commands to run dev/test and a manual validation script
  mapping each spec acceptance scenario and success criterion to a check.

**Post-design Constitution re-check**: PASS. The design adds no backend, keeps all strings in
i18n, uses logical CSS utilities, composes shadcn primitives, and confines debt persistence
behind the store seam while only reading Spec 001's counts. No new complexity.

## Phase 2 — Next

Run `/speckit-tasks` to generate the dependency-ordered task list from these artifacts.
