import { useState } from 'react'
import { AlertCircle, CheckCircle2 } from 'lucide-react'

import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { cn } from '#/lib/cn'
import { validateDateRange } from '#/features/debt/calc'
import { t } from '#/i18n'

interface DateRangeEstimatorProps {
  onAccept: (days: number) => void
}

export function DateRangeEstimator({ onAccept }: DateRangeEstimatorProps) {
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [result, setResult] = useState<
    { ok: true; days: number } | { ok: false; error: string } | null
  >(null)

  const todayISO = new Date().toISOString().slice(0, 10)

  function handleCompute() {
    const validation = validateDateRange(start, end, todayISO)
    if (validation.ok) {
      setResult({ ok: true, days: validation.days })
    } else {
      const errorKey = `debt.error.${validation.error}` as const
      setResult({ ok: false, error: t(errorKey) })
    }
  }

  function handleAccept(days: number) {
    onAccept(days)
    setResult(null)
  }

  return (
    <fieldset className="flex flex-col gap-3 rounded-lg border border-border p-4">
      <legend className="px-2 text-sm font-medium">
        {t('debt.estimator.heading')}
      </legend>

      <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
        <div className="flex-1 space-y-1">
          <Label htmlFor="estimator-start">{t('debt.estimator.start')}</Label>
          <Input
            id="estimator-start"
            type="date"
            max={todayISO}
            value={start}
            onChange={(e) => {
              setStart(e.target.value)
              setResult(null)
            }}
          />
        </div>
        <div className="flex-1 space-y-1">
          <Label htmlFor="estimator-end">{t('debt.estimator.end')}</Label>
          <Input
            id="estimator-end"
            type="date"
            max={todayISO}
            value={end}
            onChange={(e) => {
              setEnd(e.target.value)
              setResult(null)
            }}
          />
        </div>
      </div>

      <Button
        variant="outline"
        type="button"
        onClick={handleCompute}
        disabled={start === '' || end === ''}
      >
        {t('debt.estimator.compute')}
      </Button>

      {result &&
        (result.ok ? (
          <div className="flex items-center gap-2 text-sm text-primary">
            <CheckCircle2 aria-hidden size={16} />
            <span>{t('debt.estimator.proposal', { days: result.days })}</span>
            <Button
              variant="default"
              size="sm"
              type="button"
              onClick={() => handleAccept(result.days)}
            >
              {t('debt.estimator.accept')}
            </Button>
          </div>
        ) : (
          <div
            className={cn(
              'flex items-center gap-2 text-sm',
              'text-destructive',
            )}
            role="alert"
          >
            <AlertCircle aria-hidden size={16} />
            <span>{result.error}</span>
          </div>
        ))}
    </fieldset>
  )
}
