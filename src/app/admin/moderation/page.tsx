import { Pill } from "@/components/primitive/Pill";

// In production this reads from reports + intros where action is flagged or
// safety_block. For local stub mode, we render a representative queue.

const MOCK_QUEUE = [
  {
    id: "case_001",
    kind: "intro_block",
    sender_id: "u_test_actor",
    recipient_id: "u_maya",
    risk_score: 92,
    reasons: ["link spam pattern", "external URL"],
    snippet: "Earn $5000 from home, click http://...",
    created_at: "2026-05-06T07:00:00Z",
  },
  {
    id: "case_002",
    kind: "report",
    reporter_id: "u_devansh",
    reported_user_id: "u_someone",
    reason: "Sent the same template to 12 founders",
    classifier_score: 65,
    created_at: "2026-05-06T05:30:00Z",
  },
  {
    id: "case_003",
    kind: "verification",
    user_id: "u_pending",
    method: "email_subject",
    classifier_score: 22,
    submitted_at: "2026-05-06T03:00:00Z",
  },
];

export default function ModerationQueuePage() {
  return (
    <div className="container-wide">
      <div className="flex items-baseline justify-between flex-wrap gap-3">
        <div>
          <p className="text-xxs uppercase tracking-wider text-accent font-semibold">
            Trust and safety
          </p>
          <h1 className="text-3xl font-semibold tracking-tight mt-1">Moderation queue</h1>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted">
          <span>SLA: under 4 hours</span>
          <span className="opacity-50">·</span>
          <span>{MOCK_QUEUE.length} open</span>
        </div>
      </div>

      <div className="mt-6 max-w-4xl flex flex-col gap-3">
        {MOCK_QUEUE.map((c) => (
          <article key={c.id} className="surface p-4 hover:shadow-card transition-shadow">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <Pill size="sm" accent>{c.kind}</Pill>
                <span className="text-xs text-muted font-mono">{c.id}</span>
                <span className="text-xs text-muted">{relativeFor(c.created_at ?? c.submitted_at ?? "")}</span>
              </div>
              <div className="flex items-center gap-2">
                <button className="text-xs px-3 h-8 rounded-md border border-border bg-surface hover:border-ink/40">
                  Approve
                </button>
                <button className="text-xs px-3 h-8 rounded-md bg-error text-white hover:bg-error/90">
                  Block
                </button>
              </div>
            </div>
            <CaseBody c={c} />
          </article>
        ))}
        <p className="text-xs text-muted text-center mt-4">
          Stub queue. Real queue reads from reports and intros where the safety classifier
          recommended flag, block, or escalate.
        </p>
      </div>
    </div>
  );
}

function CaseBody({ c }: { c: (typeof MOCK_QUEUE)[number] }) {
  if (c.kind === "intro_block") {
    return (
      <div className="mt-3 pt-3 border-t border-border text-sm">
        <div className="flex items-center gap-2 text-muted text-xs">
          <span>{c.sender_id}</span>
          <span>→</span>
          <span>{c.recipient_id}</span>
          <span className="ml-auto text-error font-mono">risk {c.risk_score}</span>
        </div>
        <p className="text-ink italic mt-2">"{c.snippet}"</p>
        <p className="text-xs text-muted mt-2">
          Reasons: {c.reasons?.join(", ")}
        </p>
      </div>
    );
  }
  if (c.kind === "report") {
    return (
      <div className="mt-3 pt-3 border-t border-border text-sm">
        <div className="flex items-center gap-2 text-muted text-xs">
          <span>reporter {c.reporter_id}</span>
          <span>against {c.reported_user_id}</span>
          <span className="ml-auto text-accent font-mono">classifier {c.classifier_score}</span>
        </div>
        <p className="text-ink mt-2">{c.reason}</p>
      </div>
    );
  }
  return (
    <div className="mt-3 pt-3 border-t border-border text-sm">
      <div className="flex items-center gap-2 text-muted text-xs">
        <span>user {c.user_id}</span>
        <span>method {c.method}</span>
        <span className="ml-auto text-success font-mono">low risk {c.classifier_score}</span>
      </div>
      <p className="text-muted mt-2 text-xs">Verification artifacts auto-delete in 24h.</p>
    </div>
  );
}

function relativeFor(iso: string) {
  if (!iso) return "unknown";
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "unknown";
  const diff = Math.max(0, Date.now() - t);
  const hr = Math.floor(diff / 3_600_000);
  if (hr < 1) return "<1h ago";
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}
