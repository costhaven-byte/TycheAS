import { useI18n } from '../i18n/context.jsx'

export default function LanguageToggle({ className = '' }) {
  const { t, toggle, langSwitchLabel } = useI18n()
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={t.langSwitchLabel}
      title={t.langSwitchLabel}
      className={`inline-flex items-center gap-1.5 rounded-full border border-line-strong bg-surface px-3 py-1.5 text-sm font-semibold text-ink transition-colors hover:border-clay hover:text-clay-ink ${className}`}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
        <path
          d="M3 12h18M12 3c2.5 2.6 2.5 15.4 0 18M12 3c-2.5 2.6-2.5 15.4 0 18"
          stroke="currentColor"
          strokeWidth="1.6"
        />
      </svg>
      {t.langName}
    </button>
  )
}
