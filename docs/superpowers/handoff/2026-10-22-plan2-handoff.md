# Handoff: finish Plan 2 (Motion kit + Home page), Tasks 3–11

Written 2026-10-22 by the controlling Claude session. You are taking over execution; the same controller will **review everything you produce when you are done**. Read this file fully before touching code.

---

## 0. Read order (15 minutes, do not skip)

1. This file.
2. `CLAUDE.md` (project facts, hard rules) and `PROJECT-REQUIREMENTS.md` (spec; §3 non-negotiables, §5 features).
3. `.agent/rules/*.md`, binding: 31 tokens/colors/fonts, 32 components, 33 content-driven, 34 motion, 60 security, 70 structure.
4. **The plan you execute:** `docs/superpowers/plans/2026-10-22-motion-and-home.md` (Plan 2). Each task has exact files, interfaces, test code and implementation code. Follow it; the deviations below override it.
5. `.superpowers/sdd/progress.md` (local, git-ignored ledger with per-task decisions and Minor findings) and `.superpowers/sdd/constraints.md` (Plan 2 global constraints, verbatim from the plan).
6. `content/README.md` (owner guide) and `docs/ai-context.md` (architecture brief).

## 1. What this project is

Premium static redesign of **envirosphere.co.in** (Envirosphere Consultant & Engineers, Pune; environmental clearances and compliance; NABET Cat A). Single Next.js 16.4.2 app (**not a monorepo**), `output: "export"` + `trailingSlash: true`, deployed to **Hostinger** as static files from `out/`. No login, no database, no server. Forms (Plan 4) go to Google Sheets via Apps Script. Design reference: https://neiden.framer.media/ (editorial minimalism; do not copy). Owner edits content in `content/` (YAML/Markdown) and `public/media/`, never code.

Stack: Next.js 16.4, React 19.2, TypeScript strict, Tailwind v4 (CSS-first tokens in `src/app/globals.css`), Motion 14 (`motion/react`), Lenis 1.3, CVA + Radix Slot, lucide-react, Zod 4, `yaml`, Vitest + Testing Library, Playwright, pnpm, Node 24, Windows 11 + Git Bash.

## 2. Repository state right now

- Branch **`feat/home`** (checked out). `main` = Plan 1 (Foundation), already merged; never commit to `main`.
- HEAD **`26c0155`**. Plan 2 commits so far (all reviewed and approved):
  - `6533a74` hydration-safe motion base, hero `rise` utility, token fixes
  - `7848e09` fix: Reveal `amount: "some"`, `rise` fill-mode `backwards`
  - `26c0155` interface strings moved to content; header/footer/section-label hardening
- Verification at HEAD: **154 unit tests, lint, typecheck, `pnpm content:check`, `pnpm build`, e2e 10/10 all green.**
- Working tree clean. `.superpowers/` and `.claude/session-handoff.md` are git-ignored.

### Plan 2 task status

| Task | Content | Status |
|---|---|---|
| 1 | Motion foundation, tokens, `rise` utility | **done** |
| 2 | Chrome strings → content, header/footer/SectionLabel hardening | **done** |
| 3 | SplitText, ScrollWords, Counter | todo |
| 4 | Parallax, Marquee, ScrollStory (+ `usePinned`) | todo |
| 5 | Real assets: 39 client logos + about photo; `sharp` | todo |
| 6 | Home schema, `home.yaml`, 13 services, loaders, `getImageAsset` | todo |
| 7 | Hero, About sections | todo |
| 8 | ServicesIndex, Stats sections | todo |
| 9 | Clients marquee, pinned Process sections | todo |
| 10 | Testimonials, ContactCta; compose `src/app/page.tsx` | todo |
| 11 | e2e, browser verification (screenshots), docs | todo |

## 3. Decisions the user already made (binding; do not relitigate)

