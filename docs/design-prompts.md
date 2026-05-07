# Step-by-step recipe to run a $50k-tier external design pass on Jumpstart

This is the exact sequence to follow inside Claude.ai (or v0.dev, or any high-context AI design tool). Time to first deliverable: about 25 minutes. Total over four passes: 1 to 2 hours.

## Preparation, do this once

1. Open Claude.ai. Create a **new Project** named "Jumpstart redesign". Projects keep context across messages and let you pin docs.
2. In the Project sidebar, upload these files from your `C:\jumpstart` clone:
   - `docs/design-brief.md`
   - `docs/superpowers/specs/2026-05-05-jumpstart-design.md`
   - `docs/superpowers/specs/2026-05-06-implementation-ultraplan.md`
   - `tailwind.config.ts`
   - `src/app/globals.css`
   - `src/app/page.tsx`
   - `src/app/(app)/drop/page.tsx`
   - `src/components/Logo.tsx`
   - `src/components/Marquee.tsx`
   - `src/components/CohortGlobe.tsx`
   - `src/components/AnimatedCounter.tsx`
   - `src/components/FounderCard.tsx`
   - `src/components/MatchCard.tsx`
   - `tests/e2e/happy-path.spec.ts`
3. Take two screenshots and upload them to the Project as image attachments:
   - `https://events.ycombinator.com/startup-school-2026` (full page, scroll down once)
   - The current Jumpstart landing at `https://foods-bubble-tonight-mysterious.trycloudflare.com/`
4. In the Project's **Custom Instructions**, paste the voice rules block from the bottom of this file.
5. Pick the model: **Claude Sonnet 4.5** (or higher). Avoid Haiku for design work.

## Pass 1 - Vision sync

Paste this into a new chat in the Project. The goal is to confirm the design AI has the brief locked before producing pixels.

```
You are the lead designer for a $50K-tier landing page and product redesign.

Read the project files I uploaded. Then answer five questions in 200 words total:

1. In one sentence, what is Jumpstart?
2. What aesthetic direction did the brief commit to?
3. Name the three font families I locked.
4. Name the three most distinctive color tokens.
5. List the existing reactive components and rate each on a 1 to 10 fidelity scale, with a one-line note per component on what would lift it.

Do not propose any new design yet. This is sync.
```

Read the response carefully. If anything is wrong, correct it before moving to Pass 2. The model is going to riff off whatever it confirms here, so accuracy matters.

## Pass 2 - Hero redesign

```
Redesign the landing hero only. Constraints:

- Keep the locked palette (cream #F4F1DB body, espresso #2D2417 darks, accent #FF6600).
- Keep Instrument Serif display + Geist body + Geist Mono serials.
- The CohortGlobe component must remain the visual anchor. Do not replace it.
- Add at least two reactive elements not present today, drawn from the wishlist in design-brief.md.
- Honor prefers-reduced-motion.
- Output a single revised src/app/page.tsx file plus any new components in src/components/.
- Each new component is under 250 lines. No new dependencies.

Deliverables in order:
1. A 150-word rationale for the design choices.
2. The TSX file content for src/app/page.tsx.
3. Any new component files, full source.
4. A list of new motion variants or Tailwind animation keyframes.
5. A Playwright test scaffold for the new interactive elements.

Do not include changelog formatting, do not include "I hope this helps", do not include emoji.
```

Apply the output to your repo. Run `bun run build` and `bash scripts/loop.sh`. If the hardening score drops below 100, paste the failure into the same chat and ask the AI to fix while preserving the design.

## Pass 3 - Drop home redesign

```
Now redesign the authenticated Drop home at src/app/(app)/drop/page.tsx.

Same locked tokens. The three-match list is the centerpiece. Add:
- A live drop counter (real-time vibe, no real-time data needed; can poll a stub endpoint).
- A type-on effect on the "why you should meet" line of the first match.
- A magnetic CTA on the primary "Request intro" button on the match-detail variant.
- A scroll-linked masthead that compresses to a thin bar after 64 px of scroll.

Constraints unchanged. Deliver the same five artifacts as Pass 2.
```

## Pass 4 - Polish, accessibility, performance

