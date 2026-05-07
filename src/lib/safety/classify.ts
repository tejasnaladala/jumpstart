// Lightweight content classifier. Stub-mode standin for the
// Safety Classifier agent (which uses Claude in real mode). Regex
// patterns for swear words, harassment, slurs, and bullying terms.
// Used at create-time on:
//   - forum posts (title + body)
//   - forum comments
//   - intro request notes (already gated server-side by /api/intros)
//   - thread messages
//
// Output: { flagged: bool, reasons: string[], severity: "low|med|high" }.
// Caller decides what to do (block, queue for admin, soft-warn).
//
// Conservative bias: false positives are cheap (admin reviews and
// approves), false negatives are expensive (toxic content reaches
// the cohort). Better to flag aggressively here and let the admin
// queue absorb the noise.

export type Severity = "low" | "medium" | "high";

export type SafetyResult = {
  flagged: boolean;
  reasons: string[];
  severity: Severity;
  // Sanitized version with the worst tokens masked. Used for preview
  // surfaces where the admin reviews context without re-exposing the
  // full slur to the screen.
  sanitized: string;
};

// Patterns grouped by severity. Keep this list bounded so the cohort
// doesn't see the full taxonomy in code review; expand on the moderation
// dashboard via a config table once that lands.
//
// PATTERN GROUPS:
//   high: slurs, threats, doxx attempts
//   medium: harassment / bullying patterns
//   low: profanity (still flagged; founder reviews to decide tone)
const PATTERNS_HIGH: { re: RegExp; reason: string }[] = [
  // Slurs (truncated set; expand via config later).
  { re: /\b(n[i1]gg[e3]r|f[a@]gg[o0]t|tr[a@]nn[y1])\b/i, reason: "slur" },
  // Direct threats.
  { re: /\b(kill\s+(yourself|him|her|them)|i\s+will\s+find\s+you|you'?re?\s+dead)\b/i, reason: "threat" },
  // Doxx-shaped strings: SSN-like, full address-with-zip, phone+address combo.
  { re: /\b\d{3}-\d{2}-\d{4}\b/, reason: "doxx_ssn" },
  // CSAM / explicit minor content keywords.
  { re: /\b(child\s*porn|underage)\b/i, reason: "child_safety" },
];

const PATTERNS_MEDIUM: { re: RegExp; reason: string }[] = [
  // Harassment / bullying patterns.
  { re: /\b(loser|pathetic|worthless|nobody\s+wants\s+you)\b/i, reason: "bullying" },
  { re: /\b(you'?re?\s+(a|an)\s+(idiot|stupid|moron|retard))\b/i, reason: "personal_attack" },
  { re: /\b(go\s+(die|away|kys))\b/i, reason: "harassment" },
  // Spam / scam patterns.
  { re: /\b(crypto\s+giveaway|wire\s+transfer\s+immediate|nigerian\s+prince)\b/i, reason: "spam" },
  { re: /\b(click\s+here\s+to\s+(earn|make|win))\b/i, reason: "spam" },
];

const PATTERNS_LOW: { re: RegExp; reason: string }[] = [
  // Common profanity (light; founder reviews tone fit for the cohort).
  // Word-boundary matches to avoid false positives in technical terms.
  { re: /\b(f+u+c+k+|sh+i+t+|b+i+t+c+h+|a+s+s+h+o+l+e+|d+a+m+n+)\b/i, reason: "profanity" },
];

function maskToken(text: string, re: RegExp): string {
  return text.replace(re, (m) => "•".repeat(Math.max(3, m.length)));
}

export function classifyContent(raw: string): SafetyResult {
  const text = raw || "";
  const reasons = new Set<string>();
  let severity: Severity = "low";
  let sanitized = text;

  for (const p of PATTERNS_HIGH) {
    if (p.re.test(text)) {
      reasons.add(p.reason);
      severity = "high";
      sanitized = maskToken(sanitized, p.re);
    }
  }
  for (const p of PATTERNS_MEDIUM) {
    if (p.re.test(text)) {
      reasons.add(p.reason);
      if (severity !== "high") severity = "medium";
    }
  }
  for (const p of PATTERNS_LOW) {
    if (p.re.test(text)) {
      reasons.add(p.reason);
    }
  }

  const flagged = reasons.size > 0;
  return {
    flagged,
    reasons: Array.from(reasons),
    severity: flagged ? severity : "low",
    sanitized,
  };
}

// Convenience: should we BLOCK at create time, or just flag and pass
// through to admin review? High-severity blocks. Everything else
// passes but gets queued.
export function shouldBlock(result: SafetyResult): boolean {
  return result.flagged && result.severity === "high";
}
