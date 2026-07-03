import { useState } from 'react'
import { AlertCircle } from 'lucide-react'

import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { validateDebtCount } from '#/features/debt/calc'
import { DateRangeEstimator } from '#/features/debt/components/DateRangeEstimator'
import * as store from '#/features/debt/store'
import { t } from '#/i18n'

export function DebtEntryForm() {
  const stored = store.useDebt()

  const [prayerInput, setPrayerInput] = useState(
    stored.prayerDebt !== null ? String(stored.prayerDebt) : '',
  )
  const [fastInput, setFastInput] = useState(
    stored.fastDebt !== null ? String(stored.fastDebt) : '',
  )
  const [prayerError, setPrayerError] = useState<string | null>(null)
  const [fastError, setFastError] = useState<string | null>(null)
  const [savedMessage, setSavedMessage] = useState<string | null>(null)

  function handleSave() {
    const prayerResult = validateDebtCount(prayerInput)
    const fastResult = validateDebtCount(fastInput)

    setPrayerError(
      prayerResult.ok ? null : t(`debt.error.${prayerResult.error}`),
    )
    setFastError(fastResult.ok ? null : t(`debt.error.${fastResult.error}`))

    if (!prayerResult.ok || !fastResult.ok) return

    store.saveDebt({
      prayerDebt: prayerResult.value,
      fastDebt: fastResult.value,
    })

    setSavedMessage(t('debt.saved'))
    setTimeout(() => setSavedMessage(null), 3000)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4">
        <div className="space-y-1">
          <Label htmlFor="prayer-debt">{t('debt.prayer.label')}</Label>
          <Input
            id="prayer-debt"
            type="text"
            inputMode="numeric"
            value={prayerInput}
            onChange={(e) => {
              setPrayerInput(e.target.value)
              setPrayerError(null)
            }}
            aria-invalid={!!prayerError}
          />
          {prayerError && (
            <p
              role="alert"
              className="flex items-center gap-1 text-sm text-destructive"
            >
              <AlertCircle aria-hidden size={14} />
              <span>{prayerError}</span>
            </p>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor="fast-debt">{t('debt.fast.label')}</Label>
          <Input
            id="fast-debt"
            type="text"
            inputMode="numeric"
            value={fastInput}
            onChange={(e) => {
              setFastInput(e.target.value)
              setFastError(null)
            }}
            aria-invalid={!!fastError}
          />
          {fastError && (
            <p
              role="alert"
              className="flex items-center gap-1 text-sm text-destructive"
            >
              <AlertCircle aria-hidden size={14} />
              <span>{fastError}</span>
            </p>
          )}
        </div>
      </div>

      <DateRangeEstimator
        onAccept={(days) => {
          setPrayerInput(String(days))
          setPrayerError(null)
        }}
      />

      <Button type="button" onClick={handleSave}>
        {t('debt.save')}
      </Button>

      {savedMessage && (
        <p aria-live="polite" className="text-center text-sm text-primary">
          {savedMessage}
        </p>
      )}
    </div>
  )
}
