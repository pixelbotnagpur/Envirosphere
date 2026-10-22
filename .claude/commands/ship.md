Pre-commit pipeline for the current changes:
1. `pnpm lint` and `pnpm typecheck`.
2. Run tests for changed files (`pnpm test -- <file>`). If failures: show ONLY failing test names
   + error lines, fix, re-run. Max 2 fix cycles, then stop and report.
3. `git status` — flag any unintended files.
4. Propose a conventional commit message (do not commit without approval).
Report: pass/fail per step, files changed, commit message. No full logs.
