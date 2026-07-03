import { beforeEach, describe, expect, it } from 'vitest'

import * as store from '#/features/counters/store'
import { loadRecord } from '#/lib/storage/persistence'

describe('store consistency (SC-007)', () => {
  beforeEach(() => {
    const seedFajr = store.getState().prayers.fajr
    for (let i = 0; i < seedFajr; i++) store.decrementPrayer('fajr')
  })

  it('applies 10 synchronous increments with no lost or doubled taps', () => {
    const before = store.getState().prayers.fajr
    for (let i = 0; i < 10; i++) store.incrementPrayer('fajr')
    expect(store.getState().prayers.fajr).toBe(before + 10)
  })

  it('applies a mixed increment/decrement sequence exactly', () => {
    const before = store.getState().prayers.fajr
    const ops = [1, 1, -1, 1, -1, -1, 1, 1, 1, -1] as const
    let expected = before
    for (const op of ops) {
      if (op === 1) {
        store.incrementPrayer('fajr')
        expected += 1
      } else {
        store.decrementPrayer('fajr')
        expected = Math.max(0, expected - 1)
      }
    }
    expect(store.getState().prayers.fajr).toBe(expected)
  })
})

describe('store persistence (SC-002 / FR-006)', () => {
  beforeEach(() => {
    localStorage.clear()
    const seedFajr = store.getState().prayers.fajr
    for (let i = 0; i < seedFajr; i++) store.decrementPrayer('fajr')
  })

  it('after 10 increments from 40, both memory and storage read 50', () => {
    for (let i = 0; i < 40; i++) store.incrementPrayer('fajr')
    for (let i = 0; i < 10; i++) store.incrementPrayer('fajr')
    expect(store.getState().prayers.fajr).toBe(50)
    expect(loadRecord().prayers.fajr).toBe(50)
  })

  it('decrementing at 0 leaves both memory and storage at 0', () => {
    expect(store.getState().prayers.fajr).toBe(0)
    store.decrementPrayer('fajr')
    expect(store.getState().prayers.fajr).toBe(0)
    expect(loadRecord().prayers.fajr).toBe(0)
  })
})
