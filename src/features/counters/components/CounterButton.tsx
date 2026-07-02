import { Minus, Plus } from 'lucide-react'

import { t } from '#/i18n'

interface CounterButtonProps {
  kind: 'increment' | 'decrement'
  label: string
  onPress: () => void
  disabled?: boolean
}

export function CounterButton({
  kind,
  label,
  onPress,
  disabled,
}: CounterButtonProps) {
  const Icon = kind === 'increment' ? Plus : Minus
  const ariaLabel = t(
    kind === 'increment' ? 'action.increment' : 'action.decrement',
    { label },
  )

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onPress}
      disabled={disabled}
      className="flex h-11 w-11 items-center justify-center rounded-full border border-current disabled:opacity-40"
    >
      <Icon aria-hidden size={20} />
    </button>
  )
}
