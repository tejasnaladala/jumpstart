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

const EXPLAIN_TEMPLATES: Record<MatchType, (m: FounderCard, o: FounderCard) => string> = {
  domain_peer: (me, o) => {
    const overlap = me.tags.filter((t) => o.tags.includes(t)).find((t) => !["sf", "india", "remote", "cofounder"].includes(t));
    return `${o.name.split(" ")[0]} works on ${overlap || o.tags[0]} from a different angle than you. Worth a 30-minute compare-notes call about what each of you has learned in the last 90 days.`;
  },
  cofounder_shape: (me, o) =>
    `${o.name.split(" ")[0]} is also looking for a cofounder and your domains are adjacent enough to spark serious conversation. The complementarity in skills is worth investigating before either of you locks in elsewhere.`,
  weird_adjacent: (me, o) => {
    const youTag = me.tags[0] || "your domain";
    const theirTag = o.tags.find((t) => !me.tags.includes(t)) || o.tags[0];
    return `${o.name.split(" ")[0]} works on ${theirTag} which has nothing to do with ${youTag} on paper. The unobvious match is the kind of conversation that produces ideas you would not have alone.`;
  },
  city_match: (me, o) =>
    `${o.name.split(" ")[0]} is in the same city as you and going to overlapping in-person things. Easiest possible coffee, the kind of intro that tends to actually happen rather than sit in a saved list forever.`,
};

const OPENER_TEMPLATES: Record<MatchType, (m: FounderCard, o: FounderCard) => string> = {
  domain_peer: (me, o) => {
    const overlap = me.tags.filter((t) => o.tags.includes(t))[0] || "this space";
    return `Saw your work on ${overlap}. Building adjacent stuff and would love to compare notes on what you have learned in the last 90 days. 30 min coffee or call?`;
  },
  cofounder_shape: (me, o) =>
    `Both of us are looking for a cofounder and our work has interesting overlap. Open to a real conversation about whether there is something here? No pressure, just a serious chat.`,
  weird_adjacent: (me, o) =>
    `Our domains do not obviously overlap, which is exactly why I think a conversation would be useful. Free for 30 min this week?`,
  city_match: (me, o) => {
    const city = locationCity(o.location).split(" ").map((w) => w[0]?.toUpperCase() + w.slice(1)).join(" ");
    return `Both in ${city}. Coffee this week? Pick a place near you, I will come to you.`;
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
