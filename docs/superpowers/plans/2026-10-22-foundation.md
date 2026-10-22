# Envirosphere Foundation Implementation Plan (Plan 1 of 5)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A buildable, statically exported Next.js shell for Envirosphere with the design tokens, base UI kit, Lenis smooth scroll, a validated file-based content system, header/footer and a placeholder home page, with executable guardrails for the project rules.

**Architecture:** Single Next.js 16 app (`output: "export"`). All design values are CSS tokens in `src/app/globals.css`. All copy and media live in `content/` (YAML + Markdown) and `public/media/`, are read and Zod-validated at build time by `src/lib/content`, and reach components as props. Rules are enforced by tests and ESLint, not memory.

**Tech Stack:** Next.js 16.4.2, React 19.2, TypeScript strict, Tailwind v4.3.3, Motion 14.6.0 (`motion/react`), Lenis 1.3.27, CVA + Radix Slot, lucide-react, Zod, `yaml`, Vitest + Testing Library, Playwright, pnpm, Node 24.

## Plan series (this file is Plan 1)
1. **Foundation (this plan):** scaffold, tokens, UI kit, Lenis + Reveal, content engine, header/footer, static build, guardrail tests.
2. **Motion kit + Home:** SplitText, Parallax, Pin, Marquee, Counter, ImageReveal; all Home sections.
3. **Inner pages + assets:** About, Services index + 13 service pages, Why Us, Gallery, Downloads, Careers (listing), Contact page shell; download assets from envirosphere.co.in into `public/media/`; migrate copy into `content/`.
4. **Forms:** form components, Zod schemas, Apps Script `Code.gs` + `SETUP.md`, Turnstile, CV upload.
5. **Launch:** SEO (sitemap, robots, JSON-LD), image optimization script, CSP header, Lighthouse/a11y pass, Hostinger deploy guide.

## Global Constraints

Every task's requirements include these (copied from `PROJECT-REQUIREMENTS.md` and `.agent/rules/`):

- Single Next.js app. **No monorepo**, no workspaces, no Turborepo, no `packages/`.
- Next.js **16.4.x**, `output: "export"`, `trailingSlash: true`. No server actions, route handlers, middleware, ISR, `cookies()`, `headers()`.
- Node 24, React 19.2, TypeScript strict (no `any`, no `@ts-ignore` without a reason), Tailwind v4 CSS-first `@theme`.
- Animation library: `motion` imported from `motion/react`. Never `framer-motion`. One Lenis instance (`lenis/react`).
- **Tokens only**: no hex/rgb/hsl, no `[12px]` arbitrary px, no inline font stacks in components (rule 31).
- **Exactly 2 font families**: Fraunces (`font-heading`, headings) and Manrope (`font-body`, weights 300 and 400 only). No `font-medium|semibold|bold|extrabold|black` anywhere in `src/`.
- **Banned icons**: `Sparkles`, `Sparkle`, `WandSparkles` (and their `*Icon` / `Lucide*` aliases) and the ✨ emoji, anywhere.
- Palette (semantic tokens): primary Forest, secondary Sage, accent Ochre, background Bone, surface Sand, foreground Bark, muted-foreground Lichen, border Linen, destructive Clay. Every `x`/`x-foreground` pair ≥ 4.5:1.
- Animate only `transform`, `opacity`, `clip-path`, `filter`. Honor `prefers-reduced-motion`. Text must be visible without JS.
- All copy, contacts, links, numbers and media paths come from `content/` (YAML + Markdown) and `content/media.yaml` keys. Never hardcoded in JSX (rule 33). Never invent content; mark gaps `TODO(content)`.
- Components: build once in `src/components/ui`, extend with CVA variants, `className` merged via `cn()`, spread native props (rule 32).
- Import alias `@/*` → `src/*`. `ui` and `motion` never import `sections`, `app` or `lib/content`.
- No `console.log` in `src/` (scripts/ excepted). Comments explain WHY only.
- Commit messages: Conventional Commits, subject ≤ 72 chars, and end with the trailer `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

---

## File Structure

```
.gitignore  .nvmrc  .env.example  .prettierrc
package.json  tsconfig.json  next.config.ts  postcss.config.mjs
eslint.config.mjs  vitest.config.ts  playwright.config.ts
content/README.md  content/site.yaml  content/media.yaml
content/pages/home.yaml  content/services/environmental-audit.md   (one seed service)
public/.htaccess  public/media/brand/logo.svg
scripts/content-check.ts
src/app/{globals.css,layout.tsx,page.tsx,not-found.tsx}
src/lib/{utils.ts,motion.ts}
src/lib/validators/content.ts
src/lib/content/{read.ts,media.ts,index.ts}
src/components/ui/{button.tsx,container.tsx,section-label.tsx}
src/components/motion/{lenis-provider.tsx,reveal.tsx}
src/components/layout/{header.tsx,footer.tsx}
tests/setup.ts  tests/unit/{tokens.test.ts,fonts.test.ts,rules.test.ts}
tests/unit/helpers/{tree.ts,fixtures.ts,oklch.ts}
tests/e2e/smoke.spec.ts
```
Colocated unit tests: `src/**/*.test.ts(x)`.

---

### Task 1: Scaffold, tooling, git

**Files:**
- Create: `.gitignore`, `.nvmrc`, `.env.example`, `.prettierrc`, `package.json`, `tsconfig.json`, `postcss.config.mjs`, `vitest.config.ts`, `tests/setup.ts`

**Interfaces:**
- Produces: scripts `dev`, `build`, `preview`, `content:check`, `test`, `test:e2e`, `typecheck`, `lint`; alias `@/*` (src) and `@tests/*` (tests).

- [ ] **Step 1: Verify tools**

Run: `node -v && pnpm -v`
Expected: Node `v24.x` and a pnpm version. If pnpm is missing: `corepack enable && corepack prepare pnpm@latest --activate`, then re-run.

- [ ] **Step 2: Init git and ignore file**

Run: `git init -b main`

Create `.gitignore`:
```gitignore
node_modules/
.next/
out/
coverage/
playwright-report/
test-results/
next-env.d.ts
.env
.env.local
*.log
.DS_Store
.claude/session-handoff.md
.superpowers/
```

- [ ] **Step 3: Write `package.json`**

```json
{
  "name": "envirosphere",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "engines": { "node": ">=24" },
  "scripts": {
    "dev": "next dev",
    "build": "pnpm content:check && next build",
    "preview": "serve out -l 4173",
    "content:check": "tsx scripts/content-check.ts",
    "test": "vitest run",
    "test:e2e": "playwright test",
    "typecheck": "tsc --noEmit",
    "lint": "eslint ."
  },
  "pnpm": {
    "onlyBuiltDependencies": ["esbuild", "sharp", "unrs-resolver"]
  }
}
```

- [ ] **Step 4: Install dependencies**

Run:
```bash
pnpm add next@16.4.2 react@19.2 react-dom@19.2 motion@14.6.0 lenis@1.3.27 lucide-react class-variance-authority clsx tailwind-merge @radix-ui/react-slot zod yaml image-size
pnpm add -D typescript @types/node @types/react @types/react-dom tailwindcss@4.3.3 @tailwindcss/postcss@4.3.3 eslint eslint-config-next@16.4.2 vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event @playwright/test serve tsx prettier
```
Expected: installs without errors. Commit `pnpm-lock.yaml` with this task.

- [ ] **Step 5: Write config files**

`.nvmrc`:
```
24
```

`.env.example`:
```bash
# Public values only: these ship in the static bundle.
NEXT_PUBLIC_SITE_URL=https://envirosphere.co.in
NEXT_PUBLIC_FORMS_ENDPOINT=
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
```

`.prettierrc`:
```json
{ "singleQuote": false, "trailingComma": "all", "printWidth": 100 }
```

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"], "@tests/*": ["./tests/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules", "out"]
}
```

`postcss.config.mjs`:
```js
const config = { plugins: { "@tailwindcss/postcss": {} } };
export default config;
```

`vitest.config.ts`:
```ts
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const fromRoot = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@tests": fromRoot("./tests"), "@": fromRoot("./src") } },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}", "tests/unit/**/*.test.{ts,tsx}"],
  },
});
```

`tests/setup.ts`:
```ts
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => cleanup());

