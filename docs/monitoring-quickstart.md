# Monitoring quickstart

The single page you keep open while the harness runs and during the
closed-beta-of-10 launch. Five things to watch.

## 1. Live ops dashboard

Open these in browser tabs:

- `http://localhost:3030/admin/health` - local application liveness with
  recent poll history. Auto-refreshes every 10s and never calls a provider.
  **Green = the application process is responding. Red = the local route
  failed. This is intentionally not a dependency-readiness check.**
- `http://localhost:3030/admin` - tile launcher. Live health, Moderation,
  Agent logs, Cohort dashboard.
- `http://localhost:3030/admin/cohort` - cohort distribution, drop performance.

Tunnel URL: paste the latest `https://*.trycloudflare.com` here once you
restart cloudflared.

## 2. Live persona stream (terminal)

```bash
bash scripts/monitor.sh
```

Refreshes every 3s. Shows: server health, last invariant assertion, rolling
counters (signups / drops / intros / accepts / declines / meetings / errors),
last 5 persona events, last 3 meetings, last loop pass.

## 3. The four log files

| Log | What it tells you |
|---|---|
| `experiments/harness-activity.jsonl` | Every persona event (signup, drop view, intro request, accept, decline, meeting, error). The audit trail. |
| `experiments/harness-meetings.jsonl` | Every pretend meeting that got scheduled. The success metric. |
| `experiments/harness-assertions.jsonl` | Every invariant check, pass or fail. The regression alarm. |
| `experiments/harness-loop.jsonl` | One row per maintenance loop pass. The trend feed. |

Tail one in another terminal:

```bash
tail -f experiments/harness-activity.jsonl | jq -c '{ts,persona_id,event}'
```

## 4. The maintenance loop

One pass = hardening (typecheck/build/eval/lint) + harness round (12
personas × 1 tick) + invariant assertions + metric emit. About 60-180s
per pass on this machine.

```bash
bash scripts/harness-loop.sh    # one pass
```

For continuous pressure-testing in the background:

```bash
HARNESS_LOOP_PAUSE_MS=120000 bun run harness:loop &
```

## 5. The single-number health metric

After any round, run:

```bash
bun run harness:metrics
```

You get:
- `signups`, `drops_seen`, `intros_requested`, `intros_accepted`, `meetings_scheduled`
- `acceptance_rate` (accepts / (accepts + declines)) - keep above 40%
  for normal cohort behavior. Below means the matchmaker is matching wrong.
- `assertion_pass_rate` - keep at 100. Anything below means a regression.
- `errors` - should be 0. Anything else, look at recent persona screenshots
  in `experiments/harness-runs/<run_id>/<persona_id>/`.

## When something goes red

| Signal | Where to look |
|---|---|
| `assertion_pass_rate < 100` | `experiments/harness-assertions.jsonl` - grep `"passed":false` |
| `errors > 0` in activity | `experiments/harness-runs/<latest>/*/telemetry.json` - console errors and 4xx/5xx per persona |
| `acceptance_rate < 30%` | Decision rules might be too picky, or matchmaker scoring drifted. Inspect `harness/lib/coordinator.ts decideAccept` |
| `/admin/health` shows a failure | The application route is not responding; inspect the server process and logs |
| A provider-backed feature fails | Check that provider's dashboard and server logs; public liveness does not probe dependencies |

## Persona-specific debugging

```bash
# Run one persona end-to-end with a real browser window:
HARNESS_HEADLESS=0 bun run harness:persona p_priya_fintech
```

Watch the persona drive the app live. Useful for diagnosing why a
specific archetype's flow fails (e.g. mobile profile + filter sheet
+ chaos clicks all in sequence).

## What you do NOT need to watch

- Server stdout - keep it available because `/api/health` deliberately contains no logs or dependency detail.
- The cloudflared tunnel terminal - it logs noise but the URL is
  constant for the session. If it dies, the URL rotates; check it.
- Per-persona state files in `harness/state/` - those are durable but
  only matter if you want to reset a persona (`rm harness/state/<id>.json`).
