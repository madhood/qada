import { salahMin } from '#/features/counters/calc'
import * as counters from '#/features/counters/store'
import { CategoryProgress } from '#/features/debt/components/CategoryProgress'
import * as debtStore from '#/features/debt/store'
import { t } from '#/i18n'

export function ProgressView() {
  const countersState = counters.useCounters()
  const debt = debtStore.useDebt()

  const completedPrayer = salahMin(countersState)
  const completedFast = countersState.fasts

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold sm:text-xl">
        {t('progress.heading')}
      </h2>
      <CategoryProgress
        category="prayer"
        debt={debt.prayerDebt}
        completed={completedPrayer}
      />
      <CategoryProgress
        category="fast"
        debt={debt.fastDebt}
        completed={completedFast}
      />
    </section>
  )
}
