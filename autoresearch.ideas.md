# Autoresearch Ideas Backlog

Candidate refinements / additions / removals / critiques to evaluate. Sorted by my prior on impact (highest first). Pull from the top of the list each iteration.

## Spec coherence

- [ ] **Re-examine cofounder positioning vs YC Cofounder Matching.** The spec says "not competing with YC Cofounder Matching" but cofounder is one of the listed match types. Could weaken positioning. Test whether tightening the phrase or removing cofounder match type entirely helps.
- [ ] **Brutal critique: Bookface comparison.** YC alumni already have Bookface. Why is Jumpstart different even for non-alumni? Sharpen the differentiation.
- [ ] **Drop format experiment.** 3 people might be wrong. Test the case for 1 high-signal match per drop (closer to Ditto) vs 5 (more chances).
- [ ] **Cadence revisit.** We locked Wednesday + Event mode but didn't reconsider after locking the 3-tab MVP. Verify event-mode survives the simplification.
- [ ] **Compress sections that overlap.** Sections 5 (JTBD), 6 (AI-OS model), and 7 (workflows) repeat themselves. Compress without losing meaning.

## Feature additions

- [ ] **Add: weekly check-in nudge.** "Did you talk to anyone this week?" Closes a feedback loop the spec hand-waves.
- [ ] **Add: AI-suggested follow-up topics.** After accept, AI proposes a conversation hook based on both cards.
- [ ] **Add: founder check-ins via SMS/email.** Async re-engagement layer.
- [ ] **Add: "I'm looking to meet" share card.** Section 19 mentions this but it isn't speced. Either spec it or cut it.
- [ ] **Add: micro-events emerge from match patterns.** If 5 founders all want to meet on a topic, system suggests they meet together. Not a Pod, just a single emergent event. May or may not justify reintroducing pods later.

## Feature subtractions

- [ ] **Cut: Browse tab.** Could the product be even simpler? Just Drop + You? Test if Browse meaningfully adds or just feels safer.
- [ ] **Cut: Suggested Opener.** Is this redundant with the Match Explainer? Could be.
- [ ] **Cut: Contact unlock.** Just send the email immediately on accept. Removing the unlock step removes a state.
- [ ] **Cut: Match explanation length to one sentence.** The "two to three sentences" framing might be too much.

## Edge cases / abuse

- [ ] **Duplicate the abuse case for "high-status founder gets 100 requests".** Spec mentions reciprocity gap but doesn't model it.
- [ ] **Verification appeal flow.** What if someone is wrongly rejected by the Safety Classifier?
- [ ] **Founder leaves the cohort.** If Jumpstart becomes essential, what happens after SS ends?
- [ ] **Founder Card pause.** Spec mentions but doesn't fully spec.

## AI-OS coherence

- [ ] **Make Cohort Analyst output a single live page.** Not just a daily digest but a continuously-updating internal status page.
- [ ] **Lock Match Explainer specificity check formally.** The check is mentioned but not turned into an eval.
- [ ] **Define the agent invocation budget.** Token-max strategy mentions costs but doesn't enforce a budget per drop.

## Critiques

- [ ] **Why now defensible.** SS 2026 ends. Then what? Either accept it as a 3-month tool (fine, sharpen this) or have a credible v2 plan.
- [ ] **YC indifference fallback.** Spec acknowledges this but doesn't have a plan if YC says nothing for 90 days.
- [ ] **Privacy compliance.** Holding acceptance screenshots even briefly is GDPR/CCPA risk. Test whether referral-only verification cuts this risk.
- [ ] **Localization.** Spec assumes English. India cohort attendees may want Hindi. Out of scope for v1, but document.

## Founder voice

- [ ] **Write a "what this is not" paragraph in plain founder voice.** The current section 2 is OK but could be sharper.
- [ ] **Make sure "Jumpstart" name has no trademark conflict.** Name is high-risk.
- [ ] **The launch post copy.** Section 26 has it but is it actually shareable?

## Token-max economics

- [ ] **Cost per drop sanity check.** $0.15/drop is plausible but not derived. Test with realistic prompt + completion sizes.
- [ ] **Embeddings cost.** Spec doesn't model embeddings. 8000 founders embedded once + nightly rerank could be material.
