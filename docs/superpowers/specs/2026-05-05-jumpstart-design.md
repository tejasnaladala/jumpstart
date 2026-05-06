# Jumpstart design spec

Date: 2026-05-05
Phase: 1, ideation locked
Author: Tejas N.
Status: ready for implementation planning

---

## 1. Core thesis

Jumpstart is the AI-routed relationship layer for the YC Startup School 2026 cohort: a small opinionated app that turns 8,000+ accepted founders into a queryable, self-improving graph of people worth meeting.

It exists now for one reason. YC SS 2026 is the densest pre-screened global founder cohort in the world for a three month window. After that the density disperses. No tool today treats this density as an intelligent graph. LinkedIn is too noisy. Bookface is alumni only. Slack groups die in two weeks. The cohort needs routing, not another directory.

YC creates the density. Jumpstart routes it.

## 2. What this is and what it is not

Jumpstart is one thing. An AI matchmaker that delivers a small curated list of founders worth your time, learns from what happens after, and gets sharper every week.

It looks nothing like a networking app. The home is a curated drop, not a directory. There is no swipe pile or social feed. The intro flow is structured (request, accept, contact unlock) and the AI is the matchmaker, not a chatbot you talk to.

It also does not compete with YC Cofounder Matching. The cohort here is bounded to verified SS 2026 attendees, the goal is breadth across the cohort (cofounder being one of many match types), and the time horizon is the three months of the program.

The wedge against networking apps is exact:

- The home is a curated drop, not a directory.
- There is no infinite scroll, no swipe pile, no follower count.
- The intro flow is structured (request, accept, contact unlock), not freeform DM.
- The AI is the matchmaker, not a chatbot you talk to.
- Every drop teaches the system. By drop three, your matches are personalized to your taste, not just your tags.
- The cohort is bounded. Only verified SS 2026 attendees. The smallness is the value.
- No public profile. Cards are only visible to other verified attendees.
- No vanity metrics. The app will never tell you how many people viewed your card.

If a feature would make Jumpstart feel more like LinkedIn, it does not ship.

## 3. Brutal critique

The most likely ways this dies, ordered by probability.

### Cold start kills the first drop

Thin profiles produce generic matches. The first drop is the only chance to convert a curious user. If the first drop is mid, retention is dead. Mitigation: gate the first drop behind a richer intent interview, seed the cohort with high-signal early adopters before opening, and let the AI explicitly say "we need more signal, here is one match instead of three" rather than padding.

### Verification friction trades growth for trust

Manual review every signup means the cohort grows slowly and feels like a club. Automated screenshot checks mean spam slips in. The honest answer: a tiered trust model where you can use the app on day one with a soft signal (acceptance email subject line + LinkedIn URL) and earn full visibility after a manual review or peer referral.

### AI slop matches kill the magic

A match explanation that says "you both build AI" is worse than no match. Real founders read this and quit. The match explanation has to be specific about complementarity or shared shape. The bar: every "why you should meet" line must contain at least one detail no other pair could share.

### Reciprocity gap creates ghosting

Top founders get many requests, ignore them, and the rest feel ghosted. Mitigation: cap intro requests per founder per week, default match types to peer-shape rather than punch-up shape, and surface a clear "saved you a seat" signal so a non-reply does not feel like rejection.

### Cohort lifecycle problem

After SS ends, app dies in four weeks. This is the actual product question. If Jumpstart is a three month tool, that is fine, the success metric is what happened during those months. If it wants to live longer, it needs a per-cohort model (SS 2027, SS 2028) or a follow-up product the alumni want.

### YC indifference

You build it, YC sees it, says "cool" and never engages. Mitigation: build the CohortOS dashboard from week one, design the product so the YC-facing metrics (cross-region intros, cofounder matches, country graph) are first class outputs, and treat the handoff package as a real artifact you ship, not a deck you mock up at the end.

### Trust break

One bad actor scrapes cards, screenshots circulate, the brand is dead in a day. Mitigation: per-card watermarks on shareable assets, rate limits on Browse, no card export, signed image URLs that expire, and an active safety classifier that reads every intro request before it is sent.

### Drift into generic networking

Without ruthless editing this becomes another founder app. The defense is the principle in section 2: any feature that pushes toward directory, scroll, or social feed gets cut.

## 4. User personas

Five personas the matching has to handle well. Listed by what they want, not what they are.

### Tejas-shape (technical hardtech founder, going to SF)

Wants cofounders and technical collaborators. Has a real product. Wants high-signal, low-volume matches. Will read every match explanation carefully. Will quit if drops feel generic. Highest taste, lowest tolerance for slop.

### Devansh-shape (India founder, may not go to SF)

Wants async global intros and an India bridge to SF. Attended SS India in person. Hard to get traction with western tools. Cares about timezone-aware matching. Will be a daily user if the product respects async.

### Ananya-shape (undergrad solo founder)

Wants peers, accountability partners, and a sense that other young builders exist in this cohort. Lower funded, higher energy. Will share the app aggressively if it works.

### Maya-shape (busy AI infra founder)

Time poor. Wants two great matches a month, not twelve okay ones. Will not browse the directory. Will only check the Drop tab. Wants email digests so the app does not need to live on her phone.

### Domain-bridge shape (climate or biotech founder)

Wants other domain peers (rare in the cohort) and the right adjacent collisions (a hardware founder, an AI agent founder for their domain). Hardest to match. Will judge the system on whether it finds them their five domain peers across the global cohort.

## 5. Jobs to be done

In priority order.

1. Help me figure out who in this cohort is actually worth my time.
2. Give me a reason to message someone, not just a list to browse.
3. Remember the people I meet so I do not lose them.
4. Tell me when someone interesting joins the cohort or changes their card.
5. Translate my vague intent into matches I would not have searched for.

The product is built for job 1 first. Everything else is in service of that.

## 6. AI-first operating model

Jumpstart is not a CRUD app with AI features. It is an agent system with a thin UI on top.

The user sees a small app. Behind it, eight agents do the work that would otherwise need a community manager, a matchmaker, a moderator, a copywriter, a researcher, an analyst, and a customer success rep. The founder running this product (me) reviews dashboards and approves edge cases. There is no support inbox to triage. There is no manual matching queue. There is no community ops team.

The architecture in one sentence: every important action in the system is an agent invocation that writes structured output back to a queryable database, and every decision the agent makes can be rerun, replayed, and improved with new feedback.

This is what makes Jumpstart legible to itself. Every match generated is logged with the reasoning. Every skip and accept is logged with the user. Every meeting outcome is logged with both sides. The cohort graph is queryable not just to the user but to the agents that improve it.

If a competitor built a clone tomorrow, the visible product would look identical. The difference is what runs underneath.

## 7. Workflow map

Eight workflows. Each defined as input, AI layer, human role, output, feedback loop, stored memory, success metric.

