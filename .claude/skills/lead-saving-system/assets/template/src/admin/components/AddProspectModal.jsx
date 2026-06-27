// Add a prospect that came from outside the website (calls, referrals, events).
// The main inbound flow is still the lead form → Potential deals automatically.
import { useState } from 'react'
import { Modal, Field, Input, Select, Textarea, AdminButton } from './shared.jsx'
import { SERVICES } from '../config.js'

const EMPTY = { clientName: '', industry: '', interestPackage: '', need: '', dueDate: '' }

export default function AddProspectModal({ open, onClose, onSubmit }) {
  const [values, setValues] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const set = (k) => (e) => {
    setValues((v) => ({ ...v, [k]: e.target.value }))
    if (errors[k]) setErrors((er) => ({ ...er, [k]: undefined }))
  }

  const close = () => {
    if (saving) return
    setValues(EMPTY)
    setErrors({})
    onClose()
  }

  const submit = async (e) => {
    e.preventDefault()
    const err = {}
    if (!values.clientName.trim()) err.clientName = 'Client name is required'
    if (!values.industry.trim()) err.industry = 'Industry is required'
    setErrors(err)
    if (Object.keys(err).length) return
    setSaving(true)
    try {
      await onSubmit(values)
      setValues(EMPTY)
      onClose()
    } catch (e) {
      setErrors({ form: e.message || 'Could not save. Try again.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title="Add prospect"
      subtitle="For leads from outside the website. A Client ID is generated automatically."
      footer={
        <>
          <AdminButton variant="ghost" type="button" onClick={close} disabled={saving}>
            Cancel
          </AdminButton>
          <AdminButton
            type="button"
            disabled={saving}
            onClick={() => document.getElementById('add-prospect-form')?.requestSubmit()}
          >
            {saving ? 'Adding…' : 'Add prospect'}
          </AdminButton>
        </>
      }
    >
      <form id="add-prospect-form" onSubmit={submit} className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Client name" required error={errors.clientName}>
            <Input value={values.clientName} onChange={set('clientName')} placeholder="e.g. Riverside Project" />
          </Field>
          <Field label="Industry" required error={errors.industry}>
            <Input value={values.industry} onChange={set('industry')} placeholder="e.g. Construction" />
          </Field>
        </div>
        <Field label="Interest in service">
          <Select value={values.interestPackage} onChange={set('interestPackage')} placeholder="Select a service">
            {SERVICES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Need — what to give as a prototype" hint="What we'll mock up to win them.">
          <Textarea
            rows={3}
            value={values.need}
            onChange={set('need')}
            placeholder="e.g. Walkthrough demo for their team"
          />
        </Field>
        <Field label="Receive / due date" hint="When the prototype is expected.">
          <Input type="date" value={values.dueDate} onChange={set('dueDate')} />
        </Field>
        {errors.form && <p className="text-sm font-medium text-alert">{errors.form}</p>}
      </form>
    </Modal>
  )
}