- **No monorepo.** Static export to Hostinger. No login. Forms → Google Sheets (Plan 4).
- **Fonts:** exactly two: **Syne Regular (400) for headings** (`font-heading`) and **Manrope 300/400 for body** (`font-body`). The user rejected Fraunces and wanted "Vocago" (paid license) → chose Syne. Body weight never above 400.
- **Palette:** Forest `primary`, Sage `secondary`, Ochre `accent`, Bone `background`, Sand `surface`, Bark `foreground`, Lichen `muted-foreground`, Linen `border`, Clay `destructive` (`oklch(0.53 0.16 30)`). "Change card to primary" means swap the semantic utilities. Values live only in `globals.css`.
- **Focus ring:** one global two-tone ring (Forest outline + Bone band), **unlayered** at the bottom of `globals.css`. Components never add focus ring/shadow/outline utilities.
- **No Sparkles icons** (`Sparkles`, `Sparkle`, `WandSparkles`, ✨) anywhere.
- **Premium scroll-driven design**: Lenis smooth scroll, Motion animations, trending editorial look.
- **Content from the current site only; never invent.** Drafted wording is flagged `TODO(content)`.
- **Standing permission (2026-10-22):** auto-fix owner-safety / robustness findings from reviews without asking. **Ask the user** for design, scope or visible-behavior changes, new dependencies beyond those the plan names, and anything destructive.
- **Approved by the user's "continue" on 2026-10-22:** the plan's new dev dependency `sharp` and downloading assets from the live site.
- Commit trailer: `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`; Conventional Commits; subject ≤ 72 chars; never commit `.env`, `out/`, `.next/`, `node_modules/`.

## 4. Deviations and clarifications that override the plan text

1. **`getImage` memoization** was deliberately dropped (YAGNI). Do not add it.
2. **Task 1 outcomes already in the code:** `Reveal` uses `viewport={{ once: true, amount: "some" }}` (not 0.2) so tall elements can never stay hidden; `@utility rise` uses fill-mode `backwards` (not `both`).
3. **Task 6:** the unit test for `toImageAsset` goes in `src/lib/content/media.test.ts`. `getImageAsset` is exported from `src/lib/content/index.ts`.
4. **Task 10 replaces `src/app/page.tsx` wholesale.** It currently still wraps the hero in `Reveal` and uses `className="text-secondary"` on a `SectionLabel`; both disappear because the new `Hero` section uses CSS `rise` classes and `tone="inverse"`. Until Task 10 lands, the home page is the old placeholder; that is expected.
5. **The task brief files in `.superpowers/sdd/task-N-brief.md` for N = 3…10 are STALE (from Plan 1).** They share names with the Plan 2 briefs and were not overwritten yet. Regenerate each one from the Plan 2 file before use:
   `bash "C:/Users/user/.claude/plugins/cache/superpowers-dev/superpowers/6.1.1/skills/subagent-driven-development/scripts/task-brief" docs/superpowers/plans/2026-10-22-motion-and-home.md N`
   Or simply read the task's section in the plan file directly. **Never work from a brief you did not just regenerate.**
6. **Asset download (Task 5):** plain `curl` is blocked by the old site's ModSecurity (`Not Acceptable`). Browser-like `fetch` headers usually work; the script falls back to Playwright's `request`. If downloads still fail, stop and tell the controller; do not substitute other images.
7. **Hero fit (Task 11 Step 2):** if the hero CTA is not inside a 1440×900 viewport, lower only the **max** of `--text-display` from `9.5rem` to `7.5rem`. That is the single allowed design-token change; anything else visual goes to the controller.
8. Plan 2's Home deliberately has **no FAQ section** (the old site has none).

## 5. Architecture you need in your head

```
content/                    owner-editable YAML + Markdown (site.yaml, media.yaml, pages/home.yaml, services/*.md)
public/media/               images (brand/, clients/, images/), referenced ONLY by media.yaml keys
src/app/                    globals.css (ALL tokens + rise/marquee utilities + focus ring), layout.tsx, page.tsx, not-found.tsx
src/lib/content/            read.ts (yaml/md readers, ContentError), media.ts (resolveMedia, toImageAsset), index.ts (loadSite/Home/Media/Services/All, getImage, socialLinks)
src/lib/validators/content.ts   Zod schemas (site incl. `ui`, media, home, service front matter)
src/lib/{utils.ts,motion.ts,links.ts}   cn() (tailwind-merge taught our tokens), duration/ease/lenisOptions, telHref/mailtoHref
src/components/ui/          Button (CVA), Container, SectionLabel (tone: muted|inverse)
src/components/motion/      LenisProvider (MotionConfig reducedMotion="user"), Reveal
src/components/layout/      Header (labels prop, Escape closes menu), Footer (labels prop, <nav> explore)
src/hooks/                  use-hydrated.ts (useSyncExternalStore)
tests/unit/                 tokens.test.ts, fonts.test.ts, rules.test.ts (repo-wide guardrails), real-content.test.ts (Task 6), helpers/{tree,fixtures,oklch}.ts
tests/e2e/                  smoke.spec.ts (+ helpers/site.ts reads content/site.yaml), home.spec.ts (Task 11)
```