// jsdom lacks these browser APIs that Motion uses; node-environment tests skip this block.
if (typeof window !== "undefined") {
  class IntersectionObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  }
  Object.defineProperty(window, "IntersectionObserver", {
    writable: true,
    configurable: true,
    value: IntersectionObserverStub,
  });
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
      dispatchEvent: () => false,
    }),
  });
}
```

- [ ] **Step 6: Verify the toolchain runs**

Run: `pnpm exec vitest run --passWithNoTests && pnpm exec next --version`
Expected: vitest reports "No test files found" and exits 0; next prints `Next.js v16.4.2`.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: scaffold single Next.js app with tooling" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: `cn()` utility and ESLint icon/library bans

**Files:**
- Create: `src/lib/utils.ts`, `src/lib/utils.test.ts`, `eslint.config.mjs`

**Interfaces:**
- Produces: `cn(...inputs: ClassValue[]): string` that keeps custom type-scale classes (`text-h1`) and color classes (`text-primary`) together.

- [ ] **Step 1: Write the failing test** `src/lib/utils.test.ts`

```ts
import { describe, expect, it } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("merges conflicting tailwind utilities, last wins", () => {
    expect(cn("px-4", "px-6")).toBe("px-6");
  });

  it("keeps a type-scale token and a color token together", () => {
    expect(cn("text-h1", "text-primary")).toBe("text-h1 text-primary");
  });

  it("lets a later type-scale token replace an earlier one", () => {
    expect(cn("text-h1", "text-h3")).toBe("text-h3");
  });

  it("drops falsy values", () => {
    expect(cn("a", false && "b", undefined, "c")).toBe("a c");
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm test -- src/lib/utils.test.ts`
Expected: FAIL, cannot resolve `./utils`.

- [ ] **Step 3: Implement** `src/lib/utils.ts`

```ts
import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Our type-scale tokens (text-h1…) must be recognised as font sizes, otherwise
// tailwind-merge treats them as colors and strips the real color class.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        { text: ["display", "h1", "h2", "h3", "h4", "lead", "base", "sm", "label"] },
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm test -- src/lib/utils.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Write ESLint config** `eslint.config.mjs`

```js
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const sparkleIcons = [
  "Sparkles",
  "Sparkle",
  "WandSparkles",
  "SparklesIcon",
  "SparkleIcon",
  "WandSparklesIcon",
  "LucideSparkles",
  "LucideSparkle",
  "LucideWandSparkles",
];

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([".next/**", "out/**", "node_modules/**", "next-env.d.ts", "coverage/**"]),
  {
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "lucide-react",
              importNames: sparkleIcons,
              message: "Sparkles icons are banned in this project (rule 34).",
            },
            { name: "framer-motion", message: 'Import from "motion/react" instead (rule 34).' },
          ],
          patterns: [
            {
              group: [
                "lucide-react/icons/sparkle*",
                "lucide-react/icons/wand-sparkles*",
                "lucide-react/dist/**/sparkle*",
                "lucide-react/dist/**/wand-sparkles*",
              ],
              message: "Sparkles icons are banned in this project (rule 34).",
            },
          ],
        },
      ],
    },
  },
]);
```

- [ ] **Step 6: Verify the ban fires**

Create a throwaway `src/zz-ban-check.tsx`:
```tsx
import { Sparkles } from "lucide-react";
export const Bad = () => <Sparkles />;
```
Run: `pnpm lint`
Expected: FAIL with `Sparkles icons are banned in this project (rule 34).`
Then delete `src/zz-ban-check.tsx` and re-run `pnpm lint && pnpm typecheck`. Expected: both pass.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add cn utility and lint bans for sparkle icons" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Design tokens and token tests

**Files:**
- Create: `src/app/globals.css`, `src/lib/motion.ts`, `tests/unit/helpers/oklch.ts`, `tests/unit/tokens.test.ts`

**Interfaces:**
- Produces (CSS utilities used by every later task): colors `bg-|text-|border-` + `primary|primary-foreground|secondary|secondary-foreground|accent|accent-foreground|background|foreground|surface|muted-foreground|border|ring|destructive`; font utilities `font-heading`, `font-body`; type utilities `text-display|h1|h2|h3|h4|lead|base|sm|label`; `tracking-label`; radii `rounded-card|control|pill`; spacing `py-section`, `px-gutter`; width `max-w-content`; `shadow-card`; easings `ease-out-expo|ease-in-out-quart`; vars `--duration-fast|base|slow`, `--z-header`.
- Produces (TS): `duration`, `ease`, `lenisOptions` from `@/lib/motion`.

- [ ] **Step 1: Write the OKLCH helper** `tests/unit/helpers/oklch.ts`

```ts
// OKLCH → linear sRGB (Björn Ottosson's matrices) → WCAG relative luminance.
export interface Oklch {
  l: number;
  c: number;
  h: number;
}

export function parseOklch(value: string): Oklch {
  const match = value.match(/^oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\)$/);
  if (!match) throw new Error(`Not a plain oklch() value: ${value}`);
  return { l: Number(match[1]), c: Number(match[2]), h: Number(match[3]) };
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

export function luminance({ l: L, c: C, h }: Oklch): number {
  const hue = (h * Math.PI) / 180;
  const a = C * Math.cos(hue);
  const b = C * Math.sin(hue);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const r = clamp01(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s);
  const g = clamp01(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s);
  const bl = clamp01(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s);
  return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
}

export function contrast(a: Oklch, b: Oklch): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
```

- [ ] **Step 2: Write `src/lib/motion.ts`**

```ts
// Mirrors the --duration-* and --ease-* tokens in globals.css (tests/unit/tokens.test.ts enforces this).
export const duration = { fast: 0.15, base: 0.4, slow: 0.9 } as const;

type Bezier = [number, number, number, number];
export const ease: Record<"outExpo" | "inOutQuart", Bezier> = {
  outExpo: [0.16, 1, 0.3, 1],
  inOutQuart: [0.76, 0, 0.24, 1],
};

export const lenisOptions = { lerp: 0.1, smoothWheel: true } as const;
```

- [ ] **Step 3: Write the failing token tests** `tests/unit/tokens.test.ts`

```ts
// @vitest-environment node
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { duration, ease } from "@/lib/motion";
import { contrast, parseOklch } from "./helpers/oklch";

const css = readFileSync(path.join(process.cwd(), "src/app/globals.css"), "utf8");

const tokens = new Map<string, string>();
for (const match of css.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
  tokens.set(match[1], match[2].trim());
}

function resolve(name: string): string {
  const value = tokens.get(name);
  if (!value) throw new Error(`Token ${name} is not defined in globals.css`);
  const ref = value.match(/^var\((--[\w-]+)\)$/);
  return ref ? resolve(ref[1]) : value;
}

const color = (name: string) => parseOklch(resolve(`--color-${name}`));

describe("semantic color pairs meet WCAG AA (4.5:1)", () => {
  const pairs: [string, string][] = [
    ["primary", "primary-foreground"],
    ["secondary", "secondary-foreground"],
    ["accent", "accent-foreground"],
    ["background", "foreground"],
    ["surface", "foreground"],
    ["background", "muted-foreground"],
    ["surface", "muted-foreground"],
    ["background", "destructive"],
    ["primary", "secondary"],
  ];
  it.each(pairs)("%s vs %s", (a, b) => {
    expect(contrast(color(a), color(b))).toBeGreaterThanOrEqual(4.5);
  });
});

describe("palette roles exist", () => {
  it.each([
    "primary", "primary-foreground", "secondary", "secondary-foreground", "accent",
    "accent-foreground", "background", "foreground", "surface", "muted-foreground",
    "border", "ring", "destructive",
  ])("--color-%s", (name) => {
    expect(() => color(name)).not.toThrow();
  });
});

describe("motion tokens mirror src/lib/motion.ts", () => {
  it("durations", () => {
    expect(tokens.get("--duration-fast")).toBe(`${duration.fast * 1000}ms`);
    expect(tokens.get("--duration-base")).toBe(`${duration.base * 1000}ms`);
    expect(tokens.get("--duration-slow")).toBe(`${duration.slow * 1000}ms`);
  });
  it("easings", () => {
    expect(tokens.get("--ease-out-expo")).toBe(`cubic-bezier(${ease.outExpo.join(", ")})`);
    expect(tokens.get("--ease-in-out-quart")).toBe(`cubic-bezier(${ease.inOutQuart.join(", ")})`);
  });
});

describe("fonts", () => {
  it("defines exactly the heading and body families", () => {
    const families = [...tokens.keys()].filter((k) => /^--font-(heading|body)$/.test(k));
    expect(families.sort()).toEqual(["--font-body", "--font-heading"]);
    expect(tokens.get("--font-heading")).toContain("var(--font-fraunces)");
    expect(tokens.get("--font-body")).toContain("var(--font-manrope)");
  });
});
```

- [ ] **Step 4: Run to verify it fails**

Run: `pnpm test -- tests/unit/tokens.test.ts`
Expected: FAIL, `ENOENT ... globals.css`.

- [ ] **Step 5: Write `src/app/globals.css`**

```css
@import "tailwindcss";

/* `static` forces every token to be emitted, even ones only referenced via var(). */
@theme static {
  /* Drop Tailwind's default colors and font families: only project tokens may produce utilities. */
  --color-*: initial;
  --font-*: initial;
  --default-font-family: var(--font-body);

  /* ── 1. PRIMITIVES: raw nature palette (OKLCH). Only the semantic tier may reference these. ── */
  --color-forest-700: oklch(0.31 0.05 155);
  --color-bone-100: oklch(0.96 0.012 90);
  --color-sand-200: oklch(0.92 0.02 88);
  --color-linen-300: oklch(0.86 0.02 95);
  --color-sage-300: oklch(0.78 0.045 135);
  --color-ochre-400: oklch(0.74 0.12 75);
  --color-lichen-600: oklch(0.5 0.02 150);
  --color-clay-600: oklch(0.55 0.16 30);
  --color-bark-900: oklch(0.22 0.02 155);

  /* ── 2. SEMANTIC: the ONLY tier components use ── */
  --color-primary: var(--color-forest-700);
  --color-primary-foreground: var(--color-bone-100);
  --color-secondary: var(--color-sage-300);
  --color-secondary-foreground: var(--color-bark-900);
  --color-accent: var(--color-ochre-400);
  --color-accent-foreground: var(--color-bark-900);
  --color-background: var(--color-bone-100);
  --color-foreground: var(--color-bark-900);
  --color-surface: var(--color-sand-200);
  --color-muted-foreground: var(--color-lichen-600);
  --color-border: var(--color-linen-300);
  --color-ring: var(--color-accent);
  --color-destructive: var(--color-clay-600);

  /* ── Typography: exactly two families (set by next/font in layout.tsx) ── */
  --font-heading: var(--font-fraunces), ui-serif, Georgia, serif;
  --font-body: var(--font-manrope), ui-sans-serif, system-ui, sans-serif;
  --heading-variation: "SOFT" 40;
  --tracking-label: 0.14em;

  --text-display: clamp(3.5rem, 1.5rem + 8vw, 9.5rem);
  --text-display--line-height: 0.95;
  --text-display--letter-spacing: -0.035em;
  --text-h1: clamp(2.75rem, 1.5rem + 5vw, 6rem);
  --text-h1--line-height: 1;
  --text-h1--letter-spacing: -0.03em;
  --text-h2: clamp(2.25rem, 1.25rem + 3.5vw, 4.25rem);
  --text-h2--line-height: 1.05;
  --text-h2--letter-spacing: -0.025em;
  --text-h3: clamp(1.75rem, 1.2rem + 2vw, 2.75rem);
  --text-h3--line-height: 1.1;
  --text-h3--letter-spacing: -0.02em;
  --text-h4: clamp(1.25rem, 1.1rem + 0.8vw, 1.75rem);
  --text-h4--line-height: 1.2;
  --text-h4--letter-spacing: -0.01em;
  --text-lead: clamp(1.125rem, 1.05rem + 0.4vw, 1.375rem);
  --text-lead--line-height: 1.5;
  --text-base: 1rem;
  --text-base--line-height: 1.65;
  --text-sm: 0.875rem;
  --text-sm--line-height: 1.55;
  --text-label: 0.75rem;
  --text-label--line-height: 1.4;

  /* ── Shape, space, layout ── */
  --radius-control: 0.75rem;
  --radius-card: 1.25rem;
  --radius-pill: 999px;
  --spacing-gutter: clamp(1.25rem, 4vw, 3rem);
  --spacing-section: clamp(5rem, 3rem + 8vw, 11rem);
  --container-content: 80rem;
  --shadow-card:
    0 1px 2px color-mix(in oklch, var(--color-bark-900) 6%, transparent),
    0 12px 32px color-mix(in oklch, var(--color-bark-900) 8%, transparent);

  /* ── Motion (mirrored in src/lib/motion.ts) ── */
  --duration-fast: 150ms;
  --duration-base: 400ms;
  --duration-slow: 900ms;
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in-out-quart: cubic-bezier(0.76, 0, 0.24, 1);

  /* ── Layering ── */
  --z-header: 50;
}

@layer base {
  *,
  ::before,
  ::after {
    border-color: var(--color-border);
  }

  html {
    background: var(--color-background);
    color: var(--color-foreground);
  }

  body {
    font-family: var(--font-body);
    font-weight: 400;
    font-size: var(--text-base);
    line-height: var(--text-base--line-height);
    -webkit-font-smoothing: antialiased;
  }

  h1,
  h2,
  h3,
  h4 {
    font-family: var(--font-heading);
    font-weight: 400;
    font-variation-settings: var(--heading-variation);
    text-wrap: balance;
  }

  :focus-visible {
    outline: 2px solid var(--color-ring);
    outline-offset: 3px;
  }

  ::selection {
    background: var(--color-accent);
    color: var(--color-accent-foreground);
  }

  @media (prefers-reduced-motion: reduce) {
    html {
      scroll-behavior: auto;
    }
  }
}
```

- [ ] **Step 6: Run to verify it passes**

Run: `pnpm test -- tests/unit/tokens.test.ts`
Expected: PASS. If a contrast pair fails (most likely `background`/`destructive` or `surface`/`muted-foreground`), lower that primitive's lightness by 0.02 in `globals.css`, re-run, and update the matching row in `PROJECT-REQUIREMENTS.md` §3.1 and `.agent/rules/31-design-tokens.md`.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add nature design tokens, motion tokens and token tests" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Content schemas and file readers

**Files:**
- Create: `src/lib/validators/content.ts`, `src/lib/validators/content.test.ts`, `src/lib/content/read.ts`, `src/lib/content/read.test.ts`, `tests/unit/helpers/tree.ts`, `tests/unit/helpers/fixtures.ts`

**Interfaces:**
- Produces from `validators/content.ts`: `siteSchema`, `mediaSchema`, `mediaItemSchema`, `homeSchema`, `serviceFrontMatterSchema`, and types `Site`, `Media`, `MediaItem`, `Home`, `ServiceFrontMatter`.
- Produces from `read.ts`: `CONTENT_ROOT: string`, `PUBLIC_ROOT: string`, `class ContentError extends Error`, `validate<T>(schema: ZodType<T>, data: unknown, label: string): T`, `readYamlFile<T>(relPath: string, schema: ZodType<T>, root?: string): T`, `readMarkdownFile<T>(relPath: string, schema: ZodType<T>, root?: string): { data: T; body: string }`.
- Produces from helpers: `makeTree(files: Record<string, string>): { root: string; content: string; publicDir: string }`, `validFiles(): Record<string, string>`.

- [ ] **Step 1: Write the test helpers**

`tests/unit/helpers/tree.ts`:
```ts
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

/** Writes `files` (relative paths) into a fresh temp dir; use `content`/`publicDir` as roots. */
export function makeTree(files: Record<string, string>) {
  const root = mkdtempSync(path.join(os.tmpdir(), "envirosphere-"));
  for (const [relative, text] of Object.entries(files)) {
    const file = path.join(root, relative);
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, text);
  }
  return { root, content: path.join(root, "content"), publicDir: path.join(root, "public") };
}
```

`tests/unit/helpers/fixtures.ts`:
```ts
export const LOGO_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><circle cx="20" cy="20" r="20"/></svg>';

export const SITE_YAML = `
name: Test Co
shortName: Test
tagline: Test tagline
url: https://example.com
locale: en-IN
logoKey: logo
cta: { label: Contact, href: /contact/ }
contact:
  email: hello@example.com
  phones: ["+91 98602 20550"]
  address: 1 Test Road, Pune
offices:
  - { name: Head Office, city: Pune }
accreditations:
  - { label: NABET Cat A }
nav:
  - { label: Home, href: / }
  - { label: Services, href: /services/ }
links:
  linkedin: https://www.linkedin.com/company/test
seo:
  titleTemplate: "%s | Test"
  description: A test site.
  ogImageKey: logo
`;

export const MEDIA_YAML = `
logo:
  src: /media/brand/logo.svg
  alt: Test logo
`;

export const HOME_YAML = `
hero:
  eyebrow: Test eyebrow
  title: Test title
  subtitle: Test subtitle
  primaryCta: { label: Start, href: /contact/ }
`;

export const SERVICE_MD = `---
title: Environmental audit
order: 1
summary: Independent audit of compliance.
---
Body text of the service.
`;

export function validFiles(): Record<string, string> {
  return {
    "content/site.yaml": SITE_YAML,
    "content/media.yaml": MEDIA_YAML,
    "content/pages/home.yaml": HOME_YAML,
    "content/services/environmental-audit.md": SERVICE_MD,
    "public/media/brand/logo.svg": LOGO_SVG,
  };
}
```

- [ ] **Step 2: Write the failing schema test** `src/lib/validators/content.test.ts`

```ts
// @vitest-environment node
import { parse } from "yaml";
import { describe, expect, it } from "vitest";
import { HOME_YAML, MEDIA_YAML, SITE_YAML } from "@tests/unit/helpers/fixtures";
import { homeSchema, mediaSchema, siteSchema } from "./content";

describe("content schemas", () => {
  it("accept the valid fixtures", () => {
    expect(siteSchema.safeParse(parse(SITE_YAML)).success).toBe(true);
    expect(mediaSchema.safeParse(parse(MEDIA_YAML)).success).toBe(true);
    expect(homeSchema.safeParse(parse(HOME_YAML)).success).toBe(true);
  });

  it("rejects a title template without %s", () => {
    const site = parse(SITE_YAML);
    site.seo.titleTemplate = "Test";
    const result = siteSchema.safeParse(site);
    expect(result.success).toBe(false);
  });

  it("rejects a phone number that is not a phone number", () => {
    const site = parse(SITE_YAML);
    site.contact.phones = ["call me"];
    expect(siteSchema.safeParse(site).success).toBe(false);
  });

  it("rejects media paths outside /media/", () => {
    const media = { logo: { src: "/images/logo.svg", alt: "x" } };
    expect(mediaSchema.safeParse(media).success).toBe(false);
  });

  it("rejects media keys that are not lowercase-dash", () => {
    const media = { "Hero Home": { src: "/media/a.jpg", alt: "x" } };
    expect(mediaSchema.safeParse(media).success).toBe(false);
  });

  it("allows social links to be omitted", () => {
    const site = parse(SITE_YAML);
    delete site.links;
    expect(siteSchema.safeParse(site).success).toBe(true);
  });
});
```

- [ ] **Step 3: Run to verify it fails**

Run: `pnpm test -- src/lib/validators/content.test.ts`
Expected: FAIL, cannot resolve `./content`.

- [ ] **Step 4: Implement** `src/lib/validators/content.ts`

```ts
import { z } from "zod";

const mediaKey = z
  .string()
  .regex(/^[a-z0-9][a-z0-9-]*$/, "use lowercase letters, numbers and dashes, e.g. hero-home");
const href = z
  .string()
  .regex(/^(\/|https?:\/\/|mailto:|tel:)/, "must start with / or https://");
const phone = z
  .string()
  .regex(/^\+?[0-9 ()-]{8,20}$/, "must look like +91 98602 20550");

const navItemSchema = z.object({ label: z.string().min(1), href });

export const mediaItemSchema = z.object({
  src: z
    .string()
    .regex(/^\/media\/.+\.[a-z0-9]+$/i, "must start with /media/ and end with a file extension"),
  // Empty alt is allowed only for purely decorative images.
  alt: z.string(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
});
export const mediaSchema = z.record(mediaKey, mediaItemSchema);

export const siteSchema = z.object({
  name: z.string().min(1),
  shortName: z.string().min(1),
  tagline: z.string().min(1),
  url: z.url(),
  locale: z.string().default("en-IN"),
  logoKey: mediaKey,
  cta: navItemSchema,
  contact: z.object({
    email: z.email(),
    phones: z.array(phone).min(1),
    whatsapp: phone.optional(),
    address: z.string().min(1),
  }),
  offices: z
    .array(
      z.object({ name: z.string().min(1), city: z.string().min(1), address: z.string().optional() }),
    )
    .min(1),
  accreditations: z.array(z.object({ label: z.string().min(1), detail: z.string().optional() })),
  nav: z.array(navItemSchema).min(1),
  links: z
    .object({
      linkedin: z.url().optional(),
      facebook: z.url().optional(),
      instagram: z.url().optional(),
      youtube: z.url().optional(),
    })
    .default({}),
  seo: z.object({
    titleTemplate: z.string().refine((v) => v.includes("%s"), 'must contain "%s" for the page title'),
    description: z.string().min(1),
    ogImageKey: mediaKey,
  }),
});

export const homeSchema = z.object({
  hero: z.object({
    eyebrow: z.string().min(1),
    title: z.string().min(1),
    subtitle: z.string().min(1),
    primaryCta: navItemSchema,
    image: mediaKey.optional(),
  }),
});

export const serviceFrontMatterSchema = z.object({
  title: z.string().min(1),
  order: z.number().int().positive(),
  summary: z.string().min(1),
  image: mediaKey.optional(),
});

export type Site = z.infer<typeof siteSchema>;
export type Media = z.infer<typeof mediaSchema>;
export type MediaItem = z.infer<typeof mediaItemSchema>;
export type Home = z.infer<typeof homeSchema>;
export type ServiceFrontMatter = z.infer<typeof serviceFrontMatterSchema>;
```

- [ ] **Step 5: Run to verify it passes**

Run: `pnpm test -- src/lib/validators/content.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 6: Write the failing reader test** `src/lib/content/read.test.ts`

```ts
// @vitest-environment node
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { makeTree } from "@tests/unit/helpers/tree";
import { ContentError, readMarkdownFile, readYamlFile } from "./read";

const faqSchema = z.object({
  items: z.array(z.object({ question: z.string(), answer: z.string() })),
});

describe("readYamlFile", () => {
  it("parses and validates a file", () => {
    const { content } = makeTree({
      "content/faq.yaml": "items:\n  - { question: Why?, answer: Because. }\n",
    });
    expect(readYamlFile("faq.yaml", faqSchema, content).items).toHaveLength(1);
  });

  it("names the file and the exact field when validation fails", () => {
    const { content } = makeTree({
      "content/faq.yaml":
        "items:\n  - { question: A, answer: B }\n  - { question: C, answer: D }\n  - { question: E }\n",
    });
    expect(() => readYamlFile("faq.yaml", faqSchema, content)).toThrowError(
      /content\/faq\.yaml → items\[2\]\.answer/,
    );
  });

  it("reports invalid YAML with the file name", () => {
    const { content } = makeTree({ "content/faq.yaml": "items: [unclosed" });
    expect(() => readYamlFile("faq.yaml", faqSchema, content)).toThrowError(/content\/faq\.yaml/);
  });

  it("reports a missing file", () => {
    const { content } = makeTree({ "content/other.yaml": "a: 1" });
    expect(() => readYamlFile("faq.yaml", faqSchema, content)).toThrowError(
      /content\/faq\.yaml: file is missing/,
    );
  });

  it("throws ContentError", () => {
    const { content } = makeTree({ "content/other.yaml": "a: 1" });
    expect(() => readYamlFile("faq.yaml", faqSchema, content)).toThrowError(ContentError);
  });
});

describe("readMarkdownFile", () => {
  const schema = z.object({ title: z.string() });

  it("splits front matter from body", () => {
    const { content } = makeTree({ "content/a.md": "---\ntitle: Hello\n---\nBody here.\n" });
    expect(readMarkdownFile("a.md", schema, content)).toEqual({
      data: { title: "Hello" },
      body: "Body here.",
    });
  });

  it("requires a front matter block", () => {
    const { content } = makeTree({ "content/a.md": "Just text" });
    expect(() => readMarkdownFile("a.md", schema, content)).toThrowError(
      /content\/a\.md: .*front matter/,
    );
  });

  it("validates front matter fields", () => {
    const { content } = makeTree({ "content/a.md": "---\nname: x\n---\nBody" });
    expect(() => readMarkdownFile("a.md", schema, content)).toThrowError(/content\/a\.md → title/);
  });
});
```

- [ ] **Step 7: Run to verify it fails**

Run: `pnpm test -- src/lib/content/read.test.ts`
Expected: FAIL, cannot resolve `./read`.

- [ ] **Step 8: Implement** `src/lib/content/read.ts`

```ts
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { parse } from "yaml";
import type { ZodType } from "zod";

export const CONTENT_ROOT = path.join(process.cwd(), "content");
export const PUBLIC_ROOT = path.join(process.cwd(), "public");

/** A problem the site owner can fix by editing a file in content/. Messages are plain language. */
export class ContentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ContentError";
  }
}

