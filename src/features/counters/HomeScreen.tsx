import { Link } from '@tanstack/react-router'

import { FastSection } from '#/features/counters/components/FastSection'
import { SalahSection } from '#/features/counters/components/SalahSection'
import { useEncouragementMessage } from '#/features/counters/encouragement'
import { t, useDirection } from '#/i18n'

export function HomeScreen() {
  const dir = useDirection()
  const message = useEncouragementMessage()

  return (
    <main
      dir={dir}
      className="flex h-dvh flex-col gap-4 overflow-hidden bg-background p-4 sm:gap-6 sm:p-6"
    >
      <header className="shrink-0">
        <Link
          to="/debt"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          {t('nav.debt')}
        </Link>
      </header>
      <SalahSection />
      <FastSection />
      <p
        aria-live="polite"
        className="h-6 shrink-0 text-center text-sm text-muted-foreground"
      >
        {message}
      </p>
    </main>
  )
}
