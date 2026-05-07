# Jumpstart launch playbook

This file is the canonical reference for shipping Jumpstart to the closed
beta of 10 (and beyond). Saved here so any future session can `Read` it
and pick up the exact sequencing without rederiving from chat.

**Source of truth for product spec:** `docs/superpowers/specs/2026-05-05-jumpstart-design.md`
(with the correction banner reflecting the 2-day in-person event reality).
**Source of truth for project conventions:** `CLAUDE.md`.

---

## Pre-launch checklist (do these before sharing the link)

These five items take about 30 minutes total. Do them in order. Do not
skip 1; the rest assume you've actually walked the funnel yourself.

1. **Resilience-test the full flow yourself end-to-end.** Open the
   tunnel URL in a private browser window. Walk through:
   `signup → identity → verification → intent → card → drop →
   match detail → request intro → /you → share-my-pass → /pass/me as
   recipient → /browse with search + tag filter`.
   Capture a screenshot of anything that feels janky. Easier to find
   one bug now than to hear it from 10 friends later.

2. **Set the share copy you'll DM.** Don't write "check this out,
   working on something" — that gets ignored. Use:

   > "I built an unofficial pre-event matchmaker for our SS cohort.
   > Picks 3 founders worth meeting per week, has an opener half-written
   > so you don't have to. Wanted to test with you first. <link>.
   > Takes 90 seconds to fill out."

   The "wanted to test with you first" framing converts much higher
   than a generic launch.

3. **Have a way to receive feedback fast.** Telegram group, group chat,
   anything async. After they sign up, ask one specific question:
   "Did the first match feel useful?" That's the single signal that
   matters and it tells you whether the matchmaker is working.