function formatPath(segments: PropertyKey[]): string {
  return segments.reduce<string>((out, segment) => {
    if (typeof segment === "number") return `${out}[${segment}]`;
    return out ? `${out}.${String(segment)}` : String(segment);
  }, "");
}

export function validate<T>(schema: ZodType<T>, data: unknown, label: string): T {
  const result = schema.safeParse(data);
  if (result.success) return result.data;
  const lines = result.error.issues.map(
    (issue) => `${label}${issue.path.length ? ` → ${formatPath(issue.path)}` : ""}: ${issue.message}`,
  );
  throw new ContentError(lines.join("\n"));
}

function readText(root: string, relPath: string, label: string): string {
  const file = path.join(root, relPath);
  if (!existsSync(file)) throw new ContentError(`${label}: file is missing`);
  return readFileSync(file, "utf8");
}

function parseYaml(text: string, label: string): unknown {
  try {
    return parse(text);
  } catch (error) {
    const reason = error instanceof Error ? error.message.split("\n")[0] : "unknown problem";
    throw new ContentError(`${label}: could not read the file (${reason})`);
  }
}

export function readYamlFile<T>(relPath: string, schema: ZodType<T>, root = CONTENT_ROOT): T {
  const label = `content/${relPath}`;
  return validate(schema, parseYaml(readText(root, relPath, label), label), label);
}

