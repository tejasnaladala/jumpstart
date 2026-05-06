// Common types for the agent layer.

export type AgentDef<I, O> = {
  name: string;
  description: string;
  model: "claude-sonnet-4-5" | "claude-haiku-4-5";
  /** Build the system prompt. Includes voice rules and rubric. */
  system: () => string;
  /** Build the user message from the typed input. */
  user: (input: I) => string;
  /** Parse the model's output into the typed output. Throws on contract violation. */
  parse: (raw: string) => O;
  /** Eval cases path relative to repo root, used by evals/run-all.ts. */
  evalCasesPath?: string;
};

export const VOICE_RULES = `
Voice rules. Follow strictly in any user-facing string.
- No em dashes anywhere. Use commas, periods, parentheses, or semicolons.
- No "not X, not Y, but Z" parallel constructions.
- No "stands as", "serves as", "represents a", "marks a", "showcases", "highlights".
- No "vibrant", "rich", "groundbreaking", "nestled", "in the heart of".
- No "tapestry", "interplay", "intricate", "delve", "underscore", "landscape" used abstractly.
- No "It's not just X, it's Y" constructions.
- No emoji decoration of headings or bullets.
- No "let me know", "I hope this helps", "great question".
- Sentences vary in length. Have opinions. Be specific.
- Sentence-case for any heading you produce.
`.trim();
