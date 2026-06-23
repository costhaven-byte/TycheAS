import { Container, Reveal, Kicker } from './ui.jsx'
import { IconClock, IconPhoneSlash, IconCalc, IconGlobe } from './icons.jsx'
import { useI18n } from '../i18n/context.jsx'

const ICONS = [IconClock, IconPhoneSlash, IconCalc, IconGlobe]

export default function ProblemSection() {
  const { t } = useI18n()
  const p = t.problem

  return (
    <section id="problem" className="relative bg-sunken py-20 sm:py-28">
      <Container>
        <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <Reveal>
            <div className="lg:sticky lg:top-28">
              <Kicker>{p.kicker}</Kicker>
              <h2 className="mt-5 text-[2rem] font-bold leading-[1.05] tracking-tight sm:text-[2.6rem] md:text-[2.9rem]">
                {p.title}
              </h2>
              <p className="mt-5 max-w-md text-[1.05rem] leading-relaxed text-ink-soft">
                {p.sub}
              </p>
            </div>
          </Reveal>

          <ul className="flex flex-col">
            {p.items.map((item, i) => {
              const Icon = ICONS[i]
              return (
                <Reveal key={item.title} delay={i * 0.07}>
                  <li
                    className={`group flex items-start gap-5 py-6 ${i !== 0 ? 'border-t border-line' : ''}`}
                  >
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-line bg-surface text-clay-ink transition-colors group-hover:border-clay">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="pt-0.5">
                      <h3 className="text-lg font-bold text-ink">{item.title}</h3>
                      <p className="mt-1 flex items-center gap-2 text-[0.95rem] text-ink-soft">
                        <span aria-hidden className="inline-block font-semibold text-clay rtl:-scale-x-100">
                          →
                        </span>
                        {item.cost}
                      </p>
                    </div>
                  </li>
                </Reveal>
              )
            })}
          </ul>
        </div>
      </Container>
    </section>
  )
}