export function readMarkdownFile<T>(
  relPath: string,
  schema: ZodType<T>,
  root = CONTENT_ROOT,
): { data: T; body: string } {
  const label = `content/${relPath}`;
  const text = readText(root, relPath, label);
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) {
    throw new ContentError(`${label}: the file must start with a front matter block between two --- lines`);
  }
  return { data: validate(schema, parseYaml(match[1], label), label), body: match[2].trim() };
}
```

- [ ] **Step 9: Run to verify it passes**

Run: `pnpm test -- src/lib/content/read.test.ts`
Expected: PASS (8 tests).

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: add content schemas and validated YAML/Markdown readers" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Media resolution, loaders, seed content, `content:check`

**Files:**
- Create: `src/lib/content/media.ts`, `src/lib/content/media.test.ts`, `src/lib/content/index.ts`, `src/lib/content/index.test.ts`, `scripts/content-check.ts`, `content/site.yaml`, `content/media.yaml`, `content/pages/home.yaml`, `content/services/environmental-audit.md`, `public/media/brand/logo.svg`

**Interfaces:**
- Consumes: Task 4 exports.
- Produces from `media.ts`: `interface ResolvedMedia { key: string; src: string; alt: string; width?: number; height?: number }`, `resolveMedia(media: Media, key: string, publicRoot?: string, usedIn?: string): ResolvedMedia`, `verifyAllMedia(media: Media, publicRoot?: string): void`.
- Produces from `index.ts`: `loadSite(root?)`, `loadMedia(root?)`, `loadHome(root?)`, `loadServices(root?): Service[]` where `Service = ServiceFrontMatter & { slug: string; body: string }` sorted by `order`, `loadAll(root?, publicRoot?)`, `getImage(key: string): ResolvedMedia`, `socialLinks(site: Site): { label: string; href: string }[]`.

- [ ] **Step 1: Write the failing media test** `src/lib/content/media.test.ts`

```ts
// @vitest-environment node
import { describe, expect, it } from "vitest";
import { makeTree } from "@tests/unit/helpers/tree";
import { LOGO_SVG } from "@tests/unit/helpers/fixtures";
import { ContentError } from "./read";
import { resolveMedia, verifyAllMedia } from "./media";

const media = { logo: { src: "/media/brand/logo.svg", alt: "Logo" } };

describe("resolveMedia", () => {
  it("returns src, alt and dimensions probed from the file", () => {
    const { publicDir } = makeTree({ "public/media/brand/logo.svg": LOGO_SVG });
    expect(resolveMedia(media, "logo", publicDir)).toEqual({
      key: "logo",
      src: "/media/brand/logo.svg",
      alt: "Logo",
      width: 40,
      height: 40,
    });
  });

  it("prefers dimensions written in media.yaml", () => {
    const { publicDir } = makeTree({ "public/media/brand/logo.svg": LOGO_SVG });
    const sized = { logo: { ...media.logo, width: 100, height: 50 } };
    expect(resolveMedia(sized, "logo", publicDir)).toMatchObject({ width: 100, height: 50 });
  });

  it("fails with a plain message when the key is not listed", () => {
    const { publicDir } = makeTree({ "public/media/brand/logo.svg": LOGO_SVG });
    expect(() => resolveMedia(media, "hero", publicDir, "content/pages/home.yaml → hero.image")).toThrowError(
      /content\/pages\/home\.yaml → hero\.image: "hero" is not listed in content\/media\.yaml/,
    );
  });

  it("fails when the file is not in public/", () => {
    const { publicDir } = makeTree({ "public/other.txt": "x" });
    expect(() => resolveMedia(media, "logo", publicDir)).toThrowError(ContentError);
    expect(() => resolveMedia(media, "logo", publicDir)).toThrowError(
      /content\/media\.yaml → logo: file not found at public\/media\/brand\/logo\.svg/,
    );
  });

  it("does not probe sizes for non-images (pdf, mp4)", () => {
    const { publicDir } = makeTree({ "public/media/docs/brochure.pdf": "%PDF" });
    const docs = { brochure: { src: "/media/docs/brochure.pdf", alt: "Brochure" } };
    const resolved = resolveMedia(docs, "brochure", publicDir);
    expect(resolved.width).toBeUndefined();
  });
});

