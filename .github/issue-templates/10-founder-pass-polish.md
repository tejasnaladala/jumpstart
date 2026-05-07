## Brief

The Founder Pass card (`src/components/FounderPass.tsx`) is the visual signature of the product. It appears on `/you`, `/pass/[id]`, the homepage, and the new OG image. Right now it reads as functional but the editorial weight isn't dialed in. Polish pass: typography hierarchy inside the card, ticket-perforation treatment, the "01 02 03 04" folio numerals next to each line, and the stamp/seal accent.

## Context

- `src/components/FounderPass.tsx` is the component. Read the whole file.
- Reference real-world editorial cards: think NYT Sunday opinion column heading + admit-one ticket (Cunard White Star Line vintage). Specifically NOT business-card or tech-startup-card vibes.
- Aesthetic tokens are in `src/app/globals.css` (`.ed-serial`, `.ed-rule`, `.ed-folio`, double-bezel pattern) and `tailwind.config.*`.
- Current screenshot: `experiments/screens/11-pass-laptop.png`.

## What to polish

Specific calls (treat as a starting point, not a checklist):

1. **Folio numerals**: the "01 / BUILDING" treatment to the left of each Founder Pass line. Currently small mono caps; could be display serif at scale (40-48px) with a hairline rule between each row, magazine-like.
2. **Perforated ticket edge**: the dashed/dotted vertical line at the left margin of the card that says "tear along here". Today it's a CSS dashed border; could be more refined (small circles, every 8px) and respond to dark/light surfaces.
3. **Stamp seal placement**: today the stamp is over-emphasized (huge accent color rotation). Try a subdued one-color emboss-style stamp at 20-24% opacity, centered or angled subtly.
4. **Typography hierarchy inside the four lines**: the heading "BUILDING / LOOKING FOR / CAN HELP WITH / TALK TO ME IF" vs the body copy. Today they're visually equal; the headings should feel like newspaper sub-heads (smallcaps mono, accent color, ~10px) and the body should feel like editorial copy (serif body, 14-16px, generous leading).
5. **Tag chips**: the "hardtech / ai-agents / research / fusion / cofounder / sf" pills. Currently rounded with a warm cream fill. Could pick up the editorial treatment: low-stroke borders + tabular-nums-ish mono labels at 0.65rem.

## Acceptance

- [ ] Founder Pass renders cleanly at three sizes: 720px column (laptop /you), 440px column (phone), and 1200x630 OG image (issue #9).
- [ ] All five Tejas-owned editorial tokens (`.ed-serial`, `.ed-rule`, `.ed-folio`, `.surface`, double-bezel) used consistently — extend the token system if you need a new one (and log it as a follow-up).
- [ ] Visual diff: drop before/after screenshots in the PR body at 1440x900 + 414x896.
- [ ] No layout shift in the Founder Pass on /pass/[id] vs /you (they should look identical except for the optional "Get my own pass" CTA below).
- [ ] Build passes; all type checks clean.

## Out of scope

- Adding new fields to the Founder Pass (e.g. social links, location pin). The four lines stay four lines.
- Animation on the card. Static composition only — animations are in `src/components/Reveal.tsx` at the section level, not the card.
- Multiple card variants / themes. One canonical design.

## Useful skills

- `/design-consultation` for the typography hierarchy call before you start.
- `/design-review` after implementing.
- `/codex` on the diff before push.
