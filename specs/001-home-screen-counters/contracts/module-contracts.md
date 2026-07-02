# Phase 1 Contracts: Home Screen Counters

These are the exact interfaces to implement. Match names and signatures precisely. Everything
here is client-side TypeScript/React. Import from `src/*` using the `#/` alias (e.g.
`import { calc } from '#/features/counters/calc'`).

---

## 1. `src/features/counters/calc.ts` (pure functions — unit tested)

```ts
import type {
  PrayerKey,
  ProgressState,
  YmdPart,
} from '#/features/counters/types'

/** Lowest completed count across the five prayers. */
export function salahMin(state: ProgressState): number

/** Completed count for one prayer minus the current minimum. Always >= 0. */
export function surplus(state: ProgressState, key: PrayerKey): number

/** Ensure a non-negative integer (used by decrement). */
export function clampNonNegative(n: number): number // returns Math.max(0, Math.trunc(n))

/**
 * Break a day count into non-zero years/months/days parts, largest first.
 * 30-day month, 360-day year. Returns [] when days === 0.
 * Throws on negative input (should never happen).
 */
export function formatYmdParts(days: number): YmdPart[]
```

**Required test cases** (`calc.test.ts`) — must all pass:

- `formatYmdParts`: 0 → `[]`; 10 → `[{day,10}]`; 40 → `[{month,1},{day,10}]`;
  39 → `[{month,1},{day,9}]`; 360 → `[{year,1}]`; 730 → `[{year,2},{day,10}]`.
- `salahMin({40,41,40,42,40})` → 40; after fajr→39, `salahMin` → 39.
- `surplus` for `40/41/40/42/40`: fajr 0, dhuhr 1, asr 0, maghrib 2, isha 0.
- `surplus` for `39/41/40/42/40`: fajr 0, dhuhr 2, asr 1, maghrib 3, isha 1.
- `clampNonNegative(-1)` → 0; `clampNonNegative(3)` → 3.

---

## 2. `src/features/counters/store.ts` (in-memory reactive store)

```ts
import type { PrayerKey, ProgressState } from '#/features/counters/types'

/** Read the current state (do not mutate the returned object). */
export function getState(): ProgressState

/** Subscribe to changes; returns an unsubscribe function. */
export function subscribe(listener: () => void): () => void

export function incrementPrayer(key: PrayerKey): void // +1, no clamp needed
export function decrementPrayer(key: PrayerKey): void // clampNonNegative
export function incrementFast(): void
export function decrementFast(): void

/** React hook returning the current state; re-renders on change. Built on useSyncExternalStore. */
export function useCounters(): ProgressState
```

Rules:

- Mutations create a **new** `ProgressState` object (immutable update) then notify listeners, so
  `useSyncExternalStore` detects the change by reference.
- `decrementPrayer`/`decrementFast` use `clampNonNegative` (never below 0).
- The store does NOT show the confirm dialog or the encouragement message — the component layer
  owns those interactions and calls these functions after handling them.
- Seed with `INITIAL_STATE` from data-model.md.

---

## 3. `src/features/counters/messages.ts` (encouragement rotation)

```ts
/** Ordered message keys (at least 5), resolved to text via i18n `t()`. */
export const ENCOURAGEMENT_KEYS: readonly string[]

/**
 * Return the next message key, advancing an internal index that wraps around.
 * Consecutive calls never return the same key twice in a row.
 */
export function nextEncouragementKey(): string
```

---

## 4. `src/i18n/index.ts` and `src/i18n/en.ts` (minimal i18n seam)

```ts
// index.ts
export function t(key: string, vars?: Record<string, string | number>): string
export function plural(unit: 'year' | 'month' | 'day', n: number): string
export function useDirection(): 'rtl' | 'ltr' // returns 'ltr' for this feature
export const LOCALE = 'en'
```

`en.ts` must define (at minimum) these keys:

- `app.title`
- `salah.heading`, `fast.heading`
- `prayer.fajr`, `prayer.dhuhr`, `prayer.asr`, `prayer.maghrib`, `prayer.isha`
- `ymd.zero` = "0 days"
- `unit.year.one` = "{n} year", `unit.year.other` = "{n} years"
- `unit.month.one` = "{n} month", `unit.month.other` = "{n} months"
- `unit.day.one` = "{n} day", `unit.day.other` = "{n} days"
- `action.increment` = "Add one to {label}", `action.decrement` = "Remove one from {label}"
- `confirm.title`, `confirm.body` (kind wording, uses `{label}`), `confirm.yes`, `confirm.cancel`
- `praise.1` … `praise.5` (encouragement strings referenced by `ENCOURAGEMENT_KEYS`)