describe("verifyAllMedia", () => {
  it("throws on the first missing file", () => {
    const { publicDir } = makeTree({ "public/other.txt": "x" });
    expect(() => verifyAllMedia(media, publicDir)).toThrowError(/logo: file not found/);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm test -- src/lib/content/media.test.ts`
Expected: FAIL, cannot resolve `./media`.

- [ ] **Step 3: Implement** `src/lib/content/media.ts`

```ts
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { imageSize } from "image-size";
import type { Media } from "../validators/content";
import { ContentError, PUBLIC_ROOT } from "./read";

export interface ResolvedMedia {
  key: string;
  src: string;
  alt: string;
  width?: number;
  height?: number;
}

const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp", ".avif", ".gif", ".svg"]);

function probeSize(file: string): { width?: number; height?: number } {
  if (!IMAGE_EXTENSIONS.has(path.extname(file).toLowerCase())) return {};
  const { width, height } = imageSize(readFileSync(file));
  return { width, height };
}

export function resolveMedia(
  media: Media,
  key: string,
  publicRoot = PUBLIC_ROOT,
  usedIn = "content",
): ResolvedMedia {
  const item = media[key];
  if (!item) throw new ContentError(`${usedIn}: "${key}" is not listed in content/media.yaml`);
  const file = path.join(publicRoot, item.src);
  if (!existsSync(file)) {
    throw new ContentError(`content/media.yaml → ${key}: file not found at public${item.src}`);
  }
  const probed = item.width && item.height ? {} : probeSize(file);
  return {
    key,
    src: item.src,
    alt: item.alt,
    width: item.width ?? probed.width,
    height: item.height ?? probed.height,
  };
}

export function verifyAllMedia(media: Media, publicRoot = PUBLIC_ROOT): void {
  for (const key of Object.keys(media)) resolveMedia(media, key, publicRoot);
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm test -- src/lib/content/media.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Write the failing loader test** `src/lib/content/index.test.ts`

```ts
// @vitest-environment node
import { describe, expect, it } from "vitest";
import { makeTree } from "@tests/unit/helpers/tree";
import { validFiles } from "@tests/unit/helpers/fixtures";
import { loadAll, loadServices, socialLinks } from "./index";
import { ContentError } from "./read";

describe("loadAll", () => {
  it("loads valid content", () => {
    const { content, publicDir } = makeTree(validFiles());
    const all = loadAll(content, publicDir);
    expect(all.site.name).toBe("Test Co");
    expect(all.home.hero.title).toBe("Test title");
    expect(all.services.map((s) => s.slug)).toEqual(["environmental-audit"]);
  });

  it("fails when site.yaml points at an unknown logo key", () => {
    const files = validFiles();
    files["content/site.yaml"] = files["content/site.yaml"].replace("logoKey: logo", "logoKey: missing");
    const { content, publicDir } = makeTree(files);
    expect(() => loadAll(content, publicDir)).toThrowError(
      /content\/site\.yaml → logoKey: "missing" is not listed in content\/media\.yaml/,
    );
  });

  it("fails when a service references a missing image key", () => {
    const files = validFiles();
    files["content/services/environmental-audit.md"] =
      "---\ntitle: A\norder: 1\nsummary: S\nimage: nope\n---\nBody";
    const { content, publicDir } = makeTree(files);
    expect(() => loadAll(content, publicDir)).toThrowError(
      /content\/services\/environmental-audit\.md → image: "nope" is not listed/,
    );
  });

  it("fails when a media file is missing from public/", () => {
    const files = validFiles();
    delete files["public/media/brand/logo.svg"];
    files["public/other.txt"] = "x";
    const { content, publicDir } = makeTree(files);
    expect(() => loadAll(content, publicDir)).toThrowError(ContentError);
  });
});

describe("loadServices", () => {
  it("sorts by order and derives the slug from the file name", () => {
    const files = validFiles();
    files["content/services/water-audit.md"] = "---\ntitle: Water audit\norder: 2\nsummary: S\n---\nB";
    files["content/services/air.md"] = "---\ntitle: Air\norder: 3\nsummary: S\n---\nB";
    const { content } = makeTree(files);
    expect(loadServices(content).map((s) => s.slug)).toEqual(["environmental-audit", "water-audit", "air"]);
  });

  it("rejects a file name that is not a url-safe slug", () => {
    const files = validFiles();
    files["content/services/Bad Name.md"] = "---\ntitle: A\norder: 5\nsummary: S\n---\nB";
    const { content } = makeTree(files);
    expect(() => loadServices(content)).toThrowError(/content\/services\/Bad Name\.md: .*lowercase/);
  });

  it("returns an empty list when there is no services folder", () => {
    const { content } = makeTree({ "content/site.yaml": "a: 1" });
    expect(loadServices(content)).toEqual([]);
  });
});

describe("socialLinks", () => {
  it("lists only the links that are set, with display labels", () => {
    const { content, publicDir } = makeTree(validFiles());
    const { site } = loadAll(content, publicDir);
    expect(socialLinks(site)).toEqual([
      { label: "LinkedIn", href: "https://www.linkedin.com/company/test" },
    ]);
  });
});
```

- [ ] **Step 6: Run to verify it fails**

Run: `pnpm test -- src/lib/content/index.test.ts`
Expected: FAIL, cannot resolve `./index`.

- [ ] **Step 7: Implement** `src/lib/content/index.ts`

```ts
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import {
  homeSchema,
  mediaSchema,
  serviceFrontMatterSchema,
  siteSchema,
  type Home,
  type Media,
  type ServiceFrontMatter,
  type Site,
} from "../validators/content";
import { resolveMedia, verifyAllMedia, type ResolvedMedia } from "./media";
import { CONTENT_ROOT, ContentError, PUBLIC_ROOT, readMarkdownFile, readYamlFile } from "./read";

export type Service = ServiceFrontMatter & { slug: string; body: string };

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const loadSite = (root = CONTENT_ROOT): Site => readYamlFile("site.yaml", siteSchema, root);
export const loadMedia = (root = CONTENT_ROOT): Media => readYamlFile("media.yaml", mediaSchema, root);
export const loadHome = (root = CONTENT_ROOT): Home =>
  readYamlFile("pages/home.yaml", homeSchema, root);

export function loadServices(root = CONTENT_ROOT): Service[] {
  const dir = path.join(root, "services");
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((file) => file.endsWith(".md"))
    .map((file) => {
      const slug = file.replace(/\.md$/, "");
      if (!SLUG.test(slug)) {
        throw new ContentError(
          `content/services/${file}: file names must be lowercase letters, numbers and dashes, e.g. crz-clearance.md`,
        );
      }
      const { data, body } = readMarkdownFile(`services/${file}`, serviceFrontMatterSchema, root);
      return { ...data, slug, body };
    })
    .sort((a, b) => a.order - b.order);
}

/** Loads everything and checks every media reference. Used by `pnpm content:check` and the build. */
export function loadAll(root = CONTENT_ROOT, publicRoot = PUBLIC_ROOT) {
  const site = loadSite(root);
  const media = loadMedia(root);
  const home = loadHome(root);
  const services = loadServices(root);

  verifyAllMedia(media, publicRoot);
  const references: [string | undefined, string][] = [
    [site.logoKey, "content/site.yaml → logoKey"],
    [site.seo.ogImageKey, "content/site.yaml → seo.ogImageKey"],
    [home.hero.image, "content/pages/home.yaml → hero.image"],
    ...services.map((s): [string | undefined, string] => [
      s.image,
      `content/services/${s.slug}.md → image`,
    ]),
  ];
  for (const [key, where] of references) {
    if (key) resolveMedia(media, key, publicRoot, where);
  }
  return { site, media, home, services };
}

export function getImage(key: string): ResolvedMedia {
  return resolveMedia(loadMedia(), key);
}

const SOCIAL_LABELS = {
  linkedin: "LinkedIn",
  facebook: "Facebook",
  instagram: "Instagram",
  youtube: "YouTube",
} as const;

export function socialLinks(site: Site): { label: string; href: string }[] {
  return (Object.keys(SOCIAL_LABELS) as (keyof typeof SOCIAL_LABELS)[]).flatMap((key) => {
    const href = site.links[key];
    return href ? [{ label: SOCIAL_LABELS[key], href }] : [];
  });
}
```

- [ ] **Step 8: Run to verify it passes**

Run: `pnpm test -- src/lib/content/index.test.ts`
Expected: PASS (8 tests: 4 loadAll, 3 loadServices, 1 socialLinks).

- [ ] **Step 9: Create the placeholder logo** `public/media/brand/logo.svg` (replaced by the real logo in Plan 3)

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40" role="img" aria-label="Envirosphere"><circle cx="20" cy="20" r="20" fill="#1E3A2B"/><path d="M20 9c8 2 11 9 8 17-7 2-14-1-16-8 2-5 5-9 8-9z" fill="#AEBDA2"/></svg>
```

- [ ] **Step 10: Create seed content**

`content/media.yaml`:
```yaml
# Every image, logo, video and document used on the site.
# To replace a file: put the new file in public/media/ and change `src` (or keep the same file name).
# `alt` is the text for screen readers and search engines. Describe what the picture shows.
logo:
  src: /media/brand/logo.svg
  alt: Envirosphere logo
```

`content/site.yaml`:
```yaml
# Company-wide details. Used in the header, footer, contact page and search results.
name: Envirosphere Consultant & Engineers
shortName: Envirosphere
tagline: Empowering Excellence
url: https://envirosphere.co.in
locale: en-IN
logoKey: logo            # a name from media.yaml

# Button shown at the right of the header.
cta:
  label: Get in touch
  href: /contact/

contact:
  email: info@envirosphere.co.in
  phones:
    - "+91 9860220550"
    - "+91 9225176005"
  address: Shree Ganesh Ace Arcade, Kokane Chowk, Rahatani, Pune - 411017

offices:
  - name: Head Office
    city: Pune
    address: Shree Ganesh Ace Arcade, Kokane Chowk, Rahatani, Pune - 411017
  - { name: Branch Office, city: Mumbai }
  - { name: Branch Office, city: Tarapur }
  - { name: Branch Office, city: Nashik }
  - { name: Branch Office, city: Nagpur }

accreditations:
  - label: QCI NABET Accredited Consultant (Cat A)

# Main menu, in display order. Links to pages that do not exist yet go live in a later phase.
nav:
  - { label: Home, href: / }
  - { label: About, href: /about/ }
  - { label: Services, href: /services/ }
  - { label: Why Us, href: /why-us/ }
  - { label: Careers, href: /careers/ }
  - { label: Gallery, href: /gallery/ }
  - { label: Downloads, href: /downloads/ }
  - { label: Contact, href: /contact/ }

# TODO(content): add the real social profile URLs. Remove a line to hide that icon.
links: {}

seo:
  titleTemplate: "%s | Envirosphere"
  description: >-
    NABET accredited environmental consultants in Pune: environmental clearances, statutory
    compliance, audits, monitoring and water and wastewater treatment engineering.
  ogImageKey: logo
```

`content/pages/home.yaml`:
```yaml
# TODO(content): owner to review the wording. Sections are added in the next phase.
hero:
  eyebrow: QCI NABET Accredited Consultant (Cat A)
  title: Environmental clearances and compliance, handled with precision.
  subtitle: >-
    We help public and private sector clients secure statutory clearances and consents from
    MoEFCC, State Pollution Control Boards, MIDC and other authorities.
  primaryCta:
    label: Talk to our team
    href: /contact/
```

`content/services/environmental-audit.md`:
```markdown
---
title: Environmental audit
order: 4
summary: Independent audits that show where you stand against environmental regulations.
---
TODO(content): replace with the service text from the current website.
```

- [ ] **Step 11: Write the check script** `scripts/content-check.ts`

```ts
import { loadAll } from "../src/lib/content/index";
import { ContentError } from "../src/lib/content/read";

try {
  const { media, services } = loadAll();
  console.log(`Content OK: ${Object.keys(media).length} media items, ${services.length} services`);
} catch (error) {
  if (error instanceof ContentError) {
    console.error(`\nContent problem(s) to fix:\n${error.message}\n`);
    process.exit(1);
  }
  throw error;
}
```

- [ ] **Step 12: Run the check on real content, then break it on purpose**

Run: `pnpm content:check`
Expected: `Content OK: 1 media items, 1 services`.

Temporarily change `content/site.yaml` `logoKey: logo` to `logoKey: nope`, run `pnpm content:check`.
Expected: exit code 1 and `content/site.yaml → logoKey: "nope" is not listed in content/media.yaml`. Revert the change and re-run to confirm `Content OK`.

- [ ] **Step 13: Typecheck and commit**

Run: `pnpm typecheck && pnpm test`
Expected: PASS.

```bash
git add -A
git commit -m "feat: add media resolution, content loaders and content:check" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: UI primitives (Button, Container, SectionLabel)

**Files:**
- Create: `src/components/ui/button.tsx`, `src/components/ui/button.test.tsx`, `src/components/ui/container.tsx`, `src/components/ui/section-label.tsx`, `src/components/ui/section-label.test.tsx`

**Interfaces:**
- Produces: `Button` + `buttonVariants` + `ButtonProps` (`variant: "default"|"secondary"|"accent"|"outline"|"ghost"`, `size: "sm"|"md"|"lg"`, `asChild?: boolean`); `Container` (div props); `SectionLabel` (`index?: string`, p props).

- [ ] **Step 1: Write the failing tests**

`src/components/ui/button.test.tsx`:
```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "./button";

describe("Button", () => {
  it("uses the primary token by default", () => {
    render(<Button>Go</Button>);
    expect(screen.getByRole("button", { name: "Go" })).toHaveClass("bg-primary", "text-primary-foreground");
  });

  it.each([
    ["secondary", "bg-secondary"],
    ["accent", "bg-accent"],
  ] as const)("variant %s", (variant, expected) => {
    render(<Button variant={variant}>Go</Button>);
    expect(screen.getByRole("button")).toHaveClass(expected);
  });

  it("merges className over size defaults", () => {
    render(<Button className="px-10">Go</Button>);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("px-10");
    expect(button).not.toHaveClass("px-6");
  });

  it("renders the child element with asChild", () => {
    render(
      <Button asChild>
        <a href="/contact/">Contact</a>
      </Button>,
    );
    expect(screen.getByRole("link", { name: "Contact" })).toHaveClass("bg-primary");
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("forwards native props", () => {
    render(<Button disabled type="submit">Send</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });
});
```

`src/components/ui/section-label.test.tsx`:
```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SectionLabel } from "./section-label";

describe("SectionLabel", () => {
  it("renders bracketed text with an index", () => {
    render(<SectionLabel index="001">services</SectionLabel>);
    expect(screen.getByText("[ 001 / services ]")).toBeInTheDocument();
  });

  it("renders bracketed text without an index", () => {
    render(<SectionLabel>services</SectionLabel>);
    expect(screen.getByText("[ services ]")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `pnpm test -- src/components/ui`
Expected: FAIL, cannot resolve `./button` / `./section-label`.

- [ ] **Step 3: Implement**

`src/components/ui/button.tsx`:
```tsx
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  // base: tokens only (rule 31); body font weight stays at normal (rule 31)
  "inline-flex items-center justify-center gap-2 rounded-pill font-body font-normal text-base whitespace-nowrap transition-colors duration-(--duration-base) ease-out-expo focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        accent: "bg-accent text-accent-foreground hover:bg-accent/90",
        outline: "border border-border bg-transparent hover:bg-surface",
        ghost: "hover:bg-surface",
      },
      size: {
        sm: "h-9 px-4 text-sm",
        md: "h-11 px-6",
        lg: "h-14 px-8 text-lead",
      },
    },
    defaultVariants: { variant: "default", size: "md" },
  },
);

export interface ButtonProps
  extends React.ComponentProps<"button">,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
```

`src/components/ui/container.tsx`:
```tsx
import { cn } from "@/lib/utils";

export function Container({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("mx-auto w-full max-w-content px-gutter", className)} {...props} />;
}
```

`src/components/ui/section-label.tsx`:
```tsx
import { cn } from "@/lib/utils";

export interface SectionLabelProps extends React.ComponentProps<"p"> {
  /** Section number such as "001". */
  index?: string;
}

export function SectionLabel({ index, className, children, ...props }: SectionLabelProps) {
  return (
    <p
      className={cn("font-body text-label uppercase tracking-label text-muted-foreground", className)}
      {...props}
    >
      [ {index ? `${index} / ` : ""}
      {children} ]
    </p>
  );
}
```

- [ ] **Step 4: Run to verify they pass**

Run: `pnpm test -- src/components/ui && pnpm typecheck`
Expected: PASS (7 tests), typecheck clean.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add Button, Container and SectionLabel primitives" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Motion layer (LenisProvider, Reveal)

**Files:**
- Create: `src/components/motion/lenis-provider.tsx`, `src/components/motion/reveal.tsx`, `src/components/motion/reveal.test.tsx`

**Interfaces:**
- Consumes: `duration`, `ease`, `lenisOptions` from `@/lib/motion`.
- Produces: `LenisProvider({ children })`; `Reveal({ delay?: number; y?: number } & div motion props)`, which renders `data-reveal` on its element.

- [ ] **Step 1: Write the failing test** `src/components/motion/reveal.test.tsx`

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Reveal } from "./reveal";

describe("Reveal", () => {
  it("renders its children", () => {
    render(<Reveal>Hello</Reveal>);
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });

  it("marks itself so the no-JS fallback can show it", () => {
    render(<Reveal>Hello</Reveal>);
    expect(screen.getByText("Hello")).toHaveAttribute("data-reveal");
  });

  it("passes className and native props through", () => {
    render(
      <Reveal className="mt-4" id="intro">
        Hello
      </Reveal>,
    );
    expect(screen.getByText("Hello")).toHaveClass("mt-4");
    expect(screen.getByText("Hello")).toHaveAttribute("id", "intro");
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm test -- src/components/motion/reveal.test.tsx`
Expected: FAIL, cannot resolve `./reveal`.

- [ ] **Step 3: Implement**

`src/components/motion/reveal.tsx`:
```tsx
"use client";

import { motion, useReducedMotion, type HTMLMotionProps } from "motion/react";
import { duration, ease } from "@/lib/motion";

export interface RevealProps
  extends Omit<HTMLMotionProps<"div">, "initial" | "animate" | "whileInView" | "viewport" | "transition"> {
  /** Seconds to wait before the reveal starts (for staggering siblings). */
  delay?: number;
  /** Starting vertical offset in px. */
  y?: number;
}

export function Reveal({ delay = 0, y = 24, children, ...props }: RevealProps) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      data-reveal=""
      initial={{ opacity: 0, y: reduced ? 0 : y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{
        duration: reduced ? duration.fast : duration.slow,
        delay: reduced ? 0 : delay,
        ease: ease.outExpo,
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
```

`src/components/motion/lenis-provider.tsx`:
```tsx
"use client";

import "lenis/dist/lenis.css";
import { ReactLenis } from "lenis/react";
import { useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { lenisOptions } from "@/lib/motion";

/** The only Lenis instance in the app. Reduced-motion users get native scrolling. */
export function LenisProvider({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();
  if (reduced) return <>{children}</>;
  return (
    <ReactLenis root options={lenisOptions}>
      {children}
    </ReactLenis>
  );
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm test -- src/components/motion && pnpm typecheck`
Expected: PASS (3 tests), typecheck clean. If TypeScript rejects `lenis/dist/lenis.css`, add `declare module "*.css";` to a new `src/types/css.d.ts`.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add Lenis provider and Reveal motion wrapper" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Layout shell (Header, Footer)

**Files:**
- Create: `src/components/layout/header.tsx`, `src/components/layout/header.test.tsx`, `src/components/layout/footer.tsx`, `src/components/layout/footer.test.tsx`

**Interfaces:**
- Produces: `NavItem { label: string; href: string }`; `Header({ name, logo, nav, cta? })` where `logo: { src: string; alt: string; width: number; height: number }`; `Footer({ name, tagline, contact: { email; phones; address }, offices: { name; city }[], nav, social: { label; href }[] })`.
- Header toggle button accessible name is `"Open menu"` / `"Close menu"` and controls `#mobile-nav`.

- [ ] **Step 1: Write the failing tests**

`src/components/layout/header.test.tsx`:
```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Header } from "./header";

const props = {
  name: "Envirosphere",
  logo: { src: "/media/brand/logo.svg", alt: "Envirosphere logo", width: 40, height: 40 },
  nav: [
    { label: "Home", href: "/" },
    { label: "Services", href: "/services/" },
  ],
  cta: { label: "Get in touch", href: "/contact/" },
};

describe("Header", () => {
  it("renders nav links and the call to action", () => {
    render(<Header {...props} />);
    expect(screen.getAllByRole("link", { name: "Services" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: "Get in touch" }).length).toBeGreaterThan(0);
  });

  it("toggles the mobile menu with correct aria state", async () => {
    render(<Header {...props} />);
    const toggle = screen.getByRole("button", { name: "Open menu" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(toggle).toHaveAttribute("aria-controls", "mobile-nav");
    await userEvent.click(toggle);
    expect(screen.getByRole("button", { name: "Close menu" })).toHaveAttribute("aria-expanded", "true");
  });

  it("closes the mobile menu after choosing a link", async () => {
    render(<Header {...props} />);
    await userEvent.click(screen.getByRole("button", { name: "Open menu" }));
    const mobileNav = document.getElementById("mobile-nav") as HTMLElement;
    await userEvent.click(mobileNav.querySelector("a[href='/services/']") as HTMLElement);
    expect(screen.getByRole("button", { name: "Open menu" })).toBeInTheDocument();
  });
});
```

`src/components/layout/footer.test.tsx`:
```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Footer } from "./footer";

const props = {
  name: "Envirosphere Consultant & Engineers",
  tagline: "Empowering Excellence",
  contact: {
    email: "info@envirosphere.co.in",
    phones: ["+91 9860220550"],
    address: "Rahatani, Pune - 411017",
  },
  offices: [{ name: "Head Office", city: "Pune" }],
  nav: [{ label: "About", href: "/about/" }],
  social: [{ label: "LinkedIn", href: "https://www.linkedin.com/company/test" }],
};

describe("Footer", () => {
  it("shows contact details as working links", () => {
    render(<Footer {...props} />);
    expect(screen.getByRole("link", { name: "info@envirosphere.co.in" })).toHaveAttribute(
      "href",
      "mailto:info@envirosphere.co.in",
    );
    expect(screen.getByRole("link", { name: "+91 9860220550" })).toHaveAttribute("href", "tel:+919860220550");
  });

  it("lists offices, nav and social links", () => {
    render(<Footer {...props} />);
    expect(screen.getByText("Head Office, Pune")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "About" })).toHaveAttribute("href", "/about/");
    expect(screen.getByRole("link", { name: "LinkedIn" })).toHaveAttribute("rel", expect.stringContaining("noopener"));
  });

  it("shows the current year in the copyright line", () => {
    render(<Footer {...props} />);
    expect(screen.getByText(new RegExp(String(new Date().getFullYear())))).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `pnpm test -- src/components/layout`
Expected: FAIL, cannot resolve `./header` / `./footer`.

- [ ] **Step 3: Implement**

`src/components/layout/header.tsx`:
```tsx
"use client";

import { Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

export interface NavItem {
  label: string;
  href: string;
}

export interface HeaderProps {
  name: string;
  logo: { src: string; alt: string; width: number; height: number };
  nav: NavItem[];
  cta?: NavItem;
}

export function Header({ name, logo, nav, cta }: HeaderProps) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-(--z-header) border-b border-border bg-background/85 backdrop-blur">
      <Container className="flex h-20 items-center justify-between gap-6">
        <Link href="/" className="flex items-center gap-3" onClick={() => setOpen(false)}>
          <Image src={logo.src} alt={logo.alt} width={logo.width} height={logo.height} priority />
          <span className="font-heading text-h4">{name}</span>
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-8 lg:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm underline-offset-8 transition-colors hover:underline"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {cta ? (
            <Button asChild variant="accent" size="sm" className="hidden lg:inline-flex">
              <Link href={cta.href}>{cta.label}</Link>
            </Button>
          ) : null}
          <button
            type="button"
            className="inline-flex size-11 items-center justify-center rounded-pill border border-border lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </button>
        </div>
      </Container>

      <nav id="mobile-nav" aria-label="Mobile" hidden={!open} className="border-t border-border lg:hidden">
        <Container className="flex flex-col gap-1 py-6">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="py-3 font-heading text-h3"
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          {cta ? (
            <Button asChild variant="accent" className="mt-4 self-start">
              <Link href={cta.href} onClick={() => setOpen(false)}>
                {cta.label}
              </Link>
            </Button>
          ) : null}
        </Container>
      </nav>
    </header>
  );
}
```

`src/components/layout/footer.tsx`:
```tsx
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { SectionLabel } from "@/components/ui/section-label";
import type { NavItem } from "./header";

