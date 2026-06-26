// Prototype mockups — small, theme-matched UI "screenshots" that showcase the
// product. Built as lightweight HTML/Tailwind so they look like real panels
// from the app rather than generic stock art. Each is purely decorative
// (aria-hidden) and text is illustrative chrome, not translated copy.

function Window({ title, live = true, children }) {
  return (
    <div
      aria-hidden
      className="w-full overflow-hidden rounded-xl border border-line bg-surface shadow-lift"
    >
      <div className="flex items-center gap-1.5 border-b border-line bg-sunken px-3 py-2">
        <span className="h-2 w-2 rounded-full bg-line-strong" />
        <span className="h-2 w-2 rounded-full bg-line-strong" />
        <span className="h-2 w-2 rounded-full bg-line-strong" />
        <span className="ms-2 text-[0.6rem] font-semibold text-muted">{title}</span>
        {live && (
          <span className="ms-auto inline-flex items-center gap-1 text-[0.55rem] font-semibold text-win">
            <span className="h-1.5 w-1.5 rounded-full bg-win" />
            live
          </span>
        )}
      </div>
      <div className="p-3">{children}</div>
    </div>
  )
}

function Bar({ h, on }) {
  return (
    <span
      className={`w-full rounded-sm ${on ? 'bg-clay' : 'bg-clay-tint'}`}
      style={{ height: `${h}%` }}
    />
  )
}

export function DashboardMock() {
  const bars = [38, 52, 44, 66, 58, 80, 72]
  return (
    <Window title="Dashboard">
      <div className="grid grid-cols-3 gap-2">
        {[
          ['Leads', '128'],
          ['Win rate', '34%'],
          ['Revenue', '+38'],
        ].map(([k, v]) => (
          <div key={k} className="rounded-lg border border-line bg-bg px-2 py-1.5">
            <p className="text-[0.55rem] font-medium text-muted">{k}</p>
            <p className="text-sm font-bold text-ink">{v}</p>
          </div>
        ))}
      </div>
      <div className="mt-2.5 flex h-16 items-end gap-1.5 rounded-lg border border-line bg-bg p-2">
        {bars.map((h, i) => (
          <Bar key={i} h={h} on={i === bars.length - 1} />
        ))}
      </div>
    </Window>
  )
}

