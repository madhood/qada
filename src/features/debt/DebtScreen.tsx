import { Link } from '@tanstack/react-router'

import { DebtEntryForm } from '#/features/debt/components/DebtEntryForm'
import { ProgressView } from '#/features/debt/components/ProgressView'
import { t, useDirection } from '#/i18n'

export function DebtScreen() {
  const dir = useDirection()

  return (
    <main
      dir={dir}
      className="flex min-h-dvh flex-col gap-6 bg-background p-4 sm:gap-8 sm:p-6"
    >
      <header className="flex items-center gap-4">
        <Link
          to="/"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          {t('nav.home')}
        </Link>
        <h1 className="text-xl font-semibold sm:text-2xl">
          {t('debt.heading')}
        </h1>
      </header>

      <DebtEntryForm />
      <ProgressView />
    </main>
  )
}
