// Tests for the seed-cohort CSV parser and row-to-seed mapper. The script
// itself talks to Supabase, but the parsing logic should be testable in
// isolation. Both helpers are exported from scripts/seed-cohort.ts.

import { describe, test, expect } from "bun:test";
import { parseCsv, rowToSeed } from "../../scripts/seed-cohort";

describe("parseCsv", () => {
  test("parses a simple grid", () => {
    const csv = "a,b,c\n1,2,3\n4,5,6";
    expect(parseCsv(csv)).toEqual([
      ["a", "b", "c"],
      ["1", "2", "3"],
      ["4", "5", "6"],
    ]);
  });

  test("handles quoted fields with commas inside", () => {
    const csv = 'name,city\n"Reddy, Priya",Bangalore';
    expect(parseCsv(csv)).toEqual([
      ["name", "city"],
      ["Reddy, Priya", "Bangalore"],
    ]);
  });

  test("handles escaped double quotes inside quoted fields", () => {
    const csv = 'note\n"she said ""hello"""';
    expect(parseCsv(csv)).toEqual([
      ["note"],
      ['she said "hello"'],
    ]);
  });

  test("tolerates CRLF line endings", () => {
    const csv = "a,b\r\n1,2\r\n";
    expect(parseCsv(csv)).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });

  test("ignores trailing empty rows", () => {
    const csv = "a,b\n1,2\n\n";
    expect(parseCsv(csv)).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });
});

const HEADERS = [
  "email",
  "name",
  "linkedin_url",
  "phone",
  "location",
  "building_summary",
  "looking_for",
  "can_help_with",
  "talk_to_me_if",
  "tags",
  "intents",
  "open_to_async",
  "open_to_in_person",
];

const FULL_ROW = [
  "Priya@example.com",
  "Priya Reddy",
  "https://linkedin.com/in/priya",
  "+1-415-555-0100",
  "Bangalore",
  "Cross-border payments rail.",
  "Fintech operators who shipped real money movement.",
  "India banking ops, RBI, Bangalore hiring.",
  "You build infra that moves money.",
  "fintech;india;payments",
  "cofounder;collaborator;bogus",
  "true",
  "false",
];

describe("rowToSeed", () => {
  test("returns a SeedRow for a full row and lowercases the email", () => {
    const result = rowToSeed(HEADERS, FULL_ROW);
    expect("skip" in result).toBe(false);
    if ("skip" in result) return;
    expect(result.email).toBe("priya@example.com");
    expect(result.name).toBe("Priya Reddy");
    expect(result.tags).toEqual(["fintech", "india", "payments"]);
    expect(result.intents).toEqual(["cofounder", "collaborator"]); // bogus filtered out
    expect(result.open_to_async).toBe(true);
    expect(result.open_to_in_person).toBe(false);
  });

  test("skips rows missing required user fields", () => {
    const row = [...FULL_ROW];
    row[HEADERS.indexOf("email")] = "";
    const result = rowToSeed(HEADERS, row);
    expect("skip" in result).toBe(true);
  });

  test("skips rows missing required card fields", () => {
    const row = [...FULL_ROW];
    row[HEADERS.indexOf("building_summary")] = "";
    const result = rowToSeed(HEADERS, row);
    expect("skip" in result).toBe(true);
  });

  test("defaults open_to_* booleans to true when blank", () => {
    const row = [...FULL_ROW];
    row[HEADERS.indexOf("open_to_async")] = "";
    row[HEADERS.indexOf("open_to_in_person")] = "";
    const result = rowToSeed(HEADERS, row);
    if ("skip" in result) throw new Error("should not skip");
    expect(result.open_to_async).toBe(true);
    expect(result.open_to_in_person).toBe(true);
  });

  test("filters intents to the four valid values", () => {
    const row = [...FULL_ROW];
    row[HEADERS.indexOf("intents")] = "investor;cofounder;customer";
    const result = rowToSeed(HEADERS, row);
    if ("skip" in result) throw new Error("should not skip");
    expect(result.intents).toEqual(["cofounder"]);
  });
});