### W1: Onboarding to Founder Card

Input: user starts onboarding with name, email, location, LinkedIn, one line on what they are building.
AI layer: Onboarding Interviewer agent runs a conversational intent interview (5 to 8 questions, follow-ups based on answers).
Human role: user types free text answers, no dropdowns.
Output: structured Founder Card (tags, intent, building summary, looking for, can help with, talk to me if).
Feedback loop: user can edit any field, the system logs every edit and learns which AI-generated phrases get changed.
Stored memory: full interview transcript, generated card, edit history, embedding of the building summary.
Metric: card completion rate, edit rate per field (lower is better, signals the AI got it right).

### W2: Verification

Input: SS acceptance email subject line, LinkedIn URL, optional acceptance screenshot, optional referral from existing verified user.
AI layer: Safety Classifier reads inputs, scores trust 0 to 100, flags suspicious cases.
Human role: founder (me) approves manual review queue, only the flagged cases.
Output: trust tier (provisional, verified, peer-vouched).
Feedback loop: false positives and false negatives go back into the classifier prompt as eval cases.
Stored memory: verification artifacts (with screenshot deleted after approval), trust decision, reviewer.
Metric: time to verification (target under 24 hours), false positive rate, abuse rate post-launch.

### W3: Drop generation

Input: user's card, last week's accept/skip history, current cohort graph, pairwise compatibility scores (precomputed nightly).
AI layer: Matchmaker agent picks 3 candidates from a top-50 ranked list, then Match Explainer writes the "why you should meet" for each, then Opener Drafter writes a suggested opener.
Human role: none.
Output: a delivered Drop (3 cards with explanation and opener) per cycle.
Feedback loop: user behavior on each match (open, save, skip, request, mark not relevant) is the training signal for next week.
Stored memory: every drop ever generated, every choice the user made, agent reasoning trace.
Metric: drop open rate, intro request rate per drop, "not relevant" rate (lower is better), three-drop personalization lift (matches generated at week 3 should outperform week 1 for the same user).

### W4: Intro request and accept

Input: user A taps Request Intro on user B's match card. Optional 1 line note.
AI layer: Safety Classifier reads the note for spam, harassment, tone. Match Explainer writes the recipient-side framing ("here is why we recommended you to A").
Human role: user B accepts, declines, or saves.
Output: on accept, contact info exchange unlocked (email + scheduling link), both parties notified.
Feedback loop: meeting confirmation (did this happen) is fed back to W3.
Stored memory: full request, accept/decline, follow-up status.
Metric: request to accept rate (target 40%+), accept to actual meeting rate (target 60%+).

### W5: Post meeting feedback

Input: 48 hours after an unlocked intro, the user gets one prompt, "did you meet?" If yes, "was it useful?" with three buckets (worth my time, neutral, waste).
AI layer: Feedback Learner agent rolls feedback into per-user taste embeddings.
Human role: 1 tap response.
Output: updated taste profile.
Feedback loop: this is the main training signal for personalization. Every "worth my time" lifts similar matches, every "waste" pushes them down.
Stored memory: feedback record tied to both users, with optional one line text.
Metric: feedback response rate (target 50%+), meeting useful rate (target 65%+).

### W6: Browse

Input: user opens Browse, optionally taps filter icon, picks tags.
AI layer: query is also a vector search behind the scenes, so "voice agents" returns "speech LLM infra" too.
Human role: user browses, taps a card, optionally requests intro.
Output: filtered list, click-throughs to match detail.
Feedback loop: searches and clicks log to taste profile.
Stored memory: full search log per user.
Metric: Browse to intro request conversion (likely lower than Drop, that is fine, Browse is a safety valve not a primary surface).

### W7: Card edits

Input: user edits a field on their Founder Card.
AI layer: Profile Synthesizer optionally rewrites adjacent fields if the change is significant (new project, big tag shift).
Human role: user reviews any AI-suggested rewrites and accepts or rejects.
Output: updated card, queued reembedding for matching.
Feedback loop: edits feed the Profile Synthesizer's training set.
Stored memory: full edit history.
Metric: time to recommend new matches after a card change (target under 1 hour).

### W8: Moderation

Input: a report, a flagged intro request, an anomalous behavior pattern.
AI layer: Safety Classifier triages, writes a recommended action.
Human role: founder approves or rejects, manually reviews top 5% only.
Output: action taken (warn, suspend, ban, no action).
Feedback loop: every reviewed case becomes an eval case.
Stored memory: full case file, decision, reasoning.
Metric: time to action under 4 hours, false positive rate under 5%.

## 8. Closed loop design

The system is self-regulating across five loops.

### Loop 1: match quality

User behavior on each match (skip, save, request, mark not relevant, post-meeting feedback) updates a per-user taste embedding within 24 hours. Next week's matches use the updated embedding. Quality target: by drop 3, request rate is 1.4x drop 1 for the same user.

### Loop 2: explanation quality

Every "why you should meet" the user marks as not relevant or skips fast becomes a negative example. Match Explainer's prompt is tuned weekly against the latest pool of negatives. Quality target: skip rate on first 5 seconds drops 20% over 4 weeks.

### Loop 3: verification quality

Every manually reviewed verification case becomes a labeled eval case for the Safety Classifier. The classifier's threshold is tuned weekly against this set. Target: false positive rate under 5%.

### Loop 4: cohort graph quality

The pairwise compatibility scores are recomputed nightly from the latest card edits, behavior signals, and feedback. Stale matches die. Fresh ones surface. Quality target: average match age (time since last graph recompute) under 24 hours.

### Loop 5: founder operating loop

I (the founder) get a daily 6am summary from the Cohort Analyst agent: new signups, verification queue, weekly drop performance, anomalies, suggested follow-ups. I review and act in under 30 minutes. The rest of the day I am building, not operating.

## 9. Legibility layer

For an agent to operate Jumpstart well, every important thing has to be data.

### What gets captured

Every onboarding answer, every card field edit, every drop generated, every match shown, every match opened, every match skipped, every intro requested, every intro accepted or declined, every contact unlocked, every meeting confirmed, every post-meeting rating, every search query, every Browse click, every card view, every report, every verification artifact, every founder operating action.

### How it is structured

Postgres tables for the entities (users, cards, drops, matches, intros, meetings, reports, verifications). Each row has structured columns plus a JSONB column for flexible context.

A pgvector embedding column on Founder Card "building" and "looking for" fields, plus on full agent reasoning traces.

A separate logs table for every agent invocation: prompt, response, model, tokens, latency, cost, feedback signal if any. Indexed by user_id, agent_name, time.

### How it is queryable

Read replicas for the Cohort Analyst agent. The analyst speaks SQL and pgvector. It can answer "show me the 10 most active India founders this week," "show me drops where the user marked all 3 as not relevant," "show me which match types correlate with highest meeting rates."

