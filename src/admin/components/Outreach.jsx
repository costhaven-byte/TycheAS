// Internal outreach playbook — industry-aware channel guide, copy-ready
// message templates, and per-platform anti-ban safety limits.
import { useState } from 'react'
import { motion } from 'framer-motion'

// ---- Data -------------------------------------------------------------------

const INDUSTRIES = [
  { id: 'ecom',        label: 'E-commerce / DTC' },
  { id: 'restaurant',  label: 'Restaurant & Food' },
  { id: 'realestate',  label: 'Real Estate' },
  { id: 'fitness',     label: 'Fitness & Wellness' },
  { id: 'dental',      label: 'Dental / Medical' },
  { id: 'law',         label: 'Law Firm' },
  { id: 'saas',        label: 'SaaS / Tech Startup' },
  { id: 'construction',label: 'Construction & Trades' },
  { id: 'retail',      label: 'Local Retail' },
  { id: 'agency',      label: 'Marketing / Agency' },
]

const CHANNELS = [
  { id: 'email',     label: 'Cold Email',     icon: '✉️' },
  { id: 'linkedin',  label: 'LinkedIn DM',    icon: '💼' },
  { id: 'instagram', label: 'Instagram DM',   icon: '📸' },
  { id: 'twitter',   label: 'Twitter / X DM', icon: '🐦' },
  { id: 'sms',       label: 'SMS',            icon: '💬' },
]

// Per-platform hard limits — stay below these to avoid bans / restrictions
const LIMITS = {
  email: {
    daily: '50–75 new cold emails per inbox (warm), max 200 on warmed 3-month+ inbox',
    weekly: 'Never jump >30 % volume week-over-week',
    rules: [
      'Always use a custom sending domain — never @gmail / @outlook for cold outreach',
      'SPF + DKIM + DMARC records must be live before sending a single email',
      'Warm a new inbox for 3–4 weeks (start at 5/day, +5 each day) before cold campaigns',
      'One unsubscribe link is legally required (CAN-SPAM / GDPR)',
      'Bounce rate must stay under 2 % — clean your list with NeverBounce/ZeroBounce first',
      'Reply rate below 0.5 % → pause and rewrite the copy before continuing',
      'Rotate between 2–3 inboxes per domain (e.g. selim@, outreach@, hello@)',
      'Do NOT mass-delete emails — manual replies in each inbox signal engagement',
    ],
  },
  linkedin: {
    daily: '15–20 connection requests/day (free), 25–30 with Sales Navigator',
    weekly: 'Max 100 connection requests per week — LinkedIn enforces this hard',
    rules: [
      'Warm the account for 2 weeks: like posts, comment, and connect with warm contacts first',
      'Always personalize the note — generic "I\'d like to connect" hits rejection fast',
      'Never send a pitch in the first message — lead with relevance or a genuine observation',
      'Use InMail credits sparingly (15/month on basic Sales Nav) and only for senior titles',
      'Withdraw pending requests older than 3 weeks to keep acceptance rate high',
      'Profile must look real: headshot, full experience, 500+ connections before outreach',
      'If LinkedIn warns you for "suspicious activity", stop for 48 h and ease back in',
      'Never use automation bots (Dux-Soup, Phantombuster) on accounts you can\'t afford to lose',
    ],
  },
  instagram: {
    daily: '30–50 DMs/day on aged, active account — 10–20 on a new account',
    weekly: 'Interleave DMs with organic activity (likes, story views) every day',
    rules: [
      'Account must be 30+ days old and have organic posts before DM outreach',
      'Never send the same message text twice in a row — IG spam filters catch verbatim copies',
      'Follow → engage (like 2–3 posts) → DM the next day: warm touch before pitch',
      'Voice DMs get dramatically higher open rates than text — use them where appropriate',
      'Avoid third-party automation; use IG natively or verified API tools only',
      'If you hit the "Temporary Block" screen, stop for 24–48 h completely',
      'Keep DMs conversational — emojis are fine, sales speak is not',
      'Don\'t include links in the first DM — IG buries messages with URLs',
    ],
  },
  twitter: {
    daily: 'Max 400 DMs/day (API limit), but stay at 20–40 for organic-feel',
    weekly: 'Account must have posting history; cold-only accounts get suspended fast',
    rules: [
      'Engage publicly first: reply to their tweets before sliding into DMs',
      'Lead with a genuinely specific comment about their content — flattery is noise',
      'Do NOT include a link in the opening DM — it triggers spam filters',
      'Keep DMs under 280 characters on the opener; brevity wins on Twitter',
      'Avoid "Hey [name], I help X do Y, would love to chat" — it\'s the most blocked format',
      'X Blue / Verified status increases DM deliverability meaningfully',
      'If you get "You are unable to send messages at this time", stop for 72 h',
    ],
  },
  sms: {
    daily: '50–100 messages/day per number (A2P 10DLC registered)',
    weekly: 'Respect TCPA — only text between 8 AM–9 PM in the recipient\'s timezone',
    rules: [
      '10DLC registration is required in the US — unregistered numbers get filtered immediately',
      'Always include your business name and an opt-out: "Reply STOP to unsubscribe"',
      'Only text leads who have expressed prior interest or given explicit consent',
      'Never use URL shorteners (bit.ly) — carriers flag them; use full branded links',
      'Personalize with first name at minimum; plain numbers are dead',
      'One follow-up max; two unreturned texts = done',
      'Stick to business hours — an 8 AM text on a Saturday will generate complaints',
    ],
  },
}

