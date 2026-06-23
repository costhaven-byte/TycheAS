import { Container, Button } from './ui.jsx'
import Logo from './Logo.jsx'
import { IconWhatsApp } from './icons.jsx'
import { useI18n } from '../i18n/context.jsx'

export default function Footer() {
  const { t } = useI18n()
  const f = t.footer
  const year = new Date().getFullYear()

  const LINKS = [
    { label: t.nav.services, href: '#services' },
    { label: t.nav.packages, href: '#packages' },
    { label: t.nav.industries, href: '#industries' },
    { label: t.nav.process, href: '#process' },
    { label: t.nav.faq, href: '#faq' },
  ]

  return (
    <footer className="border-t border-line bg-surface">
      <Container className="py-14">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-soft">{f.desc}</p>
            <p className="mt-4 text-sm font-semibold text-clay-ink">{f.tagline}</p>
          </div>

          <div>
            <h4 className="text-sm font-bold text-ink">{f.navHeading}</h4>
            <ul className="mt-4 flex flex-col gap-2.5">
              {LINKS.map((l) => (
                <li key={l.href}>
                  <a href={l.href} className="text-sm text-ink-soft transition-colors hover:text-clay-ink">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold text-ink">{f.startHeading}</h4>
            <p className="mt-4 text-sm text-ink-soft">{f.startLead}</p>
            <Button as="a" href="#contact" size="sm" className="mt-4" withArrow>
              {t.cta.bookAudit}
            </Button>
            <a
              href="mailto:hello@tycheas.com"
              className="mt-4 block text-sm text-ink-soft transition-colors hover:text-clay-ink"
              dir="ltr"
            >
              hello@tycheas.com
            </a>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-line pt-6 sm:flex-row">
          <p className="text-xs text-muted">© {year} TycheAS. {f.rights}</p>
          <a
            href="#contact"
            className="inline-flex items-center gap-1.5 text-xs text-ink-soft transition-colors hover:text-win"
          >
            <IconWhatsApp className="h-4 w-4" />
            {t.cta.chatWithUs}
          </a>
        </div>
      </Container>
    </footer>
  )
}