A weekly digest doc gets generated from these queries and committed to the repo as a markdown file. The doc is the artifact, not a dashboard.

### How agents see the user

When an agent runs for a user, it gets a context bundle:
- the full Founder Card
- the last 4 drops they got and how they reacted
- their last 10 search queries
- their last 5 meetings and ratings
- their stated intent (raw text from interview)
- their tags and embedding

This is the same kind of context an experienced human matchmaker would have. The agent has it for free.

## 10. Agent architecture

Eight agents. Each is a Claude prompt with structured I/O, a tool set, an eval suite, and a failure mode list.

### Agent 1: Onboarding Interviewer

Purpose: run a 5 to 8 question conversational intake that produces a high-signal Founder Card draft.
Inputs: user identity (name, location, what they are building one liner).
Tools: none. Pure conversation.
Memory: the running transcript.
Outputs: structured intent JSON (tags, intent type, looking for, can help with, who not to match with).
Eval criteria: time to complete (under 4 minutes), card completion fields (target 90%+ filled), manual quality rating from founder (target 4/5+).
Failure modes: too many questions (user drops off), not enough probing (card is generic). Mitigation: max 8 questions, branch on signal.
Human escalation: if user submits all empty, route to manual founder follow-up.

### Agent 2: Profile Synthesizer

Purpose: turn the structured intent JSON into Founder Card prose (the talk-to-me-if line, the can-help-with line, etc).
Inputs: intent JSON, last edit history.
Tools: none.
Memory: the user's edit history (so it learns their voice).
Outputs: rendered card fields.
Eval criteria: edit-after-generation rate (lower is better, target under 30%).
Failure modes: too generic, too aspirational, mismatched voice. Mitigation: include 3 example cards from the user's tag cluster as in-context examples.
Human escalation: none, edits are the feedback signal.

### Agent 3: Matchmaker

Purpose: pick 3 candidates from the precomputed top-50 ranked list for this user this cycle.
Inputs: user's card, last 4 drops with behavior, top-50 ranked candidates (from nightly graph job), current cycle constraints (cofounder this week, peer next week, etc).
Tools: SQL access to read user history, pgvector access to verify candidate embeddings.
Memory: full drop history for the user.
Outputs: ranked list of 3 candidates with match type tags.
Eval criteria: request rate (target 30%+), not relevant rate (target under 10%).
Failure modes: same domain repetition, ignoring intent, recommending people the user already requested. Mitigation: hard exclusion list of last 30 days of shown matches, type rotation across drops.
Human escalation: if user marks all 3 as not relevant 2 weeks in a row, queue for founder review.

### Agent 4: Match Explainer

Purpose: write the "why you should meet" for each match in 2 to 3 sentences that contain at least one specific detail.
Inputs: both Founder Cards, the match type, the matchmaker's reasoning trace.
Tools: none.
Memory: a few-shot library of high-quality explanations.
Outputs: explanation string per match.
Eval criteria: skip-within-5-seconds rate (lower is better, target under 15%).
Failure modes: generic ("you both build AI"), wrong framing (calling a peer a cofounder), made-up details. Mitigation: enforce specificity check (every explanation must reference a card field from the other side), forbid fabricated facts.
Human escalation: a "this is wrong" feedback button on the match detail page sends the case to a review queue.

### Agent 5: Opener Drafter

Purpose: write a one-line opener the user can use to start the conversation.
Inputs: both cards, the explanation.
Tools: none.
Memory: the user's existing voice (from their card edit history).
Outputs: opener string, plus a "rewrite in your voice" option that lets the user iterate.
Eval criteria: copy-and-use rate (target 40%+), regenerate rate (lower is better).
Failure modes: too formal, too founder-Twitter, embarrassing. Mitigation: include the user's actual card prose as voice anchor.
Human escalation: none, regenerate is the feedback.

### Agent 6: Feedback Learner

Purpose: roll user behavior into a taste profile that improves next cycle's matches.
Inputs: user's drop history, intro requests sent, intro requests received and answered, meeting feedback ratings, search queries.
Tools: pgvector write access, SQL.
Memory: per-user taste embedding.
Outputs: updated taste embedding, plus structured insights ("user heavily prefers technical collaborators over GTM peers").
Eval criteria: drop personalization lift over 3 weeks (target 1.4x).
Failure modes: overfitting to early behavior, locking the user into a narrow loop. Mitigation: explicit diversity injection (1 of 3 matches must be outside taste cluster).
Human escalation: none.

### Agent 7: Safety Classifier

Purpose: read every intro request note, every report, every new signup verification, every flagged Browse query, score risk.
Inputs: the artifact under review, plus the user's history.
Tools: SQL read, history lookup.
Memory: previously reviewed cases (positive and negative).
Outputs: risk score 0 to 100, recommended action (allow, flag, block, escalate).
Eval criteria: false positive rate under 5%, false negative rate under 1% on labeled set.
Failure modes: missing edge cases, over-blocking benign requests. Mitigation: weekly retraining against new labeled cases, founder review on every block in week 1.
Human escalation: every block goes to the founder queue in week 1, then only above-threshold cases after.

### Agent 8: Cohort Analyst

Purpose: produce the daily founder summary and the weekly cohort report.
Inputs: full read access to all tables.
Tools: SQL, pgvector, write access to a summaries table.
Memory: the full history of summaries (so it can spot trends).
Outputs: daily 200-word digest emailed to founder at 6am, weekly markdown report committed to repo.
Eval criteria: founder reads the digest (open rate), founder takes action on at least one item per day (click rate), weekly report contains at least 3 non-obvious findings (qualitative).
Failure modes: bland summaries, missed anomalies. Mitigation: explicit "what changed" section, explicit "what is unusual" section.
Human escalation: anomalies above threshold trigger Slack ping.

## 11. Software factory plan

The repo treats this like TDD for an agentic system. Specs and tests in, working app out.

### Specs (committed)

- product.spec.md: this document
- ui.spec.md: every screen with copy, components, states (next phase)
- data.spec.md: tables, columns, indexes, constraints (next phase)
- agent.spec.md: every agent's prompt, I/O contract, eval criteria (next phase)

### Tests (committed and run on every change)

- e2e tests with Playwright: full user flows (signup, drop view, intro request, accept)
- agent eval suite: golden examples per agent with expected output shape and quality
- match quality regression suite: 50 known good and 50 known bad pairs, agent must classify correctly
- safety eval suite: 50 known abuse cases, classifier must catch all
- copy quality suite: every match explanation must pass the specificity check (contains at least one detail from the other card)

### Build iteration loop

1. Write or edit a spec.
2. Write or edit the eval cases.
3. Run Claude Code with the spec + eval cases as input.
4. Agent generates implementation.
5. Agent runs the test suite.
6. If failing, agent regenerates. Repeat up to 5 times.
7. If still failing, founder reviews and pairs with the agent.

