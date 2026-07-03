export interface DebtState {
  prayerDebt: number | null
  fastDebt: number | null
}

export const INITIAL_DEBT: DebtState = { prayerDebt: null, fastDebt: null }

export type CategoryKey = 'prayer' | 'fast'

export interface CategoryProgress {
  category: CategoryKey
  debt: number | null
  completed: number
  remaining: number
  percent: number | null
  status: 'unset' | 'nothing-owed' | 'in-progress' | 'fully-met'
}

export type DebtCountError =
  'empty' | 'not-a-number' | 'negative' | 'not-integer'
export type DateRangeError = 'empty' | 'end-before-start' | 'future-date'

export type DebtCountResult =
  { ok: true; value: number } | { ok: false; error: DebtCountError }

export type DateRangeResult =
  { ok: true; days: number } | { ok: false; error: DateRangeError }
