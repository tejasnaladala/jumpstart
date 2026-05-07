## Brief

Design and ship the OpenGraph image for the landing page so LinkedIn and X share previews aren't the default Next.js placeholder. We're publishing the page to founder Twitter and LinkedIn this week (issue #8); the OG card is what people actually see in their feeds.

## Context

- `src/app/layout.tsx` declares `metadata.openGraph` but no `images` array. Next.js falls back to a generic placeholder.
- Hero copy (load-bearing, do not change wording): "YC Startup School brings the world's best young builders into one cohort. Jumpstart helps them find each other."
- Aesthetic system: cream `#F5F0E5`-ish bg, espresso ink, accent orange, Instrument Serif italic. The current Founder Pass component (`src/components/FounderPass.tsx`) is the visual signature.
- Reference: `experiments/screens/01-home-laptop.png` — the editorial hero treatment.

## What to ship

Two paths, pick one (or do both if you want belt-and-suspenders):

**Path A: dynamic OG image** (Vercel-native, recommended)
- `src/app/opengraph-image.tsx` returning a JSX-rendered image at 1200x630 via Next's built-in `next/og` (Vercel-hosted).
- Renders the editorial hero: "Cohort SS 2026" eyebrow, the headline (or a tightened version that fits 1200x630), and a Founder Pass-style mini-card on the right.
- Test: visit `/opengraph-image` on the running dev server and screenshot it.

**Path B: static PNG**
- Design in Figma at 1200x630, export to `src/app/opengraph-image.png`.
- Next.js auto-detects the file by name and serves it. No code path change.
- Slower to iterate but full design control.

Either way, also wire `metadata.twitter`:
```ts
twitter: {
  card: "summary_large_image",
  title: "Jumpstart for Startup School 2026",
  description: "...",
  images: [{ url: "/opengraph-image" }],
}
```

## Acceptance

- [ ] Landing page returns a real OG image at `/opengraph-image` (not the default placeholder).
- [ ] LinkedIn and X share preview shows the new card. Verify with https://www.opengraph.xyz/ or the platform's own debugger:
  - https://www.linkedin.com/post-inspector/
  - https://cards-dev.twitter.com/validator (deprecated but still works)
- [ ] Image is 1200x630, under 5MB, PNG or JPG.
- [ ] Editorial voice: matches the cream + espresso + accent treatment, no AI-slop, no stock-photography vibe.
- [ ] Build passes.
- [ ] Drop the rendered preview in the PR body.

## Out of scope

- Per-page OG images (e.g. `/pass/[id]` having its own card). v1.5+.
- Animated OG (X doesn't render them).
- Localization. English only for now.

## Useful skills

- `/design-shotgun` to generate 3 OG variants and pick the strongest.
- `/codex` on the JSX rendering code if you go path A.

## Notes

This is blocking issue #8 (publish to LinkedIn + X). Ship this one first if you're picking up multiple Mukund-owned issues today.
