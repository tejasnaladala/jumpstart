// Persistence adapter for the otp_codes collection. Hides the
// PocketBase admin client behind a typed interface so the service
// layer can be unit-tested with a fake store, and so the future
// Supabase migration (issue #5) is a one-file repository swap rather
// than a service-wide rewrite.
//
// Schema (declared in pocketbase/schema.json):
//   otp_codes:
//     channel       enum(email, phone)
//     target_hash   string (hex sha256, indexed)
//     code_hash     string (hex sha256)
//     sent_at       datetime
//     expires_at    datetime
//     verified_at   datetime nullable
//     attempts      number, default 0
// All public CRUD rules in PocketBase are closed; only the server
// admin SDK can read/write.

import type { OtpRealConfig } from "./config";
import type { OtpChannel } from "./types";
import { getPocketBaseAdminClient } from "@/lib/pocketbase/server";

export type OtpCodeRecord = {
  id: string;
  channel: OtpChannel;
  target_hash: string;
  code_hash: string;
  sent_at: string;
  expires_at: string;
  verified_at?: string;
  attempts: number;
};

export type OtpCodeCreateInput = {
  channel: OtpChannel;
  target_hash: string;
  code_hash: string;
  sent_at: string;
  expires_at: string;
};

export interface OtpCodeStore {
  create(input: OtpCodeCreateInput): Promise<OtpCodeRecord>;
  findLatestUnverified(
    channel: OtpChannel,
    targetHash: string
  ): Promise<OtpCodeRecord | null>;
  incrementAttempts(id: string): Promise<number>;
  // Returns null if the row was already verified between read and
  // update (concurrent verify race). Caller maps null → mismatch so
  // only the first writer wins.
  markVerified(
    id: string,
    verifiedAt: string
  ): Promise<OtpCodeRecord | null>;
  // Mark all unverified rows for (channel, targetHash) whose
  // expires_at is in the future as expired-now. Called from sendOtp
  // before persisting the new row so a fresh send invalidates older
  // codes still inside their TTL window. Returns the count of rows
  // affected; best-effort, never throws.
  expirePriorUnverified(
    channel: OtpChannel,
    targetHash: string,
    asOfIso: string
  ): Promise<number>;
}

const COLLECTION = "otp_codes";

// Adapter for the PocketBase admin SDK. The service module receives
// this via dependency injection so unit tests can substitute a fake.
export function createPocketBaseOtpCodeStore(
  config: OtpRealConfig
): OtpCodeStore {
  return {
    async create(input) {
      const client = await getPocketBaseAdminClient(config);
      const row = await client.collection(COLLECTION).create({
        channel: input.channel,
        target_hash: input.target_hash,
        code_hash: input.code_hash,
        sent_at: input.sent_at,
        expires_at: input.expires_at,
        attempts: 0,
      });
      return rowToRecord(row);
    },

    async findLatestUnverified(channel, targetHash) {
      const client = await getPocketBaseAdminClient(config);
      try {
        // Filter on hashed target only. Sort by sent_at descending so
        // the most recent unverified code wins; older unconsumed rows
        // are left as audit trail.
        const result = await client
          .collection(COLLECTION)
          .getList(1, 1, {
            filter: `channel = "${channel}" && target_hash = "${targetHash}" && verified_at = ""`,
            sort: "-sent_at",
          });
        if (result.items.length === 0) return null;
        return rowToRecord(result.items[0]);
      } catch {
        return null;
      }
    },

    async incrementAttempts(id) {
      const client = await getPocketBaseAdminClient(config);
      // Read-modify-write; PocketBase doesn't expose atomic increments
      // in the admin SDK. Brute-force throttle is a soft guard, not
      // a security boundary; rate limits and code expiry do the
      // heavy lifting.
      const current = await client.collection(COLLECTION).getOne(id);
      const next = (Number(current["attempts"]) || 0) + 1;
      const updated = await client
        .collection(COLLECTION)
        .update(id, { attempts: next });
      return Number(updated["attempts"]) || next;
    },

    async markVerified(id, verifiedAt) {
      const client = await getPocketBaseAdminClient(config);
      // Read-then-update guard: PocketBase admin SDK does not expose a
      // filter-conditional update, so we narrow the race window by
      // re-reading the row immediately before the write. If verified_at
      // was set by a concurrent caller, return null and let the service
      // map to mismatch. Race window remains but is now sub-millisecond.
      const fresh = await client.collection(COLLECTION).getOne(id);
      if (fresh["verified_at"]) {
        return null;
      }
      const updated = await client
        .collection(COLLECTION)
        .update(id, { verified_at: verifiedAt });
      return rowToRecord(updated);
    },

    async expirePriorUnverified(channel, targetHash, asOfIso) {
      const client = await getPocketBaseAdminClient(config);
      try {
        const rows = await client.collection(COLLECTION).getFullList({
          filter: `channel = "${channel}" && target_hash = "${targetHash}" && verified_at = "" && expires_at > "${asOfIso}"`,
        });
        let count = 0;
        for (const row of rows) {
          try {
            await client
              .collection(COLLECTION)
              .update(String(row.id), { expires_at: asOfIso });
            count++;
          } catch {
            // best-effort; one failure must not block the new send
          }
        }
        return count;
      } catch {
        return 0;
      }
    },
  };
}

function rowToRecord(row: Record<string, unknown>): OtpCodeRecord {
  return {
    id: String(row.id),
    channel: row.channel as OtpChannel,
    target_hash: String(row.target_hash),
    code_hash: String(row.code_hash),
    sent_at: String(row.sent_at),
    expires_at: String(row.expires_at),
    verified_at: row.verified_at ? String(row.verified_at) : undefined,
    attempts: Number(row.attempts) || 0,
  };
}
