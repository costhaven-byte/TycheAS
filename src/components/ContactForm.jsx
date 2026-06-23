import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Container, Reveal, Kicker, Button } from './ui.jsx'
import { IconCheck, IconShield, IconClock, IconBolt } from './icons.jsx'
import { useI18n } from '../i18n/context.jsx'
import { HELP_VALUES } from '../i18n/translations.js'

const INITIAL = {
  name: '',
  business: '',
  industry: '',
  email: '',
  phone: '',
  help: '',
  message: '',
}

const PERK_ICONS = [IconClock, IconShield, IconBolt]

// Returns a map of field -> error code (keys into t.contact.errors).
function validate(values) {
  const errors = {}
  if (!values.name.trim()) errors.name = 'name'
  if (!values.business.trim()) errors.business = 'business'
  if (!values.industry.trim()) errors.industry = 'industry'

  if (!values.email.trim()) {
    errors.email = 'emailReq'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = 'emailInvalid'
  }

  if (!values.phone.trim()) {
    errors.phone = 'phoneReq'
  } else if (!/^[+\d][\d\s().-]{6,}$/.test(values.phone.trim())) {
    errors.phone = 'phoneInvalid'
  }

  if (!values.help) errors.help = 'help'
  return errors
}

const fieldBase =
  'w-full rounded-xl border bg-surface px-4 py-3 text-sm text-ink placeholder:text-muted transition-colors focus:outline-none focus:border-clay'

function Field({ label, error, children }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-semibold text-ink">{label}</span>
      {children}
      <AnimatePresence>
        {error && (
          <motion.span
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-xs font-medium text-alert"
          >
            {error}
          </motion.span>
        )}
      </AnimatePresence>
    </label>
  )
}

