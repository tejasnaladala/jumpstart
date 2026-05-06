# Decision D004: Model the reciprocity gap as a worked-out abuse case

Run 8, commit e5c3686, score 91 → 92.

## What changed

Section 29 added a paragraph for the high-status founder flooded inbox case. Three layers of mitigation:

1. Per-recipient cap of 8 incoming requests per week.
2. Matchmaker reads recipient response history and routes around founders who decline most requests, recommending them only for the strongest pair candidates.
3. Recipient never sees a hard "decline" button, only "save for later", which the sender perceives as "not now".

## Why it improves the rubric

Edge case coverage. The brutal critique already named the reciprocity gap as a top failure mode but section 29 had no concrete mitigation plan. Closes the loop.

## Numbers to validate

- 8 per recipient per week is a guess. Tune after real signups.
- "Most" requests declined threshold for rerouting needs a definition (likely above 70% decline rate).
- "Save for later" UX needs to be tested against actual user behavior — does it actually feel less rejection-y?

## Reopens if

Post-launch data shows the cap is too low (top founders complain they want more) or too high (mid-tier founders still feel ghosted).
