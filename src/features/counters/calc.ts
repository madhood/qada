import type {
  PrayerKey,
  ProgressState,
  YmdPart,
} from '#/features/counters/types'
import { PRAYER_ORDER } from '#/features/counters/types'

/** Lowest completed count across the five prayers. */
export function salahMin(state: ProgressState): number {
  return Math.min(...PRAYER_ORDER.map((key) => state.prayers[key]))
}

/** Completed count for one prayer minus the current minimum. Always >= 0. */
export function surplus(state: ProgressState, key: PrayerKey): number {
  return state.prayers[key] - salahMin(state)
}

/** Ensure a non-negative integer (used by decrement). */
export function clampNonNegative(n: number): number {
  return Math.max(0, Math.trunc(n))
}

/**
 * Break a day count into non-zero years/months/days parts, largest first.
 * 30-day month, 360-day year. Returns [] when days === 0.
 * Throws on negative input (should never happen).
 */
export function formatYmdParts(days: number): YmdPart[] {
  if (days < 0) throw new Error('formatYmdParts: days must be non-negative')

  const years = Math.floor(days / 360)
  const remainder = days % 360
  const months = Math.floor(remainder / 30)
  const d = remainder % 30

  const parts: YmdPart[] = []
  if (years > 0) parts.push({ unit: 'year', value: years })
  if (months > 0) parts.push({ unit: 'month', value: months })
  if (d > 0) parts.push({ unit: 'day', value: d })
  return parts
}
