import { useEffect, useRef } from 'react'

import { Button } from '#/components/ui/button'
import { t } from '#/i18n'

interface ConfirmDialogProps {
  open: boolean
  label: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  label,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) {
      dialog.showModal()
      cancelRef.current?.focus()
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  return (
    <dialog
      ref={dialogRef}
      onCancel={(event) => {
        event.preventDefault()
        onCancel()
      }}
      onClick={(event) => {
        if (event.target === dialogRef.current) onCancel()
      }}
      className="rounded-lg border border-border bg-card p-6 text-card-foreground shadow-lg"
    >
      <p className="mb-2 font-semibold">{t('confirm.title')}</p>
      <p className="mb-6 text-muted-foreground">
        {t('confirm.body', { label })}
      </p>
      <div className="flex justify-end gap-3">
        <Button ref={cancelRef} variant="outline" onClick={onCancel}>
          {t('confirm.cancel')}
        </Button>
        <Button variant="default" onClick={onConfirm}>
          {t('confirm.yes')}
        </Button>
      </div>
    </dialog>
  )
}
