import { useState } from 'react'

import { CounterButton } from '#/features/counters/components/CounterButton'
import { ConfirmDialog } from '#/features/counters/components/ConfirmDialog'
import { ProgressHeader } from '#/features/counters/components/ProgressHeader'
import { showEncouragement } from '#/features/counters/encouragement'
import { nextEncouragementKey } from '#/features/counters/messages'
import * as store from '#/features/counters/store'
import { t } from '#/i18n'

export function FastSection() {
  const state = store.useCounters()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const label = t('fast.heading')

  return (
    <section className="flex min-h-0 flex-col gap-2">
      <h2 className="text-base font-semibold tracking-wide text-muted-foreground uppercase sm:text-sm">
        {label}
      </h2>
      <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-3 py-2">
        <ProgressHeader days={state.fasts} className="text-primary" />
        <div className="flex items-center gap-1">
          <CounterButton
            kind="decrement"
            label={label}
            disabled={state.fasts === 0}
            onPress={() => setConfirmOpen(true)}
          />
          <CounterButton
            kind="increment"
            label={label}
            onPress={() => {
              store.incrementFast()
              showEncouragement(nextEncouragementKey())
            }}
          />
        </div>
      </div>
      <ConfirmDialog
        open={confirmOpen}
        label={label}
        onConfirm={() => {
          store.decrementFast()
          setConfirmOpen(false)
        }}
        onCancel={() => setConfirmOpen(false)}
      />
    </section>
  )
}
