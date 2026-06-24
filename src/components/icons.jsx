// Lightweight inline SVG icons — no external icon dependency.
const base = {
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

export const IconGlobe = (p) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3c2.5 2.6 2.5 15.4 0 18M12 3c-2.5 2.6-2.5 15.4 0 18" />
  </svg>
)

export const IconCalc = (p) => (
  <svg {...base} {...p}>
    <rect x="5" y="3" width="14" height="18" rx="2" />
    <path d="M8 7h8M8 11h0M12 11h0M16 11h0M8 15h0M12 15h0M16 15v2" />
  </svg>
)

export const IconChat = (p) => (
  <svg {...base} {...p}>
    <path d="M4 5h16v11H8l-4 3.5V5z" />
    <path d="M8.5 10.5h0M12 10.5h0M15.5 10.5h0" />
  </svg>
)

export const IconShield = (p) => (
  <svg {...base} {...p}>
    <path d="M12 3l7 3v5c0 4.5-3 8-7 9-4-1-7-4.5-7-9V6l7-3z" />
    <path d="M9 12l2 2 4-4" />
  </svg>
)

export const IconClock = (p) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
)

export const IconBolt = (p) => (
  <svg {...base} {...p}>
    <path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" />
  </svg>
)

export const IconTarget = (p) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
  </svg>
)

export const IconPhoneSlash = (p) => (
  <svg {...base} {...p}>
    <path d="M21 15.5v3a2 2 0 01-2.2 2A18 18 0 013.5 5.2 2 2 0 015.5 3h3a2 2 0 012 1.7c.1.9.3 1.7.6 2.5a2 2 0 01-.5 2.1L9.5 10a14 14 0 004.5 4.5l.7-1.1" />
    <path d="M3 3l18 18" />
  </svg>
)

export const IconArrow = (p) => (
  <svg {...base} {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
)

export const IconCheck = (p) => (
  <svg {...base} {...p}>
    <path d="M5 12.5l4.5 4.5L19 7" />
  </svg>
)

export const IconSpark = (p) => (
  <svg {...base} {...p}>
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M18 6l-2.5 2.5M8.5 15.5L6 18" />
  </svg>
)

export const IconSearch = (p) => (
  <svg {...base} {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4.3-4.3" />
  </svg>
)

export const IconMap = (p) => (
  <svg {...base} {...p}>
    <path d="M9 4L4 6v14l5-2 6 2 5-2V4l-5 2-6-2z" />
    <path d="M9 4v14M15 6v14" />
  </svg>
)

export const IconRocket = (p) => (
  <svg {...base} {...p}>
    <path d="M14 4c3 0 6 3 6 6-2 6-7 9-7 9l-3-3s3-5 9-7c-1-3-2-4-5-5z" />
    <path d="M9 15l-3 3M11 17l-2 2M7 13l-2 2" />
    <circle cx="14.5" cy="9.5" r="1.4" />
  </svg>
)

export const IconTune = (p) => (
  <svg {...base} {...p}>
    <path d="M4 7h11M19 7h1M4 12h5M13 12h7M4 17h9M17 17h3" />
    <circle cx="16" cy="7" r="2" />
    <circle cx="10" cy="12" r="2" />
    <circle cx="14" cy="17" r="2" />
  </svg>
)

export const IconInstagram = (p) => (
  <svg viewBox="0 0 24 24" width={24} height={24} fill="currentColor" {...p}>
    <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.72 3.72 0 01-1.38-.9 3.72 3.72 0 01-.9-1.38c-.16-.42-.36-1.06-.41-2.23-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16zm0 3.68a6.16 6.16 0 100 12.32 6.16 6.16 0 000-12.32zm0 10.16a4 4 0 110-8 4 4 0 010 8zm6.4-10.4a1.44 1.44 0 11-2.88 0 1.44 1.44 0 012.88 0z" />
  </svg>
)

export const IconTiktok = (p) => (
  <svg viewBox="0 0 24 24" width={24} height={24} fill="currentColor" {...p}>
    <path d="M16.6 5.82a4.28 4.28 0 01-1.05-2.82h-3.1v12.4a2.59 2.59 0 01-2.59 2.5 2.59 2.59 0 110-5.18c.27 0 .53.04.78.12V9.66a5.7 5.7 0 00-.78-.06 5.69 5.69 0 100 11.38 5.69 5.69 0 005.69-5.69V9.01a7.35 7.35 0 004.35 1.4V7.3a4.28 4.28 0 01-3.3-1.48z" />
  </svg>
)

export const IconLinkedIn = (p) => (
  <svg viewBox="0 0 24 24" width={24} height={24} fill="currentColor" {...p}>
    <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.07 2.07 0 110-4.13 2.07 2.07 0 010 4.13zm1.78 13.02H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" />
  </svg>
)

export const IconFacebook = (p) => (
  <svg viewBox="0 0 24 24" width={24} height={24} fill="currentColor" {...p}>
    <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07c0 6.02 4.39 11.01 10.13 11.93v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.69.24 2.69.24v2.97h-1.52c-1.49 0-1.96.93-1.96 1.89v2.25h3.33l-.53 3.49h-2.8v8.44C19.61 23.08 24 18.09 24 12.07z" />
  </svg>
)
