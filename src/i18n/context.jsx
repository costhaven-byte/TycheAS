import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { translations } from './translations.js'

const I18nContext = createContext(null)

const STORAGE_KEY = 'lucrator-lang'

function getInitialLang() {
  if (typeof window === 'undefined') return 'en'
  const saved = window.localStorage.getItem(STORAGE_KEY)
  if (saved === 'en' || saved === 'ar') return saved
  const browser = (navigator.language || '').toLowerCase()
  return browser.startsWith('ar') ? 'ar' : 'en'
}

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(getInitialLang)

  const value = useMemo(() => {
    const t = translations[lang]
    return {
      lang,
      dir: t.dir,
      t,
      setLang,
      toggle: () => setLang((l) => (l === 'en' ? 'ar' : 'en')),
    }
  }, [lang])

  // Reflect language on <html> and in the document head so SEO + RTL stay correct.
  useEffect(() => {
    const t = translations[lang]
    const html = document.documentElement
    html.lang = lang
    html.dir = t.dir
    document.title = t.meta.title

    const desc = document.querySelector('meta[name="description"]')
    if (desc) desc.setAttribute('content', t.meta.description)

    const ogTitle = document.querySelector('meta[property="og:title"]')
    if (ogTitle) ogTitle.setAttribute('content', t.meta.title)
    const ogDesc = document.querySelector('meta[property="og:description"]')
    if (ogDesc) ogDesc.setAttribute('content', t.meta.description)
    const ogLocale = document.querySelector('meta[property="og:locale"]')
    if (ogLocale) ogLocale.setAttribute('content', lang === 'ar' ? 'ar_AR' : 'en_US')

    try {
      window.localStorage.setItem(STORAGE_KEY, lang)
    } catch {
      /* storage unavailable — non-fatal */
    }
  }, [lang])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}
