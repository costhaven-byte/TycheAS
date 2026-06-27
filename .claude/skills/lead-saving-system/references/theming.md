# Theming — one confident accent, done with OKLCH

The dashboard is built around **one brand accent** (the `clay` token family) on a
white/near-white surface with near-black ink. Meaning that isn't brand — success
and danger — is carried by two functional colors (`win` green, `alert` red). This
is deliberate: a single decisive color reads as a real, owned product, not a
generic SaaS template. Recoloring a client is almost entirely "set the accent."

All colors are **OKLCH** — `oklch(Lightness Chroma Hue)`:
- **L** = lightness, `0`–`1` (0 black, 1 white).
- **C** = chroma / saturation, `0` (gray) up to ~`0.2` for vivid.
- **H** = hue angle in degrees (the actual color). This is the one number you
  change to move the whole brand to a new color.

Working in OKLCH (instead of hex) is what lets us derive a tint, a strong shade,
and an ink shade from a single hue and have them stay balanced.

## The block you edit (`src/index.css`)

```css
/* brand accent — set --color-clay to the client's color, then derive the rest */
--color-clay:        oklch(0.55 0.15 265);  /* the accent: buttons, active pills */
--color-clay-strong: oklch(0.48 0.15 265);  /* hover/pressed — ~0.07 darker L     */
--color-clay-ink:    oklch(0.50 0.15 265);  /* accent text on light — readable    */
--color-clay-tint:   oklch(0.95 0.04 265);  /* soft fill behind icons / pills     */
```

To move to a new brand color, **keep the L and C of each line and change only the
hue (the third number) to the same value on all four.** That preserves the
button/hover/text/tint relationship while shifting the color.

### Picking the hue

| Brand color | Hue (H) |
| --- | --- |
| Red / wine | 14–25 |
| Orange / clay | 40–55 |
| Amber / gold | 75–85 |
| Green | 145–160 |
| Teal | 185–195 |
| Blue | 250–265 |
| Indigo / violet | 275–290 |
| Magenta / pink | 350–360 |

If the client gives a **hex**, either convert it to OKLCH (any "hex to oklch"
converter, or compute it) and read off the hue, or just match the nearest row
above and nudge. You don't need it perfect — the L/C values here are tuned for
contrast and legibility, so anchoring to them and only swapping hue gives a
balanced result every time.

### Worked example — "wine red" (our own Lucrator look)

```css
--color-clay:        oklch(0.40 0.14 14);
--color-clay-strong: oklch(0.33 0.13 14);
--color-clay-ink:    oklch(0.40 0.14 14);
--color-clay-tint:   oklch(0.95 0.025 14);
```

Wine is a darker, slightly muted red, so L is pulled down and C in a touch — note
the accent and its ink can share the same value when the accent is already dark
enough to read as text on white.

### Worked example — "forest green"

```css
--color-clay:        oklch(0.52 0.13 150);
--color-clay-strong: oklch(0.45 0.13 150);
--color-clay-ink:    oklch(0.48 0.13 150);
--color-clay-tint:   oklch(0.95 0.035 150);
```

## Tie the neutrals to the brand (optional, high polish)

The ink and line tokens carry a faint amount of the brand hue so the whole UI
feels tinted toward the brand rather than dead gray. If you want that cohesion,
set the hue on these to match your accent hue (keep L and C):

```css
--color-ink:   oklch(0.25 0.02 265);
--color-line:  oklch(0.90 0.01 265);
/* …and the other ink-/line-/bg- tokens */
```

It's subtle but it's the difference between "templated" and "designed." Optional —
neutral gray is perfectly fine too.

## Strict single-hue look (like Lucrator)

Some brands want **no** green/red at all — success and danger expressed only by
intensity of the one brand hue. To do that, set `--color-win*` and `--color-alert`
to the same hue as the accent (see `src/index.css` comments). Only do this when
the client explicitly wants that monochrome discipline; the default functional
colors make statuses easier to read at a glance.

## Fonts

The template defaults to system font stacks (`--font-display`, `--font-sans`) — no
network fonts, nothing to load, looks clean everywhere. If a client has brand
fonts, add the `<link>`/`@font-face` in `index.html` and point the two font tokens
at them. For Arabic/RTL clients, give `--font-*` Arabic-capable faces and drop the
negative letter-spacing on headings (it harms Arabic shaping).
