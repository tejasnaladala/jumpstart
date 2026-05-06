// Harness CLI runner. Three modes:
//
//   bun run harness                   - one round (onboard + 1 tick per persona)
//   bun run harness:loop              - repeating loop, one tick per persona per cycle
//   bun run harness:persona <id>      - single-persona dry run for debugging
//
// Modes share the same primitives in lib/coordinator.ts. The CLI is
// thin so the contract for ops is small: invoke a command, watch
// experiments/harness-activity.jsonl for what happened.

import { PERSONAS, findPersona } from "./personas/seed";
import {
  onboardPersona,
  shutdown,
  tickPersona,
} from "./lib/coordinator";
import { ACTIVITY_LOG_PATH } from "./lib/activity";

// Concurrency: 4 personas in parallel by default. Higher values stress
// the dev server harder; lower values are easier to debug. Set via
// HARNESS_CONCURRENCY env var.
const CONCURRENCY = Number.parseInt(process.env.HARNESS_CONCURRENCY || "4", 10);
// Round-loop pause: how long between full passes through the persona
// list. 60s by default for soak runs; 0 means single round and exit.
const LOOP_PAUSE_MS = Number.parseInt(process.env.HARNESS_LOOP_PAUSE_MS || "60000", 10);

async function runWithConcurrency<T>(
  items: T[],
  fn: (item: T) => Promise<unknown>,
  limit: number
): Promise<void> {
  const queue = [...items];
  const workers: Promise<void>[] = [];
  for (let i = 0; i < limit; i++) {
    workers.push(
      (async () => {
        while (queue.length > 0) {
          const next = queue.shift();
          if (!next) return;
          try {
            await fn(next);
          } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            console.error(`[harness] error: ${msg}`);
          }
        }
      })()
    );
  }
  await Promise.all(workers);
}

async function modeOnce(): Promise<void> {
  console.log(`[harness] onboarding ${PERSONAS.length} personas, concurrency=${CONCURRENCY}`);
  await runWithConcurrency(PERSONAS, onboardPersona, CONCURRENCY);
  console.log(`[harness] running 1 tick per persona`);
  await runWithConcurrency(PERSONAS, tickPersona, CONCURRENCY);
  console.log(`[harness] done. activity log: ${ACTIVITY_LOG_PATH}`);
}

async function modeLoop(): Promise<void> {
  console.log(`[harness] loop mode, pause=${LOOP_PAUSE_MS}ms between rounds`);
  let round = 0;
  // Onboard once at the start.
  await runWithConcurrency(PERSONAS, onboardPersona, CONCURRENCY);
  while (true) {
    round += 1;
    const start = Date.now();
    console.log(`[harness] round ${round} start`);
    await runWithConcurrency(PERSONAS, tickPersona, CONCURRENCY);
    const dur = Date.now() - start;
    console.log(`[harness] round ${round} done in ${dur}ms`);
    if (LOOP_PAUSE_MS <= 0) break;
    await new Promise((r) => setTimeout(r, LOOP_PAUSE_MS));
  }
}

async function modePersona(id: string): Promise<void> {
  const p = findPersona(id);
  if (!p) {
    console.error(`[harness] no persona with id "${id}". Available: ${PERSONAS.map((x) => x.id).join(", ")}`);
    process.exit(1);
  }
  console.log(`[harness] dry run for ${p.id} (${p.identity.name})`);
  await onboardPersona(p);
  await tickPersona(p);
  console.log(`[harness] done. activity log: ${ACTIVITY_LOG_PATH}`);
}

async function main(): Promise<void> {
  const arg = process.argv[2] || "once";
  try {
    if (arg === "once") {
      await modeOnce();
    } else if (arg === "loop") {
      await modeLoop();
    } else if (arg === "persona") {
      const id = process.argv[3];
      if (!id) {
        console.error(`[harness] persona mode requires an id, e.g. bun run harness persona p_priya_fintech`);
        process.exit(1);
      }
      await modePersona(id);
    } else {
      console.error(`[harness] unknown mode "${arg}". Use: once | loop | persona <id>`);
      process.exit(1);
    }
  } finally {
    await shutdown();
  }
}

main().catch((err) => {
  console.error("[harness] fatal:", err);
  process.exit(1);
});
