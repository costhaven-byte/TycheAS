// TycheAS wordmark. The mark is a coin/token — a nod to Tyche (fortune) and to
// the brand promise: speed turned into won business.
export default function Logo({ className = '' }) {
  return (
    <a
      href="#top"
      className={`group inline-flex items-center gap-2.5 ${className}`}
      aria-label="TycheAS — home"
    >
      <span className="relative grid h-9 w-9 place-items-center rounded-full bg-clay text-white shadow-clay transition-transform duration-300 group-hover:-rotate-12">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" opacity="0.55" />
          <path
            d="M9 8h6M12 8v8M9.5 15.5c.8.6 1.7.9 2.6.9 1.6 0 2.6-.8 2.6-2 0-2.6-5-1.6-5-4.1 0-1.1 1-1.9 2.5-1.9.9 0 1.7.3 2.3.8"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className="text-[1.3rem] font-bold leading-none tracking-tight text-ink font-display">
        Tyche<span className="text-clay">AS</span>
      </span>
    </a>
  )
}
