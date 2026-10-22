# RULE 80: Docs & Communication

- Update docs/ai-context.md when architecture changes (new route group, new
  service, changed data flow) — one or two lines, keep it under 600 tokens.
- Exported helpers in `src/lib` get a one-line JSDoc: what + gotcha.
- PR/response summaries: what changed, why, how to verify, risks. <= 8 lines.
- Don't create README/docs files unprompted. Offer instead.
