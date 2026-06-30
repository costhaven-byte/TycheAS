// Add a lead that came from outside the website (calls, referrals, walk-ins).
// The main inbound flow is still the lead form + chatbot → Leads automatically.
import { useState } from 'react'
import { Modal, Field, Input, Select, Textarea, AdminButton } from './shared.jsx'
import { SERVICES } from '../config.js'

const EMPTY = { name: '', contact: '', interest: '', notes: '' }

export default function AddLeadModal({ open, onClose, onSubmit }) {
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
    if (!values.name.trim()) err.name = 'Name is required'
    if (!values.contact.trim()) err.contact = 'A phone or email is required'
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
      title="Add lead"
      subtitle="For leads from outside the website. An ID is generated automatically."
      footer={
        <>
          <AdminButton variant="ghost" type="button" onClick={close} disabled={saving}>Cancel</AdminButton>
          <AdminButton type="button" disabled={saving} onClick={() => document.getElementById('add-lead-form')?.requestSubmit()}>
            {saving ? 'Adding…' : 'Add lead'}
          </AdminButton>
        </>
      }
    >
      <form id="add-lead-form" onSubmit={submit} className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" required error={errors.name}>
            <Input value={values.name} onChange={set('name')} placeholder="e.g. Sarah Lopez" />
          </Field>
          <Field label="Contact" required error={errors.contact}>
            <Input value={values.contact} onChange={set('contact')} placeholder="phone or email" dir="ltr" />
          </Field>
        </div>
        <Field label="Interest">
          <Select value={values.interest} onChange={set('interest')} placeholder="Select…">
            {SERVICES.map((p) => (<option key={p} value={p}>{p}</option>))}
          </Select>
        </Field>
        <Field label="Notes" hint="Anything useful for follow-up.">
          <Textarea rows={3} value={values.notes} onChange={set('notes')} placeholder="e.g. Asked about weekend availability" />
        </Field>
        {errors.form && <p className="text-sm font-medium text-alert">{errors.form}</p>}
      </form>
    </Modal>
  )
}
