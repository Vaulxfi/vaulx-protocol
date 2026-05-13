# 04 · Design System Inventory — Laravel → Next/Tailwind

Read-only audit of `site/` (Laravel, Bootstrap 5.3) for the purpose of porting
its visual identity into `apps/web/` (Next.js, Tailwind v3, shadcn/ui). The
goal is pixel-equivalent parity for the 5 public marketing pages.

Source files surveyed (all paths absolute):

- `/Users/gogy/MyCODE/VAULX/site/resources/views/layouts/app.blade.php`
- `/Users/gogy/MyCODE/VAULX/site/resources/views/layouts/panel.blade.php`
- `/Users/gogy/MyCODE/VAULX/site/resources/css/app.css`
- `/Users/gogy/MyCODE/VAULX/site/resources/views/home.blade.php`
- `/Users/gogy/MyCODE/VAULX/site/resources/views/simulator.blade.php`
- `/Users/gogy/MyCODE/VAULX/site/resources/views/faq.blade.php`
- `/Users/gogy/MyCODE/VAULX/site/resources/views/terms.blade.php`
- `/Users/gogy/MyCODE/VAULX/site/resources/views/team.blade.php`
- `/Users/gogy/MyCODE/VAULX/site/resources/views/components/*.blade.php`
- `/Users/gogy/MyCODE/VAULX/apps/web/tailwind.config.ts`
- `/Users/gogy/MyCODE/VAULX/apps/web/src/app/globals.css`
- `/Users/gogy/MyCODE/VAULX/apps/web/src/app/layout.tsx`

The Laravel theme has **three nested skins**, all driven by `data-bs-theme`
on `<html>`:

1. **Vault Noir** (legacy default) — obsidian + champagne gold + Playfair Display.
2. **Deck Light** (active default — `data-bs-theme="light"` is hard-coded in
   `app.blade.php:2`) — paper `#FAFAF7` + ink `#0A0A0B` + teal `#0E7C7B` italic
   accent + Outfit/JetBrains Mono.
3. **Deck Dark** — pure black + paper + teal accent + Outfit/JetBrains Mono.

The site as judges see it is **Deck Light**. The Next port must default to
that surface. Vault Noir tokens are present in the CSS as fallback but the
public pages no longer use them directly.

---

## A. Design tokens

### A.1 Color — Deck Light (canonical for the port)

| Role | Hex | CSS var (Laravel) | Notes |
|---|---|---|---|
| Background (paper) | `#FAFAF7` | `--vx-bg` | Body |
| Surface (paper-pure) | `#FFFFFF` | `--vx-surface` | Cards |
| Surface 2 | `#EFEDE5` | `--vx-surface-2` | Subtle fills |
| Ink (text) | `#0A0A0B` | `--vx-text` | Body text, headlines, primary CTA bg |
| Ink mute | `#6B6B70` | `--vx-text-muted` | Sub-copy |
| Ink dim | `#9A9A9F` | `--vx-text-subtle` | Footnotes |
| Border | `rgba(10,10,11,0.12)` | `--vx-border` | Card hairlines |
| Border soft | `rgba(10,10,11,0.08)` | `--vx-border-soft` | Pills, nav rule |
| Teal | `#0E7C7B` | `--vx-teal` | Italic accent, primary mark |
| Teal-2 | `#2BA09E` | `--vx-teal-2`, `--vx-accent-mark` | Brand-x `<span>`, bullets |
| Danger | `#B8412C` | `--gf-danger` | Form errors, warning step |

### A.2 Color — Deck Dark

| Role | Hex |
|---|---|
| Background | `#000000` (pure black) |
| Surface | `#0A0A0B` |
| Surface 2 | `#14141A` |
| Ink | `#FAFAF7` |
| Ink mute | `#9A9A9F` |
| Ink dim | `#6B6B70` |
| Border | `rgba(250,250,247,0.14)` |
| Border soft | `rgba(250,250,247,0.08)` |
| Teal accent | `#0E7C7B` / `#2BA09E` (same) |
| Danger | `#E57971` |

### A.3 Color — Vault Noir (legacy, reference only)

| Role | Hex |
|---|---|
| `--vx-bg` | `#0D0D0D` obsidian |
| `--vx-surface` | `#1A1A1A` |
| `--vx-gold` | `#C9A84C` |
| `--vx-champagne` | `#E8C96B` |
| `--vx-amber` (CTA) | `#FF8C00` |

