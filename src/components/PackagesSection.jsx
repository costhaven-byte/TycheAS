import { Container, Reveal, SectionHeading, Button } from './ui.jsx'
import { IconCheck, IconSpark } from './icons.jsx'
import {
  QuoteMock,
  AppointmentMock,
  LandingMock,
  FollowupMock,
  ChatbotMock,
} from './prototypes.jsx'
import { useI18n } from '../i18n/context.jsx'

// Index-aligned to t.packages.items.
const MOCKS = [QuoteMock, AppointmentMock, LandingMock, FollowupMock, ChatbotMock]

// Single growth module. The prototype preview is collapsed until the card is
// hovered or focused (keyboard-friendly via focus-within).
function ModuleCard({ pkg, Mock, t }) {
  const p = t.packages
  return (
    <div className="group relative flex h-full flex-col rounded-3xl border border-line bg-surface p-7 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-clay hover:shadow-lift focus-within:border-clay focus-within:shadow-lift">
      {/* Hover-reveal prototype */}
      <div className="grid grid-rows-[0fr] opacity-0 transition-all duration-300 group-hover:grid-rows-[1fr] group-hover:opacity-100 group-focus-within:grid-rows-[1fr] group-focus-within:opacity-100">
        <div className="overflow-hidden">
          <div className="mb-5 rounded-2xl bg-clay-tint p-3">
            <p className="mb-2 ps-1 text-[0.6rem] font-semibold uppercase tracking-wide text-clay-ink">
              {p.previewLabel}
            </p>
            <Mock />
          </div>
        </div>
      </div>

      <h3 className="text-xl font-bold text-ink">{pkg.name}</h3>
      <p className="mt-1.5 text-sm text-ink-soft">{pkg.tagline}</p>

      <div className="mt-5">
        <span className="text-2xl font-bold text-ink">{p.customQuote}</span>
        <p className="text-xs text-muted">{p.scoped}</p>
      </div>

      <p className="mt-6 text-xs font-semibold uppercase tracking-wide text-muted">
        {p.includesLabel}
      </p>

      <ul className="mt-3 flex flex-1 flex-col gap-3">
        {pkg.includes.map((item) => (
          <li key={item} className="flex items-start gap-2.5 text-sm text-ink">
            <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-win-tint text-win">
              <IconCheck className="h-3.5 w-3.5" />
            </span>
            {item}
          </li>
        ))}
      </ul>

      <p className="mt-6 rounded-2xl bg-sunken px-4 py-3 text-xs leading-relaxed text-ink-soft">
        <span className="font-semibold text-ink">{p.bestForLabel} </span>
        {pkg.bestFor}
      </p>

      <Button as="a" href="#contact" variant="primary" size="md" className="mt-6 w-full" withArrow>
        {t.cta.getQuote}
      </Button>
    </div>
  )
}

// The hero offer: every module bundled, plus the premium extras. Creative
// name, framed as the best deal / most bought.
function FullPackageCard({ t }) {
  const p = t.packages
  const fp = p.fullPackage
  const modules = p.items.map((it) => it.name)

  return (
    <div className="relative overflow-hidden rounded-3xl bg-clay p-7 text-white shadow-clay sm:p-9">
      <div
        aria-hidden
        className="absolute inset-0 bg-dots opacity-20 [mask-image:radial-gradient(80%_80%_at_80%_0%,#000,transparent)]"
      />
      <div className="relative grid gap-8 md:grid-cols-[1fr_1fr] md:items-center">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-white ring-1 ring-white/25">
            <IconSpark className="h-3.5 w-3.5" />
            {fp.badge}
          </span>
          <h3 className="mt-4 text-3xl font-bold text-white">{fp.name}</h3>
          <p className="mt-2.5 max-w-md text-[1rem] leading-relaxed text-white/85">{fp.tagline}</p>

          <div className="mt-5">
            <span className="text-2xl font-bold text-white">{p.customQuote}</span>
            <p className="text-xs text-white/70">{p.scoped}</p>
          </div>

          <Button
            as="a"
            href="#contact"
            variant="secondary"
            size="lg"
            className="mt-6 w-full border-transparent bg-white text-clay-ink hover:bg-white hover:text-clay sm:w-auto"
            withArrow
          >
            {t.cta.getQuote}
          </Button>
        </div>

        <div className="rounded-2xl bg-white/10 p-5 ring-1 ring-white/15 backdrop-blur-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/70">
            {fp.modulesLabel}
          </p>
          <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {modules.map((name) => (
              <li key={name} className="flex items-center gap-2 text-sm font-medium text-white">
                <IconCheck className="h-4 w-4 shrink-0 text-white" />
                {name}
              </li>
            ))}
          </ul>

          <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-white/70">
            {fp.plusLabel}
          </p>
          <ul className="mt-3 flex flex-col gap-2">
            {fp.extras.map((extra) => (
              <li key={extra} className="flex items-center gap-2 text-sm font-semibold text-white">
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white text-clay">
                  <IconSpark className="h-3 w-3" />
                </span>
                {extra}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

export default function PackagesSection() {
  const { t } = useI18n()
  const p = t.packages

  return (
    <section id="packages" className="relative bg-sunken py-20 sm:py-28">
      <Container>
        <Reveal>
          <SectionHeading kicker={p.kicker} title={p.title} subtitle={p.sub} />
        </Reveal>

        <Reveal className="mt-14">
          <FullPackageCard t={t} />
        </Reveal>

        <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {p.items.map((pkg, i) => (
            <Reveal key={pkg.name} delay={(i % 3) * 0.08}>
              <ModuleCard pkg={pkg} Mock={MOCKS[i]} t={t} />
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
