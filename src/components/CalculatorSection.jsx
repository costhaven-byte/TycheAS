import { useMemo, useState } from 'react'
import { Container, Reveal, SectionHeading, Button } from './ui.jsx'
import { useI18n } from '../i18n/context.jsx'

// Believable-over-hyped model: of the leads you miss or follow up late, a
// portion would have closed at your average job value, and Lucrator recovers
// most of those by capturing and working every one. Constants kept conservative.
const CLOSE_RATE = 0.35 // share of missed leads that would have booked
const RECOVERY = 0.8 // share of that lost revenue Lucrator typically wins back

function Slider({ label, value, min, max, step, onChange, display }) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <label className="text-sm font-medium text-ink-soft">{label}</label>
        <span className="text-lg font-bold text-ink" dir="ltr">
          {display}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-full bg-clay-tint accent-clay"
        aria-label={label}
      />
    </div>
  )
}

export default function CalculatorSection() {
  const { t, lang } = useI18n()
  const c = t.calculator
  const [leads, setLeads] = useState(80)
  const [value, setValue] = useState(450)
  const [missedPct, setMissedPct] = useState(30)

  const fmtMoney = useMemo(
    () =>
      new Intl.NumberFormat(lang === 'ar' ? 'ar-SA' : 'en-US', {
        style: 'currency',
        currency: lang === 'ar' ? 'SAR' : 'USD',
        maximumFractionDigits: 0,
      }),
    [lang],
  )
  const fmtNum = useMemo(
    () => new Intl.NumberFormat(lang === 'ar' ? 'ar-SA' : 'en-US'),
    [lang],
  )

  const missedLeads = leads * (missedPct / 100)
  const losing = Math.round(missedLeads * value * CLOSE_RATE)
  const recover = Math.round(losing * RECOVERY)
  const yearly = losing * 12

  return (
    <section id="industries" className="relative py-20 sm:py-28">
      <Container>
        <Reveal>
          <SectionHeading kicker={c.kicker} title={c.title} subtitle={c.sub} />
        </Reveal>

        <Reveal className="mt-14">
          <div className="grid gap-6 overflow-hidden rounded-3xl border border-line bg-surface shadow-soft md:grid-cols-2">
            {/* Controls */}
            <div className="flex flex-col gap-8 p-7 sm:p-9">
              <Slider
                label={c.leadsLabel}
                value={leads}
                min={10}
                max={500}
                step={5}
                onChange={setLeads}
                display={fmtNum.format(leads)}
              />
              <Slider
                label={c.valueLabel}
                value={value}
                min={50}
                max={5000}
                step={50}
                onChange={setValue}
                display={fmtMoney.format(value)}
              />
              <Slider
                label={c.missedLabel}
                value={missedPct}
                min={5}
                max={70}
                step={1}
                onChange={setMissedPct}
                display={`${fmtNum.format(missedPct)}%`}
              />
              <p className="text-xs leading-relaxed text-muted">{c.disclaimer}</p>
            </div>

            {/* Result */}
            <div className="relative flex flex-col justify-center overflow-hidden bg-clay p-7 text-white sm:p-9">
              <div
                aria-hidden
                className="absolute inset-0 bg-dots opacity-20 [mask-image:radial-gradient(80%_80%_at_70%_0%,#000,transparent)]"
              />
              <div className="relative">
                <p className="text-sm font-semibold uppercase tracking-wide text-white/70">
                  {c.losingLabel}
                </p>
                <p className="mt-1 text-5xl font-bold leading-none text-white" dir="ltr">
                  {fmtMoney.format(losing)}
                  <span className="ms-1 text-xl font-semibold text-white/70">{c.perMonth}</span>
                </p>

                <p className="mt-6 text-sm font-semibold uppercase tracking-wide text-white/70">
                  {c.recoverLabel}
                </p>
                <p className="mt-1 text-3xl font-bold leading-none text-white" dir="ltr">
                  {fmtMoney.format(recover)}
                  <span className="ms-1 text-base font-semibold text-white/70">{c.perMonth}</span>
                </p>

                <p className="mt-6 border-t border-white/20 pt-4 text-sm text-white/85">
                  {c.yearlyPre}
                  <span className="font-bold text-white" dir="ltr">
                    {fmtMoney.format(yearly)}
                  </span>
                  {c.yearlyPost}
                </p>

                <Button
                  as="a"
                  href="#contact"
                  variant="secondary"
                  size="lg"
                  className="mt-6 w-full border-transparent bg-white text-clay-ink hover:bg-white hover:text-clay sm:w-auto"
                  withArrow
                >
                  {c.cta}
                </Button>
              </div>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  )
}