The Next.js `globals.css` already encodes a different gold-based scheme
(`--brand: #d4af37`). **Action required:** retune Next tokens to match Deck
Light/Dark per A.1 and A.2, not the current `globals.css` values.

### A.4 Typography

| Role | Family | Used for |
|---|---|---|
| Body | `Outfit` 300/400/500/600/700/800 | All body, nav, buttons (Deck) |
| Display | `Outfit` 700 italic / `Playfair Display` 500–700 italic | `.vx-display`, hero `<h1>`, `<em>` (Vault Noir uses Playfair, Deck uses Outfit italic) |
| Mono | `JetBrains Mono` 400/500/600/700 | Eyebrows, nav links, button labels, captions, badges, step counters |
| Body legacy fallback | `Inter` 300–800 | Vault Noir body |

All four are loaded from Google Fonts at the top of `css/app.css:7`.

Letter-spacing scale (Laravel):

| Class / context | tracking |
|---|---|
| Headlines | `-0.025em` (Deck) / `-0.02em` (Noir) |
| Body | `-0.005em` |
| Mono uppercase eyebrows | `0.14em` |
| Nav links / pitch-line | `0.06–0.12em` |
| `.team-strip` (footer band) | `0.18em` |

Type scale (effective sizes seen in views):

| Token | Value | Where |
|---|---|---|
| Hero `<h1>` | `clamp(2.8rem, 6vw, 5rem)` | `.hero h1` |
| Team headline | `clamp(2.2rem, 5vw, 3.8rem)` | `team.blade.php:215` |
| Section `<h2>` | `~2.25rem` via `.vx-display` | All marketing sections |
| Pitch number | `3rem` | `.pitch-number` (hero stats) |
| Lead | `1.15rem` | `.hero .lead` |
| Body | `1rem` |  |
| Nav link | `0.78rem` (Noir) / `11px` (Deck) | Mono in Deck |
| Small badge | `0.62–0.72rem` |  |
| Mono caption | `10px–11px` | Eyebrows, team top-strip |

### A.5 Spacing & layout

| Token | Value |
|---|---|
| Section vertical padding | `py-5` (3rem) for content; hero `7rem 0 6rem` |
| Container | Bootstrap `container` (responsive max-widths) |
| Narrow content max-width | `860px` (FAQ, Terms) |
| Card padding | `1.25rem`–`2rem` (`p-4`) |
| Asset card | `2rem 1.25rem` |
| Card gap | `g-4` (1.5rem) |
| Pill radius | `999px` |
| Card radius (`--gf-radius`) | `6px` |
| Small radius (`--gf-radius-sm`) | `4px` |
| Large radius | `10px` |

Bootstrap grid → 12-col, breakpoints `sm 576 / md 768 / lg 992 / xl 1200 / xxl 1400`. Team page overrides with **CSS Grid** 1→2→3→5 columns at `640 / 992 / 1280px`.

### A.6 Motion

| Token | Value | Source |
|---|---|---|
| `--gf-transition` | `0.22s cubic-bezier(.4, 0, .2, 1)` | Global |
| Skeleton shine | `1.4s ease-in-out infinite` | `@keyframes skeleton-shine` |
| Card hover | `translateY(-3px)` + shadow ramp | `.asset-type-card` |
| Wizard panel fade | `opacity 0.2s ease-in-out` | `.wizard-panel` |
| Team contact icon | `color/border 0.15s ease` |  |

Next-side easing already exposes `--ease-decisive: cubic-bezier(0.22, 1, 0.36, 1)` (`tailwind.config.ts:103`). Laravel uses a different, more material easing; we can keep `decisive` for new content and add a `glide` token for parity.

### A.7 Shadow tokens

| Token | Value |
|---|---|
| `--gf-shadow-sm` | `0 1px 3px rgba(0,0,0,.35)` |
| `--gf-shadow` | `0 8px 24px rgba(0,0,0,.45)` |
| `--gf-shadow-lg` | `0 20px 60px rgba(0,0,0,.55)` |
| Card hover | `0 12px 28px rgba(0,0,0,.45)` |
| Gold button hover (Noir) | `0 0 0 4px rgba(201,168,76,.12)` |

