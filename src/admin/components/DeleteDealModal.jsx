// Confirms permanent deletion of a (canceled) prospect from the database.
// Destructive + irreversible, so it asks before calling the API.
import { useState } from 'react'
import { Modal, AdminButton } from './shared.jsx'

export default function DeleteDealModal({ deal, onClose, onConfirm }) {
  const open = Boolean(deal)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const close = () => {
    if (busy) return
    onClose()
  }

  const confirm = async () => {
    setBusy(true)
    setError('')
    try {
      await onConfirm({ clientId: deal['Client ID'] })
      onClose()
    } catch (err) {
      setError(err.message || 'Could not delete. Try again.')
    } finally {
      setBusy(false)
    }
  }

  if (!open) return null

  return (
    <Modal
      open={open}
      onClose={close}
      title="Delete from database"
      subtitle={deal['Client Name']}
      footer={
        <>
          <AdminButton variant="ghost" type="button" onClick={close} disabled={busy}>
            Keep it
          </AdminButton>
          <AdminButton
            type="button"
            variant="secondary"
            disabled={busy}
            onClick={confirm}
            className="border-alert/40 text-alert hover:border-alert hover:text-alert"
          >
            {busy ? 'Deleting…' : 'Delete permanently'}
          </AdminButton>
        </>
      }
    >
      <div className="flex flex-col gap-3 text-sm">
        <p className="text-ink-soft">
          This permanently removes{' '}
          <span className="font-semibold text-ink">{deal['Client Name']}</span> from the
          database. This <span className="font-semibold text-alert">cannot be undone</span>.
        </p>
        {error && <p className="font-medium text-alert">{error}</p>}
      </div>
    </Modal>
  )
}
