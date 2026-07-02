<!--
SYNC IMPACT REPORT
==================
Version change: 1.1.0 → 1.2.0
Rationale: MINOR — added a new principle (VI. Focused Scope — Installable, Nothing
Extraneous) and promoted PWA installability from SHOULD to a MUST, with matching technical
standard and review gate.

Modified principles: none renamed
Added principles:
  - VI. Focused Scope — Installable, Nothing Extraneous
Unchanged principles: I, II, III, IV, V
Changed guidance: Technical Constraints "Offline" → "PWA & Offline" (manifest + service
  worker + installability now MUST)
Removed sections: none

Templates reviewed for consistency:
  - .specify/templates/plan-template.md ...... ✅ compatible (Constitution Check gate is
    generic; PWA + scope gate derived from Principles III/VI at plan time)
  - .specify/templates/spec-template.md ....... ✅ compatible (no principle-specific slots)
  - .specify/templates/tasks-template.md ...... ✅ compatible (PWA setup + scope review
    surface as Foundational/Polish tasks)
  - .specify/templates/checklist-template.md .. ✅ no changes required

Follow-up TODOs: none.
-->

# Qada Constitution

Qada exists to help Muslims make up their missed obligatory prayers (qada salah) and
missed fasts, so they can fulfill their duty to Allah with clarity and peace of mind.
Every decision in this project serves the worshipper: their ease, their dignity, and
the safety of their record of worship.

## Core Principles

### I. Worshipper-Centered Intuitive UX

The interface MUST be immediately understandable to a non-technical Muslim of any age,
with no tutorial required for core actions (logging a made-up prayer or fast, viewing
remaining counts). Primary actions MUST be reachable in the fewest possible taps and
MUST give clear, immediate feedback.

- The tone MUST be encouraging and free of shame or guilt; the product motivates, it
  never scolds.
- Counts, progress, and next steps MUST always be visible or one tap away — the user
  should never wonder "how many do I have left?"
- New UI MUST be justified against a simpler alternative; complexity that does not
  directly help the worshipper is rejected (YAGNI).

Rationale: The mission is to help as many Muslims as possible complete their worship;
friction, confusion, or judgment directly defeats that mission.

### II. User-Owned Data in Google Drive

The worshipper's progress belongs to the worshipper. All persistent worship data MUST
be stored in the user's own Google Drive, in the private application data folder
(`appDataFolder`) — never in a project-owned database or third-party store.

- The app MUST be local-first: it works on-device and remains fully usable offline, then
  syncs to the user's Drive when connectivity is available. Progress MUST NOT be lost due
  to a dropped connection.
- Google sign-in is REQUIRED before use, so every user's record is backed up to their own
  Drive from the start.
- Sync MUST be resilient to conflicts and interruptions; a failed sync MUST NOT corrupt or
  discard local progress. The user's most recent intent MUST be preserved.

Rationale: A record of worship is deeply personal and must never be lost or held hostage.
Storing it in the user's own Drive guarantees ownership, durability, and continued access
independent of the project's survival.

### III. Static-Only, Serverless-Free Architecture

Qada MUST ship as a fully static, client-rendered application deployable to the Cloudflare
Pages free tier and capable of serving millions of visitors at near-zero marginal cost.

- There MUST be no application backend and no serverless/edge functions of our own. All
  application logic runs in the browser.
- All persistence and authentication happen directly between the browser and Google
  (OAuth + Drive API); the deployment is static assets only.
- The build output MUST be prerendered/SPA static files. Any framework feature that
  requires a server runtime (server functions, SSR request handlers, server-side secrets)
  MUST NOT be used.

Rationale: A static-only design is the only way to reach global, viral scale for free
while keeping the project maintainable by a small team and eliminating server operating
cost and attack surface.

### IV. Security & Privacy by Default

The app handles sensitive religious-practice data and MUST protect it by default.

- OAuth scope MUST be the minimum necessary — the Drive app-data scope only. The app MUST
  NOT request access to the user's other files.
- No user worship data, tokens, or personal identifiers may be sent to any third party,
  analytics vendor, or project-owned server. Telemetry, if any, MUST be anonymous and
  MUST exclude worship records.
- All network traffic MUST be over HTTPS. Tokens MUST be handled per Google's recommended
  browser OAuth flow and never embedded in source or logged.
- Client secrets and configuration that must not be public MUST NOT be committed to the
  repository.

Rationale: Trust is foundational; a single privacy breach of worship data would be a
severe betrayal of the users the project serves.

### V. Universal Language, Direction & Accessibility

The app MUST work for the widest possible range of Muslims, devices, languages, and
conditions. Language and text direction are first-class, non-negotiable concerns.

- **Every language is supportable**: the app MUST be fully internationalized so that any
  language can be added purely as a translation resource, with no code or layout rework.
  No user-facing string may be hardcoded; all copy MUST flow through the i18n layer.
- **Both directions are first-class**: the app MUST fully support both right-to-left (RTL)
  and left-to-right (LTR) layouts, and MUST adapt direction automatically to the active
  language. Layout, icons, navigation, animations, and input MUST mirror correctly per
  direction — RTL is never an afterthought or a degraded mode.
