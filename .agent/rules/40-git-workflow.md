# RULE 40: Git Workflow

- Conventional commits: feat|fix|chore|refactor|test|docs(scope): message.
  Subject <= 72 chars, imperative. Body only when the WHY isn't obvious.
- One logical change per commit. Never mix refactor + behavior change.
- Never: force-push, amend published commits, commit .env/secrets/generated
  files, or run destructive git commands (reset --hard, clean -fd) without
  explicit user confirmation.
- Branch names: feat/<slug>, fix/<slug>.
- Before claiming "done": git status must be clean of unintended files.