Hard layering rules: `ui` and `motion` never import `sections`, `app` or `lib/content`; `sections` receive props (type-only imports from `@/lib/validators/content` are fine); client components receive plain props, never loaders.

## 6. How to work (per task)

For each of Tasks 3–11, in order (dependencies are linear):

1. Read the task section in the plan. Confirm you are on `feat/home` (`git branch --show-current`).
2. **TDD**: write the plan's failing tests, run them and see RED, implement, see GREEN.
3. Before every commit run: `pnpm lint && pnpm typecheck && pnpm test`; for Tasks that change content or CSS also `pnpm content:check && pnpm build`; run `pnpm test:e2e` at Task 11 and after any task that changes the page shell.
4. One commit per task using the exact message in the plan (two `-m` flags; the second is the trailer). Never amend published commits; never force-push; never use `git add -A` blindly: check `git status` first.
5. Write a short report per task to `.superpowers/sdd/task-N-report.md` (what changed, RED/GREEN evidence, deviations, concerns) and append one line to `.superpowers/sdd/progress.md`: `P2 Task N: complete (commit <sha>)`.
6. If a task fails the same way twice, **stop** (rule 00): write down what you tried, the exact error and your hypotheses, and ask the controller/user. Do not weaken tests, `.skip` anything, or loosen `rules.test.ts`.
7. Do not merge, rebase onto `main`, or push anywhere. Do not add dependencies except `sharp` (Task 5).

If you can spawn subagents, the proven loop is: implementer (Sonnet) → review package (commit list + stat + `git diff -U10`, lockfile excluded) → reviewer (Sonnet) → fix subagent for Critical/Important findings → re-review. If you cannot, do it inline but still self-review each diff against the plan and `.superpowers/sdd/constraints.md` before committing.

## 7. Verification commands (what "green" means)

