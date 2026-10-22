# RULE 30: Code Style

- TypeScript strict. No `any` (use `unknown` + narrowing). No `@ts-ignore`
  without a comment explaining why.
- Zod schemas in `src/lib/validators` are the single source of truth;
  derive types with z.infer. Never duplicate validation.
- Match neighboring code: before writing a new module, read one sibling and
  mirror its patterns (imports order, error handling, naming).
- Naming: handlers `handleX`, hooks `useX`, schemas `xSchema`, no abbreviations.
- Errors: throw typed errors at boundaries; never swallow; no console.log in
  committed code (use the project logger).
- Comments explain WHY, not what. No banner comments, no commented-out code.
- Imports: node built-ins → external → `@/` internal → relative.
- Server Components by default. Add `"use client"` only for interactivity/motion, as low in the tree as possible.
