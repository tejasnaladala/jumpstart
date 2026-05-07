// Deterministic local drop generation. The real Matchmaker agent uses Claude
// against the cohort graph. This stub produces three matches for dev so the
// UI is fully functional without an API key.

import type { FounderCard, Match, MatchType } from "@/lib/types";
import { MOCK_COHORT } from "@/lib/mock/cohort";

function classify(me: FounderCard, other: FounderCard): MatchType {
  const sharedDomain = me.tags.some((t) =>
    other.tags.includes(t) && !["sf", "india", "remote", "japan", "latam", "emerging-markets", "cofounder", "solo", "hiring", "undergrad"].includes(t)
  );
  const cofounderShape =
    me.intents.includes("cofounder") &&
    (other.intents.includes("cofounder") || other.tags.includes("cofounder"));
  const sameCity = locationCity(me.location) === locationCity(other.location);
  if (cofounderShape) return "cofounder_shape";
  if (sharedDomain) return "domain_peer";
  if (sameCity) return "city_match";
  return "weird_adjacent";
}

function locationCity(loc: string): string {
  return (loc.split(",")[0] || "").trim().toLowerCase();
}

function score(me: FounderCard, other: FounderCard): number {
  const sharedTags = me.tags.filter((t) => other.tags.includes(t)).length;
  const intentOverlap = me.intents.filter((i) => other.intents.includes(i)).length;
  const sameCityBonus = locationCity(me.location) === locationCity(other.location) ? 1 : 0;
  return sharedTags * 3 + intentOverlap * 2 + sameCityBonus;
}

// Match explanations. Critical rule: never claim shared characteristics
// the user did not actually express. Closes the bug where users with
// no tags / no intents got cofounder-shape matches whose explanation
// said "we both have X tag" using the candidate's first tag as the
// stand-in. Each template now branches on actual overlap.
const EXPLAIN_TEMPLATES: Record<MatchType, (m: FounderCard, o: FounderCard) => string> = {
  domain_peer: (me, o) => {
    const overlap = me.tags
      .filter((t) => o.tags.includes(t))
      .find((t) => !["sf", "india", "remote", "cofounder"].includes(t));
    const firstName = o.name.split(" ")[0] || o.name;
    if (overlap) {
      return `${firstName} works on ${overlap.replace(/-/g, " ")} from a different angle than you. Worth a 30-minute compare-notes call about what each of you has learned recently.`;
    }
    return `${firstName} is working in adjacent territory. Different angle, similar shape of problem. Worth a 30-minute compare-notes call.`;
  },
  cofounder_shape: (me, o) => {
    const firstName = o.name.split(" ")[0] || o.name;
    return `${firstName} is also looking for a cofounder and your domains are adjacent enough to spark serious conversation. Worth a real call before either of you locks in elsewhere.`;
  },
  weird_adjacent: (me, o) => {
    const firstName = o.name.split(" ")[0] || o.name;
    const theirTag = (o.tags.find((t) => !me.tags.includes(t)) || o.tags[0] || "their work").replace(/-/g, " ");
    if (me.tags.length === 0) {
      return `${firstName} works on ${theirTag}. The matchmaker doesn't have a strong overlap signal yet — but unobvious calls are the ones that produce the ideas you wouldn't get alone.`;
    }
    const youTag = (me.tags[0] || "your domain").replace(/-/g, " ");
    return `${firstName} works on ${theirTag} which has nothing to do with ${youTag} on paper. The unobvious match is the kind of conversation that produces ideas you would not have alone.`;
  },
  city_match: (me, o) => {
    const firstName = o.name.split(" ")[0] || o.name;
    return `${firstName} is in the same city as you and going to overlapping in-person things. Easiest possible coffee, the kind of intro that tends to actually happen rather than sit in a saved list forever.`;
  },
};

