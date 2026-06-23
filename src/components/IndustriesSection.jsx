import { useState } from 'react'
import { Container, Reveal, SectionHeading } from './ui.jsx'
import { useI18n } from '../i18n/context.jsx'

const EMOJI = ['🔧', '🚗', '🍽️', '💆', '🍝', '🏠', '🛠️']

export default function IndustriesSection() {
  const { t } = useI18n()
  const ind = t.industries
  const [active, setActive] = useState(0)

  return (
    <section id="industries" className="relative py-20 sm:py-28">
      <Container>
        <Reveal>
          <SectionHeading kicker={ind.kicker} title={ind.title} subtitle={ind.sub} />
        </Reveal>

        <div className="mt-14 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ind.items.map((item, i) => {
            const isActive = active === i
            return (
              <Reveal key={item.name} delay={(i % 3) * 0.06}>
                <button
                  type="button"
                  onMouseEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  onClick={() => setActive(i)}
                  aria-pressed={isActive}
                  className={`h-full w-full rounded-2xl border p-6 text-start transition-all duration-300 ${
                    isActive
                      ? 'border-clay bg-surface shadow-lift'
                      : 'border-line bg-surface shadow-soft hover:border-clay/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="grid h-11 w-11 place-items-center rounded-xl bg-clay-tint text-xl">
                      {EMOJI[i]}
                    </span>
                    <h3 className="text-base font-bold text-ink">{item.name}</h3>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {item.systems.map((sys) => (
                      <span
                        key={sys}
                        className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                          isActive ? 'bg-clay-tint text-clay-ink' : 'bg-sunken text-ink-soft'
                        }`}
                      >
                        {sys}
                      </span>
                    ))}
                  </div>
                </button>
              </Reveal>
            )
          })}
        </div>
      </Container>
    </section>
  )
}
