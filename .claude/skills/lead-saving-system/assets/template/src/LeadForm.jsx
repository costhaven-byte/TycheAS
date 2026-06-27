// Public lead-capture form. Self-contained (no i18n / external UI deps) so it can
// be dropped into any site. On submit it fires the lead straight into the
// Potential deals tab via submitLead and shows a success screen — fire-and-forget
// so a backend hiccup never blocks the visitor.
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Field, Input, Select, Textarea, AdminButton, IconCheck } from './admin/components/shared.jsx'
import { SERVICES } from './admin/config.js'
import { submitLead } from './admin/api.js'

const INITIAL = { name: '', business: '', industry: '', email: '', phone: '', help: '', message: '' }

function validate(v) {
  const e = {}
  if (!v.name.trim()) e.name = 'Your name is required'
  if (!v.business.trim()) e.business = 'Business name is required'
  if (!v.industry.trim()) e.industry = 'Industry is required'
  if (!v.email.trim()) e.email = 'Email is required'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email.trim())) e.email = 'Enter a valid email'
  if (!v.phone.trim()) e.phone = 'Phone is required'
  else if (!/^[+\d][\d\s().-]{6,}$/.test(v.phone.trim())) e.phone = 'Enter a valid phone'
  if (!v.help) e.help = 'Pick what you need'
  return e
}

export default function LeadForm() {
  const [values, setValues] = useState(INITIAL)
  const [errors, setErrors] = useState({})
  const [submitted, setSubmitted] = useState(false)

  const update = (key) => (e) => {
    setValues((v) => ({ ...v, [key]: e.target.value }))
    if (errors[key]) setErrors((er) => ({ ...er, [key]: undefined }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const found = validate(values)
    setErrors(found)
    if (Object.keys(found).length) return
    // Send the lead into the Potential deals tab. submitLead never throws into
    // the visitor's face; it logs on failure and no-ops gracefully offline.
    submitLead(values).catch((err) => {
      // eslint-disable-next-line no-console
      console.error('Lead submission failed:', err)
    })
    setSubmitted(true)
    setValues(INITIAL)
  }

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center rounded-3xl border border-line bg-surface p-10 text-center shadow-lift"
      >
        <span className="grid h-16 w-16 place-items-center rounded-full bg-win-tint text-win">
          <IconCheck className="h-8 w-8" />
        </span>
        <h3 className="mt-6 text-2xl font-bold text-ink">Thanks — we got it.</h3>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-ink-soft">
          Your details are in. We'll be in touch shortly.
        </p>
        <AdminButton variant="secondary" type="button" className="mt-8" onClick={() => setSubmitted(false)}>
          Send another
        </AdminButton>
      </motion.div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="flex flex-col gap-4 rounded-3xl border border-line bg-surface p-6 shadow-lift sm:p-8"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Your name" required error={errors.name}>
          <Input value={values.name} onChange={update('name')} placeholder="Jane Doe" />
        </Field>
        <Field label="Business" required error={errors.business}>
          <Input value={values.business} onChange={update('business')} placeholder="Acme Co." />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Industry" required error={errors.industry}>
          <Input value={values.industry} onChange={update('industry')} placeholder="e.g. Construction" />
        </Field>
        <Field label="Email" required error={errors.email}>
          <Input type="email" value={values.email} onChange={update('email')} placeholder="you@business.com" dir="ltr" />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Phone" required error={errors.phone}>
          <Input type="tel" value={values.phone} onChange={update('phone')} placeholder="+1 555 123 4567" dir="ltr" />
        </Field>
        <Field label="What do you need?" required error={errors.help}>
          <Select value={values.help} onChange={update('help')} placeholder="Select…">
            {SERVICES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label="Anything else?" hint="Optional — a sentence or two helps.">
        <Textarea rows={4} value={values.message} onChange={update('message')} placeholder="Tell us a bit about it…" />
      </Field>
      <AdminButton type="submit" className="mt-1 w-full">
        Get in touch
      </AdminButton>
      <p className="text-center text-xs text-muted">We'll only use your details to reply about your request.</p>
    </form>
  )
}
