# Jumpstart design brief, v1

This is the file you hand to Claude (or v0, or any AI design tool) to drive a comprehensive visual and interaction redesign at the highest fidelity. Pair it with `docs/design-prompts.md` for the exact prompts to send.

## Product, in one paragraph

Jumpstart is the unofficial global attendee graph for YC Startup School 2026. It delivers three curated founder matches every Wednesday, with a one-line on why you should meet and an opener you can copy. No directory to scroll, no swiping, no followers. Verified attendees only. The cohort is bounded to the 90 days of the program. The product is built by an attendee, for the cohort.

The full product spec lives at `docs/superpowers/specs/2026-05-05-jumpstart-design.md`. The implementation ultraplan lives at `docs/superpowers/specs/2026-05-06-implementation-ultraplan.md`. Both are sources of truth.

## The aesthetic direction

Editorial founder briefing. The product reads less like a SaaS dashboard and more like a sharp weekly research note. Restraint with character, not maximalism. The reference set is Linear plus Ditto plus Date Drop plus Partiful plus YC Startup School 2026.

What this is not. Not a dashboard. Not a generic SaaS landing. Not maximalist. Not playful or toy-like. Not corporate or enterprise. Not dark mode (light only).

What this is. Editorial. Restrained. Sharp. A weekly publication. Mostly silence with one or two punchy details (the orange accent, the italic display serif). Confident, founder-shaped, anti-LinkedIn.

## Locked design tokens

Do not change these. They are pulled from the actual YC SS 2026 events stylesheet plus our voice rules.

### Colors

| Token | Hex | Use |
|---|---|---|
| bg | `#F4F1DB` | Warm cream, the SS hero background. Body bg. |
| surface | `#FDFDF8` | Pale off-white for cards and sheets |
| ink | `#16140F` | Warm near-black, primary text |
| muted | `#463325` | Warm dark brown, secondary text |
| border | `#E8E3CC` | Tinted divider derived from the cream |
| accent | `#FF6600` | The canonical YC orange, CTAs and accent ticks |
| accent-soft | `#FFF0E9` | Pale peach for accent backgrounds |
| accent-edge | `#FB651E` | Hotter orange for hovers and edges |
| espresso | `#2D2417` | Dark coffee brown for inverted sections |
| espresso-deep | `#1F1A11` | Darker variant for footer band |
| espresso-warm | `#3A2C1C` | Lighter variant for borders against espresso |
| success | `#48B584` | Verified states, success toasts |
| error | `#E4544B` | Errors, blocks, red banner |

### Typography

| Family | Use |
|---|---|
| Instrument Serif | Display headings (h1, h2). Italic accents. Loaded via `next/font/google`. |
| Geist | Body, UI, button text. Loaded via `next/font/google`. |
| Geist Mono | Serial numbers, timestamps, drop counters, tabular figures. |

Sentence-case headings only. Vary sentence length. Italic in display serif used as the "punch" detail (e.g., "Jumpstart helps them find *each other.*").

### Voice rules (apply to every visible string)

- No em dashes. Use commas, periods, parens, semicolons.
- No "not X, not Y, but Z" parallel constructions.
- No "stands as", "serves as", "represents a", "marks a", "showcases", "highlights".
- No "vibrant", "rich", "groundbreaking", "nestled", "in the heart of".
- No "tapestry", "interplay", "intricate", "delve", "underscore", "landscape" used abstractly.
- No emoji decoration of headings or bullets.
- No "let me know", "I hope this helps", "great question".
- Sentences vary in length. Have opinions.

## Reactive components inventory

The current build has these. Treat them as floor, not ceiling.

| Component | What it does |
|---|---|
| `CohortGlobe` | d3-geo orthographic globe spinning on canvas, real country outlines, 12 anchor-city waypoints with sequential pulse pings |
| `Marquee` | Continuous horizontal scroll on espresso band, monospace caps, mirrors YC SS 2026 footer strip |
| `AnimatedCounter` | Counts up from 0 on scroll-into-view, eased, prefers-reduced-motion safe |
| `MatchCard` | framer-motion hover lift + tap press, spring physics |
| `Sheet` | AnimatePresence backdrop fade + sheet rise on intro request |
| `Drop home stagger` | framer-motion stagger reveal on the three matches |
| `ed-rule` | Editorial divider with single accent tick |
| `ed-serial` | Mono uppercase tabular caption ("No. 001 / Cohort SS 2026") |

## Reactive components wishlist

Bring any of these to a level the current build does not yet hit.