### Acceptance criteria

A change is accepted when:
- all eval suites pass
- the diff is reviewed by the founder
- the founder runs the affected user flow once manually

## 12. Remove human middleware

A list of human jobs that are not allowed in this product, and what replaces each.

A community manager who answers user questions becomes a help center generated from the FAQ plus the Cohort Analyst agent answering specific queries.

A matchmaker who picks who to recommend becomes the Matchmaker agent.

A copywriter who writes match explanations becomes the Match Explainer.

A QA tester who manually checks new flows becomes the e2e suite plus the agent eval suite.

A research analyst who pulls weekly metrics becomes the Cohort Analyst.

A trust and safety reviewer who reads every report becomes the Safety Classifier with the founder reviewing only the flagged 5%.

A customer success rep who follows up with churned users becomes a re-engagement agent that drafts a personalized re-onboarding interview when the user comes back.

The only human in the loop is me. My job is to write specs, review agent output, talk to high-signal users directly, and decide what to ship next. I do not approve intros. I do not write match explanations. I do not pull metrics. I do not answer support tickets. I review summaries and ship code.

## 13. Builder operator culture

This is a one-person product for now. The principle still matters because of how the product itself is shipped.

Everything that gets built ships as a working artifact. Not a doc, not a plan, not a deck. A live screen with real data, or a passing test, or a deployed feature flag.

The DRI for every workflow above is named explicitly. Right now that is me for all eight, but each agent has a clear owner-of-record so when a contributor joins the system is already structured around outcomes.

The founder works by example. I use Claude Code to ship every feature. I do not delegate AI strategy to a future hire. The build process is itself an artifact, the AI workflows that ship the product are the same kind of AI workflows the product uses.

## 14. Token max strategy

Where to spend tokens to replace work, and where not to.

### Spend heavy

Per-drop matchmaking and explanation. Each user gets 3 matches per week. Each match runs Matchmaker plus Match Explainer plus Opener Drafter. Cost per drop estimated at $0.15. 8000 users at one drop per week is $1200 a week. Cheaper than one community manager for an hour.

Personalization recomputation. Nightly graph job, ~$50 a night. Replaces a data analyst.

Cohort Analyst daily and weekly reports. ~$10 a week. Replaces a junior PM.

Safety classification on every intro request and report. ~$300 a week at scale. Replaces a trust and safety hire.

Onboarding Interviewer for every new user. ~$0.10 per user. At 8000 users, $800 total. Replaces a community onboarder.

### Spend light or skip

Generic chat with the AI. The user does not talk to a chatbot. There is nothing to spend on.

Real-time recomputation. Drops are weekly, recomputes are nightly. No need for streaming.

Vanity content (newsletters, blog posts written by AI). Skip. The product is the marketing.

### Total burn estimate at 8000 active users

Approximately $2400 a week at full scale. Annualized $125k. This replaces what would otherwise be 4-5 humans (community, matchmaking, copy, analyst, T&S). Cost ratio under 5% of equivalent headcount.

## 15. Early stage wedge

Day one looks different from day 30, and that is a feature.

### Day 1

The matching is not yet personalized. The Matchmaker uses a simple ranking: tag overlap + intent compatibility + cohort segment overlap. Match explanations are written by the Match Explainer agent against full cards. Drops go out manually approved by me for the first 50 users. I read every drop before it sends. I learn what good matches look like for this cohort by hand.

### Day 7

Manual approval drops. Drops go out automatically. I review samples weekly. The Match Explainer has 50 good examples to learn from. The eval suite has 30 cases.

### Day 30

Personalization is live. The Feedback Learner has enough data to lift drop quality. The Cohort Analyst is producing daily digests. The CohortOS dashboard exists with real metrics. I am no longer in the daily loop, I am in the weekly review loop.

The advantage of starting from zero is that I do not have a community ops team to retrain or a legacy directory product to migrate. The system is AI-native from the first user.

## 16. Product UX

Every screen in the v1 app, with goal, action, AI, feedback shown, data captured, next best action.

### Landing page

User goal: understand in 5 seconds what this is and decide whether to join.
Main action: tap "Get my Founder Drop."
AI assistance: none on this page, the magic happens after.
Feedback shown: a sample anonymized drop preview ("Maya, Toronto, building eval infra...") so the user sees the format before signing up.
Data captured: page view, scroll depth, CTA clicks.
Next best action: signup form.

Hero copy:
> YC Startup School brings the world's best young builders into one cohort. Jumpstart helps them find each other.

Subhead:
> Join the unofficial global attendee graph for Startup School 2026. Get curated founder matches every week.

Sections in order: hero, sample drop preview, how it works in 3 steps, who it is for, trust and verification note, not affiliated disclaimer, FAQ, CTA.

### Signup

User goal: start onboarding in under 30 seconds.
Main action: enter email + LinkedIn URL, get magic link.
AI assistance: none yet.
Feedback shown: progress bar (4 steps).
Data captured: email, LinkedIn, timestamp, source (referral, organic, social).
Next best action: identity step.

### Onboarding step 1: identity

User goal: tell us who you are.
Main action: name, location, one line on what you are building.
AI assistance: location autocomplete, optional pull from LinkedIn for name.
Feedback shown: live preview of the Founder Card forming on the right.
Data captured: structured fields.
Next best action: SS context step.

### Onboarding step 2: SS context and verification

User goal: prove you are in the cohort.
Main action: paste acceptance email subject line, optional acceptance screenshot, optional referral code.
AI assistance: Safety Classifier scores the submission instantly.
Feedback shown: trust tier ("provisional, full access in 24 hours after review").
Data captured: verification artifacts (screenshot deleted after review).
Next best action: intent interview.

### Onboarding step 3: intent interview

User goal: tell Jumpstart what you actually want.
Main action: 5 to 8 conversational questions in chat-like UI, free text answers.
AI assistance: Onboarding Interviewer asks follow-ups based on answers.
Feedback shown: live preview of the Founder Card filling in as you answer.
Data captured: full transcript, structured intent JSON.
Next best action: card review.

Sample questions the Interviewer might ask:
- What are you building, in your own words?
- Who would make Startup School worth it for you?
- What can you uniquely help others with?
- What kind of meeting would feel like a waste of your time?
- Are you open to async intros, in-person only, or both?

### Onboarding step 4: card review

User goal: confirm or edit the auto-generated card.
Main action: review each field, edit any, accept.
AI assistance: Profile Synthesizer rewrites adjacent fields if you change one.
Feedback shown: a preview of how the card appears to others.
Data captured: edits per field.
Next best action: drop preview.

### Drop home

