import { MOCK_COHORT } from "@/lib/mock/cohort";
import { requireSession, UnauthorizedError } from "@/lib/auth/session";
import { jsonError, BrowseQuerySchema, genericValidationErrors } from "@/lib/api/schema";
import { checkLimit } from "@/lib/auth/rate-limit";

// Browse is rate-limited and paginated. We do NOT return the full cohort to
// avoid easy enumeration. A page returns at most 20 cards.

const PAGE_SIZE = 20;

export async function GET(req: Request) {
  let session;
  try {
    session = await requireSession();
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return jsonError(401, "UNAUTHORIZED", "Authentication required.");
    }
    return jsonError(500, "SESSION_ERROR", "Could not load session.");
  }

  const limit = await checkLimit("browse_min", session.id);
  if (!limit.allowed) {
    return jsonError(429, "RATE_LIMITED", `Too many browse calls. ${limit.help}.`, {
      retry_in_ms: limit.reset_in_ms,
    });
  }

  const url = new URL(req.url);
  const tags = url.searchParams.getAll("tag");
  const page = Math.max(0, parseInt(url.searchParams.get("page") || "0", 10) || 0);

  const parsed = BrowseQuerySchema.safeParse({ tag: tags.length ? tags : undefined });
  if (!parsed.success) {
    return jsonError(400, "VALIDATION", "Invalid query.", {
      fields: genericValidationErrors(parsed.error),
    });
  }

  const filtered =
    !parsed.data.tag || parsed.data.tag.length === 0
      ? MOCK_COHORT
      : MOCK_COHORT.filter((c) => parsed.data.tag!.every((t) => c.tags.includes(t)));

  const start = page * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  const slice = filtered.slice(start, end);

  return Response.json({
    count: filtered.length,
    page,
    page_size: PAGE_SIZE,
    has_more: end < filtered.length,
    results: slice.map((c) => ({
      id: c.id,
      name: c.name,
      location: c.location,
      tags: c.tags,
      building_summary: c.building_summary,
    })),
  });
}
