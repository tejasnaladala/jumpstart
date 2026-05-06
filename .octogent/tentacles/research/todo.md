# todo: research

## Active autoresearch sessions
- [x] vision-consolidation (completed, score 85→94, 6 keeps, 5 parking-lot, branch autoresearch/vision-consolidation-2026-05-05)

## Queued sessions (run in order)

### E1: Match Explainer prompt tuning
- Goal: lift Match Explainer eval pass rate from baseline to 95%+
- Metric: eval_pass_rate from evals/run-all.ts
- Method: vary system prompt voice anchors, specificity-anchor wording, length cap; keep variants that lift pass rate
- Cadence: weekly, autonomous via cron
- Cost cap: $50/week of agent calls

### E2: Matchmaker scoring weights
- Goal: lift simulated request rate per drop by 1.4x over baseline
- Metric: simulated request rate against drop replay corpus (50 drops from week 1)
- Method: sweep w1...w7 weights in score function, replay every drop with new weights, score by predicted action
- Cadence: monthly, manual kickoff
- Cost cap: $80/month

### E3: Safety Classifier threshold sweep
- Goal: false positive rate under 5%, false negative under 1% on labeled abuse set
- Metric: confusion matrix against labeled set
- Method: sweep BLOCK / WARN / LOG_ONLY thresholds on the labeled set
- Cadence: monthly, paired with new abuse cases
- Cost cap: $30/month

### E4: Onboarding Interviewer length
- Goal: maximize completion rate × card quality
- Metric: completion rate from analytics, card quality from a Profile Synthesizer eval
- Method: A/B 5 vs 7 vs 8 questions in production for 2 weeks each
- Cadence: one-shot
- Cost cap: $0 (uses prod traffic)

### E5: Drop format experiment
- Goal: maximize meeting-useful rate per drop
- Metric: meeting_useful_pct_7d from cohort analyst
- Method: A/B 1 vs 3 vs 5 matches per drop (parked from vision consolidation)
- Cadence: one-shot, after week 4 with 100+ active users
- Cost cap: 0

### E6: Cohort Analyst digest length
- Goal: founder reads more, acts more
- Metric: founder open rate, click-through to action
- Method: sweep digest length 100/200/400 words
- Cadence: monthly
- Cost cap: $5/month

## Infrastructure
- [ ] Wire eval results into a /research/dashboard internal page
- [ ] Add a "shadow mode" framework: deploy new prompt to 5% of traffic, compare metrics, promote if better
- [ ] Quarterly review of parking-lot ideas to see which conditions for revisit have triggered
