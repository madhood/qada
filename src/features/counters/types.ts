// The five daily prayers, in canonical display order.
export type PrayerKey = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha'

export const PRAYER_ORDER: readonly PrayerKey[] = [
  'fajr',
  'dhuhr',
  'asr',
  'maghrib',
  'isha',
] as const

// The complete on-screen state. Owned by the store; later specs persist it.
export interface ProgressState {
  // completed make-up count per prayer, in days (non-negative integer)
  prayers: Record<PrayerKey, number>
  // completed make-up fasting count, in days (non-negative integer)
  fasts: number
}

// One unit of the years/months/days breakdown (only non-zero units are emitted).
export interface YmdPart {
  unit: 'year' | 'month' | 'day'
  value: number // >= 1
}