```bash
pnpm lint && pnpm typecheck && pnpm test        # unit (currently 154)
pnpm content:check                              # "Content OK: N media items, M services"
pnpm build                                      # static export; out/index.html, out/404.html, out/.htaccess must exist
pnpm test:e2e                                   # builds + serves out/ on :4173 (desktop + mobile projects)
```
Screenshots go to the session scratchpad: `C:\Users\user\AppData\Local\Temp\claude\d--Pixelbot-Clients-Envirosphere-Envirosphere-app-new\e92c4810-8c98-4928-b817-776aab111b72\scratchpad\home\` (create it). Inspect them with an image-capable Read; report concrete defects and list design judgments for the controller instead of changing them.

## 8. Gotchas learned the hard way

- **Guardrail tests** (`tests/unit/rules.test.ts`) fail on: bold weights (`font-medium|semibold|bold|…`, `font-[…]`), Sparkle icons/emoji, raw hex/rgb/hsl/oklch/lab/lch/hwb/color() in ts/tsx, `[Npx]` values, primitive color utilities (`bg-forest-700`), `focus:`/`focus-visible:`/`focus-within:` ring/shadow/outline, `outline-none|hidden|0`, framer-motion imports, server-only APIs, and layering violations. Fix the code, never the test.
- **Tailwind v4:** `--color-*`/`--font-*` defaults are reset, so only project tokens generate utilities. Arbitrary values like `max-h-[calc(100dvh-var(--spacing-header))]` and `duration-(--duration-base)` are fine; `z-(--z-header)` is the token syntax. `cn()` knows our custom tokens (spacing `gutter|section|header`, radii, `tracking-label`, `shadow-card`, `ease-*`, type scale); if you add a token utility, extend `src/lib/utils.ts` and its test.
- **Hydration:** anything animated below the fold may be `opacity: 0` in SSR HTML; the `<noscript>` rule in `layout.tsx` (`[data-reveal]{opacity:1!important;transform:none!important}`) un-hides it without JS. New hidden-initial components must carry `data-reveal`. **Above-the-fold content must use the CSS `rise` classes, never `Reveal`.**
- **Reduced motion:** `MotionConfig reducedMotion="user"` handles Motion transforms; `Counter` and `ScrollWords` check `useReducedMotion`; `ScrollStory` falls back to the stacked layout; `Marquee`/`rise` are CSS-gated.
- **jsdom lacks** `IntersectionObserver`, `ResizeObserver`, `matchMedia` (stubbed in `tests/setup.ts`). Add further stubs there if Motion needs them and say so in the report. `next/link` is mocked in header/footer tests (jsdom strips trailing slashes).
- **Zod 4:** `z.url()`, `z.email()` top-level; record keys with regex failures surface via `invalid_key` (already handled in `validate`).
- **Content system strictness is a feature:** image keys, exact-case file names, unreadable images, duplicate service `order`, and non-`.md` files in `content/services/` all fail the build with plain messages. Keep that; owners edit these files.
- **Windows:** CRLF/LF warnings from git are noise. `node_modules` may be unreadable to some agent tools. Playwright's cwd is the repo root; `pnpm preview` serves `out/` on :4173; stop any preview server you start.
- `Next/image` runs `unoptimized` (static export); `priority` on the header logo produced no warning at build.
- Do not touch `main`, `.env*`, lockfiles (except via `pnpm add`), `out/`, `.next/`.

## 9. Known leftovers (Minor findings parked for the final review; do not chase unless a task touches them)

`--stagger` not mirrored in `src/lib/motion.ts`; `Reveal` omit-list lacks `drag*`/`layoutId`/`transformTemplate`; no `.gitattributes` (add `* text=auto eol=lf` at the end if the controller agrees); `Button` has no default `type="button"` (Plan 4); `index="404"` literal in `not-found.tsx`; `media.yaml` logo `alt` is unused now (header logo decorative); e2e helper uses a cwd-relative path; default Tailwind `text-xs`/`rounded-lg` utilities still exist; `loadAll` still re-probes images twice; `Thumbs.db` in `content/services/` would fail the build (allowlist in Plan 3). Full list: `.superpowers/sdd/progress.md`.

## 10. Items that need the **user**, not you

- Wording of the drafted **Process** steps and the **service summaries** (`TODO(content)`): flag them in your final summary; do not "improve" copy.
- **Testimonials**: quotes copied as published; the clients' consent is unconfirmed.
- **Hero size** if it does not fit at 1440×900 (only the `--text-display` max may change, see §4.7).
- Any visual judgment call, new dependency, new section, or content invention.

## 11. Definition of done for Plan 2

All of: Tasks 3–11 committed on `feat/home` with the plan's messages; the §7 commands green; `out/` contains the Home page with 13 service links and 39 client logos; the three screenshots + process-story screenshots taken and inspected, with defects fixed or listed; `content/README.md` and `docs/ai-context.md` updated (Task 11); `.superpowers/sdd/progress.md` has a line per task; per-task reports exist.

## 12. When you finish, hand back to the controller with

1. The commit list (`git log --oneline 26c0155..HEAD`).
2. The output of the §7 commands (counts, not logs).
3. Paths of the per-task reports and the screenshots.
4. Every deviation from the plan, every thing you could not verify, and every item from §10.

The controller then reviews task by task (diff packages per commit range), runs a final whole-branch review, and decides merge vs fixes. Do not start Plan 3.

## 13. After Plan 2 (context only)

Plan 3: About, Services index + 13 service pages (text from the old site), Why Us, Gallery, Downloads, Careers, Contact page shell, real logo and brand assets. Plan 4: forms → Google Sheets (Apps Script, Turnstile, CV upload), `Button` default type. Plan 5: SEO (sitemap, robots, JSON-LD, canonical, raster OG), image optimization, CSP, Lighthouse/a11y, Hostinger deploy guide.
