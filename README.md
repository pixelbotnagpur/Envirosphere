# Envirosphere

Premium redesign of [envirosphere.co.in](https://envirosphere.co.in/) for Envirosphere
Consultant & Engineers. Single Next.js 16 app with Tailwind v4, Motion and Lenis.

- Spec: `PROJECT-REQUIREMENTS.md`
- Agent entry points: `CLAUDE.md` (Claude Code), `AGENTS.md` (Antigravity/others)
- Binding rules: `.agent/rules/`
- Architecture brief: `docs/ai-context.md`

## Agent tooling
```
.agent/rules/        numbered rules (source of truth)
.agent/workflows/    Antigravity /ship /review /handoff
.claude/commands/    Claude Code /ship /review /handoff
.claude/agents/      explorer, test-runner, reviewer subagents
.claude/settings.json  permissions
.mcp.json            project MCP servers (Playwright only)
```
