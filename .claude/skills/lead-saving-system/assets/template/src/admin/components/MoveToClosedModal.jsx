// Convert a prospect into a closed deal. Carries the client's identity over and
// captures the commercial terms (service, duration, closer, activation window).
import { useState, useEffect } from 'react'
import { Modal, Field, Input, Select, AdminButton, toISODate } from './shared.jsx'
import { SERVICES, CLOSERS } from '../config.js'

export default function MoveToClosedModal({ open, prospect, onClose, onSubmit }) {
  const [values, setValues] = useState({})
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  // Seed from the prospect each time the modal opens with a new one.
  useEffect(() => {
    if (!prospect) return
    setValues({
      packageBought: prospect['Interest in Package'] || '',
      duration: '',
      closer: '',
      activationDate: toISODate(new Date()),
      endDate: '',
    })
    setErrors({})
  }, [prospect])

  const set = (k) => (e) => {
    setValues((v) => ({ ...v, [k]: e.target.value }))
    if (errors[k]) setErrors((er) => ({ ...er, [k]: undefined }))
  }

  const close = () => {
    if (saving) return
    onClose()
  }

  const submit = async (e) => {
    e.preventDefault()
    const err = {}
    if (!values.packageBought) err.packageBought = 'Pick the service they bought'
    if (!values.closer) err.closer = 'Who closed it?'
    if (values.activationDate && values.endDate && values.endDate < values.activationDate)
      err.endDate = 'End date is before activation'
    setErrors(err)
    if (Object.keys(err).length) return
    setSaving(true)
    try {
      await onSubmit({
        clientId: prospect['Client ID'],
        clientName: prospect['Client Name'],
        industry: prospect['Industry'],
        ...values,
      })
      onClose()
    } catch (e) {
      setErrors({ form: e.message || 'Could not move. Try again.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title="Move to closed deals"
      subtitle={prospect ? `${prospect['Client Name']} → Closed deals` : ''}
      footer={
        <>
          <AdminButton variant="ghost" type="button" onClick={close} disabled={saving}>
            Cancel
          </AdminButton>
          <AdminButton
            type="button"
            disabled={saving}
            onClick={() => document.getElementById('move-form')?.requestSubmit()}
          >
            {saving ? 'Closing…' : 'Close the deal'}
          </AdminButton>
        </>
      }
    >
      <form id="move-form" onSubmit={submit} className="flex flex-col gap-4">
        <div className="rounded-xl border border-line bg-sunken px-4 py-3 text-sm">
          <span className="text-muted">Marks the prospect </span>
          <span className="font-semibold text-ink">Completed</span>
          <span className="text-muted"> and appends a row to Closed deals.</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Service bought" required error={errors.packageBought}>
            <Select value={values.packageBought || ''} onChange={set('packageBought')} placeholder="Select a service">
              {SERVICES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Closer" required error={errors.closer}>
            <Select value={values.closer || ''} onChange={set('closer')} placeholder="Who closed it?">
              {CLOSERS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="Duration" hint="e.g. 6 months, 12 months, retainer">
          <Input value={values.duration || ''} onChange={set('duration')} placeholder="6 months" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Activation date">
            <Input type="date" value={values.activationDate || ''} onChange={set('activationDate')} />
          </Field>
          <Field label="End date" error={errors.endDate}>
            <Input type="date" value={values.endDate || ''} onChange={set('endDate')} />
          </Field>
        </div>
        {errors.form && <p className="text-sm font-medium text-alert">{errors.form}</p>}
      </form>
    </Modal>
  )
}
