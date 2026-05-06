# todo: agents

## Pre-launch (week 1)
- [ ] Add eval cases for Onboarding Interviewer (target 30 cases)
- [ ] Add eval cases for Profile Synthesizer (30 cases)
- [ ] Add eval cases for Matchmaker (50 cases including diversity rule violations)
- [ ] Add eval cases for Opener Drafter (30 cases including voice-match)
- [ ] Add eval cases for Feedback Learner (20 cases)
- [ ] Add eval cases for Cohort Analyst (10 cases)
- [ ] Wire retry-with-backoff in runner.ts (current version has none)
- [ ] Add timeout per agent (current default depends on SDK)
- [ ] Add cost guard: warn if a single drop exceeds $0.30
- [ ] Persist agent_logs to DB after every invocation

## Hardening (week 2)
- [ ] Prompt injection regression tests against Match Explainer (user content reaches it)
- [ ] Add a "shadow mode" eval: run new prompt vs current on the same inputs, compare scores
- [ ] Add Sentry breadcrumbs around agent calls

## Continuous (autoresearch loops)
- [ ] E1: Match Explainer prompt tuning (weekly)
- [ ] E2: Matchmaker scoring weights (weekly against drop replays)
- [ ] E3: Safety Classifier threshold sweep (monthly against new abuse cases)
- [ ] E4: Onboarding Interviewer length (5 vs 8 questions, A/B in prod)
- [ ] E5: Drop format (1 vs 3 vs 5 matches per drop, A/B in prod)

## v2 (after launch)
- [ ] Embedding-based semantic match in Browse search
- [ ] Add a 9th agent: Re-engagement Drafter for churned users
- [ ] Multi-language support for India cohort (Hindi)