Deck Light disables shadows on cards (`box-shadow: none` at `app.css:164`); cards rely on the `1px` hairline border instead. **The Next port should use hairline-only cards on the marketing pages.**

### A.8 Icon set

Bootstrap Icons `1.11.3` CDN. Specific glyphs used by marketing pages:
`bi-camera`, `bi-shield-check`, `bi-gem`, `bi-currency-bitcoin`, `bi-watch`,
`bi-palette`, `bi-car-front`, `bi-wallet2`, `bi-moon-stars`, `bi-sun`, `bi-github`,
`bi-twitter-x`, `bi-telegram`, `bi-envelope`, `bi-linkedin`, `bi-sliders`,
`bi-calculator`, `bi-bar-chart`, `bi-box-arrow-up-right`, `bi-chevron-down`.

The Next app uses `lucide-react` (standard with shadcn). Each glyph needs a
1:1 lucide equivalent listed in §D.

---

## B. Components catalog (Blade)

All paths under `site/resources/views/components/`.

| Blade | Props | Purpose | Public-page use |
|---|---|---|---|
| `card.blade.php` | `accent`, `padding`, `title`, `icon` | Bootstrap card wrapper with optional gold-icon header + left accent border (`stat-card`/`card-accent` classes). | Home protocol economics; example tx panel |
| `stat-card.blade.php` | `label`, `value`, `variant`, `hint`, `icon` | KPI card: small label + large bold value + optional muted icon at 30% opacity, left accent border. | Panel dashboards (not public, but shape matches Home stats band) |
| `page-header.blade.php` | `title`, `subtitle` (slot for actions) | `<h4>` + small muted subtitle, action area on the right. | Panel pages |
| `empty-state.blade.php` | `icon`, `title`, `description`, `actionLabel`, `actionUrl` | Centered icon + heading + copy + optional CTA. | Panels |
| `skeleton.blade.php` | `rows`, `cols`, `height` | Animated shimmer placeholder. Row/col grid mode. | Panels |
| `status-badge.blade.php` | `color`, `label` | Bootstrap `.badge bg-{color}` with uppercase tracking. | Panels |
| `score-pill.blade.php` | `score`, `tier` | Maps numeric score → tier 1-4 → Bootstrap variant; renders as badge. | Evaluator panels |
| `avatar-initials.blade.php` | `name`, `size=80`, `color?` | Circular initials avatar. Default colour stable-hashes the name to a brand-safe palette (`#0E7C7B, #2BA09E, #0A0A0B, #3A3A40, #6B6B70, #1A1A1D`). | **Team page** (size 96, fixed teal) |
| `explorer.blade.php` | `type`, `value`, `label`, `length`, `fallback` | Solana Explorer link with truncated value + external-link icon. Uses `?cluster=devnet` when network ≠ mainnet. | Loan detail, on-chain panels |
| `solana-panel.blade.php` | `loan` | Card showing on-chain loan id + custody tx with `LIVE/DEVNET` badge. | Loan detail |
| `money.blade.php` | `amount`, `currency`, `bold`, `color` | Currency formatter — `$ 1,234.56` (en-US for USDC) or `R$ 1.234,56` (pt-BR for BRZ), via `NumberFormatter`. | Panels |
| `triangle.blade.php` | `onlineScore`, `offlineScore`, `marketLabel` | SVG 3-node triangle (market / online / offline) — gold/champagne strokes on Noir surface. | Evaluator scoring |
| `asset-journey.blade.php` | `asset` | 6-dot horizontal timeline with done/current/pending states, connector lines, JetBrains Mono labels, "Now"/date stamps. | Borrower asset detail |
| `asset-next-step.blade.php` | `asset` | Inline italic next-step hint with mono ETA label. | Borrower lists |
| `asset-progress-card.blade.php` | `assets` | Multi-row "What's happening" card: per-asset step counter, message, thin progress bar tinted by tone (ink/teal/danger), action chip. | Borrower dashboard |

Inline (non-extracted) patterns that appear on multiple public pages and need their own React components:

- **Pitch line eyebrow pill** — `pill border + teal dot + mono uppercase label`. Pattern: `home.blade.php:9-12`, `team.blade.php:211-214`, `simulator.blade.php:15-23`. Variant: solid bullet + label only (no pill) for section eyebrows (`pitch-line` class without pill wrapper).
- **Section header** — eyebrow + `.vx-display` h2 + centered lead paragraph capped at `38rem`. Used on every home section.
- **Pitch number block** — `.pitch-number` (3rem display) + small uppercase muted label below. Hero stats band, protocol economics cards.
- **Step icon** — 60px circular outlined-teal/gold icon over surface, used in How-it-works steps.
- **Asset type card** — `.asset-type-card` (surface + border + center + large icon + bold h6 + muted small).
- **Hero block** — radial-gradient (gold + amber wash) over `--vx-bg`, large serif (Noir) / sans italic (Deck) h1 with `<em>` accent, max-width lead, two buttons (primary amber/ink + outline).
- **CTA section** — `.cta-section` linear-gradient surface → bg with top border, identical button pair.
- **Team card** — `.team-card`: top strip (location/flags, mono uppercase, teal underline) → avatar → name (Outfit 700) → role (mono teal uppercase) → bio → tag chips → contact icons border-row.
- **Team callout** — left teal accent border + teal-wash bg, mono label + body line.
- **Team strip** — ink-solid band with paper text, JetBrains Mono uppercase, teal dot separators.

---

## C. Tailwind config additions needed

Apply to `apps/web/tailwind.config.ts` + the `:root`/`.dark`/`.light` blocks in `apps/web/src/app/globals.css`.

### C.1 Color tokens (overhaul globals.css palette)

Replace the current `--brand: #d4af37` (gold) with the Deck teal+ink+paper system, while keeping shadcn HSL slots in sync:

```css
:root, .light {
  --bg: #FAFAF7;           /* paper */
  --bg-elev-1: #FFFFFF;
  --bg-elev-2: #EFEDE5;
  --ink: #0A0A0B;
  --ink-dim: #2E333C;
  --ink-muted: #6B6B70;
  --ink-subtle: #9A9A9F;
  --rule: rgba(10,10,11,0.12);
  --rule-strong: rgba(10,10,11,0.2);
  --rule-soft: rgba(10,10,11,0.08);
  --brand: #0E7C7B;        /* teal — primary */
  --brand-2: #2BA09E;      /* teal-2 — italic accent, brand-x mark */
  --brand-wash: rgba(43,160,158,0.08);
  --signal-good: #16A34A;
  --signal-warn: #D97706;
  --signal-bad:  #B8412C;
}

.dark {
  --bg: #000000;           /* pure black, not 0a0b0d */
  --bg-elev-1: #0A0A0B;
  --bg-elev-2: #14141A;
  --ink: #FAFAF7;
  --ink-dim: #C9C5BB;
  --ink-muted: #9A9A9F;
  --ink-subtle: #6B6B70;
  --rule: rgba(250,250,247,0.14);
  --rule-strong: rgba(250,250,247,0.3);
  --rule-soft: rgba(250,250,247,0.08);
  --brand: #2BA09E;        /* dark uses teal-2 as primary surface */
  --brand-2: #0E7C7B;
  --brand-wash: rgba(43,160,158,0.10);
  --signal-bad: #E57971;
}
```

### C.2 Tailwind `theme.extend.colors` additions

```ts
ink: {
  DEFAULT: "var(--ink)",
  dim: "var(--ink-dim)",
  muted: "var(--ink-muted)",
  subtle: "var(--ink-subtle)",
},
rule: {
  DEFAULT: "var(--rule)",
  strong: "var(--rule-strong)",
  soft: "var(--rule-soft)",
},
brand: {
  DEFAULT: "var(--brand)",
  "2": "var(--brand-2)",
  wash: "var(--brand-wash)",
},
paper: "var(--bg-elev-1)",   // pure white card surface
```

### C.3 Fonts (already done — verify only)

Next currently loads `Fraunces / Instrument_Sans / JetBrains_Mono`. Laravel loads **`Outfit / Playfair Display / JetBrains Mono / Inter`**. For Deck parity:

- Replace `Instrument_Sans` with **`Outfit`** (300, 400, 500, 600, 700, 800). This is the body font on the canonical Deck Light skin.
- Keep `Fraunces` only if we want a serif fallback for Vault-Noir-style sections; Laravel Deck does **not** use a serif.
- Keep `JetBrains_Mono` (matches).
- The `Playfair Display` is only relevant if we choose to expose the original Vault Noir skin as an alternate theme; otherwise drop it.

### C.4 Animations

Add to `tailwind.config.ts` → `theme.extend`:

```ts
transitionTimingFunction: {
  decisive: "cubic-bezier(0.22, 1, 0.36, 1)", // already there
  glide:    "cubic-bezier(0.4, 0, 0.2, 1)",   // Laravel --gf-transition
},
keyframes: {
  "skeleton-shine": {
    "0%":   { backgroundPosition: "-200% 0" },
    "100%": { backgroundPosition:  "200% 0" },
  },
  shake: {
    "0%,100%":             { transform: "translateX(0)" },
    "10%,30%,50%,70%,90%": { transform: "translateX(-4px)" },
    "20%,40%,60%,80%":     { transform: "translateX(4px)" },
  },
  "vx-reveal": {
    from: { opacity: "0", transform: "translateY(24px)" },
    to:   { opacity: "1", transform: "translateY(0)" },
  },
  "vx-marquee": {
    from: { transform: "translateX(0)" },
    to:   { transform: "translateX(-50%)" },
  },
},
animation: {
  "skeleton-shine": "skeleton-shine 1.4s ease-in-out infinite",
  shake:             "shake 0.35s cubic-bezier(0.36,0.07,0.19,0.97)",
  "vx-reveal":       "vx-reveal 600ms cubic-bezier(0.22,1,0.36,1) forwards",
  "vx-marquee":      "vx-marquee 60s linear infinite",
},
```

Most of these are already in `globals.css` as raw `@keyframes`. Promote them to Tailwind so they can be applied as utilities.

### C.5 Letter-spacing additions

Add to `theme.extend.letterSpacing`:

```ts
"mono-tight": "0.06em",   // pitch-line, table headers
"mono-wide":  "0.18em",   // .team-strip
```

(`editorial: -0.02em` and `mono: 0.14em` already exist.)

### C.6 Border-radius

Add `pill: "999px"` to `theme.extend.borderRadius` for the pitch-line pill. The other Laravel radii (4/6/10px) map to shadcn's `sm/md/lg`.

---

## D. Components to build / port

All under `apps/web/src/components/vaulx/` unless noted. Files that already
exist are marked; the rest are new.

| Next file path | Mirrors Blade | Visual job |
|---|---|---|
| `apps/web/src/components/vaulx/pitch-line.tsx` *(new)* | `.pitch-line` inline pattern | Pill or inline eyebrow: teal dot + mono uppercase label. Variants: `pill`, `inline`. |
| `apps/web/src/components/vaulx/pitch-number.tsx` *(new)* | `.pitch-number` | Large 3rem display number + small muted label under. Variants: `default` (ink), `accent` (teal). |
| `apps/web/src/components/vaulx/section-eyebrow.tsx` *(new)* | section-header pattern | Eyebrow + `.vx-display` h2 + centered lead. Used 5× on `home.blade.php`. |
| `apps/web/src/components/vaulx/step-icon.tsx` *(new)* | `.step-icon` | 60px circle outlined in teal with centered icon (lucide). |
| `apps/web/src/components/vaulx/asset-type-card.tsx` *(new)* | `.asset-type-card` | Square card, large lucide icon, bold title, muted subtitle. Hover lifts. |
| `apps/web/src/components/vaulx/hero.tsx` *(new)* | `.hero` block | Radial-gradient bg, h1 with italic `<em>`, lead, two CTAs. |
| `apps/web/src/components/vaulx/cta-band.tsx` *(new)* | `.cta-section` | Gradient surface→bg band, top border, paired CTAs. |
| `apps/web/src/components/vaulx/avatar-initials.tsx` *(new)* | `avatar-initials.blade.php` | Circular initials avatar, optional name-hashed palette. |
| `apps/web/src/components/vaulx/team-card.tsx` *(new)* | `.team-card` inline CSS | Full team card with top strip, avatar, name, role, bio, tags, contact icons. |
| `apps/web/src/components/vaulx/team-callout.tsx` *(new)* | `.team-callout` | Left-teal-border washed callout. |
| `apps/web/src/components/vaulx/team-strip.tsx` *(new)* | `.team-strip` | Ink-solid band, mono uppercase, teal dot separators. |
| `apps/web/src/components/vaulx/simulator-card.tsx` *(new)* | simulator inputs panel | shadcn `Card` + form controls (slider, select, radio group). |
| `apps/web/src/components/vaulx/simulator-result.tsx` *(new)* | simulator result panel | Mirror of `card-accent accent`, 2×2 grids for figures, schedule table below. |
| `apps/web/src/components/vaulx/faq-accordion.tsx` *(new)* | `.accordion` | shadcn `Accordion` wrapper styled to Deck (mono trigger, ink body). |
| `apps/web/src/components/vaulx/legal-page.tsx` *(new)* | terms.blade.php container | Centered 860px column with `<h2>` + `<h5>` rhythm. |
| `apps/web/src/components/vaulx/site-header.tsx` *(exists — review)* | layouts/app.blade.php nav | Confirm: brand wordmark with teal x, mono uppercase nav links, theme toggle, wallet/launch CTA. |
| `apps/web/src/components/vaulx/site-footer.tsx` *(exists — review)* | layouts/app.blade.php footer | Confirm: serif/Outfit wordmark, mono uppercase links, social icons (github/x/telegram/email), copyright. |
| `apps/web/src/components/vaulx/theme-toggle.tsx` *(exists — review)* | `.theme-toggle` | Circular outline button, swap moon/sun icon. |
| `apps/web/src/components/vaulx/onchain-ticker.tsx` *(exists — review)* | live-stats band | Live devnet pitch-line + pitch-number row. |
| `apps/web/src/components/vaulx/metric-card.tsx` *(exists — review)* | `stat-card.blade.php` | KPI card with left accent border. |
| `apps/web/src/components/vaulx/example-loan-card.tsx` *(new)* | home "Live Example" panel | Watch icon + name + ref · year, 3-col Value/LTV/Credit row, two truncated wallet rows. |

