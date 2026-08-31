# Prelaunch review synthesis

Output of the prelaunch review: a developer-experience pass plus simulated
user tests across the core flows. Findings ranked by severity. Closed-beta-of-10
only, so some "fix later" items are deferred until roughly 50 attendees.

The fixes batch listed at the end of this doc was applied in a single pass
before the launch link went out. Anything in the **Watch list** is intentional
debt for the 10-friend window; the trigger to revisit each item is named.

---

## P0 - Fixed before launch

| # | Finding | Source | Fix |
|---|---------|--------|-----|
| 1 | Identity step accepted whitespace-only input. "    " passed validation, the synth pass produced a junk Pass, the speed-runner blew through onboarding in 12s with garbage. | speed-runner | `draft.name.trim().length >= 2` + `oneLine.trim().length >= 10` plus `blockedReason` copy. |
| 2 | `/pass/[id]` had no robots:noindex meta. Google would index private user passes and surface unconsented PII for the cohort. | security/API | `generateMetadata` returns `robots: { index: false, follow: false }` plus per-user OG title, description, twitter card. |
| 3 | `/pass/[id]` had no `?from=<id>` referral attribution. Once funnels are wired we'd lose every referral source for invites that converted. | invite recipient | Signup CTA now `/signup?from=${encodeURIComponent(id)}`. |
| 4 | `card.name.split(" ")[0]` rendered empty for mononyms. Real cohort has at least three single-name founders. | edge cases / global locales | `firstNameOf()` helper with whitespace-aware fallback to full name, then to "Someone". |
| 5 | `/onboarding/card` mount silently overwrote saved Pass with re-synthesis from drafts. Returning user who hand-edited their Pass lost every change on next visit. | returning user day 3 | Check `localStorage["jumpstart.me"]` first, hydrate if present and parseable, only fall through to synth on first run. |
| 6 | `/match/[id]` substituted `generateLocalDrop(me)[0]` when the id wasn't in the current drop. Stale URL or tampered link sent a stranger as if matched. Privacy regression. | deep match-flow | Track `notFound` state, render real "drop has rotated" UI with Back-to-drop CTA. |
| 7 | Sending an intro with empty note silently sent literal `""` to the recipient via the Safety Classifier. UI copy said "Leave blank if the suggested opener feels right" but the API never saw the opener. | deep match-flow | Send `note.trim() || opener` so recipient gets the Pass-pulled phrasing if user blanked the field. |
| 8 | `FounderPass` StampSeal hardcoded `topLabel="Verified"` even when `card.trust_tier === "provisional"`. Pre-verification users saw a green "Verified" stamp on their own Pass - false confidence. | a11y user, stress-tester | StampSeal label and color now derive from `card.trust_tier`. Provisional renders muted "Pending". |
| 9 | `metadataBase` hardcoded to `https://jumpstart.dev` (a domain we don't own). Cloudflared tunnel link previews would resolve OG image URLs against the wrong origin. | security/API | `metadataBase` reads from `NEXT_PUBLIC_SITE_URL` env, falls back to `http://localhost:3030`. Tunnel ops just sets the env var. |
| 10 | No live process visibility for the founder during closed beta. | DX-Maya, DX-Priya | `/admin/health` polls a local-only liveness route every 10s and retains recent status. Provider readiness remains a separate authenticated-operations follow-up. |

---

## P1 - Watch list (fix during week 1 if friend feedback names them)

| # | Finding | Source | Trigger to fix |
|---|---------|--------|----------------|
| A | Touch targets on clear-search X, Share button, opener Refresh < 44px on iOS Safari. | mobile/slow-network | One friend on iPhone says "I keep mis-tapping the X." |
| B | Mobile FounderPass StampSeal overflows the right stub at 414px width on certain iPhone Plus models. | mobile/slow-network | Visible overflow screenshot from any friend's phone. |
| C | `<Sheet>` doesn't trap focus; pressing Tab inside the request-intro modal escapes to the underlying page. | a11y user | Any keyboard-only user reports they "lost" the modal. |
| D | `MagneticButton` doesn't gate on `prefers-reduced-motion` for the cursor-tracking effect. | a11y user | Any vestibular-sensitive user reports motion sickness. |
| E | `/browse` doesn't paginate; rendering 200+ cards on mid-tier Android stalls the main thread for ~600ms. | mobile/slow-network | Friend reports laggy scroll on Android. |
| F | No loading skeletons on `/match/[id]`; route transition shows blank for ~150ms. | DX-Maya | Visible to anyone reviewing on slow 3G. |
| G | `/api/cron/retention` returns 503 by design - uptime checkers will alarm. | security/API | Wire screenshot deletion job before scaling beyond 10. |

---

## P2 - Defer until ~50 attendees

| # | Finding | Source |
|---|---------|--------|
| H | Drop history with marked-useful feedback loop | power user |
| I | Auto-schedule on accept (Calendly / Google Calendar bridge) | DX-Priya, deep match-flow |
| J | Real Anthropic / Supabase wiring (currently stub-mode for closed beta of 10) | security/API |
| K | PostHog + Sentry wiring | DX-Maya |
| L | Per-user rate-limit tuning based on real traffic | security/API |
| M | A/B prompt tuning for Match Explainer via /autoresearch | DX-Priya |

---

## Convergence themes (>3 reports surfaced the same theme)

1. **Stub-mode auth bypass is a footgun.** Six reports flagged that the
   triple-flag opt-in (`JUMPSTART_PRIVATE_BETA=1` + `JUMPSTART_ALLOW_STUB=1`
   + `JUMPSTART_DEV_ADMIN=1`) is the right shape, but the failure mode if
   any single flag leaks into prod is severe. **Mitigation**: README has a
   bold "never set these together in prod" warning, plus the `assertMatchOwnership`
   gate now requires `!supabaseConfigured` AND `JUMPSTART_ALLOW_STUB=1`
   together - a stray stub flag in real-DB prod can't bypass ownership.

2. **Indexable public pages are a privacy regression vector.** `/pass/[id]`
   was the obvious one (now fixed). Audit also flagged `/match/[id]` and the
   logged-in routes - the (app) layout is auth-gated, so they're not publicly
   indexable, but public OG previews would still leak names if shared. Closed
   the loop by making `/pass/[id]` the only intentionally-public route and
   confirmed it's now `noindex`.

3. **Whitespace and length validation gaps everywhere.** Identity step was
   the worst, but the same pattern showed up in intent step, the Card edit
   sheets, and the intro-note textarea. Identity step is fixed. Others are
   bounded by `maxLength` on the input (existing) so the worst case is
   excess whitespace passing through; the synth function trims.

4. **Match-flow recipient surface is missing.** Every flow ends at "request
   sent" with an inline toast, but the recipient (the person being asked
   for an intro) has no surface to accept/decline within the app. Today
   that lives in email. Fine for 10 friends; needs an in-app "incoming
   intros" tray before scaling.