```
Audit the redesign for:
- Lighthouse performance and accessibility (target ≥ 90 / ≥ 95).
- WCAG color contrast on every text-on-color combination.
- Keyboard navigation order on the new interactive elements.
- Touch target size (≥ 44x44 px) on every clickable element.
- Animation budget: count total CPU work per frame. Flag anything that exceeds 8 ms.
- Bundle impact: estimate KB added by new components.

Output a single markdown report with severity-tagged findings (P0, P1, P2). For each P0 and P1, propose a specific fix. Do not produce new design.
```

## Pass 5, optional - Variants

```
Produce three landing-page variants holding the locked tokens but exploring different hero compositions:

A) Globe-dominant (current). The CohortGlobe is the largest element on screen.
B) Type-dominant. A massive italic-serif headline takes the full hero, the globe shrinks to a small badge.
C) Card-dominant. The sample drop card is the hero, the globe is a small embedded element inside the card's background.

For each variant, deliver:
- A 100-word rationale.
- A revised src/app/page.tsx file.
- Estimated lift: which audience would respond best, what message it foregrounds.

Pick a winner with one line of justification. I will A/B test in production.
```

## Custom instructions to paste into the Project

```
You are designing for Jumpstart, a curated weekly matchmaker for the YC Startup School 2026 cohort. The aesthetic is "editorial founder briefing": restraint with character, not maximalism.

Voice rules. Apply to every visible string and every comment:
- No em dashes. Use commas, periods, parens, semicolons.
- No "not X, not Y, but Z" parallel constructions.
- No "stands as", "serves as", "represents a", "marks a", "showcases", "highlights".
- No "vibrant", "rich", "groundbreaking", "nestled", "in the heart of".
- No "tapestry", "interplay", "intricate", "delve", "underscore", "landscape" used abstractly.
- No emoji decoration of headings or bullets.
- No "let me know", "I hope this helps", "great question".
- Sentences vary in length. Have opinions.

Locked design tokens. Never change without my explicit OK:
- bg #F4F1DB (cream), surface #FDFDF8, ink #16140F, muted #463325, border #E8E3CC
- accent #FF6600 (YC orange), accent-soft #FFF0E9, accent-edge #FB651E
- espresso #2D2417, espresso-deep #1F1A11, espresso-warm #3A2C1C
- success #48B584, error #E4544B
- Display: Instrument Serif (italic for emphasis). Body: Geist. Mono: Geist Mono.

Stack constraints:
- Next.js 15 App Router, Tailwind 3, framer-motion, d3-geo, topojson-client, Lucide icons
- TypeScript strict, no any, no non-null assertions
- No new dependencies without explicit justification

Output discipline:
- Code blocks are ready-to-paste TSX, no placeholder comments
- Rationale before code, never after
- Cite line numbers when referencing existing files
- One artifact per response unless I ask for variants
```

## Things to NOT do in any pass

- Do not let the design AI change the locked tokens "to be safer".
- Do not accept output that uses Inter, Space Grotesk, Roboto, or any of the AI-default fonts.
- Do not accept gradients (other than the existing cream-to-accent-soft on closer cards).
- Do not accept dark mode unless explicitly scoped (the espresso bands are not "dark mode", they are inverted sections).
- Do not accept stock-photo or illustration replacements for the CohortGlobe.
- Do not accept output that fails the hardening loop. Fix it.

## After the four passes

1. Open a new branch: `git checkout -b design/redesign-pass-1`
2. Land each pass as a separate commit so rollback is granular.
3. Run `bash scripts/loop.sh` after every commit. Stay 100/100.
4. Run `/codex review` against master to catch anything the design AI missed.
5. Walk the redesigned tunnel URL on three devices (laptop, phone, tablet) and check responsiveness.
6. Compare side-by-side against the YC SS 2026 events page. The Jumpstart redesign should feel like a sibling publication, not a clone.

## When the design AI gets stuck

If the AI produces something off-brief, paste this single line:

```
Reread design-brief.md sections "The aesthetic direction" and "Anti-references". Output corrected version with one sentence on what changed.
```

If the AI introduces a new dependency, paste:

```
Justify the dependency in 50 words against design-brief.md "Stack constraints". If you cannot justify, replace it with a hand-rolled implementation.
```

If the AI reaches for a gradient or a 3D illustration, paste:

```
This is editorial founder briefing, not SaaS landing. Remove the [gradient/illustration] and replace with one of the wishlist items from design-brief.md "Reactive components wishlist".
```