export interface FooterProps {
  name: string;
  tagline: string;
  contact: { email: string; phones: string[]; address: string };
  offices: { name: string; city: string }[];
  nav: NavItem[];
  social: { label: string; href: string }[];
}

const telHref = (phone: string) => `tel:${phone.replace(/\s/g, "")}`;

export function Footer({ name, tagline, contact, offices, nav, social }: FooterProps) {
  return (
    <footer className="bg-primary py-section text-primary-foreground">
      <Container className="grid gap-16 lg:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <p className="font-heading text-h2">{name}</p>
          <p className="mt-4 max-w-md text-lead text-primary-foreground/80">{tagline}</p>
        </div>

        <div className="flex flex-col gap-3">
          <SectionLabel className="text-secondary">Contact</SectionLabel>
          <a className="underline-offset-4 hover:underline" href={`mailto:${contact.email}`}>
            {contact.email}
          </a>
          {contact.phones.map((phone) => (
            <a key={phone} className="underline-offset-4 hover:underline" href={telHref(phone)}>
              {phone}
            </a>
          ))}
          <address className="mt-2 not-italic text-primary-foreground/80">{contact.address}</address>
          <ul className="mt-2 flex flex-col gap-1 text-sm text-primary-foreground/80">
            {offices.map((office) => (
              <li key={`${office.name}-${office.city}`}>
                {office.name}, {office.city}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-3">
          <SectionLabel className="text-secondary">Explore</SectionLabel>
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="underline-offset-4 hover:underline">
              {item.label}
            </Link>
          ))}
          {social.map((item) => (
            <a
              key={item.href}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="underline-offset-4 hover:underline"
            >
              {item.label}
            </a>
          ))}
        </div>
      </Container>

      <Container className="mt-16 border-t border-primary-foreground/20 pt-6 text-sm text-primary-foreground/70">
        <p>
          © {new Date().getFullYear()} {name}
        </p>
      </Container>
    </footer>
  );
}
```

- [ ] **Step 4: Run to verify they pass**

Run: `pnpm test -- src/components/layout && pnpm typecheck`
Expected: PASS (6 tests), typecheck clean. If `next/image` fails to load in jsdom, add `vi.mock("next/image", () => ({ default: (p: Record<string, unknown>) => <img {...p} /> }))` at the top of `header.test.tsx` (and add `// eslint-disable-next-line @next/next/no-img-element` above the `<img`). If clicking a `next/link` in jsdom throws a router invariant, mock it the same way: `vi.mock("next/link", () => ({ default: ({ href, ...p }: { href: string } & Record<string, unknown>) => <a href={href} {...p} /> }))`.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add header with mobile menu and footer" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: App wiring, static export, hosting file, guardrail tests, e2e smoke

