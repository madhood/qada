# Implementation Plan: Home Screen Counters

**Branch**: `001-home-screen-counters` | **Date**: 2026-07-02 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/001-home-screen-counters/spec.md`

**Audience note**: This plan is written to be followed by a low-capability implementer. Every
file path, function signature, and formula is spelled out. When in doubt, copy the shapes in
[contracts/module-contracts.md](contracts/module-contracts.md) exactly and make the tests in
`calc.test.ts` pass.

## Summary

Build the Qada home screen: a single, no-scroll view with a salah (5 daily prayers) section
and a fasting section. Each prayer row shows a read-only "surplus" number with `+`/`−`
buttons; `+` is one tap (no confirm) and shows a rotating encouragement message; `−` requires a
kind confirmation. A derived header shows overall salah progress in years/months/days, and the
fast section shows fast progress in years/months/days with no raw number. All counting and
formatting logic lives in pure, unit-tested functions; the screen reads/writes a simple
in-memory store that later specs (003 persistence, 005 sync) will back with real storage.

## Technical Context

**Language/Version**: TypeScript 6 (strict), React 19

**Primary Dependencies**: TanStack Start + TanStack Router (file-based routing), Vite 8,
Tailwind CSS v4, lucide-react (icons, already installed)

**Storage**: In-memory reactive store for this feature (module-level state + `useSyncExternalStore`).
This is the deliberate seam that Spec 003 replaces with IndexedDB — the store's public API stays
the same so the swap is drop-in.

**Testing**: Vitest + @testing-library/react (both already in devDependencies), jsdom
environment. Pure calc functions are unit-tested (constitution-required for count logic).

**Target Platform**: Static, client-rendered SPA served from Cloudflare Pages free tier. No
server runtime, no serverless functions.

**Project Type**: Single web application (frontend only).

**Performance Goals**: Instant local interaction (no network on any tap). Home screen usable
within a few seconds on a mid-range phone over 3G.

**Constraints**:
- The salah section + fasting section MUST fit in one viewport with no scrolling from 320px
  wide upward (FR-001, SC-003). Use `100dvh` and a flex column that never overflows.
- No hardcoded user-facing strings; all text via the i18n `t()` helper; layout must work in
  both RTL and LTR using CSS logical properties (FR-016).
- All interactive controls touch- and keyboard-operable with accessible labels (FR-017).

**Scale/Scope**: One screen, ~8 small components, 4 pure functions, 1 store, 1 minimal i18n
seam. Counts may reach tens of thousands of days (a lifetime of missed prayers) — use plain JS
integers (safe well beyond this).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | How this plan complies |
|-----------|------------------------|
| I. Worshipper-Centered Intuitive UX | `+` is one tap, no confirm; counts always visible; `−` behind a kind, non-shaming confirm; rotating encouragement on `+`. |
| II. User-Owned Data in Google Drive | No backend. Data stays on-device (in-memory now; IndexedDB in Spec 003; Drive in Spec 005). Store API is the seam; nothing leaves the browser. |
| III. Static-Only, Serverless-Free | Home route is a client component; no server functions/loaders that need a runtime. Builds to static assets. |
| IV. Security & Privacy by Default | No network calls, no third parties, no tokens, no telemetry in this feature. |
| V. Universal Language, Direction & Accessibility | Minimal i18n seam (`t()` + `dir`); CSS logical properties only; responsive from 320px; keyboard + touch + aria labels; native `<dialog>` for accessible confirm. |
| VI. Focused Scope — Installable, Nothing Extraneous | Only the counter home screen — no extra features. PWA install is Spec 007; this plan does nothing that blocks it. |

**Initial gate result**: PASS (no violations). **Complexity Tracking**: none required.

## Project Structure

### Documentation (this feature)

```text
specs/001-home-screen-counters/
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
│   └── index.tsx                 # EDIT: render <HomeScreen/> instead of the placeholder
├── i18n/
│   ├── index.ts                  # NEW: t(key, vars?), useDirection(), current locale (seam for Spec 006)
│   └── en.ts                     # NEW: English message dictionary (all home-screen strings)
└── features/
    └── counters/
        ├── types.ts              # NEW: PrayerKey, ProgressState, YmdPart
        ├── calc.ts               # NEW: pure functions (min, surplus, formatYmdParts, clampNonNegative)
        ├── calc.test.ts          # NEW: Vitest unit tests for calc.ts (constitution-required)
        ├── store.ts              # NEW: in-memory reactive store + useCounters() hook
        ├── messages.ts           # NEW: ordered list of encouragement message keys + rotation helper
        ├── HomeScreen.tsx        # NEW: top-level layout composing the two sections (no-scroll)
        └── components/
            ├── ProgressHeader.tsx  # NEW: renders YmdPart[] as localized text
            ├── SalahSection.tsx    # NEW: header + 5 PrayerRow
            ├── PrayerRow.tsx       # NEW: label, surplus number, +/- buttons
            ├── FastSection.tsx     # NEW: fast header (y/m/d, no number) + +/- buttons
            ├── CounterButton.tsx   # NEW: reusable +/- button with aria-label
            └── ConfirmDialog.tsx   # NEW: native <dialog> kind confirmation for '-'
```

Config: add a `test` block to the Vite config (jsdom env, globals on). Exact snippet is in
research.md. No extra test-setup file is required — use plain Testing Library.

**Structure Decision**: Single frontend project. Feature code is grouped under
`src/features/counters/` so it is self-contained and easy to locate; shared i18n lives under
`src/i18n/`. Import via the `#/` or `@/` alias (both map to `src/`).

## Complexity Tracking

No constitution violations — this section is intentionally empty.

## Phase 0 — Research

See [research.md](research.md). Resolves: state management approach, y/m/d formatting rules,
i18n/RTL seam scope, no-scroll layout technique, accessible confirm dialog, encouragement
rotation, and the vitest setup. No open `NEEDS CLARIFICATION` remain (spec clarifications
already fixed month=30/year=360, non-zero-units formatting, and reduce-below-min behavior).

## Phase 1 — Design & Contracts

Artifacts produced:
- [data-model.md](data-model.md) — `ProgressState`, `PrayerKey`, `YmdPart`, derivation rules,
  validation (non-negative integers), and the worked example numbers.
- [contracts/module-contracts.md](contracts/module-contracts.md) — exact signatures for every
  function, the store hook, the i18n helper, and every component's props.
- [quickstart.md](quickstart.md) — commands to run dev/test and a manual validation script
  mapping each spec acceptance scenario to a check.

**Post-design Constitution re-check**: PASS. The design adds no backend, keeps all strings in
i18n, uses logical CSS, and confines persistence behind the store seam. No new complexity.

## Phase 2 — Next

Run `/speckit-tasks` to generate the dependency-ordered task list from these artifacts.
