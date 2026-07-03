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

/** Splits a `{days}`-bearing translation around the placeholder so the rendered
 *  day count lands wherever the translation puts it, instead of a fixed JSX order. */
function splitAroundDays(key: string): [string, string] {
  const [before, after] = t(key).split('{days}')
  return [before, after]
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
  const [completedBefore, completedAfter] =
    splitAroundDays('progress.completed')
  const [remainingBefore, remainingAfter] =
    splitAroundDays('progress.remaining')

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
              {completedBefore}
              <ProgressHeader days={completed} className="inline text-base" />
              {completedAfter}
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
              {completedBefore}
              <ProgressHeader
                days={completed}
                className="inline text-base font-semibold text-foreground"
              />
              {completedAfter}
            </span>
            <span>
              {remainingBefore}
              <ProgressHeader
                days={rem}
                className={cn(
                  'inline text-base',
                  rem === 0
                    ? 'font-semibold text-primary'
                    : 'font-semibold text-foreground',
                )}
              />
              {remainingAfter}
            </span>
          </div>
        </>
      )}
    </div>
  )
}