export default function ContactForm() {
  const { t } = useI18n()
  const c = t.contact
  const [values, setValues] = useState(INITIAL)
  const [errors, setErrors] = useState({})
  const [submitted, setSubmitted] = useState(false)

  const update = (key) => (e) => {
    setValues((v) => ({ ...v, [key]: e.target.value }))
    if (errors[key]) setErrors((er) => ({ ...er, [key]: undefined }))
  }

  const borderFor = (key) => (errors[key] ? 'border-alert' : 'border-line-strong')
  const errMsg = (key) => (errors[key] ? c.errors[errors[key]] : undefined)

  const handleSubmit = (e) => {
    e.preventDefault()
    const found = validate(values)
    setErrors(found)
    if (Object.keys(found).length > 0) {
      const first = document.querySelector('[data-invalid="true"]')
      first?.focus()
      return
    }
    // Front-end only for now. Structured payload — ready to wire to email/CRM/automation.
    const payload = { ...values, submittedAt: new Date().toISOString() }
    // eslint-disable-next-line no-console
    console.log('TycheAS — new lead:', payload)
    setSubmitted(true)
    setValues(INITIAL)
  }

  return (
    <section id="contact" className="relative bg-sunken py-20 sm:py-28">
      <Container>
        <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <Reveal>
            <div className="lg:sticky lg:top-28">
              <Kicker>{c.kicker}</Kicker>
              <h2 className="mt-5 text-[2rem] font-bold leading-[1.05] tracking-tight sm:text-[2.6rem]">
                {c.title}
              </h2>
              <p className="mt-5 max-w-md text-[1.05rem] leading-relaxed text-ink-soft">{c.sub}</p>
              <ul className="mt-8 flex flex-col gap-3">
                {c.perks.map((perk, i) => {
                  const Icon = PERK_ICONS[i]
                  return (
                    <li key={perk} className="flex items-center gap-3 text-[0.95rem] text-ink">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-clay-tint text-clay-ink">
                        <Icon className="h-5 w-5" />
                      </span>
                      {perk}
                    </li>
                  )
                })}
              </ul>
              <p className="mt-8 rounded-2xl border border-line bg-surface p-5 text-sm leading-relaxed text-ink-soft">
                {c.emailPre}
                <a href="mailto:hello@tycheas.com" className="font-semibold text-clay-ink hover:text-clay" dir="ltr">
                  hello@tycheas.com
                </a>
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="rounded-3xl border border-line bg-surface p-6 shadow-lift sm:p-8">
              <AnimatePresence mode="wait">
                {submitted ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center py-12 text-center"
                  >
                    <span className="grid h-16 w-16 place-items-center rounded-full bg-win-tint text-win">
                      <IconCheck className="h-8 w-8" />
                    </span>
                    <h3 className="mt-6 text-2xl font-bold text-ink">{c.success.title}</h3>
                    <p className="mt-3 max-w-sm text-sm leading-relaxed text-ink-soft">{c.success.body}</p>
                    <Button
                      as="button"
                      type="button"
                      variant="secondary"
                      size="md"
                      className="mt-8"
                      onClick={() => setSubmitted(false)}
                    >
                      {c.success.again}
                    </Button>
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onSubmit={handleSubmit}
                    noValidate
                    className="flex flex-col gap-5"
                  >
                    <div className="grid gap-5 sm:grid-cols-2">
                      <Field label={c.labels.name} error={errMsg('name')}>
                        <input
                          type="text"
                          value={values.name}
                          onChange={update('name')}
                          data-invalid={!!errors.name}
                          placeholder={c.placeholders.name}
                          className={`${fieldBase} ${borderFor('name')}`}
                        />
                      </Field>
                      <Field label={c.labels.business} error={errMsg('business')}>
                        <input
                          type="text"
                          value={values.business}
                          onChange={update('business')}
                          data-invalid={!!errors.business}
                          placeholder={c.placeholders.business}
                          className={`${fieldBase} ${borderFor('business')}`}
                        />
                      </Field>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                      <Field label={c.labels.industry} error={errMsg('industry')}>
                        <input
                          type="text"
                          value={values.industry}
                          onChange={update('industry')}
                          data-invalid={!!errors.industry}
                          placeholder={c.placeholders.industry}
                          className={`${fieldBase} ${borderFor('industry')}`}
                        />
                      </Field>
                      <Field label={c.labels.email} error={errMsg('email')}>
                        <input
                          type="email"
                          value={values.email}
                          onChange={update('email')}
                          data-invalid={!!errors.email}
                          placeholder={c.placeholders.email}
                          dir="ltr"
                          className={`${fieldBase} ${borderFor('email')}`}
                        />
                      </Field>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                      <Field label={c.labels.phone} error={errMsg('phone')}>
                        <input
                          type="tel"
                          value={values.phone}
                          onChange={update('phone')}
                          data-invalid={!!errors.phone}
                          placeholder={c.placeholders.phone}
                          dir="ltr"
                          className={`${fieldBase} ${borderFor('phone')}`}
                        />
                      </Field>
                      <Field label={c.labels.help} error={errMsg('help')}>
                        <select
                          value={values.help}
                          onChange={update('help')}
                          data-invalid={!!errors.help}
                          className={`${fieldBase} ${borderFor('help')} ${values.help ? 'text-ink' : 'text-muted'}`}
                        >
                          <option value="" disabled>
                            {c.placeholders.help}
                          </option>
                          {HELP_VALUES.map((value, i) => (
                            <option key={value} value={value} className="text-ink">
                              {c.helpOptions[i]}
                            </option>
                          ))}
                        </select>
                      </Field>
                    </div>

                    <Field label={c.labels.message} error={errMsg('message')}>
                      <textarea
                        value={values.message}
                        onChange={update('message')}
                        rows={4}
                        placeholder={c.placeholders.message}
                        className={`${fieldBase} ${borderFor('message')} resize-none`}
                      />
                    </Field>

                    <Button as="button" type="submit" size="lg" className="mt-1 w-full" withArrow>
                      {c.submit}
                    </Button>
                    <p className="text-center text-xs text-muted">{c.disclaimer}</p>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  )
}
