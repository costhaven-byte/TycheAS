import { useSyncExternalStore, useEffect } from 'react'
import LeadForm from './LeadForm.jsx'
import AdminApp from './admin/AdminApp.jsx'
import { BRAND } from './admin/config.js'

// Inject the embeddable chatbot widget when a backend is configured. The widget
// (public/lucrator-widget.js) speaks as this client's business and books into
// their sheet. Set VITE_API_BASE_URL + VITE_CHATBOT_CLIENT_ID to enable it.
function useChatWidget() {
  useEffect(() => {
    const api = import.meta.env.VITE_API_BASE_URL
    if (!api || document.getElementById('lucrator-widget-script')) return
    const s = document.createElement('script')
    s.id = 'lucrator-widget-script'
    s.src = '/lucrator-widget.js'
    s.setAttribute('data-api', api)
    s.setAttribute('data-client-id', import.meta.env.VITE_CHATBOT_CLIENT_ID || '')
    s.setAttribute('data-name', BRAND.name)
    s.setAttribute('data-launcher', `Chat with ${BRAND.name}`)
    document.body.appendChild(s)
  }, [])
}

// Minimal zero-dependency hash routing. The public landing is the default;
// `#/admin` swaps in the internal dashboard on the same deploy.
const subscribe = (cb) => {
  window.addEventListener('hashchange', cb)
  return () => window.removeEventListener('hashchange', cb)
}
const getHash = () => window.location.hash

function useIsAdmin() {
  const hash = useSyncExternalStore(subscribe, getHash, () => '')
  return hash.replace(/^#/, '').startsWith('/admin')
}

// A minimal, presentable landing so the template runs as a complete mini-site.
// Replace or restyle freely — only the <LeadForm /> needs to stay to capture leads.
function Landing() {
  return (
    <div className="min-h-screen bg-bg">
      <header className="border-b border-line bg-bg/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-5 py-4 sm:px-8">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-clay text-sm font-bold text-white">
            {BRAND.initial}
          </span>
          <span className="text-sm font-bold text-ink">{BRAND.name}</span>
        </div>
      </header>
      <main className="mx-auto grid max-w-5xl gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16 lg:py-24">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <h1 className="text-[2.2rem] font-bold leading-[1.05] text-ink sm:text-[2.8rem]">
            Tell us what you need.
          </h1>
          <p className="mt-5 max-w-md text-[1.05rem] leading-relaxed text-ink-soft">
            Fill in a few details and we'll get back to you. No pressure, no spam —
            just a quick conversation about how we can help.
          </p>
        </div>
        <LeadForm />
      </main>
    </div>
  )
}

export default function App() {
  const isAdmin = useIsAdmin()
  useChatWidget()
  return isAdmin ? <AdminApp /> : <Landing />
}