export function PipelineMock() {
  const cols = [
    ['New', ['Aisha · HVAC', 'Tom · Roof']],
    ['Working', ['Mara · Spa', 'Leo · Auto']],
    ['Won', ['Sam · Cater']],
  ]
  return (
    <Window title="Pipeline">
      <div className="grid grid-cols-3 gap-2">
        {cols.map(([name, cards], ci) => (
          <div key={name} className="rounded-lg bg-bg p-1.5">
            <p className="mb-1.5 px-0.5 text-[0.55rem] font-semibold uppercase tracking-wide text-muted">
              {name}
            </p>
            <div className="flex flex-col gap-1.5">
              {cards.map((c) => (
                <div
                  key={c}
                  className={`rounded-md border px-1.5 py-1 text-[0.55rem] font-medium ${
                    ci === 2
                      ? 'border-win/30 bg-win-tint text-win'
                      : 'border-line bg-surface text-ink'
                  }`}
                >
                  {c}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Window>
  )
}

export function ScoringMock() {
  const rows = [
    ['Aisha — booked a call', 'Hot', 92, 'bg-clay text-white', 'bg-clay'],
    ['Mara — opened 3 quotes', 'Warm', 64, 'bg-clay-tint text-clay-ink', 'bg-clay/60'],
    ['Leo — no reply in 14d', 'Cold', 28, 'bg-sunken text-muted', 'bg-line-strong'],
  ]
  return (
    <Window title="Lead scoring">
      <div className="flex flex-col gap-2">
        {rows.map(([name, tag, score, pill, fill]) => (
          <div key={name} className="rounded-lg border border-line bg-bg px-2 py-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[0.6rem] font-medium text-ink">{name}</span>
              <span className={`rounded-full px-1.5 py-0.5 text-[0.5rem] font-bold ${pill}`}>
                {tag}
              </span>
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-line">
              <span className={`block h-full rounded-full ${fill}`} style={{ width: `${score}%` }} />
            </div>
          </div>
        ))}
      </div>
    </Window>
  )
}

export function StatusMock() {
  const rows = [
    ['Roof repair — Tom', 'Open', 'bg-clay-tint text-clay-ink', 'JS'],
    ['Spa package — Mara', 'In progress', 'bg-sunken text-ink-soft', 'AK'],
    ['Catering — Sam', 'Won', 'bg-clay text-white', 'RP'],
    ['Tune-up — Leo', 'Lost', 'bg-sunken text-muted', 'JS'],
  ]
  return (
    <Window title="Statuses">
      <div className="flex flex-col gap-1.5">
        {rows.map(([job, status, pill, who]) => (
          <div
            key={job}
            className="flex items-center justify-between rounded-lg border border-line bg-bg px-2 py-1.5"
          >
            <span className="text-[0.6rem] font-medium text-ink">{job}</span>
            <span className="flex items-center gap-1.5">
              <span className={`rounded-full px-1.5 py-0.5 text-[0.5rem] font-bold ${pill}`}>
                {status}
              </span>
              <span className="grid h-4 w-4 place-items-center rounded-full bg-clay text-[0.45rem] font-bold text-white">
                {who}
              </span>
            </span>
          </div>
        ))}
      </div>
    </Window>
  )
}

// ── Growth-module previews (hover) ───────────────────────────────────────────

export function QuoteMock() {
  const lines = [
    ['Site visit & diagnosis', '$90'],
    ['Compressor replacement', '$640'],
    ['Labor — 2.5 hrs', '$210'],
  ]
  return (
    <Window title="Quote" live={false}>
      <div className="flex flex-col gap-1.5">
        {lines.map(([item, price]) => (
          <div key={item} className="flex items-center justify-between text-[0.6rem]">
            <span className="text-ink">{item}</span>
            <span className="font-semibold text-ink">{price}</span>
          </div>
        ))}
        <div className="mt-1 flex items-center justify-between border-t border-line pt-1.5 text-[0.65rem]">
          <span className="font-semibold text-muted">Total</span>
          <span className="font-bold text-clay-ink">$940</span>
        </div>
        <span className="mt-1 inline-flex w-fit rounded-full bg-clay px-2 py-0.5 text-[0.5rem] font-bold text-white">
          Ready to send
        </span>
      </div>
    </Window>
  )
}

export function AppointmentMock() {
  const slots = [
    ['9:00', 'Brake check — Leo', true],
    ['11:30', 'Open', false],
    ['2:00', 'Cut & color — Mara', true],
  ]
  return (
    <Window title="Calendar" live={false}>
      <div className="flex flex-col gap-1.5">
        {slots.map(([time, label, booked]) => (
          <div key={time} className="flex items-center gap-2 text-[0.6rem]">
            <span className="w-8 shrink-0 font-semibold text-muted">{time}</span>
            <span
              className={`flex-1 rounded-md px-1.5 py-1 font-medium ${
                booked ? 'bg-clay-tint text-clay-ink' : 'border border-dashed border-line text-muted'
              }`}
            >
              {label}
            </span>
          </div>
        ))}
        <span className="mt-0.5 text-[0.5rem] font-medium text-win">↻ Reminder sent · 2 confirmed</span>
      </div>
    </Window>
  )
}

export function LandingMock() {
  return (
    <Window title="Landing page" live={false}>
      <div className="flex flex-col items-center gap-1.5 rounded-lg bg-bg p-3 text-center">
        <span className="h-2 w-20 rounded-full bg-ink/80" />
        <span className="h-1.5 w-28 rounded-full bg-line-strong" />
        <span className="h-1.5 w-24 rounded-full bg-line-strong" />
        <span className="mt-1 inline-flex rounded-full bg-clay px-3 py-1 text-[0.55rem] font-bold text-white">
          Get a free quote
        </span>
        <span className="mt-0.5 h-1.5 w-16 rounded-full bg-line" />
      </div>
    </Window>
  )
}

export function FollowupMock() {
  return (
    <Window title="Follow-up" live={false}>
      <div className="flex flex-col gap-1.5">
        <div className="max-w-[80%] rounded-lg rounded-bl-sm bg-sunken px-2 py-1 text-[0.55rem] text-ink">
          Hi Mara — still thinking about the spa package?
        </div>
        <div className="ms-auto max-w-[80%] rounded-lg rounded-br-sm bg-clay px-2 py-1 text-[0.55rem] text-white">
          Yes! Can I book Friday?
        </div>
        <div className="mt-1 flex items-center justify-between rounded-lg border border-line bg-bg px-2 py-1">
          <span className="text-[0.55rem] font-medium text-ink">Leave a review?</span>
          <span className="text-[0.7rem] text-clay">★★★★★</span>
        </div>
      </div>
    </Window>
  )
}

export function ChatbotMock() {
  return (
    <Window title="Chatbot" live>
      <div className="flex flex-col gap-1.5">
        <div className="max-w-[85%] rounded-lg rounded-bl-sm bg-sunken px-2 py-1 text-[0.55rem] text-ink">
          Hi! Need a quote or a booking? I’m here 24/7.
        </div>
        <div className="ms-auto max-w-[85%] rounded-lg rounded-br-sm bg-clay px-2 py-1 text-[0.55rem] text-white">
          Do you fix AC units?
        </div>
        <div className="max-w-[85%] rounded-lg rounded-bl-sm bg-sunken px-2 py-1 text-[0.55rem] text-ink">
          We do — what’s a good number to text you a quote?
        </div>
        <span className="mt-0.5 inline-flex w-fit rounded-full bg-win-tint px-2 py-0.5 text-[0.5rem] font-bold text-win">
          Lead captured →
        </span>
      </div>
    </Window>
  )
}