// Playbook: best angle, tone, templates per [industry][channel]
const PLAYBOOK = {
  ecom: {
    bestChannels: ['email', 'instagram', 'linkedin'],
    channels: {
      email: {
        tone: 'Direct and metric-driven. DTC founders care about CAC, ROAS, and LTV — lead with those.',
        angle: 'Reference their store, a specific product, or a recent launch. Prove you did your homework.',
        bestTime: 'Tue–Thu, 7–9 AM or 12–1 PM (recipient\'s local time)',
        subject: [
          '[Brand] — saw your recent [product] launch',
          'Quick thought on [Brand]\'s Meta spend',
          '[First name] — your checkout abandonment might be doing this',
        ],
        templates: [
          {
            label: 'Audit hook',
            body: `Hi [First name],

Spotted [Brand] running ads for [product] — looks like a strong angle.

Quick observation: [specific thing I noticed, e.g. "your landing page doesn't match the ad creative"]. That usually costs 15–25% of conversions.

We fix that. I can send a 3-minute Loom of exactly what I'd change — no pitch, just value.

Worth a look?

[Your name]`,
          },
          {
            label: 'Competitor comparison',
            body: `Hi [First name],

I work with a few DTC brands in [niche] and noticed [Brand] is doing X while competitors are doing Y with much better results.

Happy to share what's working — takes about 10 minutes on a call.

Interested?

[Your name]`,
          },
        ],
      },
      instagram: {
        tone: 'Visual and casual. Meet them where they are — match the energy of their feed.',
        angle: 'Comment on a specific reel or post first. DM the next day mentioning it.',
        bestTime: 'Weekdays 11 AM–1 PM or 7–9 PM',
        subject: [],
        templates: [
          {
            label: 'Opener after engagement',
            body: `Hey [First name]! Loved the reel on [product] — the packaging looks really clean.

I help DTC brands like yours scale with paid + content. Would it be cool to send over a few ideas specific to [Brand]?`,
          },
        ],
      },
      linkedin: {
        tone: 'Professional but brief. Founders and CMOs are busy — one punchy paragraph.',
        angle: 'Connect request → wait for accept → lead with a specific insight, not a service pitch.',
        bestTime: 'Tue–Thu, 8–10 AM',
        subject: [],
        templates: [
          {
            label: 'Connection note',
            body: `Hi [First name], following [Brand]'s growth in [category] — impressive trajectory. Would love to connect.`,
          },
          {
            label: 'First DM after connect',
            body: `Thanks for connecting [First name].

I noticed [specific thing about their brand/strategy]. We've helped [similar brand] do [result] with a similar setup.

Would a quick 15-min call make sense?`,
          },
        ],
      },
    },
  },
  restaurant: {
    bestChannels: ['instagram', 'email', 'sms'],
    channels: {
      email: {
        tone: 'Local, friendly, and outcome-focused. Owners want more covers and more repeat visits.',
        angle: 'Reference their Google reviews, menu, or a specific dish you noticed.',
        bestTime: 'Mon–Wed, 10 AM–12 PM (before the lunch rush)',
        subject: [
          '[Restaurant name] — quick thought on your Google presence',
          'Idea for [Restaurant] — turning first visits into regulars',
          '[First name] — noticed something on your Google listing',
        ],
        templates: [
          {
            label: 'Google / local SEO hook',
            body: `Hi [First name],

I was looking at [Restaurant] online — the food looks incredible.

One thing I noticed: your Google listing is missing [X], which usually means you're losing 20–30% of search clicks to competitors.

I can fix that in a day and show you exactly what I'd do before you commit to anything.

Can I send a quick video?

[Your name]`,
          },
        ],
      },
      instagram: {
        tone: 'Enthusiastic and visual. React to their food content authentically.',
        angle: 'Comment genuinely on their food photos or reels, then DM with a specific idea.',
        bestTime: 'Weekdays 2–5 PM (post-lunch lull)',
        subject: [],
        templates: [
          {
            label: 'Food content opener',
            body: `Hey! That [dish] content is making me hungry 😂

Serious note — I help restaurants around [city] get more eyes on their content and more bookings. Would love to share a couple of quick ideas for [Restaurant] if you're open to it?`,
          },
        ],
      },
      sms: {
        tone: 'Super short and local. Owners check texts faster than email.',
        angle: 'Only use if you have a warm referral or prior contact. Cold SMS to restaurants is borderline.',
        bestTime: '10 AM–12 PM weekdays',
        subject: [],
        templates: [
          {
            label: 'Referral SMS',
            body: `Hi [First name], this is [Your name] — [Referral] mentioned I should reach out. I help restaurants in [city] with [service]. Mind if I send over a quick idea? Takes 2 min to read.`,
          },
        ],
      },
    },
  },
  realestate: {
    bestChannels: ['email', 'linkedin', 'sms'],
    channels: {
      email: {
        tone: 'Polished and numbers-driven. Agents and brokers care about listings, leads, and commissions.',
        angle: 'Reference their active listings, sold history, or their market area specifically.',
        bestTime: 'Mon and Wed, 8–10 AM',
        subject: [
          'Idea for [Agent name]\'s listing pipeline',
          '[City] agents doing this are closing 30% more — worth a look',
          'Quick thought on your Zillow profile, [First name]',
        ],
        templates: [
          {
            label: 'Listing marketing hook',
            body: `Hi [First name],

I came across your listing at [address] — beautiful property.

One thing that might help: agents who add professional video walkthroughs are seeing 40% more inquiries on comparable properties in [area].

We do exactly that. Happy to share a sample from a recent shoot in [city]?

[Your name]`,
          },
        ],
      },
      linkedin: {
        tone: 'Aspirational and professional. Real estate is identity-driven — speak to their brand.',
        angle: 'Comment on their market updates or listing posts before DM\'ing.',
        bestTime: 'Tue–Thu, 8–10 AM',
        subject: [],
        templates: [
          {
            label: 'First DM',
            body: `Hi [First name], loved your breakdown of the [area] market this month — really sharp take on [specific point].

I help top agents build their content presence so the listings come to them. Would it make sense to share a quick idea for your brand?`,
          },
        ],
      },
      sms: {
        tone: 'Direct and brief. Real estate agents live on their phones.',
        angle: 'Best for warm leads or referral-based intro. State name and reason immediately.',
        bestTime: 'Tue–Thu, 9–11 AM',
        subject: [],
        templates: [
          {
            label: 'Cold SMS (only with prior research)',
            body: `Hi [First name], this is [Your name]. I help real estate agents in [city] get more listing leads through [channel]. Saw your work in [area] — thought you'd find this interesting. OK to send a short overview?`,
          },
        ],
      },
    },
  },
  fitness: {
    bestChannels: ['instagram', 'email', 'linkedin'],
    channels: {
      instagram: {
        tone: 'Energetic and results-focused. Owners want more members, less churn.',
        angle: 'Engage with their transformation posts or class content before DM.',
        bestTime: 'Weekdays 6–9 AM or 6–8 PM (around workout times)',
        subject: [],
        templates: [
          {
            label: 'Membership growth hook',
            body: `Hey [First name]! Love what you're building with [Studio/Gym name] — the community vibe comes through.

I help fitness studios get more trial members from their existing social following. Quick question — are you running any lead campaigns right now, or mainly word of mouth?`,
          },
        ],
      },
      email: {
        tone: 'Clear and ROI-focused. Studio owners track revenue per member closely.',
        angle: 'Reference their class schedule, pricing page, or a specific program they offer.',
        bestTime: 'Mon–Wed, 9–11 AM',
        subject: [
          'Idea for [Studio] — turning followers into paying members',
          '[First name], your [class name] content deserves more reach',
        ],
        templates: [
          {
            label: 'Follower-to-member angle',
            body: `Hi [First name],

I was looking at [Studio]'s Instagram — you've got great content and an engaged audience.

The problem I see for a lot of studios: followers aren't converting to trials because there's no clear path.

We've helped studios like yours add 20–40 new trial members/month just by tweaking the funnel. I can show you exactly what we'd do for [Studio] in a short call.

Worth 15 minutes?

[Your name]`,
          },
        ],
      },
      linkedin: {
        tone: 'Professional — for gym chains, franchise owners, or corporate wellness programs.',
        angle: 'Frame it around B2B corporate wellness or franchise growth.',
        bestTime: 'Tue–Thu, 8–10 AM',
        subject: [],
        templates: [
          {
            label: 'Corporate wellness pitch',
            body: `Hi [First name], I help fitness businesses land corporate wellness contracts with local employers.

With the return-to-office push, companies are actively looking for studio partners. Would love to share how we've connected [similar gym] with 3 corporate accounts in their area.`,
          },
        ],
      },
    },
  },
  dental: {
    bestChannels: ['email', 'linkedin', 'instagram'],
    channels: {
      email: {
        tone: 'Professional and compliant. Medical/dental owners are busy and skeptical — be credible fast.',
        angle: 'New patient acquisition, reviews, or Google rankings. Avoid making medical claims.',
        bestTime: 'Tue–Thu, 7–9 AM (before the practice opens)',
        subject: [
          '[Practice name] — quick note on your Google ranking',
          'New patient pipeline idea for [Practice]',
          '[Dr. Last name] — your reviews vs. competitors in [city]',
        ],
        templates: [
          {
            label: 'New patient acquisition',
            body: `Hi Dr. [Last name],

I specialize in helping dental practices in [city] grow their new patient pipeline through digital.

Quick observation: [Practice] is ranking on page 2 for "[keyword in city]" — the top 3 spots capture 80% of clicks.

I can show you a clear plan to close that gap. Takes about 15 minutes to walk through.

Would [day] or [day] work for a call?

[Your name]
[Company]`,
          },
        ],
      },
      linkedin: {
        tone: 'Peer-to-peer and credential-forward. Lead with results and practice expertise.',
        angle: 'Connect with practice owners (not just front desk) — filter by title "Owner" or "Practice Manager".',
        bestTime: 'Tue–Wed, 8–10 AM',
        subject: [],
        templates: [
          {
            label: 'Practice growth DM',
            body: `Hi Dr. [Last name], I work specifically with dental practices on patient acquisition through local search and paid ads.

Recent result: helped a practice in [similar city/size] go from 18 to 47 new patients/month in 90 days.

Would it make sense to share what we did?`,
          },
        ],
      },
      instagram: {
        tone: 'Friendly and social-proof heavy. Before-and-afters drive engagement in this space.',
        angle: 'Engage with their patient transformation content or smile makeover posts.',
        bestTime: 'Weekdays 12–2 PM',
        subject: [],
        templates: [
          {
            label: 'Content-first DM',
            body: `Hi [First name]! Your smile transformation posts are really strong — the before/afters speak for themselves.

I help practices like [Practice] amplify that content so it reaches more people who are actively looking for a dentist in [city]. Want me to share a quick breakdown of what that could look like?`,
          },
        ],
      },
    },
  },
  law: {
    bestChannels: ['email', 'linkedin'],
    channels: {
      email: {
        tone: 'Precise, formal, and brief. Lawyers value accuracy and waste no time on fluffy copy.',
        angle: 'Lead generation, case intake, or authority positioning. Never promise legal outcomes.',
        bestTime: 'Tue–Thu, 7:30–9 AM',
        subject: [
          'Client intake idea for [Firm name]',
          '[Attorney name] — your Google presence vs. competitors',
          'Quick thought on [Firm]\'s intake funnel',
        ],
        templates: [
          {
            label: 'Intake funnel angle',
            body: `Hi [First name],

I work with law firms on improving digital client acquisition — specifically reducing the time between a prospect finding you online and booking a consultation.

For context: firms in [practice area] in [city] are averaging [X] days to first contact. We typically cut that in half.

Would a 15-minute conversation make sense?

[Your name]
[Company]`,
          },
        ],
      },
      linkedin: {
        tone: 'Authoritative and concise. Attorneys respond to data and credibility, not enthusiasm.',
        angle: 'Reference a specific practice area, recent case type, or court they appear in.',
        bestTime: 'Tue–Wed, 8–10 AM',
        subject: [],
        templates: [
          {
            label: 'Referral network angle',
            body: `Hi [First name], I help attorneys build consistent referral pipelines through strategic digital positioning.

I noticed [Firm] focuses on [practice area] — that's a niche where thought leadership content produces strong inbound. Happy to share specifics if it's relevant to your growth goals.`,
          },
        ],
      },
    },
  },
  saas: {
    bestChannels: ['email', 'linkedin', 'twitter'],
    channels: {
      email: {
        tone: 'Peer-level, problem-specific, and insight-first. SaaS founders hate being pitched — lead with an observation.',
        angle: 'Reference their product, a recent press mention, or their tech stack. Use data.',
        bestTime: 'Tue–Thu, 7–9 AM',
        subject: [
          'One thing I noticed about [Product]\'s onboarding',
          '[First name] — quick thought on [Product]',
          'Saw [Company] raised [round] — idea on scaling GTM',
        ],
        templates: [
          {
            label: 'Product observation angle',
            body: `Hi [First name],

I signed up for [Product] last week — really solid [feature]. One friction point I noticed: [specific thing in onboarding/UX].

We help SaaS teams fix exactly that kind of drop-off. Our last client went from 34% → 61% trial-to-paid in 8 weeks by addressing it.

Would you be open to a 20-min call?

[Your name]`,
          },
          {
            label: 'GTM scale angle (post-funding)',
            body: `Hi [First name], congrats on the [round] — saw the TechCrunch piece.

At this stage most teams have product-market fit but the GTM motion is still founder-led. We specialize in building out the outbound layer so pipeline doesn't depend on you personally.

Worth a conversation?

[Your name]`,
          },
        ],
      },
      linkedin: {
        tone: 'Founder-to-founder or operator-to-operator. Peer framing wins over vendor framing.',
        angle: 'Engage with their posts on product or team building first.',
        bestTime: 'Tue–Thu, 8–10 AM',
        subject: [],
        templates: [
          {
            label: 'Thought leadership DM',
            body: `Hi [First name], really enjoyed your post on [topic] — the point about [specific thing] is something we ran into building [context].

I work with early-stage SaaS teams on [area]. Would love to compare notes sometime — even if nothing comes of it.`,
          },
        ],
      },
      twitter: {
        tone: 'Casual, direct, and intellectually sharp. Match the energy of their timeline.',
        angle: 'Reply genuinely to their thread or post first. DM only after they engage with you.',
        bestTime: 'Weekdays 9–11 AM or 8–10 PM',
        subject: [],
        templates: [
          {
            label: 'Post-engagement DM',
            body: `Hey [First name] — great thread on [topic]. Had a related thought: [one sharp observation about their product/company]. Worth a chat if you're open to it?`,
          },
        ],
      },
    },
  },
  construction: {
    bestChannels: ['email', 'sms', 'instagram'],
    channels: {
      email: {
        tone: 'Straight-talking and practical. Contractors are skeptical of marketing fluff — be concrete.',
        angle: 'New job leads, project pipeline, or Google Maps visibility.',
        bestTime: 'Mon–Wed, 7–8:30 AM (before the job site)',
        subject: [
          'More roofing jobs in [city] — quick idea',
          '[Company] — your Google Maps presence',
          'How [similar contractor] got 14 new leads last month',
        ],
        templates: [
          {
            label: 'Job lead pipeline',
            body: `Hi [First name],

I help [trade] contractors in [city] get a consistent flow of qualified job leads online — not Angi, not HomeAdvisor.

[Similar company in area] went from 3–4 incoming calls a week to 12–15 in 60 days using this.

I can show you exactly how in a 15-minute call. What day works?

[Your name]`,
          },
        ],
      },
      sms: {
        tone: 'Ultra-brief. Contractors check texts more than email.',
        angle: 'Most effective for warm referrals or local contractors you can reference specifically.',
        bestTime: '7–8 AM weekdays',
        subject: [],
        templates: [
          {
            label: 'Brief SMS',
            body: `Hi [First name], this is [Your name]. I help [trade] contractors in [city] get more jobs through Google. Mind if I send a 60-second video showing what I'd do for [Company]?`,
          },
        ],
      },
      instagram: {
        tone: 'Visual. Project photos and before/afters get strong engagement.',
        angle: 'Comment on their project work, then DM with a specific content or lead-gen idea.',
        bestTime: 'Weekdays 7–9 AM or 5–7 PM',
        subject: [],
        templates: [
          {
            label: 'Project work DM',
            body: `Hey [First name] — that [project type] work looks clean. Seriously impressive.

I help contractors like yourself get more eyes on this kind of work so the right clients find you. Quick question — are you mostly getting jobs from referrals right now, or are you running any ads?`,
          },
        ],
      },
    },
  },
  retail: {
    bestChannels: ['instagram', 'email', 'sms'],
    channels: {
      instagram: {
        tone: 'Community-first and local. Local retail owners care about foot traffic and loyalty.',
        angle: 'Engage with their product showcases or local event posts.',
        bestTime: 'Weekdays 10 AM–12 PM or 7–9 PM',
        subject: [],
        templates: [
          {
            label: 'Local audience growth DM',
            body: `Hey [First name]! [Store] looks amazing — I love supporting local.

I help retail shops in [city] grow their local following and turn online engagement into in-store visits. Would you be open to a quick idea I have specifically for [Store]?`,
          },
        ],
      },
      email: {
        tone: 'Local-community tone. Warm and specific.',
        angle: 'Reference their specific products, store aesthetic, or a recent post.',
        bestTime: 'Tue–Thu, 9–11 AM',
        subject: [
          'Quick idea for [Store]\'s local reach',
          '[Store] — turning your followers into regulars',
        ],
        templates: [
          {
            label: 'Loyalty/retention angle',
            body: `Hi [First name],

I was in [area] recently and found [Store] on Instagram — great aesthetic and product selection.

I help local retail shops build simple loyalty and re-engagement systems that bring customers back more often. Most shops see a 20–30% lift in repeat visits within 90 days.

Could I share a quick overview?

[Your name]`,
          },
        ],
      },
      sms: {
        tone: 'Short and community-feel. Works well for shops with a loyal local following.',
        angle: 'Only if you have prior contact or a strong local referral.',
        bestTime: 'Tue–Thu, 10 AM–12 PM',
        subject: [],
        templates: [
          {
            label: 'Local referral SMS',
            body: `Hi [First name], I'm [Your name] — [Referral] suggested I reach out. I help local shops in [city] grow foot traffic through social + loyalty. Could I send a quick overview?`,
          },
        ],
      },
    },
  },
  agency: {
    bestChannels: ['email', 'linkedin', 'twitter'],
    channels: {
      email: {
        tone: 'Peer-level and differentiated. Agency owners get pitched constantly — call out what makes you different.',
        angle: 'White-label services, client acquisition, or a niche you fill that they don\'t.',
        bestTime: 'Tue–Thu, 8–10 AM',
        subject: [
          'White-label partnership idea for [Agency]',
          '[First name] — your clients might need this',
          'One thing I noticed on [Agency]\'s positioning',
        ],
        templates: [
          {
            label: 'White-label partner pitch',
            body: `Hi [First name],

I run a [service] team that works white-label with agencies — no client poaching, no competition.

If you've ever had to turn down a [service] request or deliver it at lower quality than you'd like, this is probably relevant.

We handle fulfillment, you keep the relationship. Happy to send over a one-pager if it sounds interesting.

[Your name]`,
          },
          {
            label: 'Referral partner pitch',
            body: `Hi [First name],

I work with clients who often need [adjacent service] — something outside what we offer but firmly in your lane.

Would a referral arrangement make sense? We'd send you warm intros in exchange for the same when you encounter [your service need].`,
          },
        ],
      },
      linkedin: {
        tone: 'Strategic and collaborative. Frame as a peer, not a vendor.',
        angle: 'Comment on their case studies or thought leadership before DM\'ing.',
        bestTime: 'Tue–Thu, 8–10 AM',
        subject: [],
        templates: [
          {
            label: 'Collaboration DM',
            body: `Hi [First name], great post on [topic] — the point about [specific thing] is spot on.

I run [Your agency] and we focus on [niche]. Think there's a natural overlap with what [Their agency] does. Worth a quick call to explore if there's a partnership angle?`,
          },
        ],
      },
      twitter: {
        tone: 'Casual and sharp. Agency Twitter is hyper-networked — public replies matter as much as DMs.',
        angle: 'Reply to their threads on client work or agency life first. Build rapport publicly.',
        bestTime: 'Weekdays 9 AM–12 PM',
        subject: [],
        templates: [
          {
            label: 'Collaboration DM',
            body: `Hey [First name] — been following your work on [topic]. I'm building something in [adjacent space] and think there's a natural overlap. Worth a chat?`,
          },
        ],
      },
    },
  },
}

