# Agent Instructions (universal)

This file is the entry point for ANY coding agent (Antigravity, Claude Code,
aider, etc.). Claude Code users: CLAUDE.md mirrors this and adds Claude-specifics.

## Read first
1. `CLAUDE.md` — project facts, commands, hard rules
2. `.agent/rules/*.md` — numbered, binding rules (00 = highest level)
3. `docs/ai-context.md` — architecture brief (only when task needs it)

## Antigravity specifics
- Workspace rules auto-load from `AGENTS.md` + `.agent/rules/*.md` (this repo's layout).
- Workflows: `.agent/workflows/{ship,review,handoff}.md` — invoke as /ship /review /handoff.
- MCP servers: configure in Antigravity settings (it does not read `.mcp.json`);
  follow `.agent/rules/65-mcp-policy.md` either way.
- Ignore `.claude/` and `CLAUDE.md` Claude-Code specifics; rules here are the contract.

## Operating contract
- Plan before multi-file changes; present the plan; wait for approval.
- Small diffs. One concern per change. Never reformat unrelated code.
- Run tests for what you touched; report pass/fail honestly.
- If a task failed twice, STOP: summarize attempts + errors, ask for direction.
- Prefer editing existing files over creating new ones. No speculative abstractions.

## Token discipline (applies to all agents)
- Read the files you need, not the repo. Ask for paths if unsure.
- Summarize verbose tool output; never paste full logs into conversation.
- Keep responses to: what changed, why, what to verify. No restating requirements.
