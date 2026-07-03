import type { PrayerKey } from '#/features/counters/types'

export interface ProgressRecord {
  version: number // SCHEMA_VERSION; enables migration
  prayers: Record<PrayerKey, number> // five completed counts, non-negative integers
  fasts: number // completed fast days, non-negative integer
  prayerDebt: number | null // null = not recorded yet; else non-negative integer
  fastDebt: number | null // null = not recorded yet; else non-negative integer
  updatedAt: string // ISO timestamp; auxiliary metadata only (never used in math)
}

export const SCHEMA_VERSION = 1
export const STORAGE_KEY = 'qada.progress.v1'

export const DEFAULT_RECORD: ProgressRecord = {
  version: SCHEMA_VERSION,
  prayers: { fajr: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 },
  fasts: 0,
  prayerDebt: null,
  fastDebt: null,
  updatedAt: '1970-01-01T00:00:00.000Z',
}