`t()` replaces `{var}` placeholders. `plural(unit, n)` picks `.one` when `n === 1` else `.other`
and fills `{n}`. No English text may appear outside `en.ts`.

**Header rendering rule** (used by `ProgressHeader`): given `YmdPart[]`, if empty render
`t('ymd.zero')`; otherwise map each part to `plural(part.unit, part.value)` and join with
`", "` (join separator itself is a plain comma+space, direction handled by the browser via the
container's `dir`).

---

## 5. Components (props contracts)

All components are function components. Text comes from `t()`. Never write literal user-facing
strings in JSX. Use Tailwind **logical** utilities (`ps-*`, `pe-*`, `ms-*`, `me-*`, `text-start`,
`text-end`) — never `pl-*`/`pr-*`/`left`/`right`.

```ts
// CounterButton.tsx
interface CounterButtonProps {
  kind: 'increment' | 'decrement'
  label: string // localized name of the target, e.g. t('prayer.fajr')
  onPress: () => void
  disabled?: boolean // true when a decrement would target a value already at 0
}
// Renders a <button> with aria-label = t('action.increment'|'action.decrement', { label }).
// Icon (lucide Plus/Minus) is aria-hidden. Min touch target ~44x44px.

// ProgressHeader.tsx
interface ProgressHeaderProps {
  days: number // salahMin, or fasts
}
// Computes formatYmdParts(days) and renders localized text per the header rendering rule.

// PrayerRow.tsx
interface PrayerRowProps {
  prayer: PrayerKey
}
// Reads useCounters(); shows t(`prayer.${prayer}`), the surplus number (read-only), and a
// CounterButton increment + decrement. Increment: store.incrementPrayer + show encouragement.
// Decrement: open ConfirmDialog; on confirm call store.decrementPrayer.
// decrement disabled when state.prayers[prayer] === 0.

// SalahSection.tsx  — no props
// Renders t('salah.heading'), <ProgressHeader days={salahMin(state)} />, and the 5 PrayerRow
// in PRAYER_ORDER.

// FastSection.tsx  — no props
// Renders t('fast.heading'), <ProgressHeader days={state.fasts} /> (NO raw number shown),
// and increment/decrement CounterButtons (decrement behind ConfirmDialog; disabled at 0).

// ConfirmDialog.tsx
interface ConfirmDialogProps {
  open: boolean
  label: string // localized target name for the body copy
  onConfirm: () => void
  onCancel: () => void
}
// Wraps native <dialog>; showModal() when open. Confirm/Cancel buttons with localized labels.
// Esc / backdrop => onCancel. Focus starts on Cancel (safer default).

// HomeScreen.tsx — no props
// Root: <main dir={useDirection()} class="h-dvh flex flex-col overflow-hidden ...">
//   <SalahSection/> <FastSection/> and a shared aria-live region for encouragement.
```

---

## 6. Encouragement display contract

- On any increment, call `nextEncouragementKey()` → `t(key)` and place the result in a single
  shared `aria-live="polite"` region rendered by `HomeScreen` (pass a setter down, or use a tiny
  local store — implementer's choice, but there must be exactly one live region).
- The message auto-clears after ~3 seconds. It must never shift layout enough to cause scrolling
  (reserve its space or overlay it).

---

## 7. Route wiring

`src/routes/index.tsx` becomes:

```tsx
import { createFileRoute } from '@tanstack/react-router'
import { HomeScreen } from '#/features/counters/HomeScreen'

export const Route = createFileRoute('/')({ component: HomeScreen })
```

No route params, no loaders, no server functions (keeps it static — Constitution III).

---

## Definition of done for this contract set

1. `npm run test` passes (all `calc.test.ts` cases green).
2. `npm run dev` shows the home screen with seed data `40/41/40/42/40`, fasts `30`.
3. Manual checks in quickstart.md all pass (single-tap +, confirm on −, no scroll to 320px,
   keyboard operable, no hardcoded strings).
4. `npm run check` (Prettier) and `npm run lint` pass.
