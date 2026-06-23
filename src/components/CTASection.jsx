import { Container, Reveal, Button } from './ui.jsx'
import { useI18n } from '../i18n/context.jsx'

export default function CTASection() {
  const { t } = useI18n()
  const c = t.ctaBanner

  return (
    <section className="relative py-12 sm:py-16">
      <Container>
        <Reveal>
          <div className="relative overflow-hidden rounded-[2rem] bg-clay px-6 py-14 text-center shadow-clay sm:px-12 sm:py-20">
            <div
              aria-hidden
              className="absolute inset-0 bg-dots opacity-30 [mask-image:radial-gradient(80%_80%_at_50%_50%,#000,transparent)]"
            />
            <div className="relative mx-auto max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-wide text-white/80">{c.tag}</p>
              <h2 className="mt-4 text-balance text-[2rem] font-bold leading-[1.05] tracking-tight text-white sm:text-[2.6rem] md:text-[2.9rem]">
                {c.title}
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-pretty text-lg leading-relaxed text-white/90">
                {c.sub}
              </p>
              <div className="mt-8 flex justify-center">
                <Button
                  as="a"
                  href="#contact"
                  variant="secondary"
                  size="lg"
                  className="border-transparent bg-white text-clay-ink hover:bg-white hover:text-clay"
                  withArrow
                >
                  {c.button}
                </Button>
              </div>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  )
}
