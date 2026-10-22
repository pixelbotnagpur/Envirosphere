# RULE 20: Token Discipline

Context is the cost. Keep the window small and relevant.

## Reading
- Read named files/ranges, not directories. Never "look around the repo".
- Filter before reading: grep/tail logs, `git diff --stat` before full diffs.
- Big read-only research (>3 large files) → explorer subagent, summary back.

## Writing
- Output diffs / changed functions only. Never re-print unchanged code.
- No restating requirements, no long preambles, max ~10 lines of explanation.

## Session
- Suggest /clear when the user switches to an unrelated task.
- Suggest /compact at phase completion (feature done, bug fixed) — not at 95%.
- Before a long session ends: offer to write .claude/session-handoff.md
  (decisions, files changed, state, next steps — under 500 tokens).

## Never
- cat entire logs/lockfiles/generated files into context.
- Load skills or MCP tools not needed for the current task.
- Send full file contents when a 30-line excerpt answers the question.
