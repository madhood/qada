import { useSyncExternalStore } from 'react'

import type { DebtState } from '#/features/debt/types'
import {
  loadRecord,
  subscribeExternal,
  updateRecord,
} from '#/lib/storage/persistence'
import { markUnavailable } from '#/lib/storage/status'

function readState(): DebtState {
  const r = loadRecord()
  return { prayerDebt: r.prayerDebt, fastDebt: r.fastDebt }
}

let state: DebtState = readState()
const listeners = new Set<() => void>()

function setState(next: DebtState): void {
  state = next
  for (const listener of listeners) listener()
  const res = updateRecord({
    prayerDebt: state.prayerDebt,
    fastDebt: state.fastDebt,
  })
  if (!res.ok) markUnavailable()
}

/** Read the current debt (do not mutate the returned object). */
export function getState(): DebtState {
  return state
}

/** Subscribe to changes; returns an unsubscribe function. */
export function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** Replace one category's debt (whole value). Pass a non-negative integer or null. */
export function setPrayerDebt(days: number | null): void {
  setState({ ...state, prayerDebt: days })
}

export function setFastDebt(days: number | null): void {
  setState({ ...state, fastDebt: days })
}

/** Replace both at once (used by the form's single Save). */
export function saveDebt(next: Partial<DebtState>): void {
  setState({ ...state, ...next })
}

/** React hook returning the current debt; re-renders on change. */
export function useDebt(): DebtState {
  return useSyncExternalStore(subscribe, getState, getState)
}

subscribeExternal(() => {
  setState(readState())
})