**Files:**
- Create: `next.config.ts`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/not-found.tsx`, `public/.htaccess`, `tests/unit/fonts.test.ts`, `tests/unit/rules.test.ts`, `playwright.config.ts`, `tests/e2e/smoke.spec.ts`

**Interfaces:**
- Consumes: everything above. `loadSite`, `loadHome`, `getImage`, `socialLinks`.
- Produces: a `pnpm build` that creates `out/index.html`, `out/404.html`, `out/.htaccess`.

- [ ] **Step 1: Write the failing guardrail tests**

`tests/unit/fonts.test.ts`:
```ts
// @vitest-environment node
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const layout = readFileSync(path.join(process.cwd(), "src/app/layout.tsx"), "utf8");

describe("fonts (rule 31)", () => {
  it("imports exactly Fraunces and Manrope from next/font/google", () => {
    const match = layout.match(/import\s*\{([^}]+)\}\s*from\s*"next\/font\/google"/);
    expect(match).not.toBeNull();
    const names = match![1].split(",").map((n) => n.trim()).filter(Boolean).sort();
    expect(names).toEqual(["Fraunces", "Manrope"]);
  });

  it("loads Manrope in weights 300 and 400 only", () => {
    expect(layout).toMatch(/weight:\s*\["300",\s*"400"\]/);
  });
});
```

`tests/unit/rules.test.ts`:
```ts
// @vitest-environment node
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.join(process.cwd(), "src");
const files = (readdirSync(root, { recursive: true }) as string[])
  .filter((f) => /\.(ts|tsx|css)$/.test(f) && !/\.test\./.test(f))
  .map((f) => ({ file: f, text: readFileSync(path.join(root, f), "utf8") }));

const offenders = (pattern: RegExp, only?: RegExp) =>
  files
    .filter(({ file }) => (only ? only.test(file) : true))
    .filter(({ text }) => pattern.test(text))
    .map(({ file }) => file);

