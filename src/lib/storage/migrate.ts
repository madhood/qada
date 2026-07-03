import type { ProgressRecord } from '#/lib/storage/progressRecord'
import { DEFAULT_RECORD, SCHEMA_VERSION } from '#/lib/storage/progressRecord'
import { PRAYER_ORDER } from '#/features/counters/types'

function toCount(n: unknown): number {
  const num = typeof n === 'number' ? n : Number(n)
  return Number.isFinite(num) ? Math.max(0, Math.trunc(num)) : 0
}

function toDebt(n: unknown): number | null {
  if (n === null) return null
  if (typeof n === 'number' && Number.isFinite(n))
    return Math.max(0, Math.trunc(n))
  return null
}

/**
 * Coerce an unknown (already JSON.parsed) value into a valid ProgressRecord.
 * Applies the data-model validation table; never throws; never returns negatives.
 * Missing/invalid shape => DEFAULT_RECORD. Missing prayer keys => 0. Bad numbers => clamped.
 */
export function parseRecord(value: unknown): ProgressRecord {
  if (typeof value !== 'object' || value === null) return DEFAULT_RECORD

  const raw = value as Record<string, unknown>
  const rawPrayers = raw.prayers
  if (typeof rawPrayers !== 'object' || rawPrayers === null)
    return DEFAULT_RECORD

  const prayersInput = rawPrayers as Record<string, unknown>
  const prayers = Object.fromEntries(
    PRAYER_ORDER.map((key) => [key, toCount(prayersInput[key])]),
  ) as ProgressRecord['prayers']

  return {
    version: SCHEMA_VERSION,
    prayers,
    fasts: toCount(raw.fasts),
    prayerDebt: 'prayerDebt' in raw ? toDebt(raw.prayerDebt) : null,
    fastDebt: 'fastDebt' in raw ? toDebt(raw.fastDebt) : null,
    updatedAt:
      typeof raw.updatedAt === 'string'
        ? raw.updatedAt
        : DEFAULT_RECORD.updatedAt,
  }
}

/**
 * Version-aware entry point. version === SCHEMA_VERSION -> validate via parseRecord.
 * Older/absent/unknown version -> best-effort field map through parseRecord, set version.
 * Unrecognisable -> DEFAULT_RECORD.
 */
export function migrate(value: unknown): ProgressRecord {
  if (typeof value !== 'object' || value === null) return DEFAULT_RECORD
  return parseRecord(value)
}
