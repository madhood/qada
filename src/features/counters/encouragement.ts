import { useSyncExternalStore } from 'react'

import { t } from '#/i18n'

const AUTO_CLEAR_MS = 3000

let message: string | null = null
let clearTimer: ReturnType<typeof setTimeout> | undefined
const listeners = new Set<() => void>()

function notify(): void {
  for (const listener of listeners) listener()
}

/** Show an encouragement message (resolved via i18n); auto-clears after ~3s. */
export function showEncouragement(key: string): void {
  message = t(key)
  notify()
  if (clearTimer) clearTimeout(clearTimer)
  clearTimer = setTimeout(() => {
    message = null
    notify()
  }, AUTO_CLEAR_MS)
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getMessage(): string | null {
  return message
}

/** The current encouragement message, or null when none is showing. */
export function useEncouragementMessage(): string | null {
  return useSyncExternalStore(subscribe, getMessage, getMessage)
}
