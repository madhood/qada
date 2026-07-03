import { Minus, Plus } from 'lucide-react'

import { Button } from '#/components/ui/button'
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
    <Button
      variant="outline"
      size="icon"
      className="size-11"
      aria-label={ariaLabel}
      onClick={onPress}
      disabled={disabled}
    >
      <Icon aria-hidden size={20} />
    </Button>
  )
}
