// Lightweight status actions for a prospect: mark it In Progress (assigned to a
// closer) or cancel it. One modal, two modes, so the two flows stay consistent.
import { useState, useEffect } from 'react'
import { Modal, Field, Select, AdminButton } from './shared.jsx'
import { CLOSERS } from '../config.js'

export default function DealStatusModal({ mode, deal, onClose, onSubmit }) {
  const open = Boolean(mode && deal)
  const isStart = mode === 'start'
  const [assignee, setAssignee] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setAssignee(deal['Assigned To'] || '')
    setError('')
  }, [open, deal])

  const close = () => {
    if (saving) return
    onClose()
  }

  const submit = async (e) => {
    e?.preventDefault()
    if (isStart && !assignee) {
      setError('Pick who is working on it')
      return
    }
    setSaving(true)
    try {
      await onSubmit(
        isStart
          ? { clientId: deal['Client ID'], status: 'In Progress', assignedTo: assignee }
          : { clientId: deal['Client ID'], status: 'Canceled', assignedTo: '' }
      )
      onClose()
    } catch (err) {
      setError(err.message || 'Could not update. Try again.')
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <Modal
      open={open}
      onClose={close}
      title={isStart ? 'Set deal in progress' : 'Cancel this deal'}
      subtitle={deal['Client Name']}
      footer={
        <>
          <AdminButton variant="ghost" type="button" onClick={close} disabled={saving}>
            {isStart ? 'Cancel' : 'Keep it'}
          </AdminButton>
          <AdminButton
            type="button"
            variant={isStart ? 'primary' : 'secondary'}
            disabled={saving}
            onClick={submit}
            className={isStart ? '' : 'border-alert/40 text-alert hover:border-alert hover:text-alert'}
          >
            {saving ? 'Saving…' : isStart ? 'Mark in progress' : 'Cancel deal'}
          </AdminButton>
        </>
      }
    >
      {isStart ? (
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="rounded-xl border border-line bg-sunken px-4 py-3 text-sm text-muted">
            Marks the prospect <span className="font-semibold text-ink">In Progress</span> and records who owns it.
          </div>
          <Field label="In progress by" required error={error}>
            <Select value={assignee} onChange={(e) => { setAssignee(e.target.value); setError('') }} placeholder="Who is on it?">
              {CLOSERS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Field>
        </form>
      ) : (
        <div className="flex flex-col gap-3 text-sm">
          <p className="text-ink-soft">
            This marks <span className="font-semibold text-ink">{deal['Client Name']}</span> as{' '}
            <span className="font-semibold text-alert">Canceled</span>. It stays in the list for the record but drops
            off the calendar and stat counts.
          </p>
          {error && <p className="font-medium text-alert">{error}</p>}
        </div>
      )}
    </Modal>
  )
}
