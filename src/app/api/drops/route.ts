import { generateLocalDrop } from "@/lib/match/local-drop";
import { DEFAULT_ME } from "@/lib/mock/me";
import { requireSession, UnauthorizedError, isStubMode } from "@/lib/auth/session";
import { checkLimit } from "@/lib/auth/rate-limit";
import { jsonError } from "@/lib/api/schema";
import type { FounderCard } from "@/lib/types";

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
  // this MUST read from founder_cards. Wrap so the explicit throw returns
  // a clean jsonError instead of a 500 stack to the caller.
  let me: FounderCard;
  try {
    me = isStubMode() ? DEFAULT_ME : await loadMeFromDb();
  } catch {
    return jsonError(
      503,
      "DROPS_NOT_IMPLEMENTED",
      "Drop generation requires Supabase. Wire the production DB read before deploying."
    );
  }

  const matches = generateLocalDrop(me);
  return Response.json({
    drop_id: `drop_${Date.now()}`,
    user_id: session.id,
    matches,
    generated_at: new Date().toISOString(),
  });
}

async function loadMeFromDb(): Promise<FounderCard> {
  // TODO(prod): supabase server client → founder_cards.select(...).eq("user_id", session.id).single()
  throw new Error(
    "loadMeFromDb is not implemented. Set JUMPSTART_ALLOW_STUB=1 for local dev, or wire the real DB read before this code path is reached in prod."
  );
}
