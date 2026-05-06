// Zod schemas for every API boundary. Validate incoming bodies before
// touching agents, DB, or anything stateful. Tight regex on identifiers.

import { z } from "zod";

// IDs accept either UUIDs or our deterministic stub identifiers
// ("fc_xxx", "u_xxx", "match_xxx", "intro_xxx", "drop_xxx").
const idShape = z
  .string()
  .min(3)
  .max(64)
  .regex(
    /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|[a-z]+_[a-zA-Z0-9_]{1,40})$/,
    "id must be a UUID or prefix_slug"
  );

const tagShape = z
  .string()
  .min(2)
  .max(40)
  .regex(/^[a-z][a-z0-9-]+$/, "tag must be kebab-case");

export const IntroRequestSchema = z.object({
  match_id: idShape,
  recipient_id: idShape,
  note: z.string().max(2000).optional().default(""),
});
export type IntroRequestBody = z.infer<typeof IntroRequestSchema>;

export const InterviewSchema = z.object({
  identity: z.object({
    name: z.string().min(1).max(120),
    location: z.string().min(1).max(120),
    oneLine: z.string().min(3).max(280),
  }),
  history: z
    .array(
      z.object({
        role: z.enum(["interviewer", "user"]),
        content: z.string().max(2000),
      })
    )
    .max(20),
  questionsAsked: z.number().int().min(0).max(20),
});
export type InterviewBody = z.infer<typeof InterviewSchema>;

export const DropRequestSchema = z.object({
  cycle_week: z.string().max(16).optional(),
});
export type DropRequestBody = z.infer<typeof DropRequestSchema>;

export const BrowseQuerySchema = z.object({
  tag: z.array(tagShape).max(20).optional(),
});
export type BrowseQuery = z.infer<typeof BrowseQuerySchema>;

// Generic field/code error for the response. Never echo received values to
// the client. Server-side log keeps the detail for debugging.
type FieldError = { field: string; code: string };

export function genericValidationErrors(zodError: z.ZodError): FieldError[] {
  return zodError.issues.slice(0, 8).map((i) => ({
    field: String(i.path.join(".") || "body"),
    code: i.code,
  }));
}

export function jsonError(
  status: number,
  code: string,
  message: string,
  extras?: Record<string, unknown>
) {
  return Response.json({ error: message, code, ...(extras ?? {}) }, { status });
}
