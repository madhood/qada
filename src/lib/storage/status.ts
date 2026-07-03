import { useSyncExternalStore } from 'react'

export type StorageStatus = 'ok' | 'unavailable'

let status: StorageStatus = 'ok'
const listeners = new Set<() => void>()

function notify(): void {
  for (const listener of listeners) listener()
}

/** Read the current storage status. */
export function getStatus(): StorageStatus {
  return status
}

/** Subscribe to changes; returns an unsubscribe function. */
export function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** Set to 'unavailable' (idempotent); called when a save fails or storage probe fails. */
export function markUnavailable(): void {
  if (status === 'unavailable') return
  status = 'unavailable'
  notify()
}

/** React hook returning the current storage status; re-renders on change. */
export function useStorageStatus(): StorageStatus {
  return useSyncExternalStore(subscribe, getStatus, getStatus)
}