4. **Write down what you'll change between week 1 and week 2.** Don't
   iterate on day-1 vibes. Pick one metric (probably "matches marked
   useful") and let it accumulate over 7 days before you adjust the
   matchmaker prompt.

5. **Copy the tunnel URL into a stable place.** The cloudflared quick-
   tunnel URL rotates if cloudflared restarts. For sharing with friends,
   paste the URL into a Notion / Google Doc / pinned message that you
   can update if it changes. Friends bookmark URLs; you don't want them
   landing on a dead one mid-week.

---

## Don'ts (day-one anti-patterns)

- **Don't post on X or LinkedIn.** The trust thesis collapses on day
  one if randos sign up. Friends in SS first, for at least 4 weeks. The
  X launch comes later, sharper, with testimonials and metrics.
- **Don't try to wire real Supabase or Anthropic before your first 10
  friends have used the app.** Stub-mode is faster to iterate on.
  Hand-watch every drop. Once you hit ~50, wire the real services.
- **Don't spend the morning building auto-schedule before you've shipped
  the link to a single friend.** The link sitting unsent for 3 days
  while you build features is the actual failure mode. Build features
  in response to friend feedback, not in anticipation of it.
- **Don't ship to YC's official channels (Bookface, Slack groups) yet.**
  Codex flagged this in the autoplan: hitting visibility before product-
  market fit triggers YC to build the official version themselves.
- **In-app messaging via the Inbox surface (founder reversed the prior
  no-DMs stance).** Original concern: DM apps become chat apps and the
  meeting rate plummets. New design keeps that risk contained: requests
  land in `/inbox` under "Requests"; only after both sides accept does
  a thread open. The surface is intentionally Instagram-DM-shaped (low
  latency, simple compose, scroll log) rather than a full chat app
  (no group threads, no read receipts, no presence). Email forwarding
  is gone — the meeting rate metric still rules. If it dips below the
  threshold post-launch, revisit the structured intro + auto-schedule
  fallback.

---

## Distribution sequence (week-by-week)

Friends → referrals → manual outreach → public, in that exact order.
Don't skip any step.

| Week | Cohort size | Action |
|------|-------------|--------|
| 1 (today) | 10 | DM your 10 closest friends in SS. Use the share copy from item 2 above. Watch every drop. Hand-correct anything that looks off. Reach out to each personally for one piece of feedback. |
| 2 | 30-50 | Each of those 10 shares their `/pass/[their_id]` URL with 3-4 SS attendees they personally know. The Share-my-Pass button is built for exactly this. Start tuning the Matchmaker based on the "useful / not useful" feedback. |
| 3-4 | 50-100 | All referrals. Review the data. Decide whether to wire real Anthropic / Supabase for the scaling tier. |
| 5 | 100-150 | Selective LinkedIn DMs to specific SS attendees you don't know personally. Each DM is hand-crafted, links to your `/pass/me`. Maximum 30/week. |
| 8 | 200+ | Public X post with testimonials and real metrics. Story, not request. By now you have product-market fit and the X launch is pull, not push. |
| ongoing | scaling | YC outreach trigger (per the corrected metrics): 30-50 high-signal verified attendees + 20 meetings scheduled at the event + 10 marked useful + 3 testimonials. Not 1000 raw signups. |

---

## Known-stub-and-fine for closed-beta-of-10

These are intentional stubs that work for 10 friends but need to be wired
before scaling further. Don't let any of them block the launch.

- **No real Supabase / Anthropic / Resend.** Three flags
  (`JUMPSTART_PRIVATE_BETA=1`, `JUMPSTART_ALLOW_STUB=1`, `JUMPSTART_DEV_ADMIN=1`)
  opt the app into stub-mode running locally. Friends see `DEFAULT_ME`
  until they fill out their own onboarding, which writes to localStorage
  on their browser. Fine for 10 friends. Wire real services at ~50.
- **Drops generated locally, not by Claude.** `generateLocalDrop()`
  runs the heuristic matchmaker without an API call. Output is
  deterministic, fast, and good enough for friends to see the flow.
  Once you have feedback on what good matches look like, swap to the
  Claude-backed Matchmaker.
- **Manual matching is the right move for week 1.** Watch every drop.
  Hand-correct the next round if two friends shouldn't have matched.
  This tells you what the prompt should do.
- **`/api/cron/retention` returns 503 by design** until the screenshot
  deletion job is wired. Honest 503 keeps monitors fail-loudly instead
  of lying-green.
- **No auto-schedule on accept yet.** Deferred. Build it after feedback
  from the first 10 confirms accepted intros are dying at the
  scheduling step (which they will).
- **No PostHog / Sentry wiring yet.** The env vars are present in
  `.env.example`; the deps aren't installed. Wire when you want a real
  analytics + error-tracking dashboard. Not needed for 10 friends.

---

## Tunnel URL handling

The current tunnel URL is whatever cloudflared spit out most recently.
Quick tunnels (`*.trycloudflare.com`) are ephemeral; if cloudflared
restarts, the URL rotates. To start a fresh tunnel:

```bash
'/c/Program Files (x86)/cloudflared/cloudflared.exe' tunnel --url http://localhost:3030
```

The new URL appears in the cloudflared output as `https://*.trycloudflare.com`.
Update the share location (Notion / pinned message) when it rotates.

For a stable URL, set up a named cloudflared tunnel with a custom domain
(`jumpstart.dev` or similar) before week 3 of the rollout.

---

## Server start command (for restarts)

```bash
JUMPSTART_PRIVATE_BETA=1 JUMPSTART_ALLOW_STUB=1 JUMPSTART_DEV_ADMIN=1 bun run start
```

The three opt-in flags authorize the in-memory rate-limit fallback,
stub-mode auth, and dev-admin bypass — only valid for tunneled private
beta. Never use these flags for a real public launch.

---

## What's deferred (post-MVP brainstorm)

Twelve features queued, ordered by leverage-per-effort. First six are
realistic for the 8-week pre-event window after MVP; rest are post-event
or v1.5+.

1. Auto-schedule on accept (the next thing to build)
2. Cohort calendar view at `/calendar`
3. Drop history with marked-useful feedback loop
4. Group intros (3-person calls)
5. Pre-event prep emails (24h before each meeting)
6. `/squad` AI-clustered subgroups
7. SS event-day mode (live "who's nearby")
8. Post-event follow-up automation
9. Cohort Analyst weekly digest
10. Peer-vouching verification
11. `/alumni` mode for SS 2025 + earlier
12. `/collab` async project board