describe("project rules are enforced in src/", () => {
  it("no bold-ish font weights (body weight ≤ 400)", () => {
    expect(offenders(/font-(medium|semibold|bold|extrabold|black)\b/)).toEqual([]);
  });

  it("no sparkle icons or emoji", () => {
    expect(offenders(/Sparkle|WandSparkles|✨/)).toEqual([]);
  });

  it("no raw hex colors in components or pages (tokens only)", () => {
    expect(offenders(/#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/, /\.tsx?$/)).toEqual([]);
  });

  it("no arbitrary pixel values in classes", () => {
    expect(offenders(/\[\d+(\.\d+)?px\]/, /\.tsx?$/)).toEqual([]);
  });

  it("no framer-motion imports", () => {
    expect(offenders(/from\s+"framer-motion"/)).toEqual([]);
  });

  it("no server-only features that break the static export", () => {
    expect(offenders(/"use server"|from\s+"next\/headers"|NextResponse/)).toEqual([]);
  });
});
```

- [ ] **Step 2: Run to verify the fonts test fails**

Run: `pnpm test -- tests/unit/fonts.test.ts tests/unit/rules.test.ts`
Expected: `fonts.test.ts` FAILS (`layout.tsx` does not exist: ENOENT); `rules.test.ts` PASSES.

- [ ] **Step 3: Write `next.config.ts`**

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export", // plain HTML in out/ for Hostinger
  trailingSlash: true, // /about/ → about/index.html works on Apache/LiteSpeed
  images: { unoptimized: true }, // no image server on static hosting; Plan 5 pre-optimizes files
  reactStrictMode: true,
};

export default nextConfig;
```

- [ ] **Step 4: Write `src/app/layout.tsx`**

```tsx
import type { Metadata } from "next";
import { Fraunces, Manrope } from "next/font/google";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { LenisProvider } from "@/components/motion/lenis-provider";
import { getImage, loadSite, socialLinks } from "@/lib/content";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  axes: ["opsz", "SOFT"],
  variable: "--font-fraunces",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["300", "400"],
  variable: "--font-manrope",
  display: "swap",
});

export function generateMetadata(): Metadata {
  const site = loadSite();
  const og = getImage(site.seo.ogImageKey);
  return {
    metadataBase: new URL(site.url),
    title: { default: site.name, template: site.seo.titleTemplate },
    description: site.seo.description,
    openGraph: {
      siteName: site.name,
      locale: site.locale.replace("-", "_"),
      type: "website",
      images: [{ url: og.src, alt: og.alt }],
    },
  };
}

// Reveal wrappers start hidden; this keeps content visible when JavaScript is off.
const noScriptFallback = "[data-reveal]{opacity:1!important;transform:none!important}";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const site = loadSite();
  const logo = getImage(site.logoKey);

  return (
    <html lang={site.locale} className={`${fraunces.variable} ${manrope.variable}`}>
      <head>
        <noscript>
          <style>{noScriptFallback}</style>
        </noscript>
      </head>
      <body>
        <LenisProvider>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-(--z-header) focus:rounded-pill focus:bg-accent focus:px-6 focus:py-3 focus:text-accent-foreground"
          >
            Skip to content
          </a>
          <Header
            name={site.shortName}
            logo={{ src: logo.src, alt: logo.alt, width: logo.width ?? 40, height: logo.height ?? 40 }}
            nav={site.nav}
            cta={site.cta}
          />
          <main id="main">{children}</main>
          <Footer
            name={site.name}
            tagline={site.tagline}
            contact={site.contact}
            offices={site.offices}
            nav={site.nav}
            social={socialLinks(site)}
          />
        </LenisProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 5: Write `src/app/page.tsx` and `src/app/not-found.tsx`**

`src/app/page.tsx`:
```tsx
import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { SectionLabel } from "@/components/ui/section-label";
import { loadHome } from "@/lib/content";

export default function HomePage() {
  const { hero } = loadHome();
  return (
    <section className="bg-primary py-section text-primary-foreground">
      <Container>
        <Reveal>
          <SectionLabel className="text-secondary">{hero.eyebrow}</SectionLabel>
        </Reveal>
        <Reveal delay={0.1}>
          <h1 className="mt-8 max-w-5xl text-display">{hero.title}</h1>
        </Reveal>
        <Reveal delay={0.2}>
          <p className="mt-10 max-w-2xl text-lead font-light text-primary-foreground/80">{hero.subtitle}</p>
        </Reveal>
        <Reveal delay={0.3}>
          <Button asChild variant="accent" size="lg" className="mt-12">
            <Link href={hero.primaryCta.href}>{hero.primaryCta.label}</Link>
          </Button>
        </Reveal>
      </Container>
    </section>
  );
}
```

`src/app/not-found.tsx`:
```tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { SectionLabel } from "@/components/ui/section-label";

export default function NotFound() {
  return (
    <section className="py-section">
      <Container>
        <SectionLabel index="404">page not found</SectionLabel>
        <h1 className="mt-6 text-h1">This page has moved or does not exist.</h1>
        <Button asChild className="mt-10">
          <Link href="/">Back to home</Link>
        </Button>
      </Container>
    </section>
  );
}
```

- [ ] **Step 6: Write `public/.htaccess`**

```apache
# Hostinger (LiteSpeed/Apache) rules for the static export. CSP is added in Plan 5.
Options -Indexes
DirectoryIndex index.html
ErrorDocument 404 /404.html

<IfModule mod_rewrite.c>
  RewriteEngine On
  # Force HTTPS
  RewriteCond %{HTTPS} off
  RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
  # /about → /about/ (matches trailingSlash: true)
  RewriteCond %{REQUEST_FILENAME} -d
  RewriteCond %{REQUEST_URI} !/$
  RewriteRule ^(.*)$ /$1/ [L,R=301]
</IfModule>

<IfModule mod_headers.c>
  Header always set X-Content-Type-Options "nosniff"
  Header always set Referrer-Policy "strict-origin-when-cross-origin"
  Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
  Header always set Permissions-Policy "camera=(), microphone=(), geolocation=()"

  # Hashed build files never change; HTML and owner-replaceable media must stay fresh.
  <FilesMatch "\.(js|css|woff2)$">
    Header set Cache-Control "public, max-age=31536000, immutable"
  </FilesMatch>
  <FilesMatch "\.(svg|jpg|jpeg|png|webp|avif|mp4|pdf)$">
    Header set Cache-Control "public, max-age=86400, must-revalidate"
  </FilesMatch>
  <FilesMatch "\.html$">
    Header set Cache-Control "no-cache"
  </FilesMatch>
</IfModule>
```

- [ ] **Step 7: Run guardrail tests and typecheck/lint**

Run: `pnpm test && pnpm typecheck && pnpm lint`
Expected: all PASS. (`page.tsx` uses `font-light` on Manrope = weight 300, allowed.)

- [ ] **Step 8: Build the static site**

Run: `pnpm build`
Expected: `Content OK: 1 media items, 1 services`, then a successful `next build` listing `/` and `/_not-found` as static (○). Then verify:
```bash
ls out/index.html out/404.html out/.htaccess
```
Expected: all three exist. If `out/.htaccess` is missing, copy it explicitly by adding `"postbuild": "node -e \"require('fs').copyFileSync('public/.htaccess','out/.htaccess')\""` to `package.json` scripts.

- [ ] **Step 9: Playwright config and smoke test**

`playwright.config.ts`:
```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  webServer: {
    command: "pnpm build && pnpm preview",
    url: "http://localhost:4173",
    reuseExistingServer: true,
    timeout: 180_000,
  },
  use: { baseURL: "http://localhost:4173" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
});
```

`tests/e2e/smoke.spec.ts`:
```ts
import { expect, test } from "@playwright/test";

test("home renders the hero and the main menu", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  const menuButton = page.getByRole("button", { name: "Open menu" });
  if (await menuButton.isVisible()) await menuButton.click();
  await expect(page.getByRole("link", { name: "Services" }).first()).toBeVisible();
});

test("content stays visible without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await context.close();
});

test("unknown pages show the 404 page", async ({ page }) => {
  await page.goto("/does-not-exist/");
  await expect(page.getByText("This page has moved or does not exist.")).toBeVisible();
});
```

- [ ] **Step 10: Run e2e**

Run: `pnpm exec playwright install chromium && pnpm test:e2e`
Expected: 6 tests pass (3 tests × desktop + mobile). If the 404 test fails because `serve` returns its own page, note it in the commit and keep the other two; 404 behavior is verified on Hostinger via `.htaccess`.

- [ ] **Step 11: Visual check in a real browser**

Run `pnpm dev`, open `http://localhost:3000` at 1440px and 375px wide. Confirm: Forest hero, Fraunces headline, Manrope body, Ochre button, sticky header, mobile menu opens, smooth scroll works, and the page is readable. Report anything off instead of fixing silently.

- [ ] **Step 12: Commit**

```bash
git add -A
git commit -m "feat: wire layout, home placeholder and static export build" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: Owner guide and doc sync

**Files:**
- Create: `content/README.md`
- Modify: `docs/ai-context.md` (Current focus line), `PROJECT-REQUIREMENTS.md` (§2 version numbers if any changed during install)

- [ ] **Step 1: Write the owner guide** `content/README.md`

```markdown
# How to edit the website content

Everything you can change without a developer lives in two places:

- `content/`: all text, lists and settings (this folder)
- `public/media/`: all images, logos, videos and PDF files

## Change text
1. Open the file for that page (for example `content/pages/home.yaml`).
2. Edit the words after the colon. Keep the spaces and the dashes `-` at the start of list items.
3. Save, then ask for a rebuild (or run `pnpm build`) and upload the `out` folder to Hostinger.

If something is wrong, the build stops and tells you the file and the line that needs fixing,
for example: `content/faq.yaml → items[2]: "answer" is missing`.

## Replace an image
1. Put the new file in `public/media/` (same file name keeps everything working with no other change).
2. If you use a new file name, open `content/media.yaml` and change the `src:` line for that image.
3. Update `alt:` to describe the picture in a few words. Screen readers and Google read it.

## Add or remove a service
Each service is one file in `content/services/`. Copy an existing file, rename it
(lowercase, dashes, for example `crz-clearance.md`), and edit the text. Delete the file to remove it.
The `order:` number controls the position in lists.

## What you cannot change here
Colors and fonts are part of the design. Ask the developer, for example "make the accent color a deeper ochre".

## Check your changes
Run `pnpm content:check`. It prints `Content OK` or tells you what to fix.
```

- [ ] **Step 2: Sync the brief**

In `docs/ai-context.md`, replace the "Current focus" line with:
```
Plan 1 (Foundation) done. Next: Plan 2 (Motion kit + Home sections). See docs/superpowers/plans/.
```

- [ ] **Step 3: Final verification**

Run: `pnpm lint && pnpm typecheck && pnpm test && pnpm build`
Expected: all green; `out/` contains `index.html`, `404.html`, `.htaccess`, `media/brand/logo.svg`.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "docs: add content editing guide and sync architecture brief" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

## Self-Review

**Spec coverage** (against `PROJECT-REQUIREMENTS.md` for Plan 1 scope):
- No monorepo / single app / pnpm / Node 24: Task 1. ✔
- Next 16.4.x static export, `trailingSlash`, no server features: Tasks 1, 9 (+ `rules.test.ts` guard). ✔
- Tailwind v4 tokens, nature palette roles, WCAG pairs: Task 3 (contrast test). ✔
- Two fonts, Manrope 300/400, no bold: Tasks 3, 9 (`fonts.test.ts`, `rules.test.ts`). ✔
- Sparkles banned: Task 2 (ESLint), Task 9 (`rules.test.ts`). ✔
- Lenis + Motion, reduced motion, no-JS fallback: Tasks 7, 9. ✔
- File-based content, media keys, build-time validation, plain error messages, `content:check`: Tasks 4, 5. ✔
- `.htaccess`, `out/` output: Task 9. ✔
- Owner guide: Task 10. ✔
- Deferred to later plans by design: scroll sections, inner pages, asset download, forms/Apps Script, SEO files, image optimization, CSP. ✔

**Placeholder scan:** No TBD/"handle edge cases" steps. `TODO(content)` markers in seed YAML are intentional, per rule 33.

**Type consistency:** `ResolvedMedia` (`media.ts`) fields match `Header.logo` usage in `layout.tsx` (`width ?? 40`). `Service` in `index.ts` matches `serviceFrontMatterSchema` + `slug`/`body`. `NavItem` is defined in `header.tsx` and imported by `footer.tsx`. `socialLinks` returns the `{label, href}[]` that `Footer.social` expects. `duration`/`ease` in `motion.ts` match the names used in `reveal.tsx` and `tokens.test.ts`.

**Known risks flagged in-step:** contrast pair may need a 0.02 lightness tweak (Task 3 Step 6); `next/image` in jsdom (Task 8 Step 4); `.htaccess` copy (Task 9 Step 8); `serve` 404 behavior (Task 9 Step 10).
