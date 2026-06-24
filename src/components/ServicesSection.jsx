import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Container, Reveal, SectionHeading } from './ui.jsx'
import { IconArrow, IconGlobe, IconCalc, IconChat, IconShield } from './icons.jsx'
import { useI18n } from '../i18n/context.jsx'

const ICONS = [IconGlobe, IconCalc, IconChat, IconShield]
const EASE = [0.22, 1, 0.36, 1]

// Tabbed layout (Braze-style): one service in focus at a time so each gets a
// proper screenshot-style panel instead of competing in a flat grid.
export default function ServicesSection() {
  const { t } = useI18n()
  const s = t.services
  const reduce = useReducedMotion()
  const [active, setActive] = useState(0)
  const item = s.items[active]
  const Icon = ICONS[active]

  return (
    <section id="services" className="relative py-20 sm:py-28">
      <Container>
        <Reveal>
          <SectionHeading kicker={s.kicker} title={s.title} subtitle={s.sub} />
        </Reveal>

        <Reveal>
          <div className="mt-12 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {s.items.map((it, i) => {
              const TabIcon = ICONS[i]
              const on = i === active
              return (
                <button
                  key={it.name}
                  type="button"
                  onClick={() => setActive(i)}
                  aria-pressed={on}
                  className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-start transition-all duration-200 ${
                    on
                      ? 'border-clay bg-clay text-white shadow-clay'
                      : 'border-line bg-surface text-ink hover:border-clay hover:text-clay-ink'
                  }`}
                >
                  <span
                    className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${
                      on ? 'bg-white/20 text-white' : 'bg-clay-tint text-clay-ink'
                    }`}
                  >
                    <TabIcon className="h-5 w-5" />
                  </span>
                  <span className="text-sm font-semibold leading-tight">{it.name}</span>
                </button>
              )
            })}
          </div>
        </Reveal>

        <motion.div
          key={active}
          initial={reduce ? false : { opacity: 0, y: 14 }}
          animate={reduce ? false : { opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE }}
          className="mt-6 grid items-stretch overflow-hidden rounded-3xl border border-line bg-surface shadow-soft md:grid-cols-[1.1fr_0.9fr]"
        >
          <div className="flex flex-col p-7 sm:p-9">
            <span className="inline-flex w-fit rounded-full border border-line px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-muted">
              {item.tag}
            </span>
            <h3 className="mt-4 text-2xl font-bold text-ink">{item.name}</h3>
            <p className="mt-3 flex-1 text-[1rem] leading-relaxed text-ink-soft">{item.desc}</p>
            <p className="mt-5 border-t border-line pt-4 text-sm text-ink-soft">
              <span className="font-semibold text-ink">{s.bestForLabel} </span>
              {item.bestFor}
            </p>
            <a
              href="#contact"
              className="group mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-clay-ink transition-colors hover:text-clay"
            >
              {t.cta.learnMore}
              <IconArrow className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 rtl:-scale-x-100" />
            </a>
          </div>

          <div className="relative hidden items-center justify-center overflow-hidden bg-clay-tint md:flex">
            <div
              aria-hidden
              className="absolute inset-0 bg-dots opacity-40 [mask-image:radial-gradient(80%_80%_at_50%_50%,#000,transparent)]"
            />
            <Icon className="relative h-24 w-24 text-clay" />
          </div>
        </motion.div>
      </Container>
    </section>
  )
}
