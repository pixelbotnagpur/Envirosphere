# Envirosphere

Premium redesign of envirosphere.co.in, the site of Envirosphere Consultant & Engineers
(Pune), a NABET-accredited environmental consultancy. Single Next.js app, not a monorepo,
**static export** (`out/`) hosted on Hostinger. No login, no DB, no server.
Full spec: `PROJECT-REQUIREMENTS.md`.

## Stack
Next.js 16.4.x (App Router, `output: "export"`) · React 19.2 · TypeScript strict · Tailwind v4
(`@theme` tokens) · shadcn/ui + Radix + CVA · Motion (`motion/react`) · Lenis (`lenis/react`)
· lucide-react · Zod + React Hook Form · YAML/Markdown content · Google Sheets forms
(Apps Script) · Vitest + Playwright · pnpm · Node 24 LTS

## Commands
- Dev: `pnpm dev` | Build (static → `out/`): `pnpm build` | Preview build: `pnpm preview`
- Content check: `pnpm content:check`
- Test: `pnpm test` (one file: `pnpm test -- <file>`) | E2E: `pnpm test:e2e`
- Typecheck: `pnpm typecheck` | Lint: `pnpm lint`

## Structure
- `content/` owner-editable YAML + Markdown (the "database") · `content/media.yaml` → `public/media/`
- `src/app/` routes + `globals.css` (ALL tokens) · `src/lib/content` build-time loaders
- `src/components/ui` primitives · `motion` animation wrappers · `sections` · `layout`
- `src/lib/validators` Zod (content + forms) · `integrations/google-sheets` Apps Script
- Alias `@/*` = `src/*`

## Brand shorthand (what "primary" etc. means)
- **Primary** = Forest green (`bg-primary`, text `primary-foreground` = Bone)
- **Secondary** = Sage (`bg-secondary`, text `secondary-foreground` = Bark)
- **Accent** = Ochre (`bg-accent`, text `accent-foreground`). Use sparingly.
- Background = Bone · Surface = Sand · Foreground = Bark · Border = Linen
- Fonts: **Syne** (`font-heading`, Regular 400 only) + **Manrope** (`font-body`, weights 300/400 only)

## Hard rules
- Follow all files in `.agent/rules/`. They are binding.
- Static export only: no server actions, route handlers, middleware, ISR (rule 70).
- All copy, contacts, links, numbers and media come from `content/`. Never hardcode in JSX (rule 33).
- Tokens only: no hex/px/font literals in components (rule 31). Palette + type in rule 31.
- Exactly 2 font families. Body weight never > 400 (no font-medium/semibold/bold on Manrope).
- Never use the `Sparkles`/`Sparkle`/`WandSparkles` icons or the ✨ emoji, anywhere.
- Motion: Lenis + Motion, scroll-driven, transform/opacity only, reduced-motion honored (rule 34).
- UI: reuse/extend `src/components/ui` via props/CVA, never copy-edit (rule 32).
- Never edit generated dirs (`.next/`, `out/`, `node_modules/`).
- Ask before: adding dependencies, deleting files, changing the content file shape.

## Context sources (read only when relevant)
- `docs/ai-context.md`: architecture brief
- `content/README.md`: owner's editing guide (keep in sync with schemas)
- `.claude/session-handoff.md`: last session state (if present, read first)

# Compact instructions
When compacting: preserve decisions made, files changed, failing test names,
and current task state. Drop exploration of unmodified files.
