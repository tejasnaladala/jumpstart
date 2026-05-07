import { generateLocalDrop } from "@/lib/match/local-drop";
import { DEFAULT_ME } from "@/lib/mock/me";
import { requireSession, UnauthorizedError, isStubMode, type SessionUser } from "@/lib/auth/session";
import { checkLimit } from "@/lib/auth/rate-limit";
import { jsonError } from "@/lib/api/schema";
import { getAnonServerClient, SupabaseConfigError } from "@/lib/supabase/server";
import type { FounderCard, Intent, TrustTier } from "@/lib/types";

const VALID_INTENTS: ReadonlySet<Intent> = new Set([
  "cofounder",
  "collaborator",
  "peer",
  "friend",
]);

const VALID_TRUST_TIERS: ReadonlySet<TrustTier> = new Set([
  "provisional",
  "verified",
  "peer_vouched",
]);

// Drops are generated server-side from the authenticated user's stored card.
// Bodies are NOT trusted for the user payload anymore. GET is removed entirely
// because it bypassed auth in stub mode.

export async function POST() {
  let session;
  try {
    session = await requireSession();
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return jsonError(401, "UNAUTHORIZED", "Authentication required.");
    }
    return jsonError(500, "SESSION_ERROR", "Could not load session.");
  }

  const limit = await checkLimit("drops_day", session.id);
  if (!limit.allowed) {
    return jsonError(429, "RATE_LIMITED", `Too many drops today. ${limit.help}.`, {
      retry_in_ms: limit.reset_in_ms,
    });
  }

  // In stub mode, the user card is read from server-side default. In prod,
  // this reads from founder_cards via the anon client (RLS allows own row).
  let me: FounderCard;
  try {
    me = isStubMode() ? DEFAULT_ME : await loadMeFromDb(session);
  } catch (err) {
    if (err instanceof CardNotFoundError) {
      return jsonError(404, "CARD_NOT_FOUND", "Onboarding is incomplete. Finish your founder card before generating a drop.");
    }
    if (err instanceof SupabaseConfigError) {
      return jsonError(503, "DROPS_NOT_IMPLEMENTED", err.message);
    }
    return jsonError(500, "DROPS_ERROR", "Could not load your card.");
  }

  const matches = generateLocalDrop(me);
  return Response.json({
    drop_id: `drop_${Date.now()}`,
    user_id: session.id,
    matches,
    generated_at: new Date().toISOString(),
  });
}

class CardNotFoundError extends Error {
  constructor(message = "Founder card not found") {
    super(message);
    this.name = "CardNotFoundError";
  }
}

// Reads the authenticated user's founder card via the anon client. RLS lets
// a user read their own row; if no row exists, throws CardNotFoundError so
// the route can return 404 ("finish onboarding") instead of a generic 503.
async function loadMeFromDb(session: SessionUser): Promise<FounderCard> {
  const supabase = await getAnonServerClient();

  // Read founder_cards (RLS allows own row) joined with users for name/location.
  const [cardRes, userRes] = await Promise.all([
    supabase
      .from("founder_cards")
      .select(
        "id, user_id, building_summary, looking_for, can_help_with, talk_to_me_if, tags, intents, open_to_async, open_to_in_person, updated_at"
      )
      .eq("user_id", session.id)
      .maybeSingle(),
    supabase
      .from("users")
      .select("name, location")
      .eq("id", session.id)
      .maybeSingle(),
  ]);

  if (cardRes.error) {
    throw new Error(`founder_cards select failed: ${cardRes.error.message}`);
  }
  if (!cardRes.data) {
    throw new CardNotFoundError();
  }

  const intents: Intent[] = ((cardRes.data.intents as string[] | null) ?? []).filter(
    (v): v is Intent => VALID_INTENTS.has(v as Intent)
  );

  const tier: TrustTier = VALID_TRUST_TIERS.has(session.trust_tier as TrustTier)
    ? (session.trust_tier as TrustTier)
    : "provisional";

  return {
    id: cardRes.data.id,
    user_id: cardRes.data.user_id,
    name: userRes.data?.name ?? session.email.split("@")[0] ?? "you",
    location: userRes.data?.location ?? "",
    going_to_sf: true,
    attended_india: false,
    remote_global: !cardRes.data.open_to_in_person,
    open_to_async: cardRes.data.open_to_async,
    open_to_in_person: cardRes.data.open_to_in_person,
    building_summary: cardRes.data.building_summary,
    looking_for: cardRes.data.looking_for,
    can_help_with: cardRes.data.can_help_with,
    talk_to_me_if: cardRes.data.talk_to_me_if,
    tags: (cardRes.data.tags as string[] | null) ?? [],
    intents,
    trust_tier: tier,
    updated_at: cardRes.data.updated_at,
  };
}
