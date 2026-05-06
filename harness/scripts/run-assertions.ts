// Standalone assertion runner. Calls the assertion suite once and
// emits METRIC lines for the maintenance loop. Exits non-zero only
// if every assertion failed (server is dead) — a partial failure
// still returns 0 so the loop keeps running and the next round
// gets a chance.

import { runAssertions } from "../lib/assertions";

async function main(): Promise<void> {
  const { total, passed, failed } = await runAssertions();
  const rate = total > 0 ? Math.round((passed / total) * 100) : 0;

  console.log(`Assertions: ${passed}/${total} passed (${rate}%)`);
  for (const f of failed) {
    console.log(`  FAIL ${f.name}: ${f.detail || ""}`);
  }
  console.log(`METRIC harness_assertions_total=${total}`);
  console.log(`METRIC harness_assertions_passed=${passed}`);
  console.log(`METRIC harness_assertion_pass_rate=${rate}`);

  // Exit 0 unless everything broke. Loop should continue regardless.
  if (passed === 0 && total > 0) {
    process.exit(2);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
