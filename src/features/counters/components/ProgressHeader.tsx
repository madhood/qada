import { formatYmdParts } from '#/features/counters/calc'
import { plural, t } from '#/i18n'

interface ProgressHeaderProps {
  days: number
}

export function ProgressHeader({ days }: ProgressHeaderProps) {
  const parts = formatYmdParts(days)
  const text =
    parts.length === 0
      ? t('ymd.zero')
      : parts.map((part) => plural(part.unit, part.value)).join(', ')

  return <p className="text-lg font-medium sm:text-xl">{text}</p>
}
