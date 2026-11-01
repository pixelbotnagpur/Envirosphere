# RULE 70: Project Structure (single Next.js app, static export, NOT a monorepo)

- One `package.json` at the root. No pnpm workspaces, Turborepo, `apps/` or `packages/`.
- `next.config.ts`: `output: "export"`, `trailingSlash: true`, images handled at build.
  Never add server-only features (server actions, route handlers using the request,
  middleware/proxy, ISR, `cookies()`/`headers()`). They break the export.
- Hosting is Hostinger Node.js: `server.mjs` (repo root) serves the static `out/`. `server.mjs` and
  `scripts/` are the only allowed Node files outside `src/`. They use `node:` built-ins only (no
  runtime dependencies), and this does not allow any Next.js server feature.
- Layout: `content/` (owner-editable), `public/media/`, `integrations/google-sheets/`,
  `src/app`, `src/components/{ui,motion,sections,layout}`, `src/lib/{content,forms,validators}`,
  `src/hooks`, `tests/`.
- Import via alias `@/*` → `src/*`. No `../../..` chains.
- Dependency direction: `ui` and `motion` never import from `sections`, `app` or
  `lib/content`. `sections` compose `ui` + `motion` and receive content via props.
- Adding a dependency: `pnpm add <dep>` only after it is justified in the plan (rule 60).
