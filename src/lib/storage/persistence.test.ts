import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'

import { migrate, parseRecord } from '#/lib/storage/migrate'
import {
  isStorageAvailable,
  loadRecord,
  saveRecord,
  updateRecord,
} from '#/lib/storage/persistence'
import { DEFAULT_RECORD, STORAGE_KEY } from '#/lib/storage/progressRecord'
import type { ProgressRecord } from '#/lib/storage/progressRecord'

const VALID_RECORD: ProgressRecord = {
  version: 1,
  prayers: { fajr: 40, dhuhr: 41, asr: 40, maghrib: 42, isha: 40 },
  fasts: 30,
  prayerDebt: 500,
  fastDebt: 30,
  updatedAt: '2026-07-03T00:00:00.000Z',
}

beforeEach(() => {
  localStorage.clear()
})

describe('parseRecord', () => {
  it('round-trips a valid record unchanged', () => {
    expect(parseRecord(VALID_RECORD)).toEqual(VALID_RECORD)
  })

  it('returns DEFAULT_RECORD for a non-object value', () => {
    expect(parseRecord('not an object')).toEqual(DEFAULT_RECORD)
    expect(parseRecord(null)).toEqual(DEFAULT_RECORD)
    expect(parseRecord(42)).toEqual(DEFAULT_RECORD)
  })

  it('returns DEFAULT_RECORD when prayers is missing', () => {
    expect(parseRecord({ fasts: 5 })).toEqual(DEFAULT_RECORD)
  })

  it('fills a missing prayer key with 0', () => {
    const result = parseRecord({ prayers: { fajr: 5 } })
    expect(result.prayers).toEqual({
      fajr: 5,
      dhuhr: 0,
      asr: 0,
      maghrib: 0,
      isha: 0,
    })
    expect(result.fasts).toBe(0)
    expect(result.prayerDebt).toBeNull()
    expect(result.fastDebt).toBeNull()
    expect(result.version).toBe(1)
  })

  it('clamps negative and fractional numbers', () => {
    const result = parseRecord({
      prayers: { fajr: -3, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 },
      fasts: 2.9,
    })
    expect(result.prayers.fajr).toBe(0)
    expect(result.fasts).toBe(2)
  })

  it('converts a non-numeric debt value to null', () => {
    const result = parseRecord({
      prayers: { fajr: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 },
      prayerDebt: 'abc',
    })
    expect(result.prayerDebt).toBeNull()
  })

  it('keeps an explicit null debt', () => {
    const result = parseRecord({
      prayers: { fajr: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 },
      prayerDebt: null,
    })
    expect(result.prayerDebt).toBeNull()
  })
})

describe('migrate', () => {
  it('validates a record already at SCHEMA_VERSION', () => {
    expect(migrate(VALID_RECORD)).toEqual(VALID_RECORD)
  })

  it('coerces an absent version and sets it to SCHEMA_VERSION', () => {
    const result = migrate({
      prayers: { fajr: 5, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 },
    })
    expect(result.version).toBe(1)
    expect(result.prayers.fajr).toBe(5)
  })

  it('coerces version: 0 and sets it to SCHEMA_VERSION', () => {
    const result = migrate({
      version: 0,
      prayers: { fajr: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 },
      fasts: 7,
    })
    expect(result.version).toBe(1)
    expect(result.fasts).toBe(7)
  })

  it('coerces an unknown version number', () => {
    const result = migrate({
      version: 99,
      prayers: { fajr: 1, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 },
    })
    expect(result.version).toBe(1)
    expect(result.prayers.fajr).toBe(1)
  })

  it('falls back to DEFAULT_RECORD for unrecognisable garbage', () => {
    expect(migrate('{ not json')).toEqual(DEFAULT_RECORD)
    expect(migrate(undefined)).toEqual(DEFAULT_RECORD)
  })
})

describe('saveRecord + loadRecord', () => {
  it('round-trips a saved record', () => {
    const result = saveRecord(VALID_RECORD)
    expect(result).toEqual({ ok: true })
    expect(loadRecord()).toEqual(VALID_RECORD)
  })

  it('returns DEFAULT_RECORD when nothing has been saved', () => {
    expect(loadRecord()).toEqual(DEFAULT_RECORD)
  })

  it('returns DEFAULT_RECORD for invalid JSON', () => {
    localStorage.setItem(STORAGE_KEY, '{ not json')
    expect(loadRecord()).toEqual(DEFAULT_RECORD)
  })
})

describe('updateRecord', () => {
  it('merging prayerDebt leaves existing prayers/fasts intact', () => {
    saveRecord(VALID_RECORD)
    updateRecord({ prayerDebt: 999 })
    const result = loadRecord()
    expect(result.prayerDebt).toBe(999)
    expect(result.prayers).toEqual(VALID_RECORD.prayers)
    expect(result.fasts).toBe(VALID_RECORD.fasts)
    expect(result.fastDebt).toBe(VALID_RECORD.fastDebt)
  })

  it('merging prayers/fasts leaves existing debts intact', () => {
    saveRecord(VALID_RECORD)
    const newPrayers = { ...VALID_RECORD.prayers, fajr: 100 }
    updateRecord({ prayers: newPrayers, fasts: 55 })
    const result = loadRecord()
    expect(result.prayers).toEqual(newPrayers)
    expect(result.fasts).toBe(55)
    expect(result.prayerDebt).toBe(VALID_RECORD.prayerDebt)
    expect(result.fastDebt).toBe(VALID_RECORD.fastDebt)
  })
})

describe('unavailable storage', () => {
  const originalSetItem = Storage.prototype.setItem

  afterEach(() => {
    Storage.prototype.setItem = originalSetItem
  })

  it('saveRecord returns unavailable and does not throw when setItem throws', () => {
    Storage.prototype.setItem = vi.fn(() => {
      throw new Error('quota exceeded')
    })
    expect(() => saveRecord(VALID_RECORD)).not.toThrow()
    expect(saveRecord(VALID_RECORD)).toEqual({
      ok: false,
      reason: 'unavailable',
    })
  })

  it('updateRecord returns unavailable and does not throw when setItem throws', () => {
    Storage.prototype.setItem = vi.fn(() => {
      throw new Error('quota exceeded')
    })
    expect(() => updateRecord({ fasts: 1 })).not.toThrow()
    expect(updateRecord({ fasts: 1 })).toEqual({
      ok: false,
      reason: 'unavailable',
    })
  })

  it('isStorageAvailable returns false when setItem throws', () => {
    Storage.prototype.setItem = vi.fn(() => {
      throw new Error('blocked')
    })
    expect(isStorageAvailable()).toBe(false)
  })
})
