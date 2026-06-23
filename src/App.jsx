import Header from './components/Header.jsx'
import Hero from './components/Hero.jsx'
import ProblemSection from './components/ProblemSection.jsx'
import ServicesSection from './components/ServicesSection.jsx'
import PackagesSection from './components/PackagesSection.jsx'
import IndustriesSection from './components/IndustriesSection.jsx'
import ProcessSection from './components/ProcessSection.jsx'
import CTASection from './components/CTASection.jsx'
import FAQSection from './components/FAQSection.jsx'
import ContactForm from './components/ContactForm.jsx'
import Footer from './components/Footer.jsx'

export default function App() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-bg">
      <Header />
      <main>
        <Hero />
        <ProblemSection />
        <ServicesSection />
        <PackagesSection />
        <IndustriesSection />
        <ProcessSection />
        <CTASection />
        <FAQSection />
        <ContactForm />
      </main>
      <Footer />
    </div>
  )
}
