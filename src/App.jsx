import { useSyncExternalStore } from 'react'
import Header from './components/Header.jsx'
import Hero from './components/Hero.jsx'
import ProblemSection from './components/ProblemSection.jsx'
import ServicesSection from './components/ServicesSection.jsx'
import StatsBand from './components/StatsBand.jsx'
import PackagesSection from './components/PackagesSection.jsx'
import CalculatorSection from './components/CalculatorSection.jsx'
import ProcessSection from './components/ProcessSection.jsx'
import CTASection from './components/CTASection.jsx'
import FAQSection from './components/FAQSection.jsx'
import ContactForm from './components/ContactForm.jsx'
import Footer from './components/Footer.jsx'
import AdminApp from './admin/AdminApp.jsx'

// Minimal zero-dependency hash routing. The marketing site is the default;
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

export default function App() {
  const isAdmin = useIsAdmin()
  if (isAdmin) return <AdminApp />

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-bg">
      <Header />
      <main>
        <Hero />
        <ProblemSection />
        <ServicesSection />
        <StatsBand />
        <PackagesSection />
        <CalculatorSection />
        <ProcessSection />
        <CTASection />
        <FAQSection />
        <ContactForm />
      </main>
      <Footer />
    </div>
  )
}
