import { useEffect, useRef } from 'react'

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
      className="rounded-lg p-6 backdrop:bg-black/40"
    >
      <p className="mb-4 font-semibold">{t('confirm.title')}</p>
      <p className="mb-6">{t('confirm.body', { label })}</p>
      <div className="flex justify-end gap-3">
        <button
          ref={cancelRef}
          type="button"
          onClick={onCancel}
          className="rounded px-4 py-2"
        >
          {t('confirm.cancel')}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="rounded bg-current px-4 py-2 text-white"
        >
          {t('confirm.yes')}
        </button>
      </div>
    </dialog>
  )
}
