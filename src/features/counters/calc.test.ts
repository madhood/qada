import { describe, expect, it } from 'vitest'

import {
  clampNonNegative,
  formatYmdParts,
  salahMin,
  surplus,
} from '#/features/counters/calc'
import type { ProgressState } from '#/features/counters/types'

describe('formatYmdParts', () => {
  it.each([
    [0, []],
    [10, [{ unit: 'day', value: 10 }]],
    [
      40,
      [
        { unit: 'month', value: 1 },
        { unit: 'day', value: 10 },
      ],
    ],
    [
      39,
      [
        { unit: 'month', value: 1 },
        { unit: 'day', value: 9 },
      ],
    ],
    [360, [{ unit: 'year', value: 1 }]],
    [
      730,
      [
        { unit: 'year', value: 2 },
        { unit: 'day', value: 10 },
      ],
    ],
    [
      40000,
      [
        { unit: 'year', value: 111 },
        { unit: 'month', value: 1 },
        { unit: 'day', value: 10 },
      ],
    ],
  ])('formats %i days', (days, expected) => {
    expect(formatYmdParts(days)).toEqual(expected)
  })

  it('throws on negative input', () => {
    expect(() => formatYmdParts(-1)).toThrow()
  })
})

describe('salahMin', () => {
  it('returns the lowest prayer count', () => {
    const state: ProgressState = {
      prayers: { fajr: 40, dhuhr: 41, asr: 40, maghrib: 42, isha: 40 },
      fasts: 0,
    }
    expect(salahMin(state)).toBe(40)
  })

  it('updates after a prayer drops below the others', () => {
    const state: ProgressState = {
      prayers: { fajr: 39, dhuhr: 41, asr: 40, maghrib: 42, isha: 40 },
      fasts: 0,
    }
    expect(salahMin(state)).toBe(39)
  })
})

describe('surplus', () => {
  it('computes surplus for 40/41/40/42/40', () => {
    const state: ProgressState = {
      prayers: { fajr: 40, dhuhr: 41, asr: 40, maghrib: 42, isha: 40 },
      fasts: 0,
    }
    expect(surplus(state, 'fajr')).toBe(0)
    expect(surplus(state, 'dhuhr')).toBe(1)
    expect(surplus(state, 'asr')).toBe(0)
    expect(surplus(state, 'maghrib')).toBe(2)
    expect(surplus(state, 'isha')).toBe(0)
  })

  it('computes surplus for 39/41/40/42/40', () => {
    const state: ProgressState = {
      prayers: { fajr: 39, dhuhr: 41, asr: 40, maghrib: 42, isha: 40 },
      fasts: 0,
    }
    expect(surplus(state, 'fajr')).toBe(0)
    expect(surplus(state, 'dhuhr')).toBe(2)
    expect(surplus(state, 'asr')).toBe(1)
    expect(surplus(state, 'maghrib')).toBe(3)
    expect(surplus(state, 'isha')).toBe(1)
  })

  it('returns 0 for every prayer when all counts are 0', () => {
    const state: ProgressState = {
      prayers: { fajr: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 },
      fasts: 0,
    }
    expect(surplus(state, 'fajr')).toBe(0)
    expect(surplus(state, 'dhuhr')).toBe(0)
    expect(surplus(state, 'asr')).toBe(0)
    expect(surplus(state, 'maghrib')).toBe(0)
    expect(surplus(state, 'isha')).toBe(0)
  })
})

describe('clampNonNegative', () => {
  it('clamps negative numbers to 0', () => {
    expect(clampNonNegative(-1)).toBe(0)
  })

  it('leaves non-negative numbers unchanged', () => {
    expect(clampNonNegative(3)).toBe(3)
  })
})