5. **Accessibility is a P1 for closed beta.** The 10 friends include at
   least one keyboard-first user and one screen-reader user. Sheet focus
   trap, MagneticButton reduced-motion, and visible focus rings on Pills
   are the three most-likely-to-trip items. Fix during week 1, not before
   launch - the launch is the trigger for finding which of these matters
   most.

---

## What this review didn't catch (named so future-me looks for it)

- **Drop fairness.** All three matches in the local drop come from
  `MOCK_COHORT` filtered/sorted; no rotation, no anti-clustering by tag,
  no diversity guarantee beyond the existing `seenTypes` heuristic. Once
  Claude-backed drops land, this becomes the most important thing to
  evaluate - the matchmaker is the product.
- **First-drop placebo problem.** Friends seeing their first drop will be
  delighted regardless of match quality (novelty + Pass aesthetic + opener
  copy). The signal of "is the matchmaker actually working" doesn't appear
  until drop 4 or 5 when the placebo wears off. Set this expectation in
  the share copy.
- **Cross-cohort leakage.** Once we wire real auth, an attendee from a
  different YC batch landing on a `/pass/<ss-attendee-id>` URL should see
  a generic public Pass (no intent, no full bio), not the full cohort
  view. Today it shows the same view for everyone - fine for closed beta,
  not for scaling.
