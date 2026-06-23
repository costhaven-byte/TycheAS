import { Container, Reveal, SectionHeading } from './ui.jsx'
import { IconArrow, IconGlobe, IconCalc, IconChat, IconShield } from './icons.jsx'
import { useI18n } from '../i18n/context.jsx'

const ICONS = [IconGlobe, IconCalc, IconChat, IconShield]

export default function ServicesSection() {
  const { t } = useI18n()
  const s = t.services

  return (
    <section id="services" className="relative py-20 sm:py-28">
      <Container>
        <Reveal>
          <SectionHeading kicker={s.kicker} title={s.title} subtitle={s.sub} />
        </Reveal>

        <div className="mt-14 grid gap-5 md:grid-cols-2">
          {s.items.map((item, i) => {
            const Icon = ICONS[i]
            return (
              <Reveal key={item.name} delay={(i % 2) * 0.08}>
                <article className="group flex h-full flex-col rounded-3xl border border-line bg-surface p-7 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-clay hover:shadow-lift">
                  <div className="flex items-center gap-3">
                    <span className="grid h-11 w-11 place-items-center rounded-2xl bg-clay-tint text-clay-ink">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="rounded-full border border-line px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-muted">
                      {item.tag}
                    </span>
                  </div>
                  <h3 className="mt-5 text-xl font-bold text-ink">{item.name}</h3>
                  <p className="mt-2.5 flex-1 text-[0.95rem] leading-relaxed text-ink-soft">
                    {item.desc}
                  </p>
                  <p className="mt-5 border-t border-line pt-4 text-sm text-ink-soft">
                    <span className="font-semibold text-ink">{s.bestForLabel} </span>
                    {item.bestFor}
                  </p>
                  <a
                    href="#contact"
                    className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-clay-ink transition-colors hover:text-clay"
                  >
                    {t.cta.learnMore}
                    <IconArrow className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 rtl:-scale-x-100" />
                  </a>
                </article>
              </Reveal>
            )
          })}
        </div>
      </Container>
    </section>
  )
}
