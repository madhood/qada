import { TriangleAlert } from 'lucide-react'

import { useStorageStatus } from '#/lib/storage/status'
import { t } from '#/i18n'

export function StorageStatusBanner() {
  const status = useStorageStatus()

  if (status === 'ok') return null

  return (
    <div
      role="status"
      className="flex items-start gap-3 border-b border-border bg-accent px-4 py-3 text-sm text-accent-foreground"
    >
      <TriangleAlert aria-hidden size={18} className="mt-0.5 shrink-0" />
      <div>
        <p className="font-semibold">{t('storage.unavailable.title')}</p>
        <p className="text-muted-foreground">{t('storage.unavailable.body')}</p>
      </div>
    </div>
  )
}
