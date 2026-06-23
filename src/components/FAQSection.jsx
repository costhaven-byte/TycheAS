import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Container, Reveal, SectionHeading } from './ui.jsx'
import { useI18n } from '../i18n/context.jsx'

function FAQItem({ faq, isOpen, onToggle }) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border bg-surface transition-colors ${
        isOpen ? 'border-clay shadow-soft' : 'border-line'
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-start"
      >
        <span className="text-base font-bold text-ink">{faq.q}</span>
        <span
          className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border transition-all duration-300 ${
            isOpen ? 'rotate-45 border-clay text-clay-ink' : 'border-line-strong text-ink-soft'
          }`}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="px-6 pb-5 text-[0.95rem] leading-relaxed text-ink-soft">{faq.a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function FAQSection() {
  const { t } = useI18n()
  const f = t.faq
  const [open, setOpen] = useState(0)

  return (
    <section id="faq" className="relative py-20 sm:py-28">
      <Container>
        <Reveal>
          <SectionHeading kicker={f.kicker} title={f.title} subtitle={f.sub} />
        </Reveal>

        <div className="mx-auto mt-12 flex max-w-3xl flex-col gap-3">
          {f.items.map((faq, i) => (
            <Reveal key={faq.q} delay={i * 0.04}>
              <FAQItem faq={faq} isOpen={open === i} onToggle={() => setOpen(open === i ? -1 : i)} />
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  )
}
