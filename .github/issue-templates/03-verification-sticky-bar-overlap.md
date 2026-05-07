## Brief

The sticky "Continue" bar at the bottom of `/onboarding/verification` overlaps the form fields below it. On a 900px laptop you can't see the location toggle and the "How you want to meet" question without scrolling past a half-visible bar.

## Context

- `src/app/onboarding/verification/page.tsx` - look at the sticky bar near the end of the file. It uses `fixed bottom-0` with no padding compensation on the parent.
- The wrapper div has `pb-32` already, but the form fields inside scroll under the bar because the bar's height is taller on lg.
- May 7 audit screenshot at `experiments/screens/06-onboarding-verification-laptop.png` shows the bug visually.

## Acceptance

- [ ] No content is occluded by the sticky bar at any viewport size (375 / 414 / 768 / 1024 / 1440).
- [ ] Bar stays visually attached to the bottom of the column, not the viewport, OR the parent's bottom padding grows to match the bar height plus 16px breathing room.
- [ ] The "Continue" CTA inside the bar still works (no click target change).
- [ ] `/onboarding/verification` flow works end to end in stub mode (send email code → verify → send phone code → verify → upload mock files → continue).
- [ ] Visual diff via `npx tsx harness/scripts/design-audit-shoot.ts`. Drop laptop + phone screenshots in the PR body.

## Out of scope

- Replacing the file-upload component with a real drag-drop. Keep the existing button.
- Wiring the OTP send/verify to a real backend (that's issue #1, owned separately).
- Reordering the form fields or copy.

## Useful skills

- `/design-review` for the layout call.
- `/codex` for a diff scan before push.