User goal: see who is worth meeting this week.
Main action: tap into a match, save, request intro, or skip.
AI assistance: Matchmaker, Match Explainer, Opener Drafter all already ran before the user opened the app.
Feedback shown: 3 match cards, name, location, one-line on what they are building, plus the explanation snippet on tap.
Data captured: open, view duration, scroll, tap, request, skip, mark not relevant.
Next best action: tap into a match for full detail.

Empty state copy when the next drop is not yet ready:
> Your next drop arrives Wednesday at 9am. We are matching the cohort against your card now.

### Match detail

User goal: decide whether to request intro.
Main action: read the why and the opener, tap Request Intro.
AI assistance: Match Explainer's full reasoning, Opener Drafter's suggestion.
Feedback shown: their card prose, tags, the why-you-should-meet section, the suggested opener (with regenerate button).
Data captured: time on page, opener regenerations, request sent.
Next best action: send the request.

The why section template:
> You both [shared shape]. The angle that makes this worth your time: [specific complementarity from the other card]. [If applicable] They are also looking for [their stated intent that matches you].

### Request flow (sender)

User goal: send a clean request without writing much.
Main action: optional 1-line note, tap send.
AI assistance: Safety Classifier reads the note before send.
Feedback shown: confirmation, "we will email you when they accept."
Data captured: note text, request timestamp.
Next best action: see other drops or close.

### Request flow (receiver)

User goal: decide quickly.
Main action: read why we recommended you, tap Accept, Decline, or Save.
AI assistance: a recipient-facing version of the why ("we recommended you to A because...").
Feedback shown: their card snippet, the why, their optional note.
Data captured: response, response time.
Next best action: if accepted, see the contact info and a calendar link.

### Browse

User goal: search the cohort with intent (rare flow).
Main action: tap filter icon, pick tags, browse list, tap into a card.
AI assistance: vector search expands tag matches.
Feedback shown: count of matching founders, list, scrollable.
Data captured: search query, filters used, click-throughs.
Next best action: tap a card or refine filter.

### You

User goal: see and edit your card, manage account.
Main action: edit card, change settings.
AI assistance: Profile Synthesizer rewrites if needed.
Feedback shown: card preview, edit fields, account state.
Data captured: edits, settings changes.
Next best action: edit a field or close.

## 17. Match types and matching algorithm

The matcher considers these match types per pair. A drop must include at least 2 distinct types to avoid feeling repetitive.

- Domain peer (same building space, similar stage)
- Cofounder shape (complementary skills, mutual interest)
- Technical collaborator (one builds, the other has a problem)
- GTM collaborator (one ships, the other distributes)
- Local city match (same city, both going to the same in person event)
- India to global bridge (one in India, one in SF or another hub, both interested)
- Weird adjacent collision (different domains, shared shape, surprising)
- Accountability partner (similar stage, different domains, both solo)

The score for a candidate B for user A is:
score(A, B) = w1 * tag_overlap + w2 * intent_compatibility + w3 * embedding_similarity + w4 * cohort_segment_overlap + w5 * intro_fatigue_penalty + w6 * trust_score_floor + w7 * taste_personalization

Where taste_personalization is zero on day 1 and rises over time as Feedback Learner has more data.

The top 50 candidates are precomputed nightly. The Matchmaker picks 3 from this list with diversity constraints (different match types, different cities at least sometimes, no repeats from last 30 days).

## 18. Data model

Tables (Postgres + pgvector).

### users
id, email, linkedin_url, phone, name, location, created_at, last_active, trust_tier (provisional / verified / peer_vouched), verification_artifact_id, deleted_at.

### founder_cards
id, user_id, building_summary, looking_for, can_help_with, talk_to_me_if, tags (text[]), embedding (vector), open_to_async (bool), open_to_in_person (bool), updated_at, version.

### intent_interviews
id, user_id, transcript (jsonb), structured_intent (jsonb), created_at.

### drops
id, user_id, cycle_week, generated_at, sent_at, opened_at, status (queued/sent/opened).

### matches
id, drop_id, user_id, candidate_user_id, match_type, score, reasoning_trace (jsonb), explanation, suggested_opener, position (1/2/3), shown_at, viewed_at, action (skip/save/request/not_relevant), action_at.

### intros
id, requester_id, recipient_id, match_id, note, sent_at, response (accept/decline/save/expired), response_at, contact_unlocked_at.

### meetings
id, intro_id, occurred (bool), occurred_at, useful (worth/neutral/waste), feedback_text, recorded_at.

### verifications
id, user_id, method (email_subject / screenshot / referral / linkedin_post), artifact_url (signed, expires), submitted_at, reviewed_at, reviewer_id, decision, classifier_score.

### reports
id, reporter_id, reported_user_id, reason, context (jsonb), classifier_score, status, action_taken.

### agent_logs
id, agent_name, user_id, prompt (text), response (text), model, tokens_in, tokens_out, latency_ms, cost_usd, feedback_signal (jsonb), invoked_at.

### taste_profiles
user_id, embedding (vector), preferred_match_types (jsonb), last_updated.

### Indexes

users: email unique, linkedin_url unique, last_active.
founder_cards: user_id unique, embedding (ivfflat), tags (gin), updated_at.
matches: drop_id, candidate_user_id, action.
intros: requester_id, recipient_id, response.
agent_logs: user_id+invoked_at, agent_name+invoked_at.

## 19. Viral loops

Six.

### Loop 1: intro request brings recipient in

User A is on Jumpstart, requests an intro to user B. If B is not on the app, the request email contains a "see who recommended you and why" link that previews A's card and the why. Highest-converting acquisition channel.

### Loop 2: shareable Founder Card image

After onboarding, user can share a card image to LinkedIn or X with a "find me on Jumpstart" tag. Watermarked. Card image links to a pre-filled signup that infers the city or domain.

### Loop 3: opener you can use anywhere

The Drop's suggested opener is copyable. If you use it in iMessage or LinkedIn DM and the recipient asks "where did you find me," the answer is Jumpstart. Organic word of mouth.

### Loop 4: drop screenshot, privacy-safe

A user can opt to share an anonymized drop ("this week Jumpstart matched me with 3 founders, here is one I am excited to meet") with the other person's permission. Permission prompt is built in.

### Loop 5: cohort badge

A small badge on a user's LinkedIn or website that links to their public limited card view (only their building summary and tags, no contact). One-click signup for any verified attendee.

### Loop 6: weekly post template

Founder writes a weekly LinkedIn post about who they met. Optional template provided. Drives discovery in YC-adjacent circles.

## 20. Privacy, trust, safety

Non-negotiables.

The product never displays an "official YC" claim. Every page footer contains "Unofficial attendee-built tool for Startup School participants. Not affiliated with Y Combinator."

No one sees a card before they verify. The Drop preview during onboarding uses anonymized examples.

Phone numbers are never shown. SMS is opt-in only and goes through a Twilio number, not the user's number.

Exact location is never shown. Only city.

