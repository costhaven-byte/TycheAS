import { Container, Reveal } from './ui.jsx'
import { IconBolt, IconRocket, IconTarget } from './icons.jsx'
import { useI18n } from '../i18n/context.jsx'

const ICONS = [IconBolt, IconRocket, IconTarget]

// A hard "proof" band — borrowed from Klaviyo's stats section. Dark slab so the
// numbers read as a deliberate break between Services and Packages.
export default function StatsBand() {
  const { t } = useI18n()
  const s = t.stats

  return (
    <section className="relative py-12 sm:py-16">
      <Container>
        <div className="relative overflow-hidden rounded-[2rem] bg-ink px-6 py-12 sm:px-12 sm:py-16">
          <div
            aria-hidden
            className="absolute inset-0 bg-dots opacity-20 [mask-image:radial-gradient(90%_80%_at_50%_0%,#000,transparent)]"
          />
          <Reveal>
            <p className="relative text-center text-sm font-semibold uppercase tracking-wide text-clay-tint">
              {s.kicker}
            </p>
            <h2 className="relative mx-auto mt-3 max-w-xl text-balance text-center text-[1.6rem] font-bold leading-tight text-white sm:text-[2rem]">
              {s.title}
            </h2>
          </Reveal>

          <div className="relative mt-11 grid gap-x-8 gap-y-10 sm:grid-cols-3">
            {s.items.map((item, i) => {
              const Icon = ICONS[i]
              return (
                <Reveal key={item.label} delay={i * 0.08}>
                  <div className="text-center sm:text-start">
                    <span className="mx-auto grid h-11 w-11 place-items-center rounded-2xl bg-white/10 text-clay-tint sm:mx-0">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="mt-4 font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">
                      {item.value}
                    </div>
                    <p className="mt-2 text-sm leading-snug text-white/65">{item.label}</p>
                  </div>
                </Reveal>
              )
            })}
          </div>
        </div>
      </Container>
    </section>
  )
}
