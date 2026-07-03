import type { DebtCountResult, DateRangeResult } from '#/features/debt/types'

/** Remaining make-up owed. null debt => 0. Never negative. */
export function remaining(debt: number | null, completed: number): number {
  if (debt === null) return 0
  return Math.max(debt - completed, 0)
}

/**
 * Whole-number completion percent, 0..100.
 * debt === null  -> null (empty state)
 * debt === 0     -> null ("nothing owed")
 * debt > 0       -> min(Math.round((completed / debt) * 100), 100)
 */
export function completionPercent(
  debt: number | null,
  completed: number,
): number | null {
  if (debt === null || debt === 0) return null
  return Math.min(Math.round((completed / debt) * 100), 100)
}

/**
 * Whole days elapsed from start to end, using UTC midnight of each ISO date (YYYY-MM-DD).
 * round((endUTC - startUTC) / 86_400_000). Assumes already-valid, non-future, ordered dates.
 */
export function daysInRange(startISO: string, endISO: string): number {
  const startUTC = new Date(startISO + 'T00:00:00Z').getTime()
  const endUTC = new Date(endISO + 'T00:00:00Z').getTime()
  return Math.round((endUTC - startUTC) / 86_400_000)
}

/**
 * Parse a raw debt-count string. Accepts a non-negative integer (0 allowed).
 * Rejects empty/whitespace, non-numeric, negative, and non-integer values.
 */
export function validateDebtCount(raw: string): DebtCountResult {
  const trimmed = raw.trim()
  if (trimmed === '') return { ok: false, error: 'empty' }

  const num = Number(trimmed)
  if (Number.isNaN(num)) return { ok: false, error: 'not-a-number' }

  if (num < 0) return { ok: false, error: 'negative' }
  if (!Number.isInteger(num)) return { ok: false, error: 'not-integer' }

  return { ok: true, value: num }
}

/**
 * Validate a date range against `today` (an ISO YYYY-MM-DD string, injected for testability).
 * Rejects empty endpoints, end-before-start, and any date after `today`.
 * On success returns { ok: true, days: daysInRange(start, end) }.
 */
export function validateDateRange(
  startISO: string,
  endISO: string,
  todayISO: string,
): DateRangeResult {
  if (startISO.trim() === '' || endISO.trim() === '')
    return { ok: false, error: 'empty' }

  if (endISO < startISO) return { ok: false, error: 'end-before-start' }
  if (endISO > todayISO || startISO > todayISO)
    return { ok: false, error: 'future-date' }

  const days = daysInRange(startISO, endISO)
  return { ok: true, days }
}
