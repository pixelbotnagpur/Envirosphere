# Envirosphere

Premium redesign of [envirosphere.co.in](https://envirosphere.co.in/) for Envirosphere
Consultant & Engineers. Single Next.js 16 app with Tailwind v4, Motion and Lenis.

- Spec: `PROJECT-REQUIREMENTS.md`
- Agent entry points: `CLAUDE.md` (Claude Code), `AGENTS.md` (Antigravity/others)
- Binding rules: `.agent/rules/`
- Architecture brief: `docs/ai-context.md`

## Before launch
Cloudflare Turnstile and the forms endpoint are launch requirements, not options. Follow the
launch checklist at the top of `integrations/google-sheets/SETUP.md`, then:

```
pnpm check:launch   # fails if NEXT_PUBLIC_FORMS_ENDPOINT or NEXT_PUBLIC_TURNSTILE_SITE_KEY is
                    # missing, the endpoint is the e2e test one, or a Cloudflare dummy key is used
pnpm build          # ends with check:out, which fails if out/ contains test-only values
```
`TURNSTILE_SECRET` lives in the Apps Script properties and cannot be checked from here.
`pnpm test:e2e` builds into `.next-e2e/` (never `out/`), so running tests cannot overwrite the
site you upload.

## Agent tooling
```
.agent/rules/        numbered rules (source of truth)
.agent/workflows/    Antigravity /ship /review /handoff
.claude/commands/    Claude Code /ship /review /handoff
.claude/agents/      explorer, test-runner, reviewer subagents
.claude/settings.json  permissions
.mcp.json            project MCP servers (Playwright only)
```
