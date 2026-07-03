import type { ProgressRecord } from '#/lib/storage/progressRecord'
import {
  DEFAULT_RECORD,
  SCHEMA_VERSION,
  STORAGE_KEY,
} from '#/lib/storage/progressRecord'
import { migrate } from '#/lib/storage/migrate'

export type SaveResult = { ok: true } | { ok: false; reason: 'unavailable' }

/** True if localStorage can be written+read (probe with a temp key in try/catch). */
export function isStorageAvailable(): boolean {
  try {
    const probeKey = '__qada_storage_probe__'
    localStorage.setItem(probeKey, '1')
    localStorage.removeItem(probeKey)
    return true
  } catch {
    return false
  }
}

/** Read + JSON.parse + migrate. Any failure => DEFAULT_RECORD. Never throws. */
export function loadRecord(): ProgressRecord {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === null) return DEFAULT_RECORD
    return migrate(JSON.parse(raw))
  } catch {
    return DEFAULT_RECORD
  }
}

/** JSON.stringify + setItem in try/catch. Returns {ok:false,'unavailable'} on any throw. */
export function saveRecord(record: ProgressRecord): SaveResult {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(record))
    return { ok: true }
  } catch {
    return { ok: false, reason: 'unavailable' }
  }
}

/**
 * Synchronous read-modify-merge-write of one or more top-level slices.
 * Loads the current record, shallow-merges `patch` (prayers is replaced wholesale by callers),
 * sets version = SCHEMA_VERSION and updatedAt = new Date().toISOString(), then saveRecord.
 * Returns the SaveResult. This is the atomic unit used by both stores.
 */
export function updateRecord(
  patch: Partial<
    Pick<ProgressRecord, 'prayers' | 'fasts' | 'prayerDebt' | 'fastDebt'>
  >,
): SaveResult {
  const current = loadRecord()
  const next: ProgressRecord = {
    ...current,
    ...patch,
    version: SCHEMA_VERSION,
    updatedAt: new Date().toISOString(),
  }
  return saveRecord(next)
}

/**
 * Subscribe to same-device cross-tab changes. Attaches a window 'storage' listener filtered to
 * STORAGE_KEY and calls `listener` when another tab writes. Returns an unsubscribe function.
 */
export function subscribeExternal(listener: () => void): () => void {
  function handler(event: StorageEvent): void {
    if (event.key === STORAGE_KEY) listener()
  }
  window.addEventListener('storage', handler)
  return () => window.removeEventListener('storage', handler)
}
