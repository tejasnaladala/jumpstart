import { runAgent } from "@/lib/agents/runner";
import { onboardingInterviewer } from "@/lib/agents/onboarding-interviewer";
import { InterviewSchema, jsonError, genericValidationErrors } from "@/lib/api/schema";
import { requireSession, UnauthorizedError } from "@/lib/auth/session";
import { checkLimit } from "@/lib/auth/rate-limit";

const FALLBACK_QUESTIONS = [
  "What are you building, in your own words?",
  "Who would make Startup School worth it for you?",
  "What can you uniquely help others with?",
  "What kind of meeting would feel like a waste of your time?",
];

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

  const limit = await checkLimit("onboarding_min", session.id);
  if (!limit.allowed) {
    return jsonError(429, "RATE_LIMITED", `${limit.help}.`, {
      retry_in_ms: limit.reset_in_ms,
    });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, "BAD_JSON", "Body is not valid JSON.");
  }
  const parsed = InterviewSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "VALIDATION", "Invalid request body.", {
      fields: genericValidationErrors(parsed.error),
    });
  }

  const { identity, history, questionsAsked } = parsed.data;

  let result;
  try {
    result = await runAgent(onboardingInterviewer, { identity, history, questionsAsked });
  } catch {
    return jsonError(500, "AGENT_ERROR", "Could not run the interview agent. Try again.");
  }

  if (result.via === "stub") {
    const q = FALLBACK_QUESTIONS[questionsAsked] ?? FALLBACK_QUESTIONS[0]!;
    return Response.json({
      next_question: q,
      is_final: questionsAsked >= FALLBACK_QUESTIONS.length - 1,
      reasoning: "local fallback",
    });
  }

  if (!result.ok || !result.output) {
    return jsonError(500, "AGENT_ERROR", result.error || "Agent error.");
  }

  return Response.json(result.output);
}
