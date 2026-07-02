# Phase 0 Research: Home Screen Counters

All decisions below are final for this feature. A low-capability implementer should follow
them literally and not re-open them.

## 1. State management for counts

**Decision**: A single module-level store object in `src/features/counters/store.ts` exposing
plain functions (`getState`, `subscribe`, `incrementPrayer`, `decrementPrayer`,
`incrementFast`, `decrementFast`) plus a `useCounters()` React hook built on
`React.useSyncExternalStore`.

**Rationale**: No external state library is needed for one screen. `useSyncExternalStore` is
built into React 19, is SSR/CSR safe, and gives a clean public API that Spec 003 can re-back
with IndexedDB without changing any component. Keeps bundle small (Constitution III/VI).

**Alternatives considered**: Redux/Zustand/Jotai (unnecessary dependency, against focused-scope
Principle VI); React Context with `useReducer` (works, but a plain external store is simpler to
swap for persistence later and avoids re-render of the whole tree).

## 2. Years / months / days formatting

**Decision**: Pure function `formatYmdParts(days: number): YmdPart[]`.

- `years = Math.floor(days / 360)`, `remainder = days % 360`
- `months = Math.floor(remainder / 30)`, `d = remainder % 30`
- Return an array containing only the non-zero units, ordered years → months → days, each as
  `{ unit: 'year' | 'month' | 'day', value: number }`.
- If `days === 0`, return `[]` (the component renders the localized "0 days" string).

**Rationale**: Matches the spec Clarifications (30-day month, 360-day year; non-zero units only,
largest to smallest). Returning structured parts keeps the function pure and unit-testable
without any i18n dependency; the component turns parts into localized, pluralized text.

**Worked checks** (become unit tests):

| days | parts                  | rendered (en)      |
| ---- | ---------------------- | ------------------ |
| 0    | `[]`                   | "0 days"           |
| 10   | `[{day,10}]`           | "10 days"          |
| 40   | `[{month,1},{day,10}]` | "1 month, 10 days" |
| 39   | `[{month,1},{day,9}]`  | "1 month, 9 days"  |
| 730  | `[{year,2},{day,10}]`  | "2 years, 10 days" |
| 360  | `[{year,1}]`           | "1 year"           |

**Alternatives considered**: `Intl.RelativeTimeFormat`/`Intl.DurationFormat` (not universally
available, and does not honor the fixed 30/360 convention); returning a pre-joined string (mixes
formatting with i18n and is harder to test).

## 3. i18n + RTL/LTR seam (minimal, forward-compatible)

**Decision**: A tiny i18n module now, expanded by Spec 006 later. `src/i18n/en.ts` is a flat
dictionary of message keys → English strings (with simple `{var}` placeholders and explicit
plural keys, e.g. `unit.year.one` / `unit.year.other`). `src/i18n/index.ts` exports:

- `t(key: string, vars?: Record<string, string | number>): string`
- `plural(unit: 'year'|'month'|'day', n: number): string` (chooses `.one`/`.other`, fills `{n}`)
- `useDirection(): 'rtl' | 'ltr'` (returns `'ltr'` for now; Spec 006 makes it locale-driven)
- The active locale is a module constant `'en'` for this feature.

Set the document direction: in `src/routes/__root.tsx`, keep `<html lang="en">` and add
`dir="ltr"` for now, but write all layout with CSS **logical** utilities so switching to `rtl`
is purely a `dir` change. No component may hardcode left/right.

**Rationale**: FR-016 forbids hardcoded strings and requires both directions to be first-class.
A full i18n framework is Spec 006 scope; introducing the `t()` seam now prevents hardcoded
strings from ever entering the codebase (Constitution V) while staying tiny (Principle VI).

**Alternatives considered**: Pulling in `i18next`/`react-intl` now (premature; belongs to Spec
006); hardcoding English now and refactoring later (violates FR-016 and Principle V).

## 4. Single-viewport, no-scroll layout

**Decision**: `HomeScreen` root uses `h-dvh` (dynamic viewport height), `flex flex-col`,
`overflow-hidden`, with the salah and fast sections as flex children that share the height. Use
`min-h-0` on scroll-prone children, fluid spacing (`gap`, `p-4 sm:p-6`), and `clamp()`-style
responsive text so content never overflows down to 320px width.

**Rationale**: FR-001 / SC-003 require both sections visible with no scrolling on any supported
size. `dvh` avoids the mobile-browser URL-bar resize bug that `vh` has. `overflow-hidden`
guarantees the "no scroll" contract even at extreme sizes; content scales instead of scrolling.

**Alternatives considered**: `100vh` (breaks on mobile Safari/Chrome address-bar show/hide);
CSS grid (works but flex column is simpler for two stacked sections).

## 5. Accessible confirmation dialog for `−`

**Decision**: Use the native HTML `<dialog>` element wrapped in `ConfirmDialog.tsx`, opened via
`ref.showModal()`. It provides focus trapping, `Esc`-to-cancel, and backdrop for free. Buttons:
Confirm and Cancel, both real `<button>`s with localized labels. Copy is kind/encouraging
(e.g. "No problem — remove one from {prayer}?").

**Rationale**: FR-008 (explicit, kind confirmation) + FR-017 (keyboard operable, labeled).
Native `<dialog>` is the least-code accessible option and is well supported in current browsers
(Constitution V, VI).

**Alternatives considered**: A custom div-based modal (must re-implement focus trap + Esc; more
code, easier to get a11y wrong); `window.confirm()` (not styleable, not i18n-friendly, not
brand-appropriate tone).

## 6. Encouragement message rotation on `+`

**Decision**: `messages.ts` exports an ordered array of message **keys** (e.g.
`['praise.alhamdulillah', 'praise.mashaAllah', ...]`, at least 5). A module-level index advances
by one each time `+` is pressed and wraps around, so consecutive taps never repeat the same
message. The visible message is rendered from the key via `t()` and shown as a brief inline,
`aria-live="polite"` region (auto-dismisses after a few seconds).

**Rationale**: FR-007 requires rotating, varied encouragement. Sequential wrap-around is
deterministic (easy to test) and guarantees no immediate repeat. `aria-live` announces it to
screen readers without stealing focus.

**Alternatives considered**: Random selection (can repeat consecutively — fails "rather than
repeat the same text every time"); a toast library (unneeded dependency).

## 7. Vitest configuration

**Decision**: Add a `test` block to the existing Vite config so `npm run test` runs the calc
unit tests in a jsdom environment. Snippet to add to the Vite config's exported config object:

```ts
test: {
  environment: 'jsdom',
  globals: true,
}
```

If the project's Vite config does not yet import Vitest's config type, keep it as a plain
property — Vitest reads `test` from the same `vite.config` file. Component tests (Testing
Library) and pure-function tests both run under this one config.

**Rationale**: `vitest` + `jsdom` + `@testing-library/react` are already installed. One config,
no new files. `globals: true` lets tests use `describe/it/expect` without imports (simpler for a
low-capability implementer).

## 8. Icons

**Decision**: Use `lucide-react` `Plus` and `Minus` icons inside `CounterButton`, with a
localized `aria-label` on the button (the icon is decorative, `aria-hidden`).

**Rationale**: `lucide-react` is already a dependency; avoids adding icon assets. Labeling the
button (not the icon) satisfies FR-017.

## Open questions

None. All spec clarifications are resolved; no `NEEDS CLARIFICATION` remain.
