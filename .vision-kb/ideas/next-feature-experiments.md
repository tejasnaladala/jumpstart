# Next-feature experiments to consider after consolidation

These are ideas to evaluate in future autoresearch sessions, after the implementation phase begins or after the user introduces them.

## High-prior

- **Tag taxonomy seeding.** What is the right initial tag set? Probably 30 to 50 tags covering domain (ai-agents, hardtech, climate, biotech, fintech...), stage (idea, prototype, paying-users, raising), shape (cofounder-seeking, solo, hiring, undergrad), location (sf, india, remote). The tag set determines matching quality at scale.
- **Founder Card preview before signup.** Anonymized sample drops on the landing page. Tested once but not committed. Re-evaluate after design system exists.
- **Re-engagement for churned users.** When someone has not opened a drop in 3 weeks, the Re-engagement agent (mentioned in section 12) drafts a personalized return invite based on what they originally said in onboarding.
- **AI-generated card refresh prompts.** When the user has not edited their card in 4 weeks, the Profile Synthesizer offers "I noticed your project has changed shape, want to update the card?"
- **Founder Card paused state with grace.** If a user pauses, the system holds the slot but still shows them in saved-by-others. Need to verify that "paused" semantics do not feel like punishment.

## Medium-prior

- **Single-match drop variant for ultra-busy users.** A "high-signal mode" the user can opt into. One match per week instead of three. Tested in P005, parked. Consider as a user-level setting in v2.
- **Cross-cohort bridges.** When SS 2027 launches, allow SS 2026 alumni to opt-in to be matched with new attendees as mentors. Carries trust forward.
- **Calendar holds.** When two users accept, optionally drop a 30-minute hold on both calendars (Calendly-style integration). Currently spec just sends a link.
- **Async meeting mode.** For users who explicitly check "open to async only", the intro flow ends with a structured async exchange (a few questions back and forth) instead of a meeting.

## Low-prior, but interesting

- **Pod re-introduction as emergent micro-events.** If 5 users save the same person or want to meet on a topic, the system suggests a single small group. Not a persistent pod, just an event. Could be the v2 path back to the cut Pods feature.
- **Speed dating mode for SF event days.** During the SS in-person event, a 90-minute window where users can opt in to back-to-back 5-minute meetings with curated matches. Section 33 phase 5 territory.
- **Tag exchange.** When two users meet and find common interest in a third area, the system suggests a new tag for both cards.
- **Founder Card art.** A small generated visual (color, geometry) per founder based on their tags. Reduces the need for a profile photo while keeping cards visually distinct.

## Things the user might bring up that we should be ready for

- Pricing during SS (currently free)
- Pricing post-SS (open question)
- White-label for other accelerators (Techstars, On Deck)
- Native mobile app (post-v1)
- Slack/Discord integration (probably not, would dilute the curated drop)
- Claude.ai integration (interesting, but not v1)
- Public Founder Cards (would weaken privacy posture)
