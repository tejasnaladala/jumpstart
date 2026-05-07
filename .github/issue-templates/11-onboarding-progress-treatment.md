## Brief

The onboarding flow is 4 steps (identity → intent → card → verification). Today the progress is shown as a `<StepDots />` row of small circles. It's functional but not editorial. Make the progress treatment feel like turning pages in a numbered booklet: large folio numeral for the current step, small numerals for the others, with a hairline rule and a cohort-meta line.

## Context

- `src/components/StepDots.tsx` is the current treatment.
- Used in `src/app/onboarding/identity/page.tsx`, `intent/page.tsx`, `card/page.tsx`, `verification/page.tsx` — all 4 steps.
- Aesthetic precedent: see `.ed-folio` in `src/app/globals.css` (large 3.25rem display serif numerals in accent orange) and the Founder Pass `01 / BUILDING` treatment.
- Voice: "Step 2 of 4" stays factual; do NOT replace with cute language ("Halfway there!" etc.).

## What to ship

1. **New component or rewrite**: replace `<StepDots>` with an editorial progress treatment.
   - Current step: large folio numeral (text-5xl or similar) in accent orange.
   - Other steps: small mono numerals, muted color, 0.7rem.
   - All four arranged horizontally with `·` separators or an ed-rule under each.
   - Step name underneath the current numeral (e.g. "Identity" / "Intent" / "Founder Pass" / "Verification").
2. **Cohort-meta line above the progress**: small ed-serial with "No. 001 / Cohort SS 2026" matching the homepage hero treatment. Optional but cohesive.
3. **Drop the existing step subtitle** ("Step 2 of 4") if the new treatment replaces it. Don't double-display.

## Acceptance

- [ ] All 4 onboarding pages use the new progress treatment with the correct step highlighted.
- [ ] Visual cohesion with the rest of the editorial system: ed-serial mono caps, font-display serif, accent orange tick.
- [ ] Renders correctly at phone (375), tablet (768), and laptop (1440).
- [ ] No regression on form behavior — the progress is purely visual chrome.
- [ ] Build passes.
- [ ] Before/after screenshots of all 4 onboarding steps in the PR body.

## Out of scope

- Adding/removing onboarding steps. 4 steps stay.
- Skip-to-step navigation via clicking the numerals.
- Animation between steps (a gentle fade is fine; no spring physics on the numerals).

## Useful skills

- `/design-consultation` if you want to rethink the whole flow shape before coding.
- `/codex` on the diff.
