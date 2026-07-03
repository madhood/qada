import { useSyncExternalStore } from 'react'

import { clampNonNegative } from '#/features/counters/calc'
import type { PrayerKey, ProgressState } from '#/features/counters/types'
import {
  loadRecord,
  subscribeExternal,
  updateRecord,
} from '#/lib/storage/persistence'
import { markUnavailable } from '#/lib/storage/status'

function readState(): ProgressState {
  const r = loadRecord()
  return { prayers: r.prayers, fasts: r.fasts }
}

let state: ProgressState = readState()
const listeners = new Set<() => void>()

function setState(next: ProgressState): void {
  state = next
  for (const listener of listeners) listener()
  const res = updateRecord({ prayers: state.prayers, fasts: state.fasts })
  if (!res.ok) markUnavailable()
}

/** Read the current state (do not mutate the returned object). */
export function getState(): ProgressState {
  return state
}

/** Subscribe to changes; returns an unsubscribe function. */
export function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function incrementPrayer(key: PrayerKey): void {
  setState({
    ...state,
    prayers: { ...state.prayers, [key]: state.prayers[key] + 1 },
  })
}

export function decrementPrayer(key: PrayerKey): void {
  setState({
    ...state,
    prayers: {
      ...state.prayers,
      [key]: clampNonNegative(state.prayers[key] - 1),
    },
  })
}

export function incrementFast(): void {
  setState({ ...state, fasts: state.fasts + 1 })
}

export function decrementFast(): void {
  setState({ ...state, fasts: clampNonNegative(state.fasts - 1) })
}

/** React hook returning the current state; re-renders on change. */
export function useCounters(): ProgressState {
  return useSyncExternalStore(subscribe, getState, getState)
}

subscribeExternal(() => {
  setState(readState())
})