### D.1 Bootstrap-Icons → lucide-react mapping

| Bootstrap Icon | lucide-react import |
|---|---|
| `bi-camera` | `Camera` |
| `bi-shield-check` | `ShieldCheck` |
| `bi-gem` | `Gem` |
| `bi-currency-bitcoin` | `Bitcoin` |
| `bi-watch` | `Watch` |
| `bi-palette` | `Palette` |
| `bi-car-front` | `Car` |
| `bi-wallet2` | `Wallet` |
| `bi-moon-stars` / `bi-sun` | `Moon` / `Sun` |
| `bi-github` | `Github` |
| `bi-twitter-x` | `Twitter` (or custom X svg) |
| `bi-telegram` | `Send` (or custom telegram svg) |
| `bi-envelope` | `Mail` |
| `bi-linkedin` | `Linkedin` |
| `bi-sliders` | `SlidersHorizontal` |
| `bi-calculator` | `Calculator` |
| `bi-bar-chart` | `BarChart3` |
| `bi-box-arrow-up-right` | `ExternalLink` |
| `bi-chevron-down` | `ChevronDown` |

### D.2 shadcn primitives in play

- `Accordion` (FAQ) — already shadcn-compatible primitive, just need theming pass.
- `Card`, `Input`, `Button`, `Dialog` (already in `apps/web/src/components/ui/`).
- Need to add: `Accordion`, `Select`, `Slider`, `RadioGroup`, `Table` from shadcn for the simulator.

---

## E. Pixel-parity checklist (per page)

Side-by-side acceptance for each public page. Compare port at `app.vaulx.fi/<route>` against `vaulx.fi/<same-route>`, both at 1440×900 desktop and 390×844 mobile. Theme: Deck Light unless noted.

### E.1 `/` (Home)

- [ ] Nav: lowercase `vaulx` wordmark, `x` in teal (`#2BA09E`); mono uppercase links at 11px / `0.14em`; theme toggle as 36px circle; primary CTA black `Launch App` button with mono uppercase label.
- [ ] Hero: `7rem` top, `6rem` bottom padding; pitch-line pill with teal dot above h1; h1 `clamp(2.8rem, 6vw, 5rem)`, Outfit 700, line-height `1.05`, `<em>Liquidity</em>` in teal italic; lead 1.15rem in `--ink-muted`; pair of CTAs (`btn-gf-accent` primary, `btn-outline-light` secondary).
- [ ] Trust band: 4 `.pitch-number` cells (`$3T+ / 95% / 40–65% / 24h`), alternating ink/teal; bottom border 1px rule.
- [ ] How it works: eyebrow + display h2 + 4 step columns; each step is a 60px outlined-teal circle + bold h5 + muted small.
- [ ] Collateral types: same eyebrow/h2 pattern over `--bg-elev-2` surface; 4 asset-type cards in a row, lucide icons at 2.25rem in teal.
- [ ] Protocol economics: 3 white cards, each with `.pitch-number` + uppercase label + muted small; cards stretch `h-100`.
- [ ] Live example panel: side-by-side at `md+`; left has eyebrow/h2/lead/`Run the Simulator` button; right is a white card with watch icon, ref line, hr, 3-column Value/LTV/Credit row, hr, two mono truncated wallet rows.
- [ ] CTA band: gradient bg, ink top border, same paired buttons.

