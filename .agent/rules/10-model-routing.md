# RULE 10: Model & Effort Routing

Right model, right effort, per task. Escalate on evidence, never by default.

## Defaults
- Main session: sonnet (opusplan if Opus is in the /model picker).
- Subagents: haiku (CLAUDE_CODE_SUBAGENT_MODEL). Don't override upward casually.
- Effort: adaptive/medium for routine work.

## Route DOWN (haiku / haiku subagent)
Log & test-output analysis, grep-style exploration, dependency lookups,
renames, boilerplate, docstrings, commit messages, "how does X work" research.

## Stay on sonnet
Implementation, refactors, tests, integrations, migrations, review, debugging
with a known repro.

## Route UP (opus / effort high) only if:
1. Architectural decision with cross-cutting consequences (rendering strategy, motion architecture, adding CMS/auth)
2. Same bug failed twice on sonnet → escalate WITH failure history attached
3. Security review of form handling / the Apps Script integration
4. Ambiguous requirements needing tradeoff analysis, not code
Then return to sonnet for execution.

## Effort before model
Stuck once → /effort high. Still stuck → /model opus. Trivial task → /effort low OK.

## Anti-patterns
Opus for CRUD/styling/config. Sonnet subagents for file reading. Escalating
without failure evidence. Lowering effort on debugging or architecture.

## Before escalating to opus
/compact first — the expensive model should read a clean context.
