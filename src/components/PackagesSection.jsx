import { Container, Reveal, SectionHeading, Button } from './ui.jsx'
import { IconCheck } from './icons.jsx'
import { useI18n } from '../i18n/context.jsx'

function PackageCard({ pkg, featured, t }) {
  const p = t.packages
  return (
    <div
      className={`relative flex h-full flex-col rounded-3xl p-7 transition-all duration-300 ${
        featured
          ? 'bg-clay text-white shadow-clay'
          : 'border border-line bg-surface shadow-soft hover:-translate-y-1 hover:border-clay hover:shadow-lift'
      }`}
    >
      {featured && (
        <span className="absolute -top-3 start-7 rounded-full bg-ink px-3 py-1 text-xs font-semibold text-white">
          {p.popular}
        </span>
      )}
      <h3 className={`text-xl font-bold ${featured ? 'text-white' : 'text-ink'}`}>{pkg.name}</h3>
      <p className={`mt-1.5 text-sm ${featured ? 'text-white/80' : 'text-ink-soft'}`}>{pkg.tagline}</p>

      <div className="mt-5">
        <span className={`text-2xl font-bold ${featured ? 'text-white' : 'text-ink'}`}>
          {p.customQuote}
        </span>
        <p className={`text-xs ${featured ? 'text-white/70' : 'text-muted'}`}>{p.scoped}</p>
      </div>

      <ul className="mt-6 flex flex-1 flex-col gap-3">
        {pkg.includes.map((item) => (
          <li key={item} className={`flex items-start gap-2.5 text-sm ${featured ? 'text-white' : 'text-ink'}`}>
            <span
              className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full ${
                featured ? 'bg-white/20 text-white' : 'bg-win-tint text-win'
              }`}
            >
              <IconCheck className="h-3.5 w-3.5" />
            </span>
            {item}
          </li>
        ))}
      </ul>

      <p
        className={`mt-6 rounded-2xl px-4 py-3 text-xs leading-relaxed ${
          featured ? 'bg-white/12 text-white/90' : 'bg-sunken text-ink-soft'
        }`}
      >
        <span className={`font-semibold ${featured ? 'text-white' : 'text-ink'}`}>{p.bestForLabel} </span>
        {pkg.bestFor}
      </p>

      <Button
        as="a"
        href="#contact"
        variant={featured ? 'secondary' : 'primary'}
        size="md"
        className={`mt-6 w-full ${featured ? 'border-transparent bg-white text-clay-ink hover:bg-white hover:text-clay' : ''}`}
        withArrow
      >
        {t.cta.getQuote}
      </Button>
    </div>
  )
}

export default function PackagesSection() {
  const { t } = useI18n()
  const p = t.packages
  const lastIndex = p.items.length - 1

  return (
    <section id="packages" className="relative bg-sunken py-20 sm:py-28">
      <Container>
        <Reveal>
          <SectionHeading kicker={p.kicker} title={p.title} subtitle={p.sub} />
        </Reveal>

        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {p.items.map((pkg, i) => (
            <Reveal key={pkg.name} delay={(i % 3) * 0.08}>
              <PackageCard pkg={pkg} featured={i === lastIndex} t={t} />
            </Reveal>
          ))}
        </div>

        <Reveal>
          <p className="mt-10 text-center text-sm text-ink-soft">
            {p.notSurePre}
            <a href="#contact" className="font-semibold text-clay-ink hover:text-clay">
              {p.notSureLink}
            </a>
            {p.notSurePost}
          </p>
        </Reveal>
      </Container>
    </section>
  )
}
