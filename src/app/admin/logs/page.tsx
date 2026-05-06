import { promises as fs } from "node:fs";
import path from "node:path";
import { Pill } from "@/components/primitive/Pill";

type Row = {
  ts: string;
  agent?: string;
  user_id?: string | null;
  ok?: boolean;
  via?: "claude" | "stub" | "error";
  tokens_in?: number;
  tokens_out?: number;
  cost_usd?: number;
  latency_ms?: number;
  attempts?: number;
  error?: string | null;
  input_summary?: string;
  kind?: string;
  reasons?: string[];
  risk_score?: number;
};

async function loadRecent(): Promise<Row[]> {
  const file = path.resolve(process.cwd(), ".jumpstart-logs", "agent.jsonl");
  try {
    const raw = await fs.readFile(file, "utf-8");
    const lines = raw.trim().split("\n").slice(-200).reverse();
    return lines
      .map((l) => {
        try {
          return JSON.parse(l) as Row;
        } catch {
          return null;
        }
      })
      .filter((x): x is Row => !!x);
  } catch {
    return [];
  }
}

export default async function AgentLogsPage() {
  const rows = await loadRecent();
  const totalCost = rows.reduce((s, r) => s + (r.cost_usd ?? 0), 0);
  const totalTokensIn = rows.reduce((s, r) => s + (r.tokens_in ?? 0), 0);
  const totalTokensOut = rows.reduce((s, r) => s + (r.tokens_out ?? 0), 0);
  const stubCount = rows.filter((r) => r.via === "stub").length;
  const liveCount = rows.filter((r) => r.via === "claude").length;
  const errorCount = rows.filter((r) => r.via === "error").length;

  return (
    <div className="container-wide">
      <div className="flex items-baseline justify-between flex-wrap gap-3">
        <div>
          <p className="text-xxs uppercase tracking-wider text-accent font-semibold">
            Observability
          </p>
          <h1 className="text-3xl font-semibold tracking-tight mt-1">Agent logs</h1>
          <p className="text-muted text-sm mt-2 max-w-2xl">
            Last 200 invocations. Reads from <code className="text-xs bg-bg px-1.5 py-0.5 rounded">.jumpstart-logs/agent.jsonl</code>.
            In production this view will read from <code className="text-xs bg-bg px-1.5 py-0.5 rounded">agent_logs</code> in Supabase.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 max-w-4xl">
        <Stat label="Total runs" value={rows.length.toString()} />
        <Stat label="Live" value={liveCount.toString()} />
        <Stat label="Stub" value={stubCount.toString()} />
        <Stat label="Errors" value={errorCount.toString()} accent={errorCount > 0 ? "error" : undefined} />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3 max-w-4xl">
        <Stat label="Tokens in" value={totalTokensIn.toLocaleString()} />
        <Stat label="Tokens out" value={totalTokensOut.toLocaleString()} />
        <Stat label="Total cost" value={`$${totalCost.toFixed(4)}`} />
      </div>

      <div className="surface mt-8 max-w-5xl divide-y divide-border">
        {rows.length === 0 ? (
          <div className="p-6 text-sm text-muted">
            No agent invocations recorded yet. Trigger an onboarding interview, drop, or intro to populate this view.
          </div>
        ) : (
          rows.map((r, i) => <LogRow key={i} row={r} />)
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: "error" }) {
  return (
    <div className="surface p-3">
      <p className="text-xxs uppercase tracking-wider text-muted font-semibold">{label}</p>
      <p className={`text-lg font-mono mt-1 ${accent === "error" ? "text-error" : "text-ink"}`}>
        {value}
      </p>
    </div>
  );
}

function LogRow({ row }: { row: Row }) {
  if (row.kind === "safety_block") {
    return (
      <div className="px-4 py-3 hover:bg-bg/50 flex items-start gap-3 text-sm">
        <Pill size="sm" accent>safety_block</Pill>
        <span className="font-mono text-xs text-muted">{row.ts}</span>
        <span className="text-error font-mono text-xs">risk {row.risk_score ?? "n/a"}</span>
        <span className="text-ink/80 text-xs flex-1 truncate">
          {row.reasons?.join(", ")}
        </span>
      </div>
    );
  }

  return (
    <div className="px-4 py-3 hover:bg-bg/50 flex items-start gap-3 text-sm">
      <Pill size="sm" accent={row.via === "claude"}>
        {row.via}
      </Pill>
      <span className="font-mono text-xs text-muted">{row.ts}</span>
      <span className="font-mono text-xs text-ink">{row.agent}</span>
      {row.ok ? null : <Pill size="sm">err</Pill>}
      <span className="text-xs text-muted ml-auto whitespace-nowrap">
        {row.tokens_in ?? 0}/{row.tokens_out ?? 0} tok · {row.latency_ms ?? 0}ms
        {(row.cost_usd ?? 0) > 0 ? ` · $${(row.cost_usd ?? 0).toFixed(4)}` : ""}
      </span>
    </div>
  );
}
