import { NextResponse } from "next/server";
import { runAgent } from "@/lib/agents/runner";
import { safetyClassifier } from "@/lib/agents/safety-classifier";

export async function POST(req: Request) {
  const body = await req.json();
  const { match_id, requester_id, recipient_id, note } = body as {
    match_id: string;
    requester_id: string;
    recipient_id: string;
    note: string;
  };

  // Run safety classifier on the note.
  let recommendation: "allow" | "flag" | "block" | "escalate" = "allow";
  let risk_score = 0;
  let reasons: string[] = [];

  if (note && note.trim().length > 0) {
    const result = await runAgent(safetyClassifier, {
      artifact_type: "intro_note",
      artifact_text: note,
      context: { sender_id: requester_id, recipient_id, recent_artifacts: 0 },
    });

    if (result.via === "stub") {
      // Local heuristic: any note containing obvious spam markers gets blocked.
      const spam = /(http|click here|earn \$|bitcoin|nigerian prince|crypto giveaway)/i.test(note);
      recommendation = spam ? "block" : "allow";
      risk_score = spam ? 90 : 5;
      reasons = spam ? ["spam-pattern detected by local heuristic"] : [];
    } else if (result.ok && result.output) {
      recommendation = result.output.recommendation;
      risk_score = result.output.risk_score;
      reasons = result.output.reasons;
    }
  }

  if (recommendation === "block" || recommendation === "escalate") {
    return NextResponse.json(
      {
        accepted: false,
        recommendation,
        risk_score,
        reasons,
        message: "Your message was flagged. Please rewrite without sales language or external links.",
      },
      { status: 400 }
    );
  }

  return NextResponse.json({
    accepted: true,
    intro_id: `intro_${Date.now()}`,
    match_id,
    requester_id,
    recipient_id,
    sent_at: new Date().toISOString(),
    safety: { recommendation, risk_score, reasons },
  });
}
