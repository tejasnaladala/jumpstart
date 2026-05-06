import { runAgent } from "@/lib/agents/runner";
import { safetyClassifier } from "@/lib/agents/safety-classifier";
import { IntroRequestSchema, jsonError, genericValidationErrors } from "@/lib/api/schema";
import { requireSession, UnauthorizedError } from "@/lib/auth/session";
import { checkLimit } from "@/lib/auth/rate-limit";
import { recordSafetyBlock } from "@/lib/agents/log";

export async function POST(req: Request) {
  let session;
  try {
    session = await requireSession();
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return jsonError(401, "UNAUTHORIZED", "Authentication required.");
    }
    return jsonError(500, "SESSION_ERROR", "Could not load session.");
  }

  // Rate limit per user.
  const hour = await checkLimit("intros_hour", session.id);
  if (!hour.allowed) {
    return jsonError(429, "RATE_LIMITED", `Too many intros this hour. ${hour.help}.`, {
      retry_in_ms: hour.reset_in_ms,
    });
  }
  const day = await checkLimit("intros_day", session.id);
  if (!day.allowed) {
    return jsonError(429, "RATE_LIMITED", `Too many intros today. ${day.help}.`, {
      retry_in_ms: day.reset_in_ms,
    });
  }

  // Parse and validate.
  let body;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, "BAD_JSON", "Body is not valid JSON.");
  }
  const parsed = IntroRequestSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "VALIDATION", "Invalid request body.", {
      fields: genericValidationErrors(parsed.error),
    });
  }
  const { match_id, recipient_id, note } = parsed.data;

  // Server-derived requester. NEVER trust the body for this.
  const requester_id = session.id;

  if (recipient_id === requester_id) {
    return jsonError(400, "SELF_INTRO", "Cannot send intro to yourself.");
  }

  // Ownership check: the match row must exist, must belong to the
  // requester, and the recipient_id in the body must equal the
  // candidate_user_id on the match. Closes Codex P2 finding.
  try {
    await assertMatchOwnership(requester_id, match_id, recipient_id);
  } catch (err) {
    if (err instanceof MatchOwnershipError) {
      return jsonError(403, "MATCH_NOT_OWNED", "This match is not yours to act on.");
    }
    return jsonError(503, "INTROS_NOT_IMPLEMENTED", "Intro path requires the matches table. Wire DB before deploying.");
  }

  // Safety pass on the note (if present).
  let recommendation: "allow" | "flag" | "block" | "escalate" = "allow";
  let risk_score = 0;
  let reasons: string[] = [];

  if (note && note.trim().length > 0) {
    let result;
    try {
      result = await runAgent(safetyClassifier, {
        artifact_type: "intro_note",
        artifact_text: note,
        context: { sender_id: requester_id, recipient_id, recent_artifacts: 0 },
      });
    } catch {
      return jsonError(500, "AGENT_ERROR", "Could not classify note. Try again.");
    }

    if (result.via === "stub") {
      const spam = /(http|click here|earn \$|bitcoin|nigerian prince|crypto giveaway|wire transfer)/i.test(note);
      const harassment = /(kill|hate|slur|racist)/i.test(note);
      recommendation = spam || harassment ? "block" : "allow";
      risk_score = spam || harassment ? 90 : 5;
      reasons = spam ? ["spam pattern (stub heuristic)"] : harassment ? ["harassment pattern (stub heuristic)"] : [];
    } else if (result.ok && result.output) {
      recommendation = result.output.recommendation;
      risk_score = result.output.risk_score;
      reasons = result.output.reasons;
    }
  }

  if (recommendation === "block" || recommendation === "escalate") {
    // Structured server-side log via the agent log writer. Response body
    // stays generic (no attacker oracle).
    void recordSafetyBlock({ requester_id, recipient_id, risk_score, reasons });
    return jsonError(400, "SAFETY_BLOCK", "Your note was flagged. Please rewrite without sales language or external links.");
  }

  return Response.json({
    accepted: true,
    intro_id: `intro_${Date.now()}`,
    match_id,
    requester_id,
    recipient_id,
    sent_at: new Date().toISOString(),
  });
}

class MatchOwnershipError extends Error {
  constructor(msg = "Match not owned by requester") {
    super(msg);
    this.name = "MatchOwnershipError";
  }
}

async function assertMatchOwnership(
  requester_id: string,
  match_id: string,
  recipient_id: string
): Promise<void> {
  // Stub-mode bypass requires BOTH the explicit stub flag AND no Supabase
  // configured. A stray JUMPSTART_ALLOW_STUB=1 in prod with Supabase wired
  // must not bypass ownership. Closes Codex challenge P2 #7.
  const supabaseConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  const isStub = process.env.JUMPSTART_ALLOW_STUB === "1" && !supabaseConfigured;
  if (isStub) {
    if (!match_id.startsWith("match_")) {
      throw new MatchOwnershipError("malformed match id");
    }
    if (!recipient_id.startsWith("u_") && !recipient_id.startsWith("fc_")) {
      throw new MatchOwnershipError("malformed recipient id");
    }
    void requester_id;
    return;
  }
  // Real implementation:
  //   const { data, error } = await supabase
  //     .from("matches")
  //     .select("id, user_id, candidate_user_id")
  //     .eq("id", match_id)
  //     .single();
  //   if (error || !data) throw new MatchOwnershipError("match not found");
  //   if (data.user_id !== requester_id) throw new MatchOwnershipError();
  //   if (data.candidate_user_id !== recipient_id) throw new MatchOwnershipError();
  throw new Error("matches table not yet wired in production");
}
