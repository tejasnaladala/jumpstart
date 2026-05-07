# iMessage / ditto.ai onboarding integration: should we?

> Decision doc for the closed-beta-of-10 launch. The user asked whether Jumpstart
> should use iMessage (via ditto.ai or similar bridges) as a primary onboarding
> or messaging channel, the same way some 2024-2026 social apps lean on it for
> friction-free signup.

## TL;DR

**No** for v1. **Maybe** for v1.5+ as a one-shot reminder channel.

The single thing iMessage is great at, we already have via the Web Share API
(`navigator.share`) - the user taps Share, picks Messages from the native
sheet, and the recipient sees a link with the sender's name in the OG preview.
That covers the manual-invite flow without any compliance, ToS, or pricing
exposure.

Going further (programmatic iMessage sends, automated drops via blue bubbles,
in-thread match flows) trades structured product mechanics for the worst
chat-app failure mode: founders text instead of meet. We've already chosen
that hill - the deferred-features doc lists "no in-app DMs" as a hard rule
because every networking app that adds them becomes a chat app and the
meeting rate collapses. iMessage as a primary surface is in-app DMs by a
different name.

## Where ditto.ai sits

ditto.ai (and similar bridges: SendBlue, LoopMessage, Messenger Cloud API for
business messaging) are services that send/receive iMessage on your behalf.
They sit on Apple's relay infrastructure or, more commonly, run a fleet of
Mac mini servers signed into iCloud accounts that fan out blue-bubble
messages programmatically. Pricing usually $0.01–$0.05 per message at low
volumes, with rate limits enforced by Apple-side anti-spam.

What you can plausibly do:
- Send a drop notification ("Mon drop is live: 3 people worth meeting") as
  a blue bubble.
- Receive replies and parse them ("yes" / "skip" / "useful").
- Bridge an OTP for passwordless signup so a founder doesn't have to leave
  their thread.
- Send a calendar link the moment two people accept an intro.

What you can't plausibly do (or shouldn't):
- Mass-send unsolicited messages - Apple shadow-bans the iCloud account
  within hours.
- Send to non-iPhone users (the SS cohort has a real Android contingent,
  especially the India and Latam founders).
- Treat it as a real database - iMessage threads are write-once, the bridge
  caches state but loses fidelity.

## Why not, for v1

### 1. The product is structured. Chat is not.

Jumpstart's whole pitch is: 3 founders worth meeting per week, an opener
half-written, and a one-tap intro request that lands as an email. The flow
is six taps long. Switching the surface to a chat thread reintroduces
exactly the friction the email digest was designed to remove - now the
recipient has to read a paragraph, decide whether to click, decide whether
to reply, and still has to hop out of thread to schedule.

The deferred-features doc names this: **"Every networking app that adds
DMs becomes a chat app, scheduling never happens, and the meeting rate
plummets."** iMessage as the primary surface IS adding DMs.

### 2. ToS and account-suspension risk

Apple's Business Chat is the only sanctioned API for programmatic iMessage,
and it requires a registered business agent, a verified business phone
number, and customer-initiated conversations only (the customer has to
message you first, you can't cold-send). Bridge services like ditto operate
outside that lane - they sign into iCloud accounts and automate the Messages
app on Mac minis. Apple periodically purges those accounts. Building the
funnel on infrastructure that can vanish on a Tuesday is fragile for a
2,000-attendee cohort.

For a 10-friend closed beta, this is in the noise. For a 200-attendee scale-
up two months later, you'd be one Apple sweep from a dead messaging surface.

### 3. Cross-platform reality

The SS 2026 cohort is global. India and Latam founders are disproportionately
on Android. The current rough estimate from publicly visible cohort
distributions: 65–70% iPhone, 30–35% Android. iMessage as primary onboarding
penalizes the Android third with a worse experience or drops them entirely.

Email + the web app is platform-agnostic. SMS-as-fallback is messy. Pick the
neutral channel.

### 4. Privacy and trust thesis

The pitch is "built by an attendee, for the cohort." That trust collapses
the moment a founder hands over their phone number to a third-party
messaging provider so Jumpstart can blue-bubble them. Email + magic link is
boring and works.

### 5. We already get the share-flow benefit for free

The Founder Pass share flow uses `navigator.share` on mobile. On iPhone, the
share sheet defaults to Messages. The recipient sees:

> Tejas sent you a Founder Pass via Jumpstart.
> [tejas.dev/pass/u_me]

Native iMessage URL preview (which we now drive with `generateMetadata`
exporting per-user OG tags) handles the rest. Zero additional integration.

### 6. The deferred-features list has better leverage

iMessage's effort budget is roughly the same as auto-schedule-on-accept
(deferred feature #1) or cohort calendar view (#2). Auto-schedule directly
moves the meeting rate. iMessage moves notification opens. Meetings, not
notification opens, are the real metric.

## Where iMessage might earn its keep, later

If at scaling-tier (~200+ verified) we see a specific failure mode, iMessage
can be a targeted patch:

1. **24h-before-meeting reminders.** "Tomorrow 3pm with Priya at Blue
   Bottle, 27th & Mission." Single transactional message, customer has
   already scheduled (which makes it Business-Chat-eligible).

2. **In-event "your person is in the building" pings.** Day-of, July 25-26
   at Chase Center: "Priya just walked into the keynote room, she's at row
   12 wearing the green hoodie." Right place, right time, pull instead of
   push.

3. **Post-event one-shot recap.** "Here's everyone you met yesterday and
   their contact info. Reply USEFUL with a number 1-3 to score each."

These are reminder/recap surfaces, not the primary product. They sit on top
of the structured flow rather than replacing it. They'd run on ditto or
SendBlue in transactional mode where the customer initiated the relationship
and Apple's anti-spam tolerance is highest.

## Verdict

**v1 (this week, the 10-friend launch):** Web Share API → native iMessage
share sheet for manual invites. Email digest for drops + intro accepts.
Keep email magic-link auth. Skip the bridge.

**v1.1–1.4 (weeks 2–8):** Watch for one specific friction point that
iMessage genuinely solves better than email. If the answer is "people miss
the 24h-before reminder," wire SendBlue or ditto for that single
transactional message.

**v1.5+ (post-event):** Day-of and post-event reminder surface, only if the
data shows people miss the right moment.

Don't put iMessage on the critical path during closed beta. The infra is
ToS-fragile, the cross-platform story is bad, and the structured-vs-chat
tradeoff is exactly the failure mode we already named.