1. **Live drop counter** - "12 founders matched in the last 24 hours" with a pulsing dot, updates without refresh
2. **Type-on effect** - char-by-char reveal on the sample drop's "why you should meet" line, like a wire arriving
3. **Magnetic CTA** - primary buttons subtly attract the cursor when nearby, ease-out
4. **Animated rule-draw** - the editorial rules with accent ticks animate from left on scroll
5. **Tag particle field** - 30-50 cohort tags drift slowly in the background of one section, hover to highlight, click to filter
6. **Calendar grid** - Wednesdays of SS 2026 plotted, "next drop in 3 days" highlighted
7. **Cohort flow visualizer** - animated arcs between cities on a flat world map, showing intro requests in flight
8. **Founder card flip stack** - three small cards on the landing that flip-rotate every 3s showing different match types
9. **Scroll-linked hero** - the globe scales and the headline tightens as the user scrolls past the masthead
10. **Animated KPI band** - counters tick on scroll, a small sparkline draws

## Quality bar

- 60 fps on every animation. Use `transform` and `opacity` only. Never animate `width`/`height`/`top`/`left`.
- Animation durations: 150 to 300 ms for micro-interactions, up to 600 ms for hero reveals, never longer.
- Easing: `cubic-bezier(0.16, 1, 0.3, 1)` for one-way reveals, springs for hovers and taps.
- Color contrast 4.5:1 minimum on body text, 3:1 on display.
- Touch targets at least 44 by 44 px.
- Focus rings visible on every interactive element.
- Honor `prefers-reduced-motion`. All animations collapse to instant when it is set.
- Lighthouse performance ≥ 90 on the landing page.
- First Load JS shared chunks under 110 KB.
- Hard-cap line length at 70ch in prose blocks.

## Stack constraints

The team you hand this to must produce code that fits this stack:

- Next.js 15 App Router (TSX, server components by default, client components when needed for interactivity)
- Tailwind CSS 3 with the locked tokens above
- framer-motion for layout animations and gestures
- d3-geo + topojson-client for any geographic visualization
- shadcn/ui patterns for primitives
- Lucide icons (no other icon library, no emoji)
- next/font for typography (no `<link>` to Google Fonts CDN)
- TypeScript strict mode

No new dependencies without justification. No global state libraries. No CSS-in-JS beyond what next/font provides.

## What to deliver

For each new screen or component the design AI produces, deliver:

1. The TSX source file, ready to drop into `src/components/` or `src/app/`.
2. A short rationale (under 200 words) explaining the design choices and which interaction primitive to use.
3. Any new design token additions, listed against the locked palette.
4. A short Playwright e2e test scaffold for the user-visible behaviour.

For the landing page in particular, deliver:

- A revised `src/app/page.tsx` that orchestrates the hero, marquee, counter band, how-it-works, sample card, what-it-isn't, and CTA closer.
- New components for any reactive elements introduced.
- A short before/after screenshot pair if possible (use Playwright to render both and place side-by-side).

## Reference set

Visual references the AI should study, in order of priority:

1. https://events.ycombinator.com/startup-school-2026 - the cream + espresso palette, the marquee strip, the chunky condensed display, the brown buttons
2. https://linear.app - the restraint, the typography, the dense-but-calm layout
3. https://ditto.ai - the "drop" mechanic and ritual framing
4. https://datedrop.com - the curated-not-swipe positioning
5. https://partiful.com - the editorial header treatment, the warm humour

## Anti-references

Do not produce work that resembles:

- Generic SaaS landings (Notion-clone gradient + purple accent + 3D illustration)
- AI-startup landings (animated lines + dark mode + chrome glass)
- Crypto landings (neon + gradients + maximalist)
- Marketing-page tropes (smiling stock photos, big "trusted by" logo grids)

## Files to upload

Bundle these for the design AI:

- `docs/superpowers/specs/2026-05-05-jumpstart-design.md` (full product spec)
- `docs/superpowers/specs/2026-05-06-implementation-ultraplan.md` (build sequence)
- `docs/external-tools.md` (tooling stack)
- `tailwind.config.ts` (locked tokens)
- `src/app/globals.css` (current base styles)
- `src/app/page.tsx` (current landing)
- `src/app/(app)/drop/page.tsx` (current drop home)
- `src/components/Logo.tsx`, `Marquee.tsx`, `CohortGlobe.tsx`, `AnimatedCounter.tsx`, `FounderCard.tsx`, `MatchCard.tsx`
- `tests/e2e/happy-path.spec.ts` (test patterns)
- A screenshot of the YC SS 2026 events page
- A screenshot of the current Jumpstart landing for comparison

## Acceptance criteria for the redesign

- Hardening loop at `scripts/loop.sh` still passes 100/100 (typecheck, build, eval, lint).
- Every Playwright e2e test in `tests/e2e/` continues to pass.
- Lighthouse performance ≥ 90, accessibility ≥ 95.
- The redesign reads as obviously different from a templated SaaS landing.
- Every animation honors prefers-reduced-motion.
- The aesthetic direction stated above is preserved; deviations require a written argument.