### E.2 `/simulator`

- [ ] Two equal `col-lg-5` cards centered: left "Parameters" with mono accent icon, form controls; right "Result" with teal-accent left border.
- [ ] Form controls: select with `--vx-border` 1px outline; range inputs with teal thumb; `btn-group` for USDC/BRZ toggle uses Bootstrap radios styled as `btn-outline-secondary` mono uppercase.
- [ ] Schedule table: sticky `thead` with mono uppercase 0.72rem labels; scrollable container with `max-height:250px`.
- [ ] Live capacity pitch-line (when on-chain) appears centered above the cards.
- [ ] Bottom CTA: black `Request Loan` button (amber CTA in Noir → ink CTA in Deck).

### E.3 `/faq`

- [ ] Container max-width `860px`, py-5.
- [ ] Eyebrow `Protocol` + display h2 "Frequently Asked Questions" + muted lead.
- [ ] Accordion items: 1px rule borders, surface fill; active button switches to mono uppercase teal text on slightly elevated bg (`--bg-elev-2`); 3px teal focus ring.
- [ ] Bottom CTA pair: outlined `Simulate loan` + filled `Create account`.

### E.4 `/terms`

- [ ] Same 860px column.
- [ ] Plain `<h2>` "Terms of Use" + muted timestamp.
- [ ] Sequence of `<h5 class="fw-bold mt-4">` + `<p>` blocks; vertical rhythm `mt-4` (1.5rem) between sections.
- [ ] Final small contact line in `--ink-muted`.

### E.5 `/team`

- [ ] Eyebrow pill `08 · Team` with teal dot.
- [ ] Headline `clamp(2.2rem, 5vw, 3.8rem)` with italic teal `access`.
- [ ] Team grid: 1 / 2 / 3 / 5 columns at `<640 / ≥640 / ≥992 / ≥1280`; `gap: 1.5rem`.
- [ ] Each card: top strip with `1.5px` teal underline, mono uppercase 10px location + flag emojis right-aligned; 96px circular initials avatar (teal #0E7C7B), centered Outfit 700 19px name, mono uppercase 11px teal role; bio 13px in `--ink-muted`; tag chips with mono 9px and 1px ink-border; contact icons in 30px square outlined buttons with teal hover.
- [ ] Team callout: `padding: 22px 28px`, left 3px teal border, teal-wash bg, mono uppercase label + body line.
- [ ] Team strip: ink-solid (`var(--ink)`) bg, paper text, JetBrains Mono uppercase 11px / `0.18em`, teal dot separators between category names.

### E.6 Cross-page checks

- [ ] All buttons in Deck render mono uppercase, `0.14em` tracking, no border-radius variance from `--gf-radius-sm` (4px).
- [ ] All `.hairline` borders are exactly 1px at the Deck Light alpha (`rgba(10,10,11,0.12)`), no shadcn `border-border` default leaking through with a different value.
- [ ] Theme toggle flips `html.dark` ↔ `html` (no class) cleanly; tokens swap atomically with no FOUC.
- [ ] Bootstrap-Icons spacing (`me-2` ≈ 0.5rem) translates to `gap-2` in flex containers; verify icon-to-text gap is preserved.
- [ ] Footer matches: wordmark (Playfair fallback or Outfit display), mono uppercase Terms / Protocol / Team / Simulator links, social icon row, copyright line at `0.7rem`.

---

## STATUS

STATUS: shipped
What landed:
- /Users/gogy/MyCODE/VAULX/docs/plans/inventory/04-design-system.md — 5-section design inventory (tokens, components, Tailwind additions, port targets, parity checklist).
What's blocked: none.
What's next: feed §C config diffs into a Tailwind+globals.css migration spec; feed §D component list into the marketing-pages port plan.
