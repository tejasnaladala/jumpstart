import { NextResponse } from "next/server";
import { generateLocalDrop } from "@/lib/match/local-drop";
import { DEFAULT_ME } from "@/lib/mock/me";
import type { FounderCard } from "@/lib/types";

// In production, this hits Supabase, runs the Matchmaker plus Match Explainer
// plus Opener Drafter agents, persists the drop, and returns it. For dev, we
// use the local heuristic drop generator and accept the user card from the
// request body (otherwise default to DEFAULT_ME).

export async function POST(req: Request) {
  let me: FounderCard;
  try {
    const body = await req.json();
    me = (body.me as FounderCard) || DEFAULT_ME;
  } catch {
    me = DEFAULT_ME;
  }

  const matches = generateLocalDrop(me);
  return NextResponse.json({
    drop_id: `drop_${Date.now()}`,
    user_id: me.user_id,
    matches,
    generated_at: new Date().toISOString(),
  });
}

export async function GET() {
  const matches = generateLocalDrop(DEFAULT_ME);
  return NextResponse.json({
    drop_id: "drop_default",
    user_id: DEFAULT_ME.user_id,
    matches,
    generated_at: new Date().toISOString(),
  });
}