Acceptance screenshots are deleted within 24 hours of verification. Only the trust tier is stored after that.

No public ranking. No popularity leaderboard. No "top founders this week."

Rate limits: 3 intro requests per founder per day, 10 per week. Hard ceiling.

Block and report: every user can block another user, which removes them from search, drops, and Browse. Reporting goes to Safety Classifier, then founder review for flagged cases.

Data deletion: full account delete in settings, all data purged within 7 days, intro records anonymized.

No scraping: signed image URLs that expire, rate-limited Browse, no public directory page.

Watermarks on shareable images include the user's id so leaks are traceable.

Per-card visibility: a user can pause their card so it is not shown in Browse or in others' Drops. They can still see incoming requests.

## 21. CohortOS (admin dashboard)

This is the YC-facing product. Designed to look like a clean ops dashboard, not a marketing page.

### Top-level metrics

Total verified attendees, countries, cities, SF-bound, India, remote.
Drops delivered this cycle, drops opened, intros requested, intros accepted.
Most active match types, most active cities, cross-region intros count.
Cohort sentiment (rolling 7-day average from feedback).

### Founder workspace

Daily digest from Cohort Analyst, latest 7 days.
Verification queue (only flagged cases).
Moderation queue.
Anomaly log.
Token spend (daily, weekly, monthly).
Agent eval pass rates.

### YC view (read-only export)

Public-safe metrics, no PII. Total numbers, geographic distribution, satisfaction score, testimonials with consent. Generates a PDF on demand.

## 22. YC handoff package

A clean asset designed to be sent to YC staff (Geoff, Dalton, Diana, others) when there is enough traction.

Contents:

- One-page summary: what we built, who uses it, traction numbers.
- Three months of cohort metrics (anonymized).
- Top 20 testimonials with attribution by user permission.
- The cohort graph as a visualization (anonymized clusters).
- Privacy and moderation summary (controls, abuse rate, time to action).
- Codebase summary: tech stack, deployment, ownership.
- Database schema diagram.
- Pilot and partnership proposal: official sponsorship, official rollout for SS 2027, full acquisition, or nothing. Three options laid out clearly.

The handoff is not a deck. It is a directory of artifacts that any YC partner can read in 15 minutes.

## 23. MVP scope (v1)

Ships in v1.

- Landing page
- Magic link signup with LinkedIn URL capture
- 4-step onboarding (identity, verification, intent interview, card review)
- Founder Card (auto-generated, editable)
- Drop home (3 matches per cycle)
- Match detail (why + opener + request)
- Intro request and accept (email-based contact unlock)
- Browse with tag filter (filter icon, no search bar in v1)
- You tab (card view, edit, settings)
- Email notifications (drop ready, intro request, intro accepted, weekly digest)
- Admin dashboard (CohortOS) for founder use
- Agent eval suite for matcher, explainer, classifier

Does not ship in v1. These can come back if v1 traction justifies.

- Pods
- Micro-meetups
- Event-day mode
- Relationship Map
- Follow-up tracker
- SMS or WhatsApp delivery
- Native mobile app
- In-app chat
- Calendar integration
- Public profile pages
- Followers, likes, leaderboards

## 24. Seven-day build plan

The product is shippable in 7 days. Here is the day-by-day cut.

### Day 1: scaffolding

Next.js app on Vercel. Supabase Postgres with pgvector. Magic link auth. .env with Anthropic key. .gitignore, README, CI green. Landing page placeholder live.

### Day 2: onboarding flow

All 4 onboarding steps wired to DB. Onboarding Interviewer agent live with first version of system prompt. Profile Synthesizer renders the card from interview output. Card preview screen functional.

### Day 3: matching skeleton

Nightly graph job that computes top-50 candidates per user with weighted score. Matchmaker agent picks 3 from the top-50 with diversity rules. Match Explainer writes the why for each match. Drop is rendered manually (no scheduled send yet).

### Day 4: match detail and request flow

Full match detail page. Request flow with optional note. Email notification on request, on accept, on decline. Contact unlock on accept (email exchange via Resend). Safety Classifier reads request notes before send.

### Day 5: Browse and You

Browse tab with tag filter (no full text search yet, just tag pills). Tag list seeded from cohort tags. Vector search behind the scenes for tag expansion. You tab with card edit and verification status.

### Day 6: agent evals and dashboards

Eval harness for Match Explainer (50 cases). Eval harness for Safety Classifier (50 cases). CohortOS internal dashboard (raw SQL behind a dashboard page). Cohort Analyst agent producing the daily digest.

### Day 7: launch readiness

End to end test sweep. Privacy checks (acceptance screenshot deletion job, signed URLs, rate limits). Footer disclaimer on every page. Final copy review. Soft launch to 50 hand-picked SS2026 attendees with a personal note.

## 25. Thirty-day traction plan

Goal: 1000 verified SS2026 attendees, 4 weekly drops sent, 30%+ drop open rate, 25%+ intro request rate, 50%+ intro accept rate, 65%+ meeting useful rate, written testimonial from at least 5 users.

### Week 1: seed

Hand-deliver invites to 50 users from the founder's network. Personal email + LinkedIn DM. Goal: 30 verified, 4 drops out by end of week 1, 1 testimonial.

### Week 2: referral expansion

Invited users get 3 referral codes each. Goal: 200 verified, weekly drop out, first viral loop active.

### Week 3: open public landing

Landing page goes live publicly. Tweet from founder, LinkedIn post, post in 1-2 SS-adjacent groups. Goal: 600 verified.

### Week 4: optimize

Look at drop open rate, request rate, accept rate by week. Tune Match Explainer prompts on the lowest-performing match types. Re-engage churned users. Goal: 1000 verified, 5 testimonials, drop quality up 1.4x from week 1.

## 26. Launch post

LinkedIn post (cleaned up by user before posting):

> I am building Jumpstart for the YC Startup School 2026 cohort.
>
> 8000 of the world's best young founders are about to be in the same cohort for three months. I want to actually meet the ones worth my time.
>
> Jumpstart is a small app that delivers three curated founder matches a week. The AI does the matchmaking. You get a one-line on why you should meet and a suggested opener. You request intro, they accept, you talk.
>
> No directory to scroll. No swiping. No followers. Just a weekly drop.
>
> If you got into SS 2026 and want to be on the early list, comment "in" or DM me. Founders only, verified, not affiliated with YC.

## 27. YC outreach message

Sent only after 1000 verified users and 30 days of metrics. Short.

> Geoff,
>
> I built a small attendee tool for SS 2026. 1000 verified founders signed up in 30 days, 67% drop open rate, 24% of intros end in a meeting marked "worth my time."
>
> If this is interesting, here is a 5-minute writeup with metrics, the privacy story, and three options for what could happen next: sponsorship, official rollout for SS 2027, or full handoff. No expectation, just sharing in case it is useful.
>
> [link to YC handoff page]
>
> Tejas

