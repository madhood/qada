import { useState } from 'react'

import { cn } from '#/lib/cn'
import { surplus } from '#/features/counters/calc'
import { CounterButton } from '#/features/counters/components/CounterButton'
import { ConfirmDialog } from '#/features/counters/components/ConfirmDialog'
import { showEncouragement } from '#/features/counters/encouragement'
import { nextEncouragementKey } from '#/features/counters/messages'
import * as store from '#/features/counters/store'
import type { PrayerKey } from '#/features/counters/types'
import { t } from '#/i18n'

interface PrayerRowProps {
  prayer: PrayerKey
}

export function PrayerRow({ prayer }: PrayerRowProps) {
  const state = store.useCounters()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const label = t(`prayer.${prayer}`)
  const count = surplus(state, prayer)

  const isHighlighted = count > 0

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 rounded-lg px-3 py-2 transition-colors',
        isHighlighted && 'bg-accent',
      )}
    >
      <span className="min-w-0 flex-1 text-start font-medium">{label}</span>
      <span
        className={cn(
          'min-w-[2ch] text-center tabular-nums',
          isHighlighted
            ? 'font-semibold text-primary'
            : 'text-muted-foreground',
        )}
      >
        {count}
      </span>
      <div className="flex items-center gap-1">
        <CounterButton
          kind="decrement"
          label={label}
          disabled={state.prayers[prayer] === 0}
          onPress={() => setConfirmOpen(true)}
        />
        <CounterButton
          kind="increment"
          label={label}
          onPress={() => {
            store.incrementPrayer(prayer)
            showEncouragement(nextEncouragementKey())
          }}
        />
      </div>
      <ConfirmDialog
        open={confirmOpen}
        label={label}
        onConfirm={() => {
          store.decrementPrayer(prayer)
          setConfirmOpen(false)
        }}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  )
}
