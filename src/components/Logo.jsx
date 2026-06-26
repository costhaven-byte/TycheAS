import logoUrl from '../assets/logo.png'

// Lucrator wordmark — the wine-red monogram mark paired with the wordmark.
export default function Logo({ className = '' }) {
  return (
    <a
      href="#top"
      className={`group inline-flex items-center gap-2.5 ${className}`}
      aria-label="Lucrator — home"
    >
      <img
        src={logoUrl}
        alt=""
        aria-hidden="true"
        className="h-9 w-9 object-contain transition-transform duration-300 group-hover:-rotate-6"
      />
      <span className="text-[1.3rem] font-bold leading-none tracking-tight text-ink font-display">
        Lucra<span className="text-clay">tor</span>
      </span>
    </a>
  )
}