- Direction-aware styling MUST use logical CSS properties (e.g., start/end, not left/right)
  so both directions are correct without duplicated rules.
- Numerals, dates, and Hijri/Gregorian calendar formatting MUST respect the active locale.
- The layout MUST be fully responsive and usable on all screen sizes, from small phones to
  desktops, with touch-first ergonomics.
- Interactive elements MUST meet accessibility basics: sufficient color contrast, keyboard
  operability, screen-reader labels, and respect for reduced-motion preferences.
- The app MUST perform acceptably on low-end devices and slow/intermittent networks.

Rationale: "As many Muslims as we can" spans the entire Ummah, who speak every language and
read in both directions. Excluding a language or breaking RTL/LTR would shut out whole
populations the project exists to serve.

### VI. Focused Scope — Installable, Nothing Extraneous

Qada MUST stay a focused tool for making up missed prayers and fasts, delivered as an
installable Progressive Web App. It MUST NOT accumulate features that do not directly serve
that purpose.

- **PWA is mandatory**: the app MUST be an installable PWA with a valid web app manifest and
  a service worker, MUST be installable to the home screen on supported devices, and MUST
  launch and function offline (consistent with Principle II).
- **No scope creep**: every feature MUST demonstrably serve tracking, completing, or
  motivating qada of prayers/fasts. Features that do not (social feeds, chat, ads,
  gamification for its own sake, unrelated Islamic utilities, account systems beyond the
  Google sign-in required for Drive) MUST be rejected or deferred to a documented future
  scope decision.
- When two designs meet the need, the simpler one MUST be chosen; a new dependency, screen,
  or setting MUST be justified against the mission before it is added.

Rationale: Focus is what makes the app intuitive, fast, cheap to host at scale, and easy to
maintain. Every non-essential feature adds bundle weight, cognitive load, and attack surface
that work against the very users the project serves.

## Technical Constraints & Standards

- **Stack**: TanStack Start (React 19, TanStack Router file-based routing) built to static
  output, styled with Tailwind CSS v4, bundled with Vite. Deployed to Cloudflare Pages.
- **Data & auth**: Google Identity Services for sign-in; Google Drive REST API scoped to
  `drive.appdata`; local persistence (e.g., IndexedDB/local storage) as the offline source
  of truth with Drive as the durable backup.
- **Internationalization**: A dedicated i18n layer MUST back all user-facing text; adding a
  language MUST require only a new translation resource. Direction (RTL/LTR) MUST derive
  from the active locale, applied via the document `dir` attribute and CSS logical
  properties. No hardcoded strings, and no left/right-hardcoded layout rules.
- **PWA & Offline**: The app MUST ship a web app manifest and a service worker, MUST be
  installable to the home screen, and MUST cache its shell so it opens and functions without
  a network.
- **Performance budget**: First meaningful interaction SHOULD be usable within a few
  seconds on a mid-range phone over 3G; bundle size MUST be kept lean and reviewed when it
  grows materially.
- **No server runtime**: CI/CD produces static artifacts only. Any proposal introducing a
  backend, database, or serverless function is a constitutional change (see Governance) and
  MUST be justified against Principles II and III.

## Development Workflow & Quality Gates

- **Spec-driven**: Features follow the Spec Kit flow — constitution → specify → plan →
  tasks → implement. Plans MUST include a Constitution Check evaluated against the five
  principles above before design proceeds.
- **Code quality**: Code MUST pass `npm run lint` and conform to the Prettier config (no
  semicolons, single quotes, trailing commas). `npm run check` MUST pass in CI.
- **Testing**: Automated tests are encouraged and REQUIRED for data-sync and count logic,
  where correctness protects the user's worship record. Tests are otherwise optional per
  feature but MUST be added when a regression would lose or miscount data.
- **Review gates**: Every change MUST be reviewable against the principles; reviewers
  verify no serverless dependency was introduced, OAuth scope was not widened, no worship
  data leaves the browser, no strings are hardcoded, PWA installability/offline still hold,
  the change stays within the qada mission scope, and responsive/RTL+LTR/accessibility
  were considered.
- **Complexity**: Deviations from these principles MUST be recorded in the plan's
  Complexity Tracking with justification and the rejected simpler alternative.

## Governance

This constitution supersedes other practices and conventions when they conflict. All plans,
reviews, and implementations MUST verify compliance with the principles above.

- **Amendments** MUST be proposed as a change to this file, describing the motivation,
  the impacted principles/sections, and any migration implications, and MUST be approved
  before merge.
- **Versioning** follows semantic versioning of the governance document:
  - **MAJOR**: removal or backward-incompatible redefinition of a principle or governance
    rule (e.g., introducing a backend, widening OAuth scope, moving data off the user's
    Drive).
  - **MINOR**: a new principle/section or materially expanded guidance.
  - **PATCH**: clarifications, wording, and non-semantic refinements.
- **Compliance review**: at each plan and review, the Constitution Check MUST be completed.
  Unjustified violations block the change until resolved or the constitution is amended.
- **Runtime guidance**: `CLAUDE.md` provides day-to-day development guidance and MUST stay
  consistent with this constitution; where they conflict, this constitution prevails.

**Version**: 1.2.0 | **Ratified**: 2026-07-02 | **Last Amended**: 2026-07-02