// ---- Helpers ----------------------------------------------------------------

function copy(text) {
  navigator.clipboard.writeText(text).catch(() => {})
}

// ---- Sub-components ---------------------------------------------------------

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => {
        copy(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 1800)
      }}
      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
        copied
          ? 'bg-win-tint text-win'
          : 'bg-sunken text-ink-soft hover:bg-line hover:text-ink'
      }`}
    >
      {copied ? (
        <>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="h-3 w-3">
            <path d="M20 6L9 17l-5-5" />
          </svg>
          Copied
        </>
      ) : (
        <>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" className="h-3 w-3">
            <rect x="9" y="9" width="13" height="13" rx="2" />
            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
          </svg>
          Copy
        </>
      )}
    </button>
  )
}

function SafetyPanel({ channelId }) {
  const limits = LIMITS[channelId]
  if (!limits) return null
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
      <div className="flex items-center gap-2 text-sm font-bold text-amber-800">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="h-4 w-4 shrink-0">
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          <path d="M12 9v4M12 17h.01" />
        </svg>
        Anti-ban safety limits
      </div>
      <div className="mt-3 space-y-1.5 text-xs text-amber-900">
        <p><span className="font-semibold">Daily cap:</span> {limits.daily}</p>
        <p><span className="font-semibold">Ramp rule:</span> {limits.weekly}</p>
      </div>
      <ul className="mt-3 space-y-1.5">
        {limits.rules.map((rule, i) => (
          <li key={i} className="flex items-start gap-2 text-xs text-amber-900">
            <span className="mt-0.5 h-4 w-4 shrink-0 rounded-full bg-amber-200 text-center text-[10px] font-bold leading-4 text-amber-800">
              {i + 1}
            </span>
            {rule}
          </li>
        ))}
      </ul>
    </div>
  )
}

function TemplateCard({ template }) {
  return (
    <div className="rounded-xl border border-line bg-sunken">
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5">
        <span className="text-xs font-semibold text-ink-soft">{template.label}</span>
        <CopyButton text={template.body} />
      </div>
      <pre className="whitespace-pre-wrap px-4 py-3 font-sans text-xs leading-relaxed text-ink">
        {template.body}
      </pre>
    </div>
  )
}

function ChannelPanel({ channelId, data }) {
  const [tab, setTab] = useState('guide')
  const ch = CHANNELS.find((c) => c.id === channelId)
  if (!data) return (
    <div className="rounded-2xl border border-line bg-surface p-6 text-center text-sm text-muted">
      No playbook for this channel/industry combination yet.
    </div>
  )

  return (
    <div className="space-y-4">
      {/* tab strip */}
      <div className="inline-flex rounded-xl border border-line bg-surface p-1">
        {['guide', 'templates', 'safety'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold capitalize transition-colors ${
              tab === t ? 'bg-clay text-white' : 'text-ink-soft hover:text-ink'
            }`}
          >
            {t === 'guide' ? 'Guide' : t === 'templates' ? 'Templates' : 'Safety'}
          </button>
        ))}
      </div>

      {tab === 'guide' && (
        <motion.div
          key="guide"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
          className="space-y-3"
        >
          <div className="rounded-2xl border border-line bg-surface p-5 space-y-4">
            <Row label="Tone" value={data.tone} />
            <Row label="Angle" value={data.angle} />
            {data.bestTime && <Row label="Best time to send" value={data.bestTime} />}
            {data.subject && data.subject.length > 0 && (
              <div>
                <span className="text-xs font-semibold text-ink-soft">Subject line starters</span>
                <ul className="mt-2 space-y-1.5">
                  {data.subject.map((s, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="mt-0.5 text-clay-ink text-xs">→</span>
                      <span className="flex-1 text-sm text-ink">{s}</span>
                      <CopyButton text={s} />
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {tab === 'templates' && (
        <motion.div
          key="templates"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
          className="space-y-3"
        >
          {data.templates && data.templates.length > 0 ? (
            data.templates.map((t, i) => <TemplateCard key={i} template={t} />)
          ) : (
            <p className="text-sm text-muted">No templates for this channel yet.</p>
          )}
          <p className="rounded-xl bg-clay-tint px-4 py-3 text-xs text-clay-ink">
            <strong>Replace all [bracketed] fields</strong> before sending. Personalization is what separates a booked call from a spam report.
          </p>
        </motion.div>
      )}

      {tab === 'safety' && (
        <motion.div
          key="safety"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
        >
          <SafetyPanel channelId={channelId} />
        </motion.div>
      )}
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div>
      <span className="text-xs font-semibold text-ink-soft">{label}</span>
      <p className="mt-1 text-sm text-ink leading-relaxed">{value}</p>
    </div>
  )
}

function Badge({ children, variant = 'default' }) {
  const cls =
    variant === 'best'
      ? 'bg-win-tint text-win'
      : 'bg-sunken text-ink-soft'
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${cls}`}>
      {children}
    </span>
  )
}

// ---- Main component ---------------------------------------------------------

export default function Outreach() {
  const [industryId, setIndustryId] = useState('ecom')
  const [channelId, setChannelId] = useState(null)

  const industry = INDUSTRIES.find((i) => i.id === industryId)
  const playbook = PLAYBOOK[industryId]
  const bestChannels = playbook?.bestChannels ?? []

  const handleIndustry = (id) => {
    setIndustryId(id)
    setChannelId(null)
  }

  const channelData = channelId && playbook?.channels?.[channelId]

  return (
    <div className="space-y-6">
      {/* header */}
      <div>
        <h2 className="text-lg font-bold text-ink">Outreach Playbook</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Industry-specific channel strategy, copy templates, and anti-ban safety rules. Pick an industry, pick a channel.
        </p>
      </div>

      {/* industry selector */}
      <div>
        <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-muted">Industry</p>
        <div className="flex flex-wrap gap-2">
          {INDUSTRIES.map((ind) => (
            <button
              key={ind.id}
              onClick={() => handleIndustry(ind.id)}
              className={`rounded-xl border px-3.5 py-2 text-sm font-semibold transition-all ${
                industryId === ind.id
                  ? 'border-clay bg-clay text-white shadow-sm'
                  : 'border-line bg-surface text-ink-soft hover:border-clay hover:text-ink'
              }`}
            >
              {ind.label}
            </button>
          ))}
        </div>
      </div>

      {/* channel selector */}
      <div>
        <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-muted">Channel</p>
        <div className="flex flex-wrap gap-2">
          {CHANNELS.map((ch) => {
            const isBest = bestChannels.includes(ch.id)
            const isActive = channelId === ch.id
            return (
              <button
                key={ch.id}
                onClick={() => setChannelId(ch.id)}
                className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-semibold transition-all ${
                  isActive
                    ? 'border-clay bg-clay text-white shadow-sm'
                    : isBest
                    ? 'border-win/40 bg-win-tint text-win hover:border-win'
                    : 'border-line bg-surface text-ink-soft hover:border-clay hover:text-ink'
                }`}
              >
                <span>{ch.icon}</span>
                {ch.label}
                {isBest && !isActive && (
                  <span className="rounded-full bg-win/20 px-1.5 py-0.5 text-[10px] font-bold text-win">
                    Best
                  </span>
                )}
              </button>
            )
          })}
        </div>
        {bestChannels.length > 0 && (
          <p className="mt-2 text-xs text-muted">
            <span className="font-semibold text-win">Best</span> = highest-converting channels for {industry?.label}
          </p>
        )}
      </div>

      {/* channel panel */}
      {channelId ? (
        <motion.div
          key={`${industryId}-${channelId}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="mb-3 flex items-center gap-2">
            <span className="text-lg">{CHANNELS.find((c) => c.id === channelId)?.icon}</span>
            <h3 className="font-bold text-ink">
              {CHANNELS.find((c) => c.id === channelId)?.label} → {industry?.label}
            </h3>
            {bestChannels.includes(channelId) && <Badge variant="best">Best channel</Badge>}
          </div>
          <ChannelPanel channelId={channelId} data={channelData} />
        </motion.div>
      ) : (
        <div className="rounded-2xl border border-dashed border-line-strong bg-surface px-6 py-10 text-center">
          <p className="text-sm text-muted">Select a channel above to see the playbook.</p>
        </div>
      )}

      {/* universal rules footer */}
      <div className="rounded-2xl border border-line bg-surface p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-muted">Universal rules — every channel, every time</p>
        <ul className="mt-3 space-y-2">
          {[
            'Never pitch in the first touchpoint. Build micro-rapport first.',
            'One clear ask per message. More than one = zero responses.',
            'Personalization is not optional. 1 specific detail > 10 generic lines.',
            'Follow up exactly twice. After two silences, move on — never push further.',
            'Test subject lines / openers in batches of 50 before scaling.',
            'Track your numbers: sent → replied → booked. Fix what\'s broken before sending more.',
            'Never lie about credentials, results, or who you\'ve worked with.',
            'Every campaign needs a clear exit condition — low reply rate or low meeting rate means stop and rewrite.',
          ].map((rule, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-ink">
              <span className="mt-0.5 h-5 w-5 shrink-0 rounded-full bg-clay-tint text-center text-[11px] font-bold leading-5 text-clay-ink">
                {i + 1}
              </span>
              {rule}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
