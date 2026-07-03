import { describe, expect, it } from 'vitest'

import {
  completionPercent,
  daysInRange,
  remaining,
  validateDateRange,
  validateDebtCount,
} from '#/features/debt/calc'

describe('remaining', () => {
  it('returns 0 when debt is null', () => {
    expect(remaining(null, 120)).toBe(0)
  })

  it('computes remaining when debt > completed', () => {
    expect(remaining(500, 120)).toBe(380)
  })

  it('clamps to 0 when completed >= debt', () => {
    expect(remaining(100, 120)).toBe(0)
  })

  it('returns 0 when both are 0', () => {
    expect(remaining(0, 0)).toBe(0)
  })

  it('returns 0 when completed equals debt', () => {
    expect(remaining(500, 500)).toBe(0)
  })
})

describe('completionPercent', () => {
  it('returns null when debt is null', () => {
    expect(completionPercent(null, 120)).toBeNull()
  })

  it('returns null when debt is 0', () => {
    expect(completionPercent(0, 0)).toBeNull()
  })

  it('computes 24% for debt=500, completed=120', () => {
    expect(completionPercent(500, 120)).toBe(24)
  })

  it('caps at 100% when completed exceeds debt', () => {
    expect(completionPercent(100, 120)).toBe(100)
  })

  it('caps at 100% when completed equals debt', () => {
    expect(completionPercent(500, 500)).toBe(100)
  })

  it('rounds 3/1 to 33%', () => {
    expect(completionPercent(3, 1)).toBe(33)
  })
})

describe('daysInRange', () => {
  it('returns 30 for 2020-01-01 to 2020-01-31', () => {
    expect(daysInRange('2020-01-01', '2020-01-31')).toBe(30)
  })

  it('returns 0 for same day', () => {
    expect(daysInRange('2020-01-01', '2020-01-01')).toBe(0)
  })

  it('returns 366 for a leap year', () => {
    expect(daysInRange('2020-01-01', '2021-01-01')).toBe(366)
  })
})

describe('validateDebtCount', () => {
  it('rejects empty string', () => {
    expect(validateDebtCount('')).toEqual({ ok: false, error: 'empty' })
  })

  it('rejects non-numeric input', () => {
    expect(validateDebtCount('abc')).toEqual({
      ok: false,
      error: 'not-a-number',
    })
  })

  it('rejects negative number', () => {
    expect(validateDebtCount('-5')).toEqual({ ok: false, error: 'negative' })
  })

  it('rejects non-integer', () => {
    expect(validateDebtCount('3.5')).toEqual({
      ok: false,
      error: 'not-integer',
    })
  })

  it('accepts 0', () => {
    expect(validateDebtCount('0')).toEqual({ ok: true, value: 0 })
  })

  it('accepts 500', () => {
    expect(validateDebtCount('500')).toEqual({ ok: true, value: 500 })
  })
})

describe('validateDateRange', () => {
  const today = '2026-07-03'

  it('returns days for valid range', () => {
    expect(validateDateRange('2020-01-01', '2020-01-31', today)).toEqual({
      ok: true,
      days: 30,
    })
  })

  it('rejects end-before-start', () => {
    expect(validateDateRange('2020-02-01', '2020-01-01', today)).toEqual({
      ok: false,
      error: 'end-before-start',
    })
  })

  it('rejects future date', () => {
    expect(validateDateRange('2020-01-01', '2999-01-01', today)).toEqual({
      ok: false,
      error: 'future-date',
    })
  })

  it('rejects empty endpoints', () => {
    expect(validateDateRange('', '2020-01-01', today)).toEqual({
      ok: false,
      error: 'empty',
    })
  })
})
