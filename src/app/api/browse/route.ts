import { NextResponse } from "next/server";
import { MOCK_COHORT } from "@/lib/mock/cohort";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const tags = url.searchParams.getAll("tag");

  const filtered =
    tags.length === 0
      ? MOCK_COHORT
      : MOCK_COHORT.filter((c) => tags.every((t) => c.tags.includes(t)));

  return NextResponse.json({
    count: filtered.length,
    results: filtered.map((c) => ({
      id: c.id,
      name: c.name,
      location: c.location,
      tags: c.tags,
      building_summary: c.building_summary,
    })),
  });
}