## 28. Design system direction

Minimal, founder-serious, mobile-first.

Colors:
- background: #FAFAF7 (warm off-white)
- surface: #FFFFFF (pure white for cards)
- text primary: #1A1A1A
- text secondary: #6B6B6B
- borders: #E8E6E1
- accent: #C45612 (a YC-adjacent burnt orange, used sparingly)
- accent-soft: #FFF7F0 (used for backgrounds of accent components)
- error: #C62828
- success: #2E7D32

Typography:
- system sans (Inter or similar) for body and UI
- weights 400 (body), 500 (UI), 600 (headings)
- 13-14px body, 12px secondary, 16-20px headings on mobile, scaled up on desktop

Spacing: 4 / 8 / 12 / 16 / 24 / 32 / 48 px. Cards typically 16px internal padding.

Radius: 8px for inputs, 12px for cards, 999px for pills.

Shadows: sparingly. Only on cards on hover and on modals.

Components needed in v1:
- TextInput
- TagPill (on/off)
- FounderCard (small, large, preview)
- MatchCard (shown in Drop)
- MatchDetail (full screen)
- IntroRequestSheet
- FilterIcon + FilterPanel
- BottomNav (3 items)
- ProgressBar (onboarding)
- Avatar
- EmptyState
- ToastNotification
- VerificationBadge

## 29. Edge cases and abuse cases

Concrete cases the system must handle.

A user signs up, fakes acceptance, gets verified, sends 200 intros to attractive-looking founders. Detection: rate limit, then Safety Classifier pattern match on intro notes.

A user reports another user with no real reason. Detection: Safety Classifier reads the report against the user's history. Repeated false reports degrade the reporter's own trust score.

A user changes their card every day to game matching. Detection: card edits per week threshold. After 5+ edits per week, slow down match recompute.

A user requests intro, gets accepted, never replies. Detection: meeting feedback prompt at 48 hours. If pattern of no-shows, drop request limit.

A user posts their Drop screenshot publicly without other party consent. Mitigation: built-in screenshot blocker on iOS for sensitive views, watermarks, terms of service violation flow.

A user submits a long racist screed in their card. Detection: Safety Classifier on every card field. Block at submit.

A user is the wrong person (looks like an SS attendee but is not). Detection: tiered verification, peer vouching, founder review on classifier flags.

A user from outside the cohort signs up via referral chain. Detection: referrals can only chain 2 deep, beyond that requires manual review.

A user mass-saves cards then signs up to a competitor product. Mitigation: rate limit Browse, no card export, watermarks.

A user is being harassed via intro requests. Mitigation: block and report flow, classifier reads every intro note, repeat offenders banned.

## 30. Open questions before build

Not blockers, but worth deciding before day 1.

Are you (Tejas) personally accepted to YC SS 2026? If yes, the launch positioning is "I built this for our cohort." If not, it is "I built this for you." Both work, but they shape copy and outreach.

Should the first 50 invitees come exclusively from technical hardtech founders (your circle) or be diversified across domains and cities for cohort credibility? Recommendation: diversified, otherwise the early matching will overfit to one shape.

Do you want to ship a version where only verified attendees can sign up at all (strict gate), or let people in with a placeholder card and unlock full visibility after verification (soft gate)? Recommendation: soft gate, as long as unverified users can only see the Drop preview, not Browse.

Email-only delivery for v1, or email plus a lightweight web push? Recommendation: email-only for v1. Web push adds complexity and only helps the daily-active sliver.

