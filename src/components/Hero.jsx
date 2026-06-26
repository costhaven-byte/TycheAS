import { motion, useReducedMotion } from 'framer-motion'
import { Button, Container, Kicker } from './ui.jsx'
import { IconCheck, IconPhoneSlash, IconChat, IconShield } from './icons.jsx'
import { useI18n } from '../i18n/context.jsx'

const EASE = [0.22, 1, 0.36, 1]

export default function Hero() {
  const { t } = useI18n()
  const h = t.hero
  const reduce = useReducedMotion()
  const rise = (delay) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 16 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.6, delay, ease: EASE },
        }

  return (
    <section id="top" className="relative overflow-hidden pt-28 pb-16 sm:pt-32 sm:pb-24">
      <div className="absolute inset-0 -z-10 bg-dots [mask-image:radial-gradient(120%_80%_at_15%_0%,#000_30%,transparent_75%)]" />
      <div className="absolute -left-24 -top-24 -z-10 h-[420px] w-[420px] rounded-full bg-clay-tint blur-3xl" />

      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
          <div className="max-w-xl">
            <motion.div {...rise(0)}>
              <Kicker>{h.kicker}</Kicker>
            </motion.div>

            <motion.h1
              {...rise(0.06)}
              className="mt-5 text-[2.6rem] font-bold leading-[1.02] tracking-tight sm:text-[3.4rem] md:text-[3.8rem]"
            >
              {h.headPre}
              <span className="text-clay">{h.headEm}</span>
              {h.headPost}
            </motion.h1>

            <motion.p {...rise(0.13)} className="mt-6 text-lg leading-relaxed text-ink-soft">
              {h.sub}
            </motion.p>

            <motion.div {...rise(0.2)} className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button as="a" href="#contact" size="lg" withArrow>
                {t.cta.bookAudit}
              </Button>
              <Button as="a" href="#packages" variant="secondary" size="lg">
                {t.cta.viewPackages}
              </Button>
            </motion.div>

            <motion.div {...rise(0.3)} className="mt-10">
              <p className="text-sm font-medium text-muted">{h.builtFor}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {h.trust.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-line bg-surface px-3 py-1 text-sm text-ink-soft"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={reduce ? false : { opacity: 0, y: 24 }}
            animate={reduce ? false : { opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25, ease: EASE }}
            className="relative"
          >
            <ProofPanel proof={h.proof} />
          </motion.div>
        </div>
      </Container>
    </section>
  )
}

const ROW_META = [
  { icon: IconPhoneSlash, tone: 'miss' },
  { icon: IconChat, tone: 'act' },
  { icon: IconCheck, tone: 'win' },
]

const TONES = {
  miss: 'bg-sunken text-muted',
  act: 'bg-clay-tint text-clay-ink',
  win: 'bg-win-tint text-win',
}

function ProofPanel({ proof }) {
  return (
    <div className="relative mx-auto max-w-md lg:ms-auto">
      <div className="rounded-3xl border border-line bg-surface p-5 shadow-lift sm:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-ink">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-clay-tint text-clay-ink">
              <IconShield className="h-4 w-4" />
            </span>
            {proof.title}
          </div>
          <span className="text-xs font-medium text-muted">{proof.live}</span>
        </div>

        <ol className="mt-5 space-y-3">
          {proof.rows.map((row, i) => (
            <li key={i} className="flex gap-3">
              <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${TONES[ROW_META[i].tone]}`}>
                {(() => {
                  const Icon = ROW_META[i].icon
                  return <Icon className="h-4 w-4" />
                })()}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-ink">{row.title}</p>
                  <span className="shrink-0 text-xs text-muted">{proof.times[i]}</span>
                </div>
                <p className="mt-0.5 text-sm leading-snug text-ink-soft">{row.body}</p>
                {row.badge && (
                  <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-win-tint px-2 py-0.5 text-xs font-semibold text-win">
                    {row.badge}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-5 flex items-center justify-between rounded-2xl bg-sunken px-4 py-3">
          <span className="text-sm font-medium text-ink">{proof.replyLabel}</span>
          <span className="text-sm font-bold text-win" dir="ltr">{proof.replyValue}</span>
        </div>
      </div>

      <div className="pointer-events-none absolute -bottom-10 -start-5 hidden rounded-2xl border border-line bg-surface px-4 py-3 shadow-soft sm:block">
        <p className="text-xs text-muted">{proof.bookedLabel}</p>
        <p className="text-lg font-bold text-ink">{proof.bookedValue}</p>
      </div>
    </div>
  )
}
