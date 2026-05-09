// Seed the cohort from a CSV file. Idempotent: upserts users by email and
// founder_cards by user_id. Designed for the YC SS 2026 attendee list.
//
// Usage:
//   bun run db:seed -- --file data/cohort.csv
//   bun run db:seed -- --file data/cohort.csv --dry-run
//
// Required env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
// Aborts loudly if either is missing.
//
// CSV format (header row required, columns may appear in any order):
//   email                 (required, unique key for upsert)
//   name                  (required)
//   linkedin_url          (optional)
//   phone                 (optional)
//   location              (optional)
//   building_summary      (required for founder_card)
//   looking_for           (required for founder_card)
//   can_help_with         (required for founder_card)
//   talk_to_me_if         (required for founder_card)
//   tags                  (semicolon-separated, lowercase kebab-case)
//   intents               (semicolon-separated; cofounder|collaborator|peer|friend)
//   open_to_async         (true/false, default true)
//   open_to_in_person     (true/false, default true)
//
// Rows missing any required field are skipped with a warning. The script
// prints counts and exits non-zero on any database error.

import { promises as fs } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

type SeedRow = {
  email: string;
  name: string;
  linkedin_url?: string;
  phone?: string;
  location?: string;
  building_summary: string;
  looking_for: string;
  can_help_with: string;
  talk_to_me_if: string;
  tags: string[];
  intents: string[];
  open_to_async: boolean;
  open_to_in_person: boolean;
};

const REQUIRED_USER_FIELDS = ["email", "name"] as const;
const REQUIRED_CARD_FIELDS = [
  "building_summary",
  "looking_for",
  "can_help_with",
  "talk_to_me_if",
] as const;
const VALID_INTENTS = new Set(["cofounder", "collaborator", "peer", "friend"]);

function parseArgs(argv: string[]): { file: string; dryRun: boolean } {
  let file = "data/cohort.csv";
  let dryRun = false;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--file" && i + 1 < argv.length) {
      file = argv[i + 1];
      i++;
    } else if (a === "--dry-run") {
      dryRun = true;
    }
  }
  return { file, dryRun };
}

// Minimal RFC-4180-ish CSV parser. Handles quoted fields, escaped quotes
// inside quotes, and CRLF/LF line endings. Good enough for our seed.
// Exported only for tests.
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') {
        inQuotes = false;
      } else {
        field += c;
      }
      continue;
    }
    if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (c === "\r") {
      // skip; \n handles row break
    } else {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.length > 0 && !(r.length === 1 && r[0] === ""));
}

function normaliseTagList(s: string | undefined): string[] {
  if (!s) return [];
  return s
    .split(";")
    .map((t) => t.trim().toLowerCase())
    .filter((t) => t.length > 0);
}

function normaliseIntents(s: string | undefined): string[] {
  return normaliseTagList(s).filter((t) => VALID_INTENTS.has(t));
}

function parseBool(s: string | undefined, fallback: boolean): boolean {
  if (s === undefined) return fallback;
  const v = s.trim().toLowerCase();
  if (v === "true" || v === "1" || v === "yes") return true;
  if (v === "false" || v === "0" || v === "no") return false;
  return fallback;
}

// Exported only for tests.
export function rowToSeed(headers: string[], row: string[]): SeedRow | { skip: string } {
  const get = (name: string): string | undefined => {
    const idx = headers.indexOf(name);
    if (idx === -1) return undefined;
    const v = row[idx];
    return v === undefined ? undefined : v.trim();
  };

  for (const f of REQUIRED_USER_FIELDS) {
    if (!get(f)) return { skip: `missing ${f}` };
  }
  for (const f of REQUIRED_CARD_FIELDS) {
    if (!get(f)) return { skip: `missing ${f}` };
  }

  return {
    email: get("email")!.toLowerCase(),
    name: get("name")!,
    linkedin_url: get("linkedin_url") || undefined,
    phone: get("phone") || undefined,
    location: get("location") || undefined,
    building_summary: get("building_summary")!,
    looking_for: get("looking_for")!,
    can_help_with: get("can_help_with")!,
    talk_to_me_if: get("talk_to_me_if")!,
    tags: normaliseTagList(get("tags")),
    intents: normaliseIntents(get("intents")),
    open_to_async: parseBool(get("open_to_async"), true),
    open_to_in_person: parseBool(get("open_to_in_person"), true),
  };
}

async function main() {
  const { file, dryRun } = parseArgs(process.argv.slice(2));

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error(
      "Missing env. seed-cohort requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    );
    process.exit(2);
  }

  const absPath = path.resolve(process.cwd(), file);
  let raw: string;
  try {
    raw = await fs.readFile(absPath, "utf-8");
  } catch (err) {
    console.error(`Could not read ${absPath}: ${(err as Error).message}`);
    process.exit(2);
  }

  const grid = parseCsv(raw);
  if (grid.length < 2) {
    console.error("CSV must have a header row and at least one data row.");
    process.exit(2);
  }
  const headers = grid[0].map((h) => h.trim());
  const dataRows = grid.slice(1);

  const seeds: SeedRow[] = [];
  let skipped = 0;
  for (let i = 0; i < dataRows.length; i++) {
    const result = rowToSeed(headers, dataRows[i]);
    if ("skip" in result) {
      skipped += 1;
      console.warn(`Row ${i + 2} skipped: ${result.skip}`);
      continue;
    }
    seeds.push(result);
  }

  console.log(`Parsed ${seeds.length} valid rows (${skipped} skipped) from ${file}`);

  if (dryRun) {
    console.log("Dry run; not writing to Supabase.");
    return;
  }

  const svc = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Upsert users by email. Returns inserted ids back so we can attach
  // founder_cards in the next step.
  const userPayload = seeds.map((s) => ({
    email: s.email,
    name: s.name,
    linkedin_url: s.linkedin_url ?? null,
    phone: s.phone ?? null,
    location: s.location ?? null,
  }));

  const { data: users, error: userErr } = await svc
    .from("users")
    .upsert(userPayload, { onConflict: "email" })
    .select("id, email");

  if (userErr || !users) {
    console.error(`users upsert failed: ${userErr?.message ?? "no rows returned"}`);
    process.exit(1);
  }

  const idByEmail = new Map<string, string>();
  for (const u of users) idByEmail.set(u.email, u.id);

  const cardPayload = seeds
    .map((s) => {
      const userId = idByEmail.get(s.email);
      if (!userId) return null;
      return {
        user_id: userId,
        building_summary: s.building_summary,
        looking_for: s.looking_for,
        can_help_with: s.can_help_with,
        talk_to_me_if: s.talk_to_me_if,
        tags: s.tags,
        intents: s.intents,
        open_to_async: s.open_to_async,
        open_to_in_person: s.open_to_in_person,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  const { error: cardErr } = await svc
    .from("founder_cards")
    .upsert(cardPayload, { onConflict: "user_id" });

  if (cardErr) {
    console.error(`founder_cards upsert failed: ${cardErr.message}`);
    process.exit(1);
  }

  console.log(`Seeded ${users.length} users and ${cardPayload.length} founder_cards.`);
}

// Skip auto-run when imported by tests. tsx/bun running this file directly
// sets `import.meta.main = true` (Bun) or matches process.argv[1] (Node).
const argv1 = process.argv[1] ?? "";
const importedAsMain =
  // Bun
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (import.meta as any).main === true ||
  // Node / tsx fallback: argv[1] ends with this filename
  argv1.endsWith("seed-cohort.ts") ||
  argv1.endsWith("seed-cohort.js");

if (importedAsMain) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
