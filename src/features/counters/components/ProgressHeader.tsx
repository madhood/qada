import { cn } from '#/lib/cn'
import { formatYmdParts } from '#/features/counters/calc'
import type { YmdPart } from '#/features/counters/types'
import { plural, t } from '#/i18n'

interface ProgressHeaderProps {
  days: number
  className?: string
}

export function ProgressHeader({ days, className }: ProgressHeaderProps) {
  const parts = formatYmdParts(days)
  const text =
    parts.length === 0
      ? t('ymd.zero')
      : parts.map((part: YmdPart) => plural(part.unit, part.value)).join(', ')

  return (
    <p className={cn('text-lg font-medium sm:text-xl', className)}>{text}</p>
  )
}
