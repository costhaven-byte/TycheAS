# TycheAS — Website

A modern, premium marketing site for **TycheAS** — we build hand-coded,
high-converting websites plus AI booking assistants, quote systems, and lead
qualification for local service businesses. *Fortune favors the fast.*

Built with **React 18 + Vite 6 + Tailwind CSS v4 + Framer Motion**.

## Run locally

```bash
npm install
npm run dev      # http://localhost:5173  (or http://127.0.0.1:5173)
```

Other scripts:

```bash
npm run build    # production build to /dist
npm run preview  # preview the production build
```

## Design system

Captured in `PRODUCT.md`. The look is a light "operator" aesthetic — warm-neutral
off-white, near-black ink, one committed clay/terracotta brand color, and a green
"won" signal. Type: **Bricolage Grotesque** (display) + **Hanken Grotesk** (body).
No gradient text or buttons; color carries meaning on its own. Tokens live in
`src/index.css` (`@theme`), consumed as Tailwind utilities (`bg-clay`, `text-ink`,
`border-line`, etc.).

## Structure

```
src/
  App.jsx                 # page assembly
  index.css               # Tailwind v4 theme tokens + base/utility styles
  components/
    Logo.jsx              # TycheAS wordmark + coin mark
    Header.jsx            # sticky nav + mobile menu + CTA
    Hero.jsx              # headline, CTAs, trust line, "Lead Saver" proof panel
    ProblemSection.jsx    # consequence-driven problem list
    ServicesSection.jsx   # 4 service cards (Conversion Websites + 3 AI tools)
    PackagesSection.jsx   # 5 packages; "Full AI Growth System" = solid-clay flagship
    IndustriesSection.jsx # interactive industry → recommended systems grid
    ProcessSection.jsx    # 5-step connected timeline
    CTASection.jsx        # solid-clay conversion banner
    FAQSection.jsx        # accordion FAQ
    ContactForm.jsx       # validated booking form + success state
    Footer.jsx            # description, links, CTA, email, copyright
    ui.jsx                # Container, Reveal, Kicker, Button, SectionHeading
    icons.jsx             # inline SVG icon set (no icon dependency)
```

## Contact form

`ContactForm.jsx` is **front-end only**. On a valid submit it builds a structured
payload and logs it to the console, then shows a success message. To connect it to
email / CRM / automation, replace the `console.log` in `handleSubmit` with a
`fetch()` to your endpoint — the payload shape is already clean.

Validated fields: Name, Business name, Industry, Email (format-checked),
Phone/WhatsApp (format-checked), "What do you need help with?" (dropdown), Message.

## Notes

- `vite.config.js` sets `server.host: true` so the dev server binds on both IPv4
  and IPv6 (some machines resolve `localhost` to IPv6 only).
- Honors `prefers-reduced-motion`; meets WCAG AA contrast.
```
