import { salahMin } from '#/features/counters/calc'
import { ProgressHeader } from '#/features/counters/components/ProgressHeader'
import { PrayerRow } from '#/features/counters/components/PrayerRow'
import * as store from '#/features/counters/store'
import { PRAYER_ORDER } from '#/features/counters/types'
import { t } from '#/i18n'

export function SalahSection() {
  const state = store.useCounters()

  return (
    <section className="flex min-h-0 flex-1 flex-col gap-2">
      <h2 className="text-base font-semibold sm:text-lg">
        {t('salah.heading')}
      </h2>
      <ProgressHeader days={salahMin(state)} />
      <div className="flex min-h-0 flex-1 flex-col justify-around gap-1">
        {PRAYER_ORDER.map((prayer) => (
          <PrayerRow key={prayer} prayer={prayer} />
        ))}
      </div>
    </section>
  )
}
