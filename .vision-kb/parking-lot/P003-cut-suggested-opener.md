# Parking Lot P003: Cut the Suggested Opener

Run 7, score 89 (-2 from prior best 91). Discarded.

## What was tested

Remove the Opener Drafter agent. The Match Explainer already produces "why you should meet", so the suggested opener is redundant.

## Why it failed

Founder voice took a hit (-1). The opener is a low-effort hook the user explicitly asked for ("here is the line, copy it, paste it into your DM"). Cutting it removes the lowest-friction conversion path. Thesis_alignment also dipped (-1) because the spec frames Jumpstart as "give me a reason to message someone, with the line already half-written" (job 3 of JTBD).

## Why it might come back

If actual user behavior shows the opener is rarely used (copy-and-use rate under 15%) and regenerate rate is high, we can cut it. The agent eval suite will surface this.

## Conditions for revisit

- Copy-and-use rate under 15% in production
- Regenerate rate over 50% (means the openers are bad and users keep retrying)
- Token budget pressure where Opener Drafter is the easiest agent to cut
