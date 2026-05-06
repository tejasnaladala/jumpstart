// Admin allowlist gate. Returns the session if the user is on the
// JUMPSTART_ADMIN_EMAILS env list, else null (or throws via requireAdmin).
//
// Dev admin bypass requires its OWN explicit opt-in via JUMPSTART_DEV_ADMIN=1
// (NOT JUMPSTART_ALLOW_STUB). The two flags do different jobs and conflating
// them was a CP3 finding.

import { getSession, type SessionUser } from "./session";

function adminEmails(): string[] {
  const raw = process.env.JUMPSTART_ADMIN_EMAILS ?? "";
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function devAdminAllowed(): boolean {
  if (process.env.JUMPSTART_DEV_ADMIN !== "1") return false;
  // Allowed in dev. In production, only if explicit JUMPSTART_PRIVATE_BETA=1
  // marks this as a tunneled private beta (intentional, opt-in).
  if (process.env.NODE_ENV !== "production") return true;
  return process.env.JUMPSTART_PRIVATE_BETA === "1";
}

export async function getAdmin(): Promise<SessionUser | null> {
  const session = await getSession();
  if (!session) return null;

  if (devAdminAllowed()) {
    return session;
  }

  const allow = adminEmails();
  if (allow.length === 0) return null;
  if (!allow.includes(session.email.toLowerCase())) return null;
  return session;
}

export class AdminForbiddenError extends Error {
  status = 403 as const;
  constructor() {
    super("Admin only");
    this.name = "AdminForbiddenError";
  }
}

export async function requireAdmin(): Promise<SessionUser> {
  const admin = await getAdmin();
  if (!admin) throw new AdminForbiddenError();
  return admin;
}
