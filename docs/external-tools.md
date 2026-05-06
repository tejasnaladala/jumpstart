# External tools and references

This file documents the external repos that have been embedded into the Jumpstart development workflow, where they live, what they do, and when to reach for them.

## gstack (garrytan/gstack)

Garry Tan's open-source software factory for Claude Code. 23+ slash commands plus power tools (browse, design, make-pdf), all designed for the AI-first builder workflow.

**Installed at:** `~/.claude/skills/gstack/` (global)
**Mode:** team-required for this repo (verified by `.claude/hooks/check-gstack.sh`)
**Source:** https://github.com/garrytan/gstack

### What we get

Slash commands now available in any Claude Code session for this project:

- Planning: `/office-hours`, `/plan-ceo-review`, `/plan-eng-review`, `/plan-design-review`, `/plan-devex-review`, `/autoplan`
- Design: `/design-consultation`, `/design-shotgun`, `/design-html`, `/design-review`
- Quality: `/review`, `/qa`, `/qa-only`, `/devex-review`, `/cso`, `/health`
- Shipping: `/ship`, `/land-and-deploy`, `/canary`, `/document-release`, `/landing-report`
- Debugging: `/investigate`, `/retro`, `/learn`
- Browser CLI: `/browse` (Playwright-backed headless browser, used by `/qa`, `/dogfood`, `/scrape`)
- Utilities: `/context-save`, `/context-restore`, `/freeze`, `/guard`, `/unfreeze`, `/careful`, `/codex`, `/skillify`, `/scrape`, `/make-pdf`, `/pair-agent`
- Performance: `/benchmark`, `/benchmark-models`

### Recommended call sites for Jumpstart

| Phase | Skill | Why |
|---|---|---|
| Spec done, planning impl | `/autoplan` | Multi-perspective review of the design before any code |
| Each new agent design | `/plan-eng-review` | Lock the agent prompt I/O before writing it |
| Each new screen | `/plan-design-review` | Catch UX issues before pixel work starts |
| Match Explainer eval suite | `/autoresearch` (driveline) | Tune the prompt against golden cases |
| Before any deploy | `/qa` | Real browser tests against staging |
| Before any merge | `/review` | Diff review with security and quality checks |
| Before launch | `/cso` | Security audit (OWASP + STRIDE) |
| Each Friday | `/retro` | Weekly engineering retrospective |
| Anything broken | `/investigate` | Systematic root-cause debugging |

### Update path

```bash
cd ~/.claude/skills/gstack && git pull && ./setup
```

Or just use `/gstack-upgrade` from any Claude Code session.

## autoresearch-claude-code (drivelineresearch/autoresearch-claude-code)

Autonomous experiment loop for Claude Code. Give it a goal and a measurable metric, it loops forever trying ideas, keeping winners, discarding losers. Port of pi-autoresearch as a pure Claude Code skill (no MCP server).

**Installed at:** `~/.claude/skills/autoresearch/` and `~/.claude/commands/autoresearch.md` (global)
**Hook script:** `~/.claude/hooks/autoresearch-context.sh` (present, not yet wired into settings.json)
**Source:** https://github.com/drivelineresearch/autoresearch-claude-code
**Reference clone:** `external/inspection/driveline-autoresearch/`

### When to use it for Jumpstart

The matching system, the explanation copy, the safety classifier thresholds, and the onboarding flow are all things you can frame as a single metric and let autoresearch optimize.

Concrete experiments worth running once we have data:

| Target | Metric | How to measure |
|---|---|---|
| Match Explainer prompt | golden-set pass rate | 50 known good and 50 known bad pairs, score how often it picks correctly |
| Matchmaker scoring weights | request rate per drop | replay last 200 drops with new weights, count likely requests |
| Onboarding Interviewer flow | card completion rate | run synthetic users through, score completeness |
| Safety Classifier threshold | false positive vs false negative | labeled abuse set, sweep threshold |
| Opener Drafter style | copy-and-use rate | A/B prompts on real users, measure outcome |

### Activating the autoresearch hook

The hook is dormant by default. To activate it during a live experiment, add to the project `.claude/settings.json` `UserPromptSubmit` array:

```json
{"type": "command", "command": "~/.claude/hooks/autoresearch-context.sh"}
```

Then `/autoresearch <goal>` and let it run. Disable the hook between experiments to keep prompts clean.

### Update path

The current install was a manual copy. To switch to a symlinked git checkout for upgrades:

```bash
rm -rf ~/.claude/skills/autoresearch
cd /c/jumpstart/external/inspection/driveline-autoresearch && ./install.sh
```

## karpathy/autoresearch (reference only)

Andrej Karpathy's original autoresearch repo, where the pattern came from. Not installed because the actual code is for ML training (PyTorch, single H100 GPU, edits a `train.py` to optimize val_bpb). Jumpstart is not training an LLM.

**What we keep from it:** the pattern. The `program.md` file as the agent-readable spec, the fixed-budget eval loop, the single-file iteration scope. Section 11 of our design spec (software factory plan) is structured the same way: spec plus eval suite plus build loop, with humans editing the spec and the agent iterating the implementation.

**Source:** https://github.com/karpathy/autoresearch
**Reference clone:** `external/inspection/karpathy-autoresearch/`

If you ever need the original training code (you probably won't for Jumpstart), reference it directly from the clone. Do not vendor it into the project.

## Inspection clones

All three repos have read-only clones at `external/inspection/`. Gitignored, kept locally for reference. Safe to delete if disk pressure, just re-clone when needed.

```bash
external/inspection/
├── gstack/                     # full gstack source for reference
├── karpathy-autoresearch/      # ML training pattern source
└── driveline-autoresearch/     # Claude Code plugin source
```

## Skills not yet installed but worth considering

These are mentioned in the spec or fit the AI-first architecture but are out of scope for v1 of the install. Decide later.

- An eval-harness skill for the agent eval suites (could be hand-rolled or use one of the marketplace ones)
- A scheduled-task tool for the weekly Wednesday drop cron
- An MCP integration for Supabase if direct DB access from Claude becomes useful
