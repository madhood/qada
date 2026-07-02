export const ENCOURAGEMENT_KEYS: readonly string[] = [
  'praise.1',
  'praise.2',
  'praise.3',
  'praise.4',
  'praise.5',
]

let index = 0

/**
 * Return the next message key, advancing an internal index that wraps around.
 * Consecutive calls never return the same key twice in a row.
 */
export function nextEncouragementKey(): string {
  index = (index + 1) % ENCOURAGEMENT_KEYS.length
  return ENCOURAGEMENT_KEYS[index]
}
