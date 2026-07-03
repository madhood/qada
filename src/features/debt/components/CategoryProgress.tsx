import { Progress } from '#/components/ui/progress'
import { cn } from '#/lib/cn'
import { completionPercent, remaining } from '#/features/debt/calc'
import { ProgressHeader } from '#/features/counters/components/ProgressHeader'
import type { CategoryKey } from '#/features/debt/types'
import { t } from '#/i18n'

interface CategoryProgressProps {
  category: CategoryKey
  debt: number | null
  completed: number
}

function deriveStatus(
  debt: number | null,
  completed: number,
): 'unset' | 'nothing-owed' | 'in-progress' | 'fully-met' {
  if (debt === null) return 'unset'
  if (debt === 0) return 'nothing-owed'
  if (completed >= debt) return 'fully-met'
  return 'in-progress'
}

export function CategoryProgress({
  category,
  debt,
  completed,
}: CategoryProgressProps) {
  const status = deriveStatus(debt, completed)
  const rem = remaining(debt, completed)
  const percent = completionPercent(debt, completed)
  const headingKey =
    category === 'prayer' ? 'progress.prayer.heading' : 'progress.fast.heading'

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
      <h3 className="text-base font-semibold">{t(headingKey)}</h3>

      {status === 'unset' && (
        <p className="text-sm text-muted-foreground">{t('progress.empty')}</p>
      )}

      {status === 'nothing-owed' && (
        <p className="text-sm text-muted-foreground">
          {t('progress.nothingOwed')}
        </p>
      )}

      {status === 'fully-met' && (
        <>
          <p className="text-sm text-primary">{t('progress.fullyMet')}</p>
          <Progress
            value={100}
            aria-valuenow={100}
            aria-valuemin={0}
            aria-valuemax={100}
          />
          <div className="flex gap-2 text-sm">
            <span>
              {t('progress.completed', { days: '' })}{' '}
              <ProgressHeader days={completed} className="inline text-base" />
            </span>
          </div>
        </>
      )}

      {status === 'in-progress' && percent !== null && (
        <>
          <Progress
            value={percent}
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
          />
          <p className="text-sm font-medium text-primary">
            {t('progress.percent', { n: percent })}
          </p>
          <div className="flex flex-col gap-1 text-sm text-muted-foreground sm:flex-row sm:gap-4">
            <span>
              {t('progress.completed', { days: '' })}{' '}
              <ProgressHeader
                days={completed}
                className="inline text-base font-semibold text-foreground"
              />
            </span>
            <span>
              {t('progress.remaining', { days: '' })}{' '}
              <ProgressHeader
                days={rem}
                className={cn(
                  'inline text-base',
                  rem === 0
                    ? 'font-semibold text-primary'
                    : 'font-semibold text-foreground',
                )}
              />
            </span>
          </div>
        </>
      )}
    </div>
  )
}