// Humanized opener templates. Per user feedback ("AI generated feel"),
// these are written to sound like an actual founder typing on a Saturday
// morning. No "I came across your card", no "Curious if a quick chat
// makes sense for you", no "30 min sometime soon" templated phrasing.
// Each opener names a specific shared thing and proposes one concrete
// next step (call before SS, or in-person at the event). 50 words or
// fewer to respect the recipient's time.
const OPENER_TEMPLATES: Record<MatchType, (m: FounderCard, o: FounderCard) => string> = {
  domain_peer: (me, o) => {
    const overlap = me.tags.filter((t) => o.tags.includes(t))[0];
    const firstName = o.name.split(" ")[0] || o.name;
    if (overlap) {
      return `${firstName} - we both put ${overlap.replace(/-/g, " ")} on our cards. I'd love to compare notes for 20 min before SS. Free this week or next?`;
    }
    return `${firstName} - the way you described what you're building grabbed me. Worth a 20-min call before SS? Happy to do it whenever works for you.`;
  },
  cofounder_shape: (me, o) => {
    const firstName = o.name.split(" ")[0] || o.name;
    return `${firstName} - we're both looking for a cofounder and the domains line up. I'd rather find out fast than waste either of our time, so a real call this week or next?`;
  },
  weird_adjacent: (me, o) => {
    const firstName = o.name.split(" ")[0] || o.name;
    const theirTag = o.tags.find((t) => !me.tags.includes(t)) || o.tags[0];
    if (theirTag) {
      return `${firstName} - your work on ${theirTag.replace(/-/g, " ")} is nowhere near my space, which is the whole reason I want to talk. The non-obvious calls are the ones I learn most from. 20 min?`;
    }
    return `${firstName} - we don't obviously overlap, which is exactly why I think a call would be worth it. The non-obvious matches tend to be the best ones. 20 min this week?`;
  },
  city_match: (me, o) => {
    const firstName = o.name.split(" ")[0] || o.name;
    const city = locationCity(o.location).split(" ").map((w) => w[0]?.toUpperCase() + w.slice(1)).join(" ");
    return `${firstName} - we're both in ${city}. Coffee this week? Pick a spot near you, I'll come to you. Or grab 15 min at SS if you'd rather wait.`;
  },
};

export function generateLocalDrop(me: FounderCard): Match[] {
  const candidates = MOCK_COHORT.filter((c) => c.id !== me.id && c.user_id !== me.user_id);

  const ranked = candidates
    .map((c) => ({ c, type: classify(me, c), s: score(me, c) }))
    .sort((a, b) => b.s - a.s);

  // Diversity: pick top 3 with distinct match types where possible
  const picked: typeof ranked = [];
  const seenTypes = new Set<MatchType>();
  for (const item of ranked) {
    if (picked.length >= 3) break;
    if (!seenTypes.has(item.type) || picked.length >= 2) {
      picked.push(item);
      seenTypes.add(item.type);
    }
  }
  while (picked.length < 3 && ranked.length > picked.length) {
    const next = ranked.find((r) => !picked.includes(r));
    if (next) picked.push(next);
    else break;
  }

  const shownAt = new Date().toISOString();

  return picked.map((p, i) => {
    const explanation = EXPLAIN_TEMPLATES[p.type](me, p.c);
    const opener = OPENER_TEMPLATES[p.type](me, p.c);
    return {
      id: `match_${p.c.id}_${i}`,
      drop_id: "drop_local",
      user_id: me.user_id,
      candidate: p.c,
      match_type: p.type,
      score: p.s,
      reasoning_trace: `local heuristic v1, score=${p.s}, type=${p.type}, shared=${me.tags.filter((t) => p.c.tags.includes(t)).join(",")}`,
      explanation,
      suggested_opener: opener,
      position: (i + 1) as 1 | 2 | 3,
      shown_at: shownAt,
      action: null,
    };
  });
}

export function getMatchById(matchId: string, me: FounderCard): Match | undefined {
  return generateLocalDrop(me).find((m) => m.id === matchId);
}
