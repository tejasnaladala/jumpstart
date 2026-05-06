# Parking Lot P002: Add weekly check-in nudge

Run 5, score 83 (-2 from prior best 89). Discarded.

## What was tested

Add a weekly prompt: "Did you talk to anyone this week?" To re-engage churned-ish users and capture stories.

## Why it failed

Adds a notification surface (-2 simplicity). Provides a feedback signal that the 48-hour post-meeting prompt already covers. The notification volume was the deciding factor: more pings means more unsubscribes.

## Why it might come back

If post-launch data shows we need MORE feedback signal to train Feedback Learner, and re-engagement rate is below target. In that case we ship as opt-in only, defaulted off, and tune frequency from monthly upward.

## Conditions for revisit

- Feedback Learner has fewer than 200 ratings per week
- Re-engagement rate of churned users below 10%
- User complaints about losing track of who they were planning to follow up with
