import { Container, Reveal, SectionHeading } from './ui.jsx'
import { IconSearch, IconMap, IconBolt, IconRocket, IconTune } from './icons.jsx'
import { useI18n } from '../i18n/context.jsx'

const ICONS = [IconSearch, IconMap, IconBolt, IconRocket, IconTune]

export default function ProcessSection() {
  const { t } = useI18n()
  const pr = t.process

  return (
    <section id="process" className="relative bg-sunken py-20 sm:py-28">
      <Container>
        <Reveal>
          <SectionHeading kicker={pr.kicker} title={pr.title} subtitle={pr.sub} />
        </Reveal>

        <ol className="relative mt-14">
          <span aria-hidden className="absolute start-[1.4rem] top-4 bottom-4 w-px bg-line-strong" />
          {pr.steps.map((step, i) => {
            const Icon = ICONS[i]
            return (
              <Reveal key={step.title} delay={i * 0.06}>
                <li className="relative flex gap-5 pb-9 last:pb-0">
                  <span className="relative z-10 grid h-11 w-11 shrink-0 place-items-center rounded-full border border-clay bg-surface text-clay-ink">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="pt-1">
                    <div className="flex items-baseline gap-3">
                      <span className="text-sm font-bold text-clay">{String(i + 1).padStart(2, '0')}</span>
                      <h3 className="text-lg font-bold text-ink">{step.title}</h3>
                    </div>
                    <p className="mt-1 max-w-lg text-[0.95rem] leading-relaxed text-ink-soft">{step.body}</p>
                  </div>
                </li>
              </Reveal>
            )
          })}
        </ol>
      </Container>
    </section>
  )
}