Should Drop cycle be Wednesday morning (Ditto-style ritual) or rolling per user (each user's drop arrives 7 days after their last one)? Recommendation: Wednesday morning, cohort-wide. The synchronized ritual is the social signal.

Pricing: free forever, free for SS attendees and paid post-cohort, or free with future paid premium tier? Recommendation: free forever during SS 2026. Decide pricing only if YC engages or if you want to extend post-event.

Is the founder okay with daily founder operations (verification queue, moderation review, weekly metric review) for the first 30 days? This is the part that does not delegate to agents in week 1. Recommendation: yes, time-box to 1 hour per day, automate everything that takes more.

## 31. Metrics

Six categories. Each with specific targets for the first 30 days.

### User outcome metrics

- Drop open rate: target 60%+ by week 4
- Intro request rate per match: target 25%+
- Intro accept rate: target 40%+
- Meeting confirmed rate among accepted intros: target 60%+
- Meeting useful rate (worth my time): target 65%+

### Speed metrics

- Time to first drop after signup: target under 7 days (next Wednesday)
- Time to verification: target under 24 hours
- Time to intro accept after request: target under 48 hours
- Onboarding completion time: target under 5 minutes

### Quality metrics

- Match "not relevant" rate: target under 10%
- Match Explainer pass rate against eval suite: target 95%+
- Match explanation skip-within-5-seconds rate: target under 15%
- Card edit rate after generation: target under 30%

### Learning loop metrics

- Drop personalization lift week 1 to week 3: target 1.4x request rate
- Match types diversity per drop: target 2+ distinct types per drop
- Cohort graph staleness: target under 24 hours between recomputes

### Automation metrics

- Founder hours per day on operations: target under 1 hour after week 2
- Manual review rate of Safety Classifier decisions: target under 5%
- Agent eval pass rate maintained week over week: target 95%+

### Cost / token efficiency

- Cost per active user per week: target under $0.50
- Cost per match generated: target under $0.10
- Cost per intro accepted: target under $0.50
- Total weekly burn at 1000 users: target under $500

## 32. Failure modes and fixes

Where this can become fake AI, wrapper slop, dashboard bloat, process theater, or agent chaos. Honest list with fixes.

### Fake AI

If the matching is just tag intersection plus a generic LLM template, this becomes a wrapper. Fix: every match must have a unique reasoning trace, every explanation must reference at least one detail from the other card, the Match Explainer eval suite enforces specificity, drops with too-similar explanations get flagged.

### Wrapper slop

If the agent layer is just rephrasing card text into "you both...," it adds nothing. Fix: agents must produce structured output that downstream agents consume, not just human-facing prose. Matchmaker output is a JSON of (candidate_id, match_type, reasoning_trace_id), not a paragraph.

### Dashboard bloat

If we ship 30 metrics nobody reads, ops drowns. Fix: the dashboard has a maximum of 12 numbers on the main page, the rest are query-only. The daily digest is 200 words. Anything more gets cut.

### Process theater

If we have 4 agents that all call each other but the user-facing output is no better, we are play-acting AI. Fix: every agent has an A/B baseline (the simplest non-agent version) and must beat it on its eval suite to stay in the system. Agents that do not beat baseline are removed.

### Agent chaos

If agents produce contradictory output, the user trusts none. Fix: every agent has explicit I/O contracts. Downstream agents validate upstream output. A bad output from Matchmaker fails the contract and triggers a regenerate, not a half-baked drop.

### Personalization echo chamber

If Feedback Learner overfits to early signals, users get matched only to people similar to people they already met. Fix: hard diversity constraint, 1 of 3 matches must be outside the user's taste cluster.

### Cold reciprocity collapse

If 5% of users get 80% of intro requests and ignore them, the rest churn. Fix: per-user request cap, request weighting based on response history, gentle soft-decline UI on the receiver side ("not now, save for later").

### YC ignores it

If the product gets traction but YC does not engage, this is fine for v1 (it is still useful for the cohort). For v2 we revisit. Do not optimize for YC at the expense of users.

## 33. Final build plan, five phases

Phases map to the time horizon. Phase 1 ships in 7 days. Phase 5 ships when traction justifies.

### Phase 1, prototype (week 1)

Goal: a single user can complete onboarding, get a drop, request intro, get accepted.

Deliverables:
- Next.js app deployed
- Magic link auth
- 4-step onboarding with Onboarding Interviewer agent
- Founder Card creation with Profile Synthesizer
- Top-50 candidate ranking job (cron)
- Matchmaker + Match Explainer + Opener Drafter agents
- Drop home, Match detail, Request flow, Browse, You
- Email notifications
- Manual founder approval before each drop sends

Success: 5 hand-picked users complete the full loop, founder reviews every drop, qualitative quality bar met.

### Phase 2, closed loop system (week 2 to 3)

Goal: the system learns from user behavior without manual intervention.

Deliverables:
- Drop send automation (Wednesday 9am cron)
- Feedback Learner agent updating taste profiles nightly
- Eval suites: Match Explainer (50 cases), Safety Classifier (50 cases), Onboarding Interviewer (20 cases)
- Match quality regression tests on every change
- Anomaly detection on drop performance

Success: 100 active users, drop personalization measurably improving, founder hours per day under 1.

### Phase 3, agentic workflows (week 4 to 5)

Goal: every operational job runs on agents, founder is a reviewer not an operator.

Deliverables:
- Safety Classifier in production for intro notes, reports, signups
- Cohort Analyst producing daily digest and weekly markdown report
- Re-engagement agent for churned users
- Profile Synthesizer auto-rewriting adjacent fields on big card changes
- Agent log reading and replay tooling

Success: founder ops time under 30 min/day, T&S response time under 4 hours, churn re-engagement rate 15%+.

### Phase 4, dashboard and memory layer (week 6 to 8)

Goal: the system is fully legible. Anyone (founder, future hire, YC) can understand what happened and why.

Deliverables:
- CohortOS internal dashboard with all metrics
- YC handoff page with public-safe metrics
- Full agent_logs table with replay tooling
- Weekly cohort report committed to repo as markdown
- Per-user reasoning timeline (what the system did for them and why)

Success: full traceability, YC handoff package ready to send, founder can answer "why did this match happen" for any pair.

### Phase 5, scale and automation (post-launch, ongoing)

Goal: scale to full SS 2026 cohort (8000 users) without adding humans.

Deliverables:
- Token cost monitoring and alerting
- Sharded Matchmaker for large candidate pools
- Multi-language support if international cohort needs it
- Automated re-onboarding for re-activated users
- A/B testing framework for prompts and scoring weights

Success: 1000+ active users on weekly drops, founder ops time under 2 hours per week, system runs unattended for full weekends.

---

## Appendix A: copy library

Exact strings to use across the app.

Headlines:
> YC Startup School brings the world's best young builders into one cohort. Jumpstart helps them find each other.

Sub:
> Join the unofficial global attendee graph for Startup School 2026. Get curated founder matches every week.

CTA:
> Get my Founder Drop

Drop empty state:
> Your next drop arrives Wednesday at 9am. We are matching the cohort against your card now.

Drop ready notification (email):
> Your Founder Drop is ready. Three founders worth meeting, picked for you.

Match request to recipient:
> [Sender name] wants to meet you. We recommended you because [reason].

Intro accepted, contact unlocked:
> [Recipient name] accepted. Here is their email and a calendar link.

Verification pending:
> You have provisional access. Full visibility unlocks after we review your acceptance proof. Usually under 24 hours.

Disclaimer (footer, every page):
> Unofficial attendee-built tool for Startup School participants. Not affiliated with Y Combinator.

Privacy reassurance (after signup):
> Only verified attendees see your card. We never show your phone number, never display exact location, and delete your acceptance proof within 24 hours.

Block confirmation:
> [Name] is blocked. They will not appear in your Drops, Browse, or be able to request intros.

Report submitted:
> Thanks. We review every report within 4 hours. We will email you with the action taken.

Founder Card example (Tejas):
> Tejas N.
> Seattle, going to SF
>
> Building plasmax. Autonomous R&D systems and agentic engineering tools.
>
> Looking for hardtech founders, AI infra builders, India manufacturing people, cracked undergrad founders.
>
> Can help with hardware prototyping, plasma reactors, agent systems, YC application review.
>
> Talk to me if you build weird things fast and hate generic startup advice.

Match explanation example:
> Maya is building eval infrastructure for AI agents from the enterprise reliability angle. You are building autonomous R&D and agent systems from the research angle. Worth comparing how you each think about trust and evaluation in agentic systems.

Opener example:
> "Saw your work on agent evals. I am building autonomous R&D agents and we are running into the trust question from the opposite side. 30 min to compare notes?"

## Appendix B: tech stack

The stack is chosen for one reason: a single founder can ship the whole thing with Claude Code in 7 days.

- Next.js 15 app router on Vercel
- Supabase Postgres with pgvector
- Magic link auth (Supabase Auth or Clerk)
- Anthropic Claude 4.6 Sonnet for agents
- Resend for email
- Twilio for SMS (post-v1)
- PostHog for analytics
- Vercel AI SDK for streaming agent UI
- Tailwind CSS + shadcn/ui base components
- Sentry for error monitoring
- GitHub Actions for CI
- Playwright for e2e tests

This stack has zero infra to maintain, scales to thousands without rework, and every layer has well-known patterns Claude Code can implement.

## Appendix C: not in this spec, parking lot

Captured here so they are not forgotten when v2 is considered.

- Pods (persistent groups, city / domain / intent)
- Micro-meetups (one-off events, partiful-style)
- Event-day mode (geo-aware, "90 min before next session")
- Relationship Map (post-event memory layer)
- Follow-up tracker (dedicated UI for accepted intros not yet met)
- Async / global-first delivery layer (WhatsApp for India)
- Native iOS app
- In-app chat
- Calendar API integration
- Public profile pages with permissioned visibility
- Founder Drops as iMessage native (Apple Messages for Business)
- Per-user shareable city pod public pages
- Cohort-wide live event coordination

---

End of spec.
