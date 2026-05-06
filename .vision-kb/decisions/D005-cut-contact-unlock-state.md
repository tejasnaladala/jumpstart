# Decision D005: Cut the contact-unlock state, single email on accept

Run 10, commit f02805f, score 92 → 94. Biggest single jump in the session.

## What changed

The intro flow used to have three stages: request → accept → contact unlock → email. The unlock step was a UI gesture that prompted the user to "claim" the contact. It was redundant with accepting in the first place.

Now: request → accept → both parties immediately receive a single email with each other's contact info and a calendar link. No separate unlock prompt.

## What was edited

- Section 2: updated the structured-flow description.
- Section 7 (W4 workflow): output changed.
- Section 7 (W5 workflow): "unlocked intro" → "accepted intro".
- Section 23 (MVP scope): description updated.
- Section 9 (legibility layer logging list): "every contact unlocked" stays as a synonym for "every accept" since the data field is preserved.
- Appendix A: copy library updated to reflect single-email pattern.
- Section 18: schema column `contact_unlocked_at` kept since it is functionally equal to `response_at` when status is accept. Could be cleaned up further.

## Why it improves the rubric

Simplicity 9 → 10. Every state in a flow is a chance to add UI, prompt, decision, dropoff. One fewer state means one fewer page to design, one fewer agent decision, one fewer place for the user to bounce.

## What this doesn't decide

Whether the email should be a single combined message to both, or two parallel messages. The spec now says "single" but that is a UX detail, not a vision decision.

## Reopens if

A real user reports the immediate-email feels too aggressive or violates their privacy expectations. In that case, reintroduce a confirmation step with a 24-hour reminder.
