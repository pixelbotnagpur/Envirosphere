# Envirosphere Motion Kit + Home Page Implementation Plan (Plan 2 of 5)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the Plan 1 carry-overs, add the scroll-driven motion kit, and build the real Home page (hero, about, services index, stats, clients marquee, pinned process story, testimonials, contact call-to-action) from owner-editable content and real assets from the current site.

**Architecture:** Same static-export Next.js app. Motion primitives live in `src/components/motion` (client leaves); sections in `src/components/sections` are plain props-driven components composed on `src/app/page.tsx`, which reads `content/pages/home.yaml`, `content/services/*.md` and `content/media.yaml` at build time. Above-the-fold entrance uses CSS keyframes (no JS, no hidden-until-hydration); below-the-fold uses Motion. The pinned process story renders a plain stacked list on mobile, with reduced motion, and before hydration.

**Tech Stack:** Next.js 16.4.2 (export), React 19.2, Tailwind v4 tokens, Motion 14.6 (`motion/react`), Lenis 1.3, Zod, `yaml`, Vitest + Testing Library, Playwright, `sharp` (new dev dependency: one-time asset resize script, reused for Plan 5 image optimization).

## Plan series
1. Foundation: done, merged to `main`.
2. **Motion kit + Home (this plan)**, built on branch `feat/home`.
3. Inner pages + brand assets: About, Services index + 13 service pages (text from the current site), Why Us, Gallery, Downloads, Careers, Contact page shell; real logo; remaining assets.
4. Forms: inquiry/career forms, Apps Script → Google Sheet, Turnstile, `Button` default `type="button"`.
5. Launch: SEO files, raster OG image, canonical URL, CSP, Lighthouse/a11y pass, Hostinger deploy guide.

## Global Constraints

Every task's requirements include these:

- Single Next.js app, **not a monorepo**. Static export only (`output: "export"`, `trailingSlash: true`): no server actions, route handlers, middleware, ISR, `cookies()`, `headers()`.
- Animation: `motion` from `motion/react` only (never `framer-motion`). One Lenis instance. Animate only `transform`, `opacity`, `clip-path`, `filter`. Honor `prefers-reduced-motion`. Text must be readable without JavaScript and before hydration (rule 34).
- **Tokens only**: no hex/rgb/hsl/oklch literals or `[Npx]` values in tsx; palette roles are semantic (primary Forest, secondary Sage, accent Ochre, background Bone, surface Sand, foreground Bark, muted-foreground Lichen, border Linen, destructive Clay). No primitive color utilities (`bg-forest-700`).
- **Fonts:** exactly two: Syne (`font-heading`, Regular 400 only) and Manrope (`font-body`, 300/400 only). No `font-medium|semibold|bold|extrabold|black`, no `font-[…]`.
- **Banned icons:** `Sparkles`, `Sparkle`, `WandSparkles` and the ✨ emoji. lucide-react only.
- **Focus:** one global two-tone ring in `globals.css` (unlayered). Components must never add `focus:`/`focus-visible:`/`focus-within:` ring/shadow/outline utilities, `outline-none|hidden|0`, or `ring-*`/`shadow-*` utilities on focusable elements.
- **Content:** every visible string, number, link and media path comes from `content/` (rule 33), never JSX literals. Never invent facts; wording drafted for the owner is flagged `TODO(content)`.
- Components: build once in `src/components/ui` or `motion`, extend with CVA/props, merge `className` via `cn()`. Import direction: `ui` and `motion` never import `sections`, `app` or `lib/content`; `sections` never import `lib/content` (they receive props; type-only imports from `@/lib/validators/content` are fine).
- Import alias `@/*` → `src/*`. TypeScript strict, no `any`. Server Components by default; `"use client"` only on leaves that need it.
- Tests: TDD, import `describe/it/expect` from "vitest", `// @vitest-environment node` for fs tests. Never delete/skip a failing test.
- Commit messages: Conventional Commits, subject ≤ 72 chars, ending with the trailer `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`. Stay on branch `feat/home`; never commit to `main`.
- Owner-safety/robustness findings from reviews are auto-fixed; design/scope/visible-behavior changes are escalated to the user.

---

## File Structure

```
scripts/fetch-home-assets.ts                     (new)  one-time asset downloader + resizer
public/media/clients/*.webp  public/media/images/about.webp   (new, generated)
content/media.yaml (modify)  content/site.yaml (modify: ui block)
content/pages/home.yaml (rewrite)  content/services/*.md (12 new + 1 edit)
src/app/globals.css (modify)  src/app/layout.tsx  src/app/page.tsx  src/app/not-found.tsx
src/lib/links.ts (+test)  src/lib/motion.ts (unchanged)
src/lib/validators/content.ts (+test)  src/lib/content/index.ts (+test)  src/lib/content/read.ts (BOM escape)
src/hooks/use-hydrated.ts  src/hooks/use-pinned.ts
src/components/motion/{reveal,lenis-provider}.tsx (modify)
src/components/motion/{split-text,scroll-words,counter,parallax,marquee,scroll-story}.tsx (+tests)
src/components/ui/section-label.tsx (modify)
src/components/layout/{header,footer}.tsx (modify)
src/components/sections/{types.ts,hero,about,services-index,stats,clients,process,testimonials,contact-cta}.tsx (+tests)
tests/unit/helpers/fixtures.ts (rewrite)  tests/unit/real-content.test.ts  tests/setup.ts
tests/e2e/helpers/site.ts  tests/e2e/smoke.spec.ts (modify)  tests/e2e/home.spec.ts
```

---

### Task 1: Hydration-safe motion foundation, design-token fixes, hero entrance utility

**Files:**
- Modify: `src/components/motion/reveal.tsx`, `src/components/motion/reveal.test.tsx`, `src/components/motion/lenis-provider.tsx`, `src/app/globals.css`, `src/lib/motion.ts` (unchanged unless noted), `tests/setup.ts`, `tests/unit/tokens.test.ts`, `src/components/layout/header.tsx` (token use only)
- Create: `src/hooks/use-hydrated.ts`

**Interfaces:**
- Produces: `Reveal` (same name; no SSR reduced-motion branch; typed so callers cannot pass `style`, `variants`, `while*`, `exit`, `layout`, `animate`); CSS utilities `rise`, `rise-1`, `rise-2`, `rise-3`; tokens `--stagger`, `--spacing-header` (→ `h-header`), `--animate-marquee` (→ `animate-marquee`); `useHydrated(): boolean`.

- [ ] **Step 1: Write failing tests**

Append to `src/components/motion/reveal.test.tsx` (keep existing tests):
```tsx
  it("starts hidden and offset so the entrance can play", () => {
    render(<Reveal>Hello</Reveal>);
    expect(screen.getByText("Hello")).toHaveStyle({ opacity: "0" });
  });

  it("does not let callers override the animation contract", () => {
    // @ts-expect-error style is omitted from RevealProps
    render(<Reveal style={{ opacity: 1 }}>x</Reveal>);
    // @ts-expect-error whileHover is omitted from RevealProps
    render(<Reveal whileHover={{ scale: 2 }}>y</Reveal>);
  });
```
Append to `tests/unit/tokens.test.ts` (inside the file, after existing describes):
```ts
describe("motion utilities and layout tokens", () => {
  it("defines the hero entrance keyframes and stagger", () => {
    expect(css).toMatch(/@keyframes rise\s*\{/);
    expect(css).toMatch(/@utility rise\s*\{/);
    expect(tokens.get("--stagger")).toBe("120ms");
  });
  it("defines the header height and marquee tokens", () => {
    expect(tokens.get("--spacing-header")).toBe("5rem");
    expect(tokens.get("--animate-marquee")).toContain("marquee");
  });
  it("keeps h1 smaller than display at narrow widths", () => {
    expect(tokens.get("--text-h1")).toBe("clamp(2.25rem, 1.25rem + 5vw, 6rem)");
  });
});
```

- [ ] **Step 2: Run to verify RED**

Run: `pnpm test -- src/components/motion/reveal.test.tsx tests/unit/tokens.test.ts`
Expected: FAIL (`@ts-expect-error` unused / tokens missing).

- [ ] **Step 3: Replace `src/components/motion/reveal.tsx`**

```tsx
"use client";

import { motion, type HTMLMotionProps } from "motion/react";
import { duration, ease } from "@/lib/motion";

type Controlled =
  | "initial"
  | "animate"
  | "whileInView"
  | "whileHover"
  | "whileTap"
  | "whileFocus"
  | "whileDrag"
  | "exit"
  | "variants"
  | "viewport"
  | "transition"
  | "style"
  | "layout";

export interface RevealProps extends Omit<HTMLMotionProps<"div">, Controlled> {
  /** Seconds to wait before the reveal starts (for staggering siblings). */
  delay?: number;
  /** Starting vertical offset in px. */
  y?: number;
}

/**
 * Below-the-fold entrance. Above-the-fold content uses the CSS `rise` utility instead, so it is
 * never served hidden. Reduced motion is handled globally by <MotionConfig reducedMotion="user">.
 */
export function Reveal({ delay = 0, y = 24, children, ...props }: RevealProps) {
  return (
    <motion.div
      data-reveal=""
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: duration.slow, delay, ease: ease.outExpo }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
```

- [ ] **Step 4: Replace `src/components/motion/lenis-provider.tsx`**

```tsx
"use client";

import "lenis/dist/lenis.css";
import { ReactLenis } from "lenis/react";
import { MotionConfig, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { lenisOptions } from "@/lib/motion";

/** The only Lenis instance in the app. Reduced-motion users get native scrolling and no transform animation. */
export function LenisProvider({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();
  return (
    <MotionConfig reducedMotion="user">
      {reduced ? (
        children
      ) : (
        <ReactLenis root options={lenisOptions}>
          {children}
        </ReactLenis>
      )}
    </MotionConfig>
  );
}
```

- [ ] **Step 5: Create `src/hooks/use-hydrated.ts`**

```ts
import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** False during SSR and the first client render, true afterwards. Avoids setState-in-effect. */
export function useHydrated(): boolean {
  return useSyncExternalStore(subscribe, () => true, () => false);
}
```

- [ ] **Step 6: Edit `src/app/globals.css`**

In the `@theme static` block:
- change `--text-h1: clamp(2.75rem, 1.5rem + 5vw, 6rem);` to `--text-h1: clamp(2.25rem, 1.25rem + 5vw, 6rem);`
- add under `/* ── Shape, space, layout ── */`: `--spacing-header: 5rem;`
- add under motion tokens: `--stagger: 120ms;`

After the `@theme static { … }` block (before `@layer base`), add:
```css
@theme {
  --animate-marquee: marquee var(--marquee-duration, 40s) linear infinite;

  @keyframes marquee {
    to {
      transform: translateX(-100%);
    }
  }
}

/* Above-the-fold entrance: pure CSS so the hero is never hidden before hydration or without JS. */
@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(1.5rem);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@utility rise {
  @media (prefers-reduced-motion: no-preference) {
    animation: rise var(--duration-slow) var(--ease-out-expo) both;
    animation-delay: var(--rise-delay, 0ms);
  }
}

@utility rise-1 {
  --rise-delay: var(--stagger);
}

@utility rise-2 {
  --rise-delay: calc(var(--stagger) * 2);
}

@utility rise-3 {
  --rise-delay: calc(var(--stagger) * 3);
}
```
Inside `@layer base`, in the `html { … }` rule add `scroll-padding-top: var(--spacing-header);`.

- [ ] **Step 7: Use the header token in `src/components/layout/header.tsx`**

Replace `h-20` (on the first `Container`) with `h-header`, and replace `max-h-[calc(100dvh-5rem)]` with `max-h-[calc(100dvh-var(--spacing-header))]`; update the comment above it to `{/* data-lenis-prevent lets the panel scroll natively under Lenis; the cap is the viewport minus the header bar. */}`.

- [ ] **Step 8: Add a ResizeObserver stub to `tests/setup.ts`**

Inside the existing `if (typeof window !== "undefined") { … }` block add:
```ts
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  Object.defineProperty(window, "ResizeObserver", {
    writable: true,
    configurable: true,
    value: ResizeObserverStub,
  });
```

- [ ] **Step 9: Verify GREEN and nothing regressed**

Run: `pnpm test && pnpm typecheck && pnpm lint`
Expected: all pass. If `@theme` containing `@keyframes` is rejected by the installed Tailwind, move `@keyframes marquee` to top level and keep `--animate-marquee` inside `@theme`; report it.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: hydration-safe motion base, hero rise utility, token fixes" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Chrome strings move to content; header/footer/section-label hardening

**Files:**
- Modify: `src/lib/validators/content.ts`, `src/lib/validators/content.test.ts`, `tests/unit/helpers/fixtures.ts`, `content/site.yaml`, `src/components/layout/header.tsx`, `src/components/layout/footer.tsx`, `src/components/layout/header.test.tsx`, `src/components/layout/footer.test.tsx`, `src/components/ui/section-label.tsx`, `src/components/ui/section-label.test.tsx`, `src/lib/content/read.ts`, `src/app/layout.tsx`, `src/app/not-found.tsx`, `tests/e2e/smoke.spec.ts`
- Create: `src/lib/links.ts`, `src/lib/links.test.ts`, `tests/e2e/helpers/site.ts`

**Interfaces:**
- Produces: `siteSchema.ui` with exactly: `skipToContent`, `openMenu`, `closeMenu`, `mainNav`, `mobileNav`, `footerContact`, `footerExplore`, `notFound: { label, heading, cta }` (all non-empty strings). `Header` props gain `labels: { openMenu: string; closeMenu: string; mainNav: string; mobileNav: string }`; its `logo` prop becomes `{ src: string; width: number; height: number }` (decorative `alt=""`). `Footer` props gain `labels: { contact: string; explore: string }`. `SectionLabel` gains `tone: "muted" | "inverse"` (default `muted`). `telHref(phone)`, `mailtoHref(email)` from `@/lib/links`.

- [ ] **Step 1: Write failing tests**

`src/lib/links.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { mailtoHref, telHref } from "./links";

describe("links", () => {
  it("strips spaces from phone numbers for tel: links", () => {
    expect(telHref("+91 98602 20550")).toBe("tel:+919860220550");
  });
  it("builds mailto links", () => {
    expect(mailtoHref("info@example.com")).toBe("mailto:info@example.com");
  });
});
```
In `src/lib/validators/content.test.ts` add:
```ts
  it("requires every interface label in site.ui", () => {
    const site = parse(SITE_YAML);
    delete site.ui.skipToContent;
    expect(siteSchema.safeParse(site).success).toBe(false);
  });
```
In `src/components/ui/section-label.test.tsx` add:
```tsx
  it("uses the muted tone by default and the inverse tone on dark sections", () => {
    const { rerender } = render(<SectionLabel>one</SectionLabel>);
    expect(screen.getByText(/one/)).toHaveClass("text-muted-foreground", "tabular-nums");
    rerender(<SectionLabel tone="inverse">one</SectionLabel>);
    expect(screen.getByText(/one/)).toHaveClass("text-secondary");
    expect(screen.getByText(/one/)).not.toHaveClass("text-muted-foreground");
  });
```
In `src/components/layout/header.test.tsx` (existing props object): add `labels` to the shared props (`{ openMenu: "Open menu", closeMenu: "Close menu", mainNav: "Main", mobileNav: "Mobile" }`), drop `alt` from `logo`, and add:
```tsx
  it("closes the mobile menu with Escape and returns focus to the toggle", async () => {
    render(<Header {...props} />);
    const toggle = screen.getByRole("button", { name: "Open menu" });
    await userEvent.click(toggle);
    await userEvent.keyboard("{Escape}");
    expect(screen.getByRole("button", { name: "Open menu" })).toHaveFocus();
    expect(document.getElementById("mobile-nav")).toHaveAttribute("hidden");
  });

  it("marks the logo image decorative because the brand name is visible text", () => {
    const { container } = render(<Header {...props} />);
    expect(container.querySelector("img")).toHaveAttribute("alt", "");
  });
```
In `src/components/layout/footer.test.tsx` add `labels: { contact: "Contact", explore: "Explore" }` to props and:
```tsx
  it("exposes the explore links as a labelled navigation landmark", () => {
    render(<Footer {...props} />);
    expect(screen.getByRole("navigation", { name: "Explore" })).toBeInTheDocument();
  });
```

- [ ] **Step 2: Run to verify RED**

Run: `pnpm test -- src/lib src/components/ui src/components/layout`
Expected: FAIL.

- [ ] **Step 3: Implement**

`src/lib/links.ts`:
```ts
/** `tel:` link: spaces are not allowed inside a tel: URI. */
export const telHref = (phone: string): string => `tel:${phone.replace(/\s/g, "")}`;

export const mailtoHref = (email: string): string => `mailto:${email}`;
```
`src/lib/validators/content.ts`: add to `siteSchema` (next to `seo`):
```ts
  ui: z.object({
    skipToContent: z.string().min(1),
    openMenu: z.string().min(1),
    closeMenu: z.string().min(1),
    mainNav: z.string().min(1),
    mobileNav: z.string().min(1),
    footerContact: z.string().min(1),
    footerExplore: z.string().min(1),
    notFound: z.object({
      label: z.string().min(1),
      heading: z.string().min(1),
      cta: z.string().min(1),
    }),
  }),
```
`tests/unit/helpers/fixtures.ts` `SITE_YAML`: append
```yaml
ui:
  skipToContent: Skip to content
  openMenu: Open menu
  closeMenu: Close menu
  mainNav: Main
  mobileNav: Mobile
  footerContact: Contact
  footerExplore: Explore
  notFound:
    label: page not found
    heading: This page has moved or does not exist.
    cta: Back to home
```
`content/site.yaml`: append the same `ui:` block, preceded by the comment `# Short interface texts used by the header, footer and 404 page (screen readers use them too).`

`src/components/ui/section-label.tsx` (replace file):
```tsx
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const labelVariants = cva("font-body text-label uppercase tracking-label tabular-nums", {
  variants: {
    tone: { muted: "text-muted-foreground", inverse: "text-secondary" },
  },
  defaultVariants: { tone: "muted" },
});

export interface SectionLabelProps
  extends React.ComponentProps<"p">,
    VariantProps<typeof labelVariants> {
  /** Section number such as "001". */
  index?: string;
}

export function SectionLabel({ index, tone, className, children, ...props }: SectionLabelProps) {
  // Non-breaking spaces keep the brackets attached to their text so a bracket never wraps alone.
  return (
    <p className={cn(labelVariants({ tone }), className)} {...props}>
      {"[\u00A0"}
      {index ? `${index} / ` : ""}
      {children}
      {"\u00A0]"}
    </p>
  );
}
```
`src/lib/content/read.ts`: replace the literal U+FEFF character inside the BOM-stripping regex with the escape `\uFEFF` (behavior unchanged; existing read tests must still pass).

`src/components/layout/header.tsx`: change `HeaderProps` to
```ts
export interface HeaderProps {
  name: string;
  logo: { src: string; width: number; height: number };
  labels: { openMenu: string; closeMenu: string; mainNav: string; mobileNav: string };
  nav: NavItem[];
  cta?: NavItem;
}
```
Use `labels` for the two `aria-label`s on `<nav>` and for the toggle's `aria-label` (open/close). Render the logo as `<Image src={logo.src} alt="" width={logo.width} height={logo.height} priority />`. Add Escape handling:
```tsx
const toggleRef = useRef<HTMLButtonElement>(null);
useEffect(() => {
  if (!open) return;
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== "Escape") return;
    setOpen(false);
    toggleRef.current?.focus();
  };
  document.addEventListener("keydown", onKeyDown);
  return () => document.removeEventListener("keydown", onKeyDown);
}, [open]);
```
(`import { useEffect, useRef, useState } from "react"`; put `ref={toggleRef}` on the toggle `<button>`.)

`src/components/layout/footer.tsx`: add `labels: { contact: string; explore: string }` to `FooterProps`; use `<SectionLabel tone="inverse">{labels.contact}</SectionLabel>`; remove the local `telHref` and import `{ mailtoHref, telHref } from "@/lib/links"` (use `mailtoHref(contact.email)`); wrap the Explore column's links in `<nav aria-label={labels.explore} className="flex flex-col gap-3">` with the label inside it: restructure the column as
```tsx
<nav aria-label={labels.explore} className="flex flex-col gap-3">
  <SectionLabel tone="inverse">{labels.explore}</SectionLabel>
  …nav links and social links unchanged…
</nav>
```
`src/app/layout.tsx`: pass `labels={{ openMenu: site.ui.openMenu, closeMenu: site.ui.closeMenu, mainNav: site.ui.mainNav, mobileNav: site.ui.mobileNav }}` to `Header`, drop `alt` from the `logo` prop, and `labels={{ contact: site.ui.footerContact, explore: site.ui.footerExplore }}` to `Footer`; replace the literal `Skip to content` with `{site.ui.skipToContent}`.
`src/app/not-found.tsx`: `const { ui } = loadSite();` (import `loadSite` from `@/lib/content`) and render `ui.notFound.label`, `ui.notFound.heading`, `ui.notFound.cta` instead of the literals.

`tests/e2e/helpers/site.ts`:
```ts
import { readFileSync } from "node:fs";
import { parse } from "yaml";

/** Reads content/site.yaml so e2e assertions never hardcode interface strings. */
export const site = parse(readFileSync("content/site.yaml", "utf8")) as {
  ui: {
    skipToContent: string;
    openMenu: string;
    notFound: { heading: string };
  };
};
```
`tests/e2e/smoke.spec.ts`: `import { site } from "./helpers/site";` and replace the literals `"Open menu"`, `"Skip to content"`, `"This page has moved or does not exist."` with `site.ui.openMenu`, `site.ui.skipToContent`, `site.ui.notFound.heading`.

- [ ] **Step 4: Verify GREEN**

Run: `pnpm test && pnpm typecheck && pnpm lint && pnpm content:check && pnpm build`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: move interface strings to content, harden header and labels" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Motion kit part 1: SplitText, ScrollWords, Counter

**Files:**
- Create: `src/components/motion/split-text.tsx`, `split-text.test.tsx`, `scroll-words.tsx`, `scroll-words.test.tsx`, `counter.tsx`, `counter.test.tsx`

**Interfaces:**
- Consumes: `duration`, `ease` from `@/lib/motion`; `useHydrated` from `@/hooks/use-hydrated`; `cn` from `@/lib/utils`.
- Produces: `SplitText({ text: string; delay?: number; stagger?: number } & span props)`: inline, goes inside a heading; `ScrollWords({ text: string } & span props)`: inline, words brighten with scroll; `Counter({ value: number; locale: string } & span props)`.

- [ ] **Step 1: Write the failing tests**

`src/components/motion/split-text.test.tsx`:
```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SplitText } from "./split-text";

describe("SplitText", () => {
  it("keeps the full sentence as the accessible name", () => {
    render(
      <h2>
        <SplitText text="Hello brave world" />
      </h2>,
    );
    expect(screen.getByRole("heading", { name: "Hello brave world" })).toBeInTheDocument();
  });

  it("wraps every word so the no-JS fallback can reveal it", () => {
    const { container } = render(<SplitText text="Hello brave world" />);
    expect(container.querySelectorAll("[data-reveal]")).toHaveLength(3);
  });

  it("hides the visual words from assistive tech to avoid double reading", () => {
    const { container } = render(<SplitText text="Hello brave world" />);
    expect(container.querySelector("[aria-hidden='true']")).not.toBeNull();
  });
});
```
`src/components/motion/scroll-words.test.tsx`:
```tsx
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ScrollWords } from "./scroll-words";

describe("ScrollWords", () => {
  it("renders every word in order", () => {
    const { container } = render(<ScrollWords text="Strategic planning for clearances" />);
    expect(container).toHaveTextContent("Strategic planning for clearances");
  });

  it("renders one span per word", () => {
    const { container } = render(<ScrollWords text="one two three" />);
    expect(container.querySelectorAll("[data-word]")).toHaveLength(3);
  });
});
```
`src/components/motion/counter.test.tsx`:
```tsx
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Counter } from "./counter";

describe("Counter", () => {
  it("renders the final value on first paint (readable without JS)", () => {
    const { container } = render(<Counter value={250} locale="en-IN" />);
    expect(container).toHaveTextContent("250");
  });

  it("formats with the given locale", () => {
    const { container } = render(<Counter value={12500} locale="en-IN" />);
    expect(container).toHaveTextContent("12,500");
  });

  it("uses tabular figures so digits do not jitter while counting", () => {
    const { container } = render(<Counter value={5} locale="en-IN" />);
    expect(container.firstElementChild).toHaveClass("tabular-nums");
  });
});
```

- [ ] **Step 2: Run to verify RED**

Run: `pnpm test -- src/components/motion`
Expected: FAIL (modules missing).

- [ ] **Step 3: Implement**

`src/components/motion/split-text.tsx`:
```tsx
"use client";

import { motion } from "motion/react";
import { duration, ease } from "@/lib/motion";
import { cn } from "@/lib/utils";

export interface SplitTextProps extends React.ComponentProps<"span"> {
  text: string;
  /** Seconds before the first word starts. */
  delay?: number;
  /** Seconds between words. */
  stagger?: number;
}

/** Word-by-word masked rise. Put it inside a heading: <h2><SplitText text="…" /></h2>. */
export function SplitText({ text, delay = 0, stagger = 0.06, className, ...props }: SplitTextProps) {
  const words = text.split(" ");
  return (
    <span className={cn("inline", className)} {...props}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {words.map((word, index) => (
          <span key={`${word}-${index}`}>
            <span className="inline-block overflow-hidden py-[0.08em] align-bottom -my-[0.08em]">
              <motion.span
                data-reveal=""
                className="inline-block"
                initial={{ y: "110%" }}
                whileInView={{ y: 0 }}
                viewport={{ once: true, amount: 0.6 }}
                transition={{ duration: duration.slow, delay: delay + index * stagger, ease: ease.outExpo }}
              >
                {word}
              </motion.span>
            </span>
            {index < words.length - 1 ? " " : null}
          </span>
        ))}
      </span>
    </span>
  );
}
```
`src/components/motion/scroll-words.tsx`:
```tsx
"use client";

import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "motion/react";
import { useRef } from "react";
import { useHydrated } from "@/hooks/use-hydrated";
import { cn } from "@/lib/utils";

export interface ScrollWordsProps extends React.ComponentProps<"span"> {
  text: string;
}

function Word({
  word,
  progress,
  range,
  active,
}: {
  word: string;
  progress: MotionValue<number>;
  range: [number, number];
  active: boolean;
}) {
  const opacity = useTransform(progress, range, [0.2, 1]);
  return (
    <motion.span data-word="" style={active ? { opacity } : undefined}>
      {word}
    </motion.span>
  );
}

/**
 * Words brighten one after another as the text scrolls through the viewport.
 * Fully opaque on the server, without JS and with reduced motion; the effect only starts after hydration.
 */
export function ScrollWords({ text, className, ...props }: ScrollWordsProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();
  const hydrated = useHydrated();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.9", "end 0.4"] });
  const words = text.split(" ");

  return (
    <span ref={ref} className={cn("inline", className)} {...props}>
      {words.map((word, index) => (
        <span key={`${word}-${index}`}>
          <Word
            word={word}
            progress={scrollYProgress}
            range={[index / words.length, (index + 1) / words.length]}
            active={hydrated && !reduced}
          />
          {index < words.length - 1 ? " " : null}
        </span>
      ))}
    </span>
  );
}
```
`src/components/motion/counter.tsx`:
```tsx
"use client";

import { animate, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { duration, ease } from "@/lib/motion";
import { cn } from "@/lib/utils";

export interface CounterProps extends Omit<React.ComponentProps<"span">, "children"> {
  value: number;
  /** BCP 47 locale from site.yaml; required so server and browser format identically. */
  locale: string;
}

/** Shows the final number immediately, then counts up from 0 once when it scrolls into view. */
export function Counter({ value, locale, className, ...props }: CounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    if (!inView || reduced) return;
    const controls = animate(0, value, {
      duration: duration.slow * 2,
      ease: ease.outExpo,
      onUpdate: (latest) => setDisplay(Math.round(latest)),
    });
    return () => controls.stop();
  }, [inView, reduced, value]);

  return (
    <span ref={ref} className={cn("tabular-nums", className)} {...props}>
      {new Intl.NumberFormat(locale).format(display)}
    </span>
  );
}
```

- [ ] **Step 4: Verify GREEN**

Run: `pnpm test && pnpm typecheck && pnpm lint`
Expected: PASS. If jsdom lacks an API Motion needs (e.g. `scrollTo`, `getAnimations`), add a minimal stub to `tests/setup.ts` and note it.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add SplitText, ScrollWords and Counter motion components" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Motion kit part 2: Parallax, Marquee, ScrollStory

**Files:**
- Create: `src/hooks/use-pinned.ts`, `src/components/motion/parallax.tsx`, `parallax.test.tsx`, `marquee.tsx`, `marquee.test.tsx`, `scroll-story.tsx`, `scroll-story.test.tsx`

**Interfaces:**
- Produces: `Parallax({ range?: number } & div props)` (outer div clips, inner moves); `Marquee({ speed?: number; reverse?: boolean } & div props)` (children rendered twice, second copy `aria-hidden`); `ScrollStory({ steps: number; renderStacked: () => ReactNode; renderPinned: (progress: MotionValue<number>) => ReactNode; className?: string })`; `usePinned(): boolean` (true only at ≥ 64rem and no reduced motion; false on the server).

- [ ] **Step 1: Write the failing tests**

`src/components/motion/parallax.test.tsx`:
```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Parallax } from "./parallax";

describe("Parallax", () => {
  it("renders children inside a clipping wrapper", () => {
    const { container } = render(
      <Parallax className="rounded-card">
        <p>content</p>
      </Parallax>,
    );
    expect(screen.getByText("content")).toBeInTheDocument();
    expect(container.firstElementChild).toHaveClass("overflow-hidden", "rounded-card");
  });
});
```
`src/components/motion/marquee.test.tsx`:
```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Marquee } from "./marquee";

describe("Marquee", () => {
  it("renders the children twice for a seamless loop", () => {
    render(
      <Marquee>
        <span>Logo</span>
      </Marquee>,
    );
    expect(screen.getAllByText("Logo")).toHaveLength(2);
  });

  it("hides the duplicate copy from assistive tech", () => {
    render(
      <Marquee>
        <span>Logo</span>
      </Marquee>,
    );
    const [first, second] = screen.getAllByText("Logo");
    expect(first.parentElement).not.toHaveAttribute("aria-hidden");
    expect(second.parentElement).toHaveAttribute("aria-hidden", "true");
  });

  it("passes the speed to CSS and supports reverse", () => {
    const { container } = render(
      <Marquee speed={60} reverse>
        <span>Logo</span>
      </Marquee>,
    );
    const track = container.querySelector("[style]") as HTMLElement;
    expect(track.style.getPropertyValue("--marquee-duration")).toBe("60s");
    expect(track.className).toContain("[animation-direction:reverse]");
  });
});
```
`src/components/motion/scroll-story.test.tsx`:
```tsx
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ScrollStory } from "./scroll-story";

function mockMatchMedia(matches: boolean) {
  vi.spyOn(window, "matchMedia").mockImplementation(
    (query: string) =>
      ({
        matches,
        media: query,
        onchange: null,
        addEventListener() {},
        removeEventListener() {},
        addListener() {},
        removeListener() {},
        dispatchEvent: () => false,
      }) as MediaQueryList,
  );
}

afterEach(() => vi.restoreAllMocks());

describe("ScrollStory", () => {
  it("renders the stacked layout by default (mobile, reduced motion, before hydration)", () => {
    mockMatchMedia(false);
    render(
      <ScrollStory steps={3} renderStacked={() => <p>stacked</p>} renderPinned={() => <p>pinned</p>} />,
    );
    expect(screen.getByText("stacked")).toBeInTheDocument();
    expect(screen.queryByText("pinned")).toBeNull();
  });

  it("renders a tall pinned container with a sticky stage when pinning applies", () => {
    mockMatchMedia(true);
    const renderPinned = vi.fn(() => <p>pinned</p>);
    const { container } = render(
      <ScrollStory steps={3} renderStacked={() => <p>stacked</p>} renderPinned={renderPinned} />,
    );
    expect(screen.getByText("pinned")).toBeInTheDocument();
    expect(screen.queryByText("stacked")).toBeNull();
    expect((container.firstElementChild as HTMLElement).style.height).toBe("300vh");
    expect(container.querySelector(".sticky")).not.toBeNull();
    expect(renderPinned.mock.calls[0]?.[0]).toHaveProperty("get");
  });
});
```

- [ ] **Step 2: Run to verify RED**

Run: `pnpm test -- src/components/motion`
Expected: FAIL (modules missing).

- [ ] **Step 3: Implement**

`src/hooks/use-pinned.ts`:
```ts
import { useSyncExternalStore } from "react";

// 64rem is Tailwind's lg breakpoint.
const QUERY = "(min-width: 64rem) and (prefers-reduced-motion: no-preference)";

function subscribe(onChange: () => void) {
  const media = window.matchMedia(QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

/** True when scroll-pinned layouts should run. False on the server so the stacked layout is the baseline. */
export function usePinned(): boolean {
  return useSyncExternalStore(subscribe, () => window.matchMedia(QUERY).matches, () => false);
}
```
`src/components/motion/parallax.tsx`:
```tsx
"use client";

import { motion, useReducedMotion, useScroll, useTransform, type HTMLMotionProps } from "motion/react";
import { useRef } from "react";
import { cn } from "@/lib/utils";

export interface ParallaxProps extends Omit<HTMLMotionProps<"div">, "style" | "ref"> {
  /** Travel in percent of the element's height, each direction. */
  range?: number;
}

/** Clips its child and moves it slower than the page. The child is scaled up just enough to never show a gap. */
export function Parallax({ range = 8, className, children, ...props }: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [`${range}%`, `${-range}%`]);
  const scale = 1 + (range * 2) / 100;

  return (
    <div ref={ref} className={cn("overflow-hidden", className)}>
      <motion.div className="h-full w-full" style={reduced ? undefined : { y, scale }} {...props}>
        {children}
      </motion.div>
    </div>
  );
}
```
`src/components/motion/marquee.tsx`:
```tsx
import { cn } from "@/lib/utils";

export interface MarqueeProps extends React.ComponentProps<"div"> {
  /** Seconds for one full loop. */
  speed?: number;
  reverse?: boolean;
}

/** Endless horizontal loop in pure CSS. Pauses on hover; static and scrollable with reduced motion. */
export function Marquee({ speed = 40, reverse = false, className, children, ...props }: MarqueeProps) {
  return (
    <div
      className={cn(
        "group flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)] motion-reduce:overflow-x-auto",
        className,
      )}
      {...props}
    >
      {[0, 1].map((copy) => (
        <div
          key={copy}
          aria-hidden={copy === 1 ? true : undefined}
          style={{ "--marquee-duration": `${speed}s` } as React.CSSProperties}
          className={cn(
            "flex min-w-full shrink-0 animate-marquee items-center justify-around gap-16 pr-16 group-hover:[animation-play-state:paused] motion-reduce:animate-none",
            reverse && "[animation-direction:reverse]",
            copy === 1 && "motion-reduce:hidden",
          )}
        >
          {children}
        </div>
      ))}
    </div>
  );
}
```
`src/components/motion/scroll-story.tsx`:
```tsx
"use client";

import { useScroll, type MotionValue } from "motion/react";
import { useRef, type ReactNode } from "react";
import { usePinned } from "@/hooks/use-pinned";

export interface ScrollStoryProps {
  /** Number of steps; sets the scroll distance (100vh per step). */
  steps: number;
  /** Plain layout used on mobile, with reduced motion and before hydration. */
  renderStacked: () => ReactNode;
  /** Pinned layout; receives scroll progress from 0 to 1 across the whole story. */
  renderPinned: (progress: MotionValue<number>) => ReactNode;
  className?: string;
}

function PinnedStory({ steps, renderPinned, className }: Omit<ScrollStoryProps, "renderStacked">) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  return (
    <div ref={ref} className={className} style={{ height: `${steps * 100}vh` }}>
      <div className="sticky top-0 h-screen overflow-hidden">{renderPinned(scrollYProgress)}</div>
    </div>
  );
}

/** Scroll-pinned storytelling with a readable stacked fallback. */
export function ScrollStory({ steps, renderStacked, renderPinned, className }: ScrollStoryProps) {
  const pinned = usePinned();
  if (!pinned) return <div className={className}>{renderStacked()}</div>;
  return <PinnedStory steps={steps} renderPinned={renderPinned} className={className} />;
}
```

- [ ] **Step 4: Verify GREEN**

Run: `pnpm test && pnpm typecheck && pnpm lint`
Expected: PASS. If the lint rule `react-hooks/*` flags `useScroll` inside `PinnedStory`, keep the split (it exists precisely so the ref is attached at mount) and report the rule name.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add Parallax, Marquee and ScrollStory motion components" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Real assets: client logos and about photo

**Files:**
- Create: `scripts/fetch-home-assets.ts`, `public/media/clients/*.webp` (39 files), `public/media/images/about.webp`
- Modify: `content/media.yaml`, `package.json` (dev dependency `sharp`)

**Interfaces:**
- Produces: media keys `client-<slug>` for the 39 logos below and `about-photo`, each with `src` under `/media/clients/` or `/media/images/` and `alt` text.

- [ ] **Step 1: Install the resizer**

Run: `pnpm add -D sharp`
Expected: installs (sharp is already in `pnpm.onlyBuiltDependencies`).

- [ ] **Step 2: Write `scripts/fetch-home-assets.ts`**

```ts
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

// One-time migration helper. Downloads from the current live site, resizes, and registers the
// files in content/media.yaml. Re-running is safe: existing outputs and entries are skipped
// (use --force to redo the files).
const BASE = "https://envirosphere.co.in/assets/uploads/media-uploader/";
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";

interface Asset {
  key: string;
  remote: string;
  out: string;
  alt: string;
  width: number;
  quality: number;
}

const logo = (slug: string, remote: string, name: string): Asset => ({
  key: `client-${slug}`,
  remote,
  out: `public/media/clients/${slug}.webp`,
  alt: `${name} logo`,
  width: 480,
  quality: 82,
});

const assets: Asset[] = [
  logo("perkins", "perkins1753712651.png", "Perkins"),
  logo("philips", "philips1753712677.png", "Philips"),
  logo("si-group", "si-group1753712698.png", "SI Group"),
  logo("sunshield-chemicals", "sunshield-chemicals1753712719.png", "Sunshield Chemicals"),
  logo("xsio-logistics-parks", "xsio-logistics-parks1753712753.png", "XSIO Logistics Parks"),
  logo("fine-orgokem", "1-fine-orgokem1753710657.png", "Fine Orgokem"),
  logo("itc-limited", "3-itc-limited1753711056.png", "ITC Limited"),
  logo("indian-phosphate", "4-indian-phosphate1753711133.png", "Indian Phosphate"),
  logo("magarpatta-city", "6-magarpatta-city1753711306.png", "Magarpatta City"),
  logo("nxtra-by-airtel", "7-nxtra-by-airtel1753711362.png", "Nxtra by Airtel"),
  logo("estelle", "8-estelle1753711426.png", "Estelle"),
  logo("emerson", "9-emerson1753711479.png", "Emerson"),
  logo("shapoorji-pallonji", "10-shapoorji-pallonji1753711521.png", "Shapoorji Pallonji"),
  logo("jsw", "11-jsw1753711570.png", "JSW"),
  logo("nanded-city", "12-nanded-city1753711602.png", "Nanded City"),
  logo("jll", "13-jll1753711636.png", "JLL"),
  logo("rama-phosphates", "14-rama-phospates1753711680.png", "Rama Phosphates"),
  logo("marquardt", "15-marquardt1753711730.png", "Marquardt"),
  logo("haier", "16-haier1753711783.png", "Haier"),
  logo("anuh-pharma", "17-anuh-pharma-ltd1753711824.png", "Anuh Pharma Ltd"),
  logo("lg", "18-lg1753711886.png", "LG"),
  logo("zanvar", "20-zanvar1753711936.png", "Zanvar"),
  logo("aarti-drugs", "aarti-drugs-ltd1753711991.png", "Aarti Drugs Ltd"),
  logo("alchemo-industries", "alchemo-industries1753712074.png", "Alchemo Industries"),
  logo("aquapharma", "aquapharma1753712108.png", "Aquapharma"),
  logo("armacell", "armacell1753712142.png", "Armacell"),
  logo("bajaj", "bajaj1753712178.png", "Bajaj"),
  logo("bloom-engineering", "bloom-engineering1753712209.png", "Bloom Engineering"),
  logo("flint-group", "flint-group1753712269.png", "Flint Group"),
  logo("fullife", "fullife1753712298.png", "Fullife"),
  logo("hengtong", "hengtong1753712334.png", "Hengtong"),
  logo("horizon-industrial-parks", "horizon-industrial-parks1753712361.png", "Horizon Industrial Parks"),
  logo("indospace", "indospace1753712395.png", "Indospace"),
  logo("john-deere", "john-deere1753712441.png", "John Deere"),
  logo("kirloskar-oil-engines", "kirloskar-oil-engines1753712479.png", "Kirloskar Oil Engines"),
  logo("lignopura-agrotech", "lignopura-agrotech1753712505.png", "Lignopura Agrotech"),
  logo("ngl-fine-chem", "ngl-fine-chem-ltd1753712534.png", "NGL Fine-Chem Ltd"),
  logo("noble-hospitals", "noble-hospitals1753712561.png", "Noble Hospitals"),
  logo("paladin-paints", "paladin-paints1753712626.png", "Paladin Paints"),
  {
    key: "about-photo",
    remote: "sustainable-living-environmentalist-hand-holding-green-earth1652834526.jpg",
    out: "public/media/images/about.webp",
    alt: "A hand holding a small green model of the Earth",
    width: 1600,
    quality: 78,
  },
];

async function download(url: string): Promise<Buffer> {
  const response = await fetch(url, { headers: { "User-Agent": USER_AGENT, Accept: "image/*,*/*" } });
  if (response.ok) return Buffer.from(await response.arrayBuffer());
  // The host's firewall can reject non-browser clients; retry through a real browser stack.
  const { request } = await import("@playwright/test");
  const context = await request.newContext({ extraHTTPHeaders: { "User-Agent": USER_AGENT } });
  try {
    const retry = await context.get(url);
    if (!retry.ok()) throw new Error(`${retry.status()} for ${url}`);
    return Buffer.from(await retry.body());
  } finally {
    await context.dispose();
  }
}

const force = process.argv.includes("--force");
const mediaFile = "content/media.yaml";
let mediaText = readFileSync(mediaFile, "utf8");

for (const asset of assets) {
  if (force || !existsSync(asset.out)) {
    const source = await download(BASE + asset.remote);
    mkdirSync(path.dirname(asset.out), { recursive: true });
    await sharp(source)
      .resize({ width: asset.width, withoutEnlargement: true })
      .webp({ quality: asset.quality })
      .toFile(asset.out);
    console.log(`saved ${asset.out}`);
  }
  if (!new RegExp(`^${asset.key}:`, "m").test(mediaText)) {
    const entry = `\n${asset.key}:\n  src: /${asset.out.replace(/^public\//, "")}\n  alt: ${asset.alt}\n`;
    appendFileSync(mediaFile, entry);
    mediaText += entry;
  }
}
writeFileSync(mediaFile, mediaText.replace(/\n{3,}/g, "\n\n"));
console.log(`done: ${assets.length} assets`);
```

- [ ] **Step 3: Run it**

Run: `pnpm exec tsx scripts/fetch-home-assets.ts`
Expected: 40 `saved …` lines and `done: 40 assets`. If any download fails, report the exact file and HTTP status; do not substitute other images.

- [ ] **Step 4: Verify the output**

Run:
```bash
ls public/media/clients | wc -l          # expect 39
ls public/media/images/about.webp
du -sh public/media                       # expect well under 5M
pnpm content:check                        # expect: Content OK
```
Open 3 random logo files and `about.webp` (Read tool) to confirm they look right (logo on transparent background, about photo sensible). Fix any alt text that does not match the picture (e.g. `Fine Orgokem` spelling) in `content/media.yaml` and tell the controller.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add client logos and about photo from the current site" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Home content schema, home.yaml, 13 services, loaders

**Files:**
- Modify: `src/lib/validators/content.ts`, `src/lib/content/index.ts`, `src/lib/content/index.test.ts`, `src/lib/validators/content.test.ts`, `tests/unit/helpers/fixtures.ts`, `content/pages/home.yaml`, `content/services/environmental-audit.md`
- Create: `content/services/*.md` (12 new), `tests/unit/real-content.test.ts`

**Interfaces:**
- Produces: `homeSchema` with sections `hero{eyebrow,title,subtitle,primaryCta,secondaryCta?,scrollLabel,image?}`, `about{label,heading,paragraphs[],image,cta}`, `services{label,heading,intro,cta}`, `stats{label,items[{value,suffix,label}]}`, `clients{label,heading,logos[]}`, `process{label,heading,steps[{title,body}]}`, `testimonials{label,heading,items[{quote,name,role?}]}`, `contact{label,heading,body,primaryCta,phoneLabel,emailLabel}`; `getImageAsset(key): { src; alt; width: number; height: number }`; `loadAll` also verifies `home.about.image` and every `home.clients.logos[i]`.

- [ ] **Step 1: Rewrite the fixtures and write failing tests**

Replace `tests/unit/helpers/fixtures.ts`' `MEDIA_YAML`, `HOME_YAML` and `validFiles` (keep `LOGO_SVG`, `SITE_YAML` incl. the `ui` block from Task 2, `SERVICE_MD`):
```ts
const CLIENT_KEYS = ["a", "b", "c", "d", "e", "f"].map((n) => `client-${n}`);

export const MEDIA_YAML = `
logo:
  src: /media/brand/logo.svg
  alt: Test logo
about-photo:
  src: /media/images/about.svg
  alt: About photo
${CLIENT_KEYS.map((key) => `${key}:\n  src: /media/clients/${key}.svg\n  alt: ${key} logo`).join("\n")}
`;

export const HOME_YAML = `
hero:
  eyebrow: Test eyebrow
  title: Test title
  subtitle: Test subtitle
  primaryCta: { label: Start, href: /contact/ }
  secondaryCta: { label: Services, href: /services/ }
  scrollLabel: Scroll
about:
  label: About us
  heading: About heading
  paragraphs: [First paragraph., Second paragraph.]
  image: about-photo
  cta: { label: More, href: /about/ }
services:
  label: What we offer
  heading: Services heading
  intro: Services intro
  cta: { label: All services, href: /services/ }
stats:
  label: In numbers
  items:
    - { value: 250, suffix: "+", label: Clients }
    - { value: 25, suffix: "+", label: Projects }
clients:
  label: Clients
  heading: Clients heading
  logos: [${CLIENT_KEYS.join(", ")}]
process:
  label: How we work
  heading: Process heading
  steps:
    - { title: One, body: First step. }
    - { title: Two, body: Second step. }
testimonials:
  label: Testimonials
  heading: Testimonials heading
  items:
    - { quote: Great work., name: A Person, role: Manager }
contact:
  label: Contact
  heading: Contact heading
  body: Contact body
  primaryCta: { label: Talk, href: /contact/ }
  phoneLabel: Call us
  emailLabel: Email us
`;

export function validFiles(): Record<string, string> {
  return {
    "content/site.yaml": SITE_YAML,
    "content/media.yaml": MEDIA_YAML,
    "content/pages/home.yaml": HOME_YAML,
    "content/services/environmental-audit.md": SERVICE_MD,
    "public/media/brand/logo.svg": LOGO_SVG,
    "public/media/images/about.svg": LOGO_SVG,
    ...Object.fromEntries(CLIENT_KEYS.map((key) => [`public/media/clients/${key}.svg`, LOGO_SVG])),
  };
}
```
Add to `src/lib/content/index.test.ts`:
```ts
  it("fails when a client logo key is not in media.yaml", () => {
    const files = validFiles();
    files["content/pages/home.yaml"] = files["content/pages/home.yaml"].replace("client-c,", "client-missing,");
    const { content, publicDir } = makeTree(files);
    expect(() => loadAll(content, publicDir)).toThrowError(
      /content\/pages\/home\.yaml → clients\.logos\[2\]: "client-missing" is not listed/,
    );
  });

  it("fails when the about image key is unknown", () => {
    const files = validFiles();
    files["content/pages/home.yaml"] = files["content/pages/home.yaml"].replace("image: about-photo", "image: nope");
    const { content, publicDir } = makeTree(files);
    expect(() => loadAll(content, publicDir)).toThrowError(/content\/pages\/home\.yaml → about\.image: "nope"/);
  });
```
and a `getImageAsset` unit test in a new describe: with `process.chdir`-free approach, test the pure helper `toImageAsset(resolved)` exported from `media.ts` (see Step 3): it returns width/height and throws `ContentError` naming the key when either is missing (e.g. a `.pdf`).
`src/lib/validators/content.test.ts` add: home fixture passes; `clients.logos` with fewer than 6 keys fails; `stats.items[0].value` negative fails; every section label is required.
`tests/unit/real-content.test.ts`:
```ts
// @vitest-environment node
import { describe, expect, it } from "vitest";
import { loadAll } from "@/lib/content";

describe("real site content (what the owner edits)", () => {
  const { home, services, media } = loadAll();

  it("has 13 services with unique, consecutive order numbers", () => {
    expect(services.map((s) => s.order)).toEqual(Array.from({ length: 13 }, (_, i) => i + 1));
  });

  it("lists every client logo in media.yaml with a readable alt", () => {
    expect(home.clients.logos.length).toBeGreaterThanOrEqual(30);
    for (const key of home.clients.logos) expect(media[key]?.alt.length).toBeGreaterThan(3);
  });

  it("has the four published statistics and four testimonials", () => {
    expect(home.stats.items).toHaveLength(4);
    expect(home.testimonials.items).toHaveLength(4);
  });

  it("has a drafted process with at least three steps", () => {
    expect(home.process.steps.length).toBeGreaterThanOrEqual(3);
  });
});
```

- [ ] **Step 2: Run to verify RED**

Run: `pnpm test -- src/lib tests/unit/real-content.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement schema, loaders, helper**

In `src/lib/validators/content.ts` replace `homeSchema` with:
```ts
const sectionLabel = z.string().min(1);

export const homeSchema = z.object({
  hero: z.object({
    eyebrow: z.string().min(1),
    title: z.string().min(1),
    subtitle: z.string().min(1),
    primaryCta: navItemSchema,
    secondaryCta: navItemSchema.optional(),
    scrollLabel: z.string().min(1),
    image: mediaKey.optional(),
  }),
  about: z.object({
    label: sectionLabel,
    heading: z.string().min(1),
    paragraphs: z.array(z.string().min(1)).min(1),
    image: mediaKey,
    cta: navItemSchema,
  }),
  services: z.object({
    label: sectionLabel,
    heading: z.string().min(1),
    intro: z.string().min(1),
    cta: navItemSchema,
  }),
  stats: z.object({
    label: sectionLabel,
    items: z
      .array(
        z.object({
          value: z.number().int().nonnegative(),
          suffix: z.string().default(""),
          label: z.string().min(1),
        }),
      )
      .min(2),
  }),
  clients: z.object({
    label: sectionLabel,
    heading: z.string().min(1),
    logos: z.array(mediaKey).min(6),
  }),
  process: z.object({
    label: sectionLabel,
    heading: z.string().min(1),
    steps: z.array(z.object({ title: z.string().min(1), body: z.string().min(1) })).min(2),
  }),
  testimonials: z.object({
    label: sectionLabel,
    heading: z.string().min(1),
    items: z
      .array(z.object({ quote: z.string().min(1), name: z.string().min(1), role: z.string().optional() }))
      .min(1),
  }),
  contact: z.object({
    label: sectionLabel,
    heading: z.string().min(1),
    body: z.string().min(1),
    primaryCta: navItemSchema,
    phoneLabel: z.string().min(1),
    emailLabel: z.string().min(1),
  }),
});
```
In `src/lib/content/media.ts` add:
```ts
export interface ImageAsset {
  src: string;
  alt: string;
  width: number;
  height: number;
}

/** For `next/image`: unlike ResolvedMedia, dimensions are guaranteed. Fails clearly for non-images. */
export function toImageAsset(resolved: ResolvedMedia): ImageAsset {
  const { key, src, alt, width, height } = resolved;
  if (!width || !height) {
    throw new ContentError(`content/media.yaml → ${key}: ${src} is not an image with a known size`);
  }
  return { src, alt, width, height };
}
```
In `src/lib/content/index.ts`: import `toImageAsset`/`ImageAsset`; add `export function getImageAsset(key: string): ImageAsset { return toImageAsset(getImage(key)); }`; extend `references` in `loadAll` with
```ts
    [home.about.image, "content/pages/home.yaml → about.image"],
    ...home.clients.logos.map((key, index): [string | undefined, string] => [
      key,
      `content/pages/home.yaml → clients.logos[${index}]`,
    ]),
```
Replace `content/pages/home.yaml` with:
```yaml
# The Home page. Each block is one section, top to bottom.
# TODO(content): owner to review all wording marked "draft".

hero:
  eyebrow: QCI NABET Accredited Consultant (Cat A)
  title: Environmental clearances and compliance, handled with precision.
  subtitle: >-
    We help public and private sector clients secure statutory clearances and consents from
    MoEFCC, State Pollution Control Boards, MIDC and other authorities.
  primaryCta: { label: Talk to our team, href: /contact/ }
  secondaryCta: { label: Our services, href: /services/ }
  scrollLabel: Scroll

about:
  label: About us
  heading: Strategic planning and sustainable solutions for statutory clearances.
  paragraphs:
    - >-
      Envirosphere Consultant and Engineers is QCI NABET Accredited Consultant, providing a wide
      range of services to the public and private sector. Our firm provides strategic planning,
      cost effective sustainable solutions to our clients for obtaining statutory clearances and
      consents from MoEFCC, Pollution Control Boards, MIDC, and other government authorities. The
      organisation is guided by a code of ethics, professional practices, philosophies leading it
      towards attaining the stated vision and mission.
    - >-
      We have a team of specialised professionals to provide comprehensive services such as
      Environmental Impact Assessment (EIA), Compliance of Environmental Laws & Regulations, etc.
      We conduct studies in various sectors such as Industry building and construction,
      Infrastructure Development, Industrial Estate, Coastal Regulatory Zone (CRZ) and Sustainable
      Services such as Energy Modelling, Wind and Shadow analysis, Carbon Footprint, Environment
      Due Diligence (EDD), ESG Reporting, Environmental Site Assessment Phase I and II, and Solid
      waste Management.
    - >-
      We also provide comprehensive services - in Consent Management; Post EC Compliance,
      Environmental Monitoring; Operation and Maintenance of ETP & STP, MIDC Approval, Fire NOC,
      DISH Approval, CGWB Authorisation, PESO License and other industrial approvals.
  image: about-photo
  cta: { label: More about us, href: /about/ }

services:
  label: What we offer
  heading: Thirteen services, one accountable team.
  intro: From environmental clearances to the operation of treatment plants.
  cta: { label: All services, href: /services/ }

stats:
  label: In numbers
  items:
    - { value: 250, suffix: "+", label: Clients }
    - { value: 25, suffix: "+", label: Ongoing projects }
    - { value: 2, suffix: "", label: Certifications }
    - { value: 1, suffix: "", label: Certification in the pipeline }

clients:
  label: Clients
  heading: Organisations we have worked with.
  logos:
    - client-itc-limited
    - client-jsw
    - client-philips
    - client-bajaj
    - client-john-deere
    - client-lg
    - client-haier
    - client-emerson
    - client-jll
    - client-perkins
    - client-shapoorji-pallonji
    - client-magarpatta-city
    - client-nanded-city
    - client-nxtra-by-airtel
    - client-kirloskar-oil-engines
    - client-armacell
    - client-marquardt
    - client-si-group
    - client-flint-group
    - client-estelle
    - client-indospace
    - client-horizon-industrial-parks
    - client-xsio-logistics-parks
    - client-noble-hospitals
    - client-paladin-paints
    - client-sunshield-chemicals
    - client-fine-orgokem
    - client-indian-phosphate
    - client-rama-phosphates
    - client-anuh-pharma
    - client-aarti-drugs
    - client-alchemo-industries
    - client-aquapharma
    - client-bloom-engineering
    - client-fullife
    - client-hengtong
    - client-lignopura-agrotech
    - client-ngl-fine-chem
    - client-zanvar

# Draft: owner to review. Steps are inferred from the services list, not taken from the old site.
process:
  label: How we work
  heading: From first study to final consent.
  steps:
    - title: Scoping
      body: We study your project, its location and the rules that apply, and list the approvals you need.
    - title: Assessment
      body: Our specialists carry out the studies and prepare the assessment and management plans.
    - title: Submission
      body: We file the applications and follow them up with MoEFCC, the Pollution Control Boards, MIDC and other authorities.
    - title: Compliance
      body: After approval we handle post-clearance compliance, monitoring and audits.

testimonials:
  label: Client testimonials
  heading: In our clients' words.
  # TODO(content): confirm the clients agree to be quoted. Quotes are copied as published.
  items:
    - quote: Our company received successful and timely clearance of EC which wouldn't have been possible without the hard work and commitment of ENVIROSPHERE.
      name: Shivali Phanse
      role: BDM
    - quote: We get all our needed things in right way and within timeline. Thanx
      name: Anurag Gupta
      role: Senior Manager
    - quote: Now we are really relax to get all things to be done, its save our time and cost as well. Thanks
      name: Deeawan Sethi
      role: Customer
    - quote: I found myself working in a true partnership that results in an extra incredible experience of us
      name: Abhishek Patil
      role: Customer

contact:
  label: Contact
  heading: Tell us about your project.
  body: Our team will help you work out which approvals you need and the quickest route to them.
  primaryCta: { label: Start a conversation, href: /contact/ }
  phoneLabel: Call us
  emailLabel: Email us
```
Services: edit `content/services/environmental-audit.md` front matter to keep `order: 4` and add the comment line `# TODO(content): owner to review the summary wording.` as the first line inside the front matter. Create the 12 other files, each exactly this shape (front matter, then the body line `TODO(content): replace with the service text from the current website.`):

| file | title | order | summary |
|---|---|---|---|
| `environmental-clearance.md` | Environmental Clearance (EIA) | 1 | Environmental and social impact assessment and environmental clearance for industrial, construction and infrastructure projects. |
| `spcb-compliance.md` | Statutory Compliances from State Pollution Control Board (SPCB) | 2 | Consent management and statutory compliance with the State Pollution Control Board. |
| `post-ec-compliance.md` | Six Monthly Post EC Compliance | 3 | Six-monthly compliance reporting after environmental clearance is granted. |
| `environmental-due-diligence.md` | Environmental Due Diligence | 5 | Environmental due diligence, including Phase I and Phase II site assessments. |
| `emp-implementation.md` | Environmental Management Plan (EMP) Implementation | 6 | Implementation of your Environmental Management Plan to meet clearance conditions. |
| `crz-clearance.md` | CRZ Clearance | 7 | Coastal Regulation Zone studies and clearance for projects near the coast. |
| `forest-clearance.md` | Forest Clearance | 8 | Forest clearance applications and follow-up with the authorities. |
| `environmental-monitoring.md` | Environmental Monitoring | 9 | Monitoring of air, water, STP and ETP, DG set emissions and noise. |
| `water-wastewater-treatment.md` | Design and O&M of Water & Wastewater Treatment Systems | 10 | Design, operation and maintenance of ETP, STP and WTP systems. |
| `statutory-approvals.md` | Statutory Approvals | 11 | MIDC plan approval, PESO licence, DISH approval, Fire NOC, CGWB authorisation and other industrial approvals. |
| `esg-audit.md` | ESG (Environmental, Social & Governance) Audit | 12 | Environmental, social and governance audits and ESG reporting. |
| `water-audit.md` | Water Audit | 13 | Water audits for your site, with an audit certificate. |

Example (`water-audit.md`):
```markdown
---
# TODO(content): owner to review the summary wording.
title: Water Audit
order: 13
summary: Water audits for your site, with an audit certificate.
---
TODO(content): replace with the service text from the current website.
```

- [ ] **Step 4: Verify GREEN**

Run: `pnpm test && pnpm typecheck && pnpm lint && pnpm content:check`
Expected: all pass; `content:check` prints `Content OK: 40 media items, 13 services`.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add Home content schema, real home copy and 13 services" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Sections: types, Hero, About

**Files:**
- Create: `src/components/sections/types.ts`, `hero.tsx`, `hero.test.tsx`, `about.tsx`, `about.test.tsx`

**Interfaces:**
- Produces: `Cta { label: string; href: string }`, `ImageAsset { src; alt; width; height }` (from `types.ts`); `Hero({ eyebrow, title, subtitle, primaryCta, secondaryCta?, scrollLabel })`; `About({ index?, label, heading, paragraphs, image: ImageAsset, cta })`.

- [ ] **Step 1: Write failing tests**

`src/components/sections/hero.test.tsx`:
```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Hero } from "./hero";

const props = {
  eyebrow: "QCI NABET",
  title: "Clearances handled with precision.",
  subtitle: "We help clients secure consents.",
  primaryCta: { label: "Talk to our team", href: "/contact/" },
  secondaryCta: { label: "Our services", href: "/services/" },
  scrollLabel: "Scroll",
};

describe("Hero", () => {
  it("renders the title as the page's only h1", () => {
    render(<Hero {...props} />);
    expect(screen.getByRole("heading", { level: 1, name: props.title })).toBeInTheDocument();
  });

  it("links both calls to action", () => {
    render(<Hero {...props} />);
    expect(screen.getByRole("link", { name: "Talk to our team" })).toHaveAttribute("href", "/contact/");
    expect(screen.getByRole("link", { name: "Our services" })).toHaveAttribute("href", "/services/");
  });

  it("works without a secondary call to action", () => {
    render(<Hero {...props} secondaryCta={undefined} />);
    expect(screen.queryByRole("link", { name: "Our services" })).toBeNull();
  });

  it("uses CSS entrance classes, never JS-hidden styles, so it is visible before hydration", () => {
    const { container } = render(<Hero {...props} />);
    expect(container.querySelector("[data-reveal]")).toBeNull();
    expect(screen.getByRole("heading", { level: 1 })).toHaveClass("rise");
  });
});
```
`src/components/sections/about.test.tsx`:
```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { About } from "./about";

const props = {
  index: "001",
  label: "About us",
  heading: "Strategic planning for clearances",
  paragraphs: ["First paragraph.", "Second paragraph."],
  image: { src: "/media/images/about.webp", alt: "A green globe", width: 1600, height: 2000 },
  cta: { label: "More about us", href: "/about/" },
};

describe("About", () => {
  it("renders the heading, every paragraph and the call to action", () => {
    render(<About {...props} />);
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(props.heading);
    expect(screen.getByText("First paragraph.")).toBeInTheDocument();
    expect(screen.getByText("Second paragraph.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "More about us" })).toHaveAttribute("href", "/about/");
  });

  it("renders the photo with its alt text and the numbered label", () => {
    render(<About {...props} />);
    expect(screen.getByRole("img", { name: "A green globe" })).toBeInTheDocument();
    expect(screen.getByText(/001 \/ About us/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run to verify RED** — `pnpm test -- src/components/sections` → FAIL.

- [ ] **Step 3: Implement**

`src/components/sections/types.ts`:
```ts
export interface Cta {
  label: string;
  href: string;
}

export interface ImageAsset {
  src: string;
  alt: string;
  width: number;
  height: number;
}
```
`src/components/sections/hero.tsx`:
```tsx
import { ArrowDown } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { SectionLabel } from "@/components/ui/section-label";
import type { Cta } from "./types";

export interface HeroProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  primaryCta: Cta;
  secondaryCta?: Cta;
  scrollLabel: string;
}

/** Entrance is CSS-only (`rise`) so the hero is readable immediately, without JavaScript. */
export function Hero({ eyebrow, title, subtitle, primaryCta, secondaryCta, scrollLabel }: HeroProps) {
  return (
    <section className="flex min-h-[calc(100svh-var(--spacing-header))] flex-col justify-end bg-primary pt-section pb-12 text-primary-foreground">
      <Container>
        <SectionLabel tone="inverse" className="rise">
          {eyebrow}
        </SectionLabel>
        <h1 className="rise rise-1 mt-8 max-w-6xl break-words text-display">{title}</h1>
        <div className="mt-12 flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
          <p className="rise rise-2 max-w-2xl text-lead font-light text-primary-foreground/80">{subtitle}</p>
          <div className="rise rise-3 flex flex-wrap gap-4">
            <Button asChild variant="accent" size="lg">
              <Link href={primaryCta.href}>{primaryCta.label}</Link>
            </Button>
            {secondaryCta ? (
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10"
              >
                <Link href={secondaryCta.href}>{secondaryCta.label}</Link>
              </Button>
            ) : null}
          </div>
        </div>
        <p className="rise rise-3 mt-16 flex items-center gap-3 text-label uppercase tracking-label text-primary-foreground/70">
          <ArrowDown aria-hidden="true" className="size-4" />
          {scrollLabel}
        </p>
      </Container>
    </section>
  );
}
```
`src/components/sections/about.tsx`:
```tsx
import Image from "next/image";
import Link from "next/link";
import { Parallax } from "@/components/motion/parallax";
import { Reveal } from "@/components/motion/reveal";
import { ScrollWords } from "@/components/motion/scroll-words";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { SectionLabel } from "@/components/ui/section-label";
import type { Cta, ImageAsset } from "./types";

export interface AboutProps {
  index?: string;
  label: string;
  heading: string;
  paragraphs: string[];
  image: ImageAsset;
  cta: Cta;
}

export function About({ index, label, heading, paragraphs, image, cta }: AboutProps) {
  return (
    <section className="py-section">
      <Container className="grid gap-16 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <SectionLabel index={index}>{label}</SectionLabel>
          <h2 className="mt-8 text-h2">
            <ScrollWords text={heading} />
          </h2>
          <div className="mt-12 flex max-w-2xl flex-col gap-6 text-lead font-light">
            {paragraphs.map((paragraph) => (
              <Reveal key={paragraph}>
                <p>{paragraph}</p>
              </Reveal>
            ))}
          </div>
          <Reveal>
            <Button asChild variant="outline" className="mt-12">
              <Link href={cta.href}>{cta.label}</Link>
            </Button>
          </Reveal>
        </div>
        <div className="lg:col-span-5">
          <Parallax className="aspect-[4/5] rounded-card">
            <Image
              src={image.src}
              alt={image.alt}
              width={image.width}
              height={image.height}
              className="h-full w-full object-cover"
            />
          </Parallax>
        </div>
      </Container>
    </section>
  );
}
```

- [ ] **Step 4: Verify GREEN** — `pnpm test && pnpm typecheck && pnpm lint` → PASS.

- [ ] **Step 5: Commit**
```bash
git add -A
git commit -m "feat: add Hero and About sections" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Sections: Services index, Stats

**Files:**
- Create: `src/components/sections/services-index.tsx`, `services-index.test.tsx`, `stats.tsx`, `stats.test.tsx`

**Interfaces:**
- Produces: `ServicesIndex({ index?, label, heading, intro, cta, services: { slug: string; title: string; summary: string }[] })`: numbered rows linking to `/services/<slug>/`; `Stats({ index?, label, items: { value: number; suffix: string; label: string }[], locale: string })`.

- [ ] **Step 1: Write failing tests**

`src/components/sections/services-index.test.tsx`:
```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ServicesIndex } from "./services-index";

const props = {
  index: "002",
  label: "What we offer",
  heading: "Thirteen services",
  intro: "From clearances to plants.",
  cta: { label: "All services", href: "/services/" },
  services: [
    { slug: "environmental-clearance", title: "Environmental Clearance (EIA)", summary: "EIA and clearance." },
    { slug: "water-audit", title: "Water Audit", summary: "Water audits." },
  ],
};

describe("ServicesIndex", () => {
  it("renders one numbered link per service to its own page", () => {
    render(<ServicesIndex {...props} />);
    const link = screen.getByRole("link", { name: /Environmental Clearance \(EIA\)/ });
    expect(link).toHaveAttribute("href", "/services/environmental-clearance/");
    expect(link).toHaveTextContent("001");
    expect(screen.getByRole("link", { name: /Water Audit/ })).toHaveTextContent("002");
  });

  it("renders the section heading and the all-services link", () => {
    render(<ServicesIndex {...props} />);
    expect(screen.getByRole("heading", { level: 2, name: /Thirteen services/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "All services" })).toHaveAttribute("href", "/services/");
  });
});
```
`src/components/sections/stats.test.tsx`:
```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Stats } from "./stats";

const props = {
  index: "003",
  label: "In numbers",
  locale: "en-IN",
  items: [
    { value: 250, suffix: "+", label: "Clients" },
    { value: 2, suffix: "", label: "Certifications" },
  ],
};

describe("Stats", () => {
  it("shows every figure with its suffix and label", () => {
    render(<Stats {...props} />);
    expect(screen.getByText("Clients")).toBeInTheDocument();
    expect(screen.getByText("Certifications")).toBeInTheDocument();
    expect(screen.getByText("250")).toBeInTheDocument();
    expect(screen.getByText("+")).toBeInTheDocument();
  });

  it("is a list of statistics for assistive tech", () => {
    render(<Stats {...props} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Run to verify RED** — `pnpm test -- src/components/sections` → FAIL.

- [ ] **Step 3: Implement**

`src/components/sections/services-index.tsx`:
```tsx
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";
import { SplitText } from "@/components/motion/split-text";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { SectionLabel } from "@/components/ui/section-label";
import type { Cta } from "./types";

export interface ServicesIndexProps {
  index?: string;
  label: string;
  heading: string;
  intro: string;
  cta: Cta;
  services: { slug: string; title: string; summary: string }[];
}

export function ServicesIndex({ index, label, heading, intro, cta, services }: ServicesIndexProps) {
  return (
    <section className="bg-surface py-section">
      <Container className="grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-32">
            <SectionLabel index={index}>{label}</SectionLabel>
            <h2 className="mt-8 text-h2">
              <SplitText text={heading} />
            </h2>
            <p className="mt-6 max-w-sm text-lead font-light text-muted-foreground">{intro}</p>
            <Button asChild variant="outline" className="mt-10">
              <Link href={cta.href}>{cta.label}</Link>
            </Button>
          </div>
        </div>
      </Container>
      <ol className="mt-16 border-b border-border">
        {services.map((service, position) => (
          <li key={service.slug} className="border-t border-border">
            <Reveal>
              <Link
                href={`/services/${service.slug}/`}
                className="group block transition-colors duration-(--duration-base) ease-out-expo hover:bg-primary hover:text-primary-foreground"
              >
                <Container className="grid grid-cols-[3rem_1fr_auto] items-baseline gap-x-6 py-8 lg:grid-cols-[6rem_1.2fr_1fr_auto]">
                  <span className="text-label uppercase tracking-label tabular-nums text-muted-foreground transition-colors group-hover:text-secondary">
                    {String(position + 1).padStart(3, "0")}
                  </span>
                  <span className="font-heading text-h3">{service.title}</span>
                  <span className="hidden text-muted-foreground transition-colors group-hover:text-primary-foreground/80 lg:block">
                    {service.summary}
                  </span>
                  <ArrowUpRight
                    aria-hidden="true"
                    className="size-6 transition-transform duration-(--duration-base) ease-out-expo group-hover:translate-x-1 group-hover:-translate-y-1"
                  />
                </Container>
              </Link>
            </Reveal>
          </li>
        ))}
      </ol>
    </section>
  );
}
```
`src/components/sections/stats.tsx`:
```tsx
import { Counter } from "@/components/motion/counter";
import { Reveal } from "@/components/motion/reveal";
import { Container } from "@/components/ui/container";
import { SectionLabel } from "@/components/ui/section-label";

export interface StatsProps {
  index?: string;
  label: string;
  items: { value: number; suffix: string; label: string }[];
  locale: string;
}

export function Stats({ index, label, items, locale }: StatsProps) {
  return (
    <section className="bg-secondary py-section text-secondary-foreground">
      <Container>
        <SectionLabel index={index} className="text-secondary-foreground">
          {label}
        </SectionLabel>
        <ul className="mt-16 grid grid-cols-2 gap-x-6 gap-y-16 lg:grid-cols-4">
          {items.map((item) => (
            <li key={item.label} className="border-t border-secondary-foreground/30 pt-6">
              <Reveal>
                <p className="font-heading text-h1">
                  <Counter value={item.value} locale={locale} />
                  {item.suffix ? <span>{item.suffix}</span> : null}
                </p>
                <p className="mt-4 text-lead font-light">{item.label}</p>
              </Reveal>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
```
Note: `text-secondary-foreground` on the label overrides the muted tone; this works because `cn()` merges both text colors. If a later `SectionLabel` tone for "on secondary" is needed, add a variant instead of an override (report it).

- [ ] **Step 4: Verify GREEN** — `pnpm test && pnpm typecheck && pnpm lint` → PASS.

- [ ] **Step 5: Commit**
```bash
git add -A
git commit -m "feat: add ServicesIndex and Stats sections" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Sections: Clients marquee, pinned Process story

**Files:**
- Create: `src/components/sections/clients.tsx`, `clients.test.tsx`, `process.tsx`, `process.test.tsx`

**Interfaces:**
- Produces: `Clients({ index?, label, heading, logos: ImageAsset[] })`: two opposing marquee rows; `Process({ index?, label, heading, steps: { title: string; body: string }[] })`: pinned on desktop, stacked list otherwise.

- [ ] **Step 1: Write failing tests**

`src/components/sections/clients.test.tsx`:
```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Clients } from "./clients";

const logos = ["A", "B", "C", "D"].map((name) => ({
  src: `/media/clients/${name}.webp`,
  alt: `${name} logo`,
  width: 480,
  height: 200,
}));

describe("Clients", () => {
  it("shows the heading and every logo with alt text", () => {
    render(<Clients index="004" label="Clients" heading="Organisations we have worked with." logos={logos} />);
    expect(screen.getByRole("heading", { level: 2, name: /Organisations we have worked with/ })).toBeInTheDocument();
    for (const logo of logos) expect(screen.getAllByAltText(logo.alt).length).toBeGreaterThan(0);
  });

  it("hides the looping duplicate logos from assistive tech", () => {
    const { container } = render(
      <Clients index="004" label="Clients" heading="Organisations." logos={logos} />,
    );
    expect(container.querySelectorAll("[aria-hidden='true']").length).toBeGreaterThan(0);
  });
});
```
`src/components/sections/process.test.tsx`:
```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Process } from "./process";

const steps = [
  { title: "Scoping", body: "We study the project." },
  { title: "Assessment", body: "Specialists carry out studies." },
  { title: "Submission", body: "We file the applications." },
];

describe("Process", () => {
  it("renders every step in order as a numbered list (stacked baseline)", () => {
    render(<Process index="005" label="How we work" heading="From study to consent." steps={steps} />);
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(3);
    expect(items[0]).toHaveTextContent("Scoping");
    expect(items[2]).toHaveTextContent("We file the applications.");
  });

  it("has one h2 for the section and one h3 per step", () => {
    render(<Process index="005" label="How we work" heading="From study to consent." steps={steps} />);
    expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(1);
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(3);
  });
});
```

- [ ] **Step 2: Run to verify RED** — `pnpm test -- src/components/sections` → FAIL.

- [ ] **Step 3: Implement**

`src/components/sections/clients.tsx`:
```tsx
import Image from "next/image";
import { Marquee } from "@/components/motion/marquee";
import { SplitText } from "@/components/motion/split-text";
import { Container } from "@/components/ui/container";
import { SectionLabel } from "@/components/ui/section-label";
import type { ImageAsset } from "./types";

export interface ClientsProps {
  index?: string;
  label: string;
  heading: string;
  logos: ImageAsset[];
}

function LogoRow({ logos, speed, reverse }: { logos: ImageAsset[]; speed: number; reverse?: boolean }) {
  return (
    <Marquee speed={speed} reverse={reverse}>
      {logos.map((logo) => (
        <Image
          key={logo.src}
          src={logo.src}
          alt={logo.alt}
          width={logo.width}
          height={logo.height}
          className="h-12 w-auto max-w-none opacity-70 grayscale transition-[opacity,filter] duration-(--duration-base) hover:opacity-100 hover:grayscale-0"
        />
      ))}
    </Marquee>
  );
}

export function Clients({ index, label, heading, logos }: ClientsProps) {
  const half = Math.ceil(logos.length / 2);
  return (
    <section className="py-section">
      <Container>
        <SectionLabel index={index}>{label}</SectionLabel>
        <h2 className="mt-8 max-w-4xl text-h2">
          <SplitText text={heading} />
        </h2>
      </Container>
      <div className="mt-16 flex flex-col gap-12">
        <LogoRow logos={logos.slice(0, half)} speed={70} />
        <LogoRow logos={logos.slice(half)} speed={85} reverse />
      </div>
    </section>
  );
}
```
`src/components/sections/process.tsx`:
```tsx
"use client";

import { motion, useTransform, type MotionValue } from "motion/react";
import { ScrollStory } from "@/components/motion/scroll-story";
import { Container } from "@/components/ui/container";
import { SectionLabel } from "@/components/ui/section-label";

export interface ProcessProps {
  index?: string;
  label: string;
  heading: string;
  steps: { title: string; body: string }[];
}

const pad = (value: number, size: number) => String(value).padStart(size, "0");

function PinnedStep({
  position,
  total,
  progress,
  title,
  body,
}: {
  position: number;
  total: number;
  progress: MotionValue<number>;
  title: string;
  body: string;
}) {
  // The step nearest the scroll position is fully lit; the others fade to a quiet floor.
  const opacity = useTransform(progress, (value) =>
    Math.min(1, Math.max(0.2, 1 - Math.abs(value * total - (position + 0.5)) * 1.4)),
  );
  return (
    <motion.li
      style={{ opacity }}
      className="grid grid-cols-[4rem_1fr] gap-4 border-t border-primary-foreground/20 py-6"
    >
      <span className="text-label uppercase tracking-label tabular-nums text-secondary">{pad(position + 1, 3)}</span>
      <div>
        <h3 className="text-h3">{title}</h3>
        <p className="mt-3 max-w-md text-primary-foreground/80">{body}</p>
      </div>
    </motion.li>
  );
}

function PinnedCounter({ progress, total }: { progress: MotionValue<number>; total: number }) {
  const current = useTransform(progress, (value) => pad(Math.min(total, Math.floor(value * total) + 1), 2));
  return (
    <p className="font-heading text-display tabular-nums">
      <motion.span>{current}</motion.span>
      <span className="text-primary-foreground/40"> / {pad(total, 2)}</span>
    </p>
  );
}

export function Process({ index, label, heading, steps }: ProcessProps) {
  return (
    <section className="bg-primary text-primary-foreground">
      <ScrollStory
        steps={steps.length}
        renderStacked={() => (
          <Container className="py-section">
            <SectionLabel tone="inverse" index={index}>
              {label}
            </SectionLabel>
            <h2 className="mt-8 max-w-3xl text-h2">{heading}</h2>
            <ol className="mt-16 flex flex-col">
              {steps.map((step, position) => (
                <li
                  key={step.title}
                  className="grid grid-cols-[4rem_1fr] gap-4 border-t border-primary-foreground/20 py-6"
                >
                  <span className="text-label uppercase tracking-label tabular-nums text-secondary">
                    {pad(position + 1, 3)}
                  </span>
                  <div>
                    <h3 className="text-h3">{step.title}</h3>
                    <p className="mt-3 max-w-md text-primary-foreground/80">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Container>
        )}
        renderPinned={(progress) => (
          <div className="flex h-full flex-col justify-center">
            <Container className="grid items-center gap-16 lg:grid-cols-2">
              <div>
                <SectionLabel tone="inverse" index={index}>
                  {label}
                </SectionLabel>
                <h2 className="mt-8 text-h2">{heading}</h2>
                <div className="mt-12 flex items-center gap-6">
                  <div className="h-24 w-px bg-primary-foreground/20">
                    <motion.div style={{ scaleY: progress }} className="h-full w-px origin-top bg-accent" />
                  </div>
                  <PinnedCounter progress={progress} total={steps.length} />
                </div>
              </div>
              <ol className="flex flex-col">
                {steps.map((step, position) => (
                  <PinnedStep
                    key={step.title}
                    position={position}
                    total={steps.length}
                    progress={progress}
                    title={step.title}
                    body={step.body}
                  />
                ))}
              </ol>
            </Container>
          </div>
        )}
      />
    </section>
  );
}
```
- [ ] **Step 4: Verify GREEN** — `pnpm test && pnpm typecheck && pnpm lint` → PASS. (The stacked layout is what jsdom renders; the pinned layout is covered by `scroll-story.test.tsx` and the browser check in Task 11.)

- [ ] **Step 5: Commit**
```bash
git add -A
git commit -m "feat: add Clients marquee and pinned Process sections" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 10: Sections: Testimonials, ContactCta; compose the Home page

**Files:**
- Create: `src/components/sections/testimonials.tsx`, `testimonials.test.tsx`, `contact-cta.tsx`, `contact-cta.test.tsx`
- Modify: `src/app/page.tsx`

**Interfaces:**
- Produces: `Testimonials({ index?, label, heading, items: { quote; name; role? }[] })` (first item featured); `ContactCta({ index?, label, heading, body, primaryCta, phone, email, phoneLabel, emailLabel })`; the composed Home page.

- [ ] **Step 1: Write failing tests**

`src/components/sections/testimonials.test.tsx`:
```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Testimonials } from "./testimonials";

const items = [
  { quote: "Timely clearance of EC.", name: "Shivali Phanse", role: "BDM" },
  { quote: "Right way and within timeline.", name: "Anurag Gupta", role: "Senior Manager" },
  { quote: "A true partnership.", name: "Abhishek Patil" },
];

describe("Testimonials", () => {
  it("renders each quote with its author", () => {
    render(<Testimonials index="006" label="Client testimonials" heading="In our clients' words." items={items} />);
    expect(screen.getAllByRole("blockquote")).toHaveLength(3);
    expect(screen.getByText("Shivali Phanse")).toBeInTheDocument();
    expect(screen.getByText(/Senior Manager/)).toBeInTheDocument();
  });

  it("copes with a missing role", () => {
    render(<Testimonials index="006" label="L" heading="H" items={items} />);
    expect(screen.getByText("Abhishek Patil")).toBeInTheDocument();
  });
});
```
`src/components/sections/contact-cta.test.tsx`:
```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ContactCta } from "./contact-cta";

const props = {
  index: "007",
  label: "Contact",
  heading: "Tell us about your project.",
  body: "We will help you work out the approvals.",
  primaryCta: { label: "Start a conversation", href: "/contact/" },
  phone: "+91 9860220550",
  email: "info@envirosphere.co.in",
  phoneLabel: "Call us",
  emailLabel: "Email us",
};

describe("ContactCta", () => {
  it("links to the contact page and offers phone and email shortcuts", () => {
    render(<ContactCta {...props} />);
    expect(screen.getByRole("link", { name: "Start a conversation" })).toHaveAttribute("href", "/contact/");
    expect(screen.getByRole("link", { name: /\+91 9860220550/ })).toHaveAttribute("href", "tel:+919860220550");
    expect(screen.getByRole("link", { name: /info@envirosphere\.co\.in/ })).toHaveAttribute(
      "href",
      "mailto:info@envirosphere.co.in",
    );
  });

  it("renders the heading as an h2", () => {
    render(<ContactCta {...props} />);
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Tell us about your project.");
  });
});
```

- [ ] **Step 2: Run to verify RED** — `pnpm test -- src/components/sections` → FAIL.

- [ ] **Step 3: Implement**

`src/components/sections/testimonials.tsx`:
```tsx
import { Reveal } from "@/components/motion/reveal";
import { SplitText } from "@/components/motion/split-text";
import { Container } from "@/components/ui/container";
import { SectionLabel } from "@/components/ui/section-label";

export interface TestimonialsProps {
  index?: string;
  label: string;
  heading: string;
  items: { quote: string; name: string; role?: string }[];
}

function Author({ name, role }: { name: string; role?: string }) {
  return (
    <figcaption className="mt-6 text-sm">
      <span className="text-foreground">{name}</span>
      {role ? <span className="text-muted-foreground">, {role}</span> : null}
    </figcaption>
  );
}

export function Testimonials({ index, label, heading, items }: TestimonialsProps) {
  const [featured, ...rest] = items;
  return (
    <section className="bg-surface py-section">
      <Container>
        <SectionLabel index={index}>{label}</SectionLabel>
        <h2 className="mt-8 max-w-4xl text-h2">
          <SplitText text={heading} />
        </h2>
        {featured ? (
          <Reveal className="mt-16 max-w-5xl">
            <figure>
              <blockquote className="font-heading text-h2">{featured.quote}</blockquote>
              <Author name={featured.name} role={featured.role} />
            </figure>
          </Reveal>
        ) : null}
        {rest.length > 0 ? (
          <div className="mt-16 grid gap-6 md:grid-cols-3">
            {rest.map((item, position) => (
              <Reveal key={item.name} delay={position * 0.1}>
                <figure className="h-full rounded-card bg-background p-8">
                  <blockquote className="text-lead font-light">{item.quote}</blockquote>
                  <Author name={item.name} role={item.role} />
                </figure>
              </Reveal>
            ))}
          </div>
        ) : null}
      </Container>
    </section>
  );
}
```
`src/components/sections/contact-cta.tsx`:
```tsx
import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";
import { SplitText } from "@/components/motion/split-text";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { SectionLabel } from "@/components/ui/section-label";
import { mailtoHref, telHref } from "@/lib/links";
import type { Cta } from "./types";

export interface ContactCtaProps {
  index?: string;
  label: string;
  heading: string;
  body: string;
  primaryCta: Cta;
  phone: string;
  email: string;
  phoneLabel: string;
  emailLabel: string;
}

export function ContactCta({
  index,
  label,
  heading,
  body,
  primaryCta,
  phone,
  email,
  phoneLabel,
  emailLabel,
}: ContactCtaProps) {
  return (
    <section className="bg-secondary py-section text-secondary-foreground">
      <Container>
        <SectionLabel index={index} className="text-secondary-foreground">
          {label}
        </SectionLabel>
        <h2 className="mt-8 max-w-5xl text-h1">
          <SplitText text={heading} />
        </h2>
        <Reveal className="mt-12 flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
          <p className="max-w-xl text-lead font-light">{body}</p>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <Button asChild size="lg">
              <Link href={primaryCta.href}>{primaryCta.label}</Link>
            </Button>
            <div className="flex flex-col gap-1 text-sm">
              <a href={telHref(phone)} className="underline-offset-4 hover:underline">
                {phoneLabel}: {phone}
              </a>
              <a href={mailtoHref(email)} className="underline-offset-4 hover:underline">
                {emailLabel}: {email}
              </a>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
```
`src/app/page.tsx` (replace):
```tsx
import { About } from "@/components/sections/about";
import { Clients } from "@/components/sections/clients";
import { ContactCta } from "@/components/sections/contact-cta";
import { Hero } from "@/components/sections/hero";
import { Process } from "@/components/sections/process";
import { ServicesIndex } from "@/components/sections/services-index";
import { Stats } from "@/components/sections/stats";
import { Testimonials } from "@/components/sections/testimonials";
import { getImageAsset, loadHome, loadServices, loadSite } from "@/lib/content";

export default function HomePage() {
  const site = loadSite();
  const home = loadHome();
  const services = loadServices();

  return (
    <>
      <Hero
        eyebrow={home.hero.eyebrow}
        title={home.hero.title}
        subtitle={home.hero.subtitle}
        primaryCta={home.hero.primaryCta}
        secondaryCta={home.hero.secondaryCta}
        scrollLabel={home.hero.scrollLabel}
      />
      <About
        index="001"
        label={home.about.label}
        heading={home.about.heading}
        paragraphs={home.about.paragraphs}
        image={getImageAsset(home.about.image)}
        cta={home.about.cta}
      />
      <ServicesIndex
        index="002"
        label={home.services.label}
        heading={home.services.heading}
        intro={home.services.intro}
        cta={home.services.cta}
        services={services.map(({ slug, title, summary }) => ({ slug, title, summary }))}
      />
      <Stats index="003" label={home.stats.label} items={home.stats.items} locale={site.locale} />
      <Clients
        index="004"
        label={home.clients.label}
        heading={home.clients.heading}
        logos={home.clients.logos.map(getImageAsset)}
      />
      <Process
        index="005"
        label={home.process.label}
        heading={home.process.heading}
        steps={home.process.steps}
      />
      <Testimonials
        index="006"
        label={home.testimonials.label}
        heading={home.testimonials.heading}
        items={home.testimonials.items}
      />
      <ContactCta
        index="007"
        label={home.contact.label}
        heading={home.contact.heading}
        body={home.contact.body}
        primaryCta={home.contact.primaryCta}
        phone={site.contact.phones[0]}
        email={site.contact.email}
        phoneLabel={home.contact.phoneLabel}
        emailLabel={home.contact.emailLabel}
      />
    </>
  );
}
```

- [ ] **Step 4: Verify GREEN and build**

Run: `pnpm test && pnpm typecheck && pnpm lint && pnpm build`
Expected: all pass; build lists `/` and `/_not-found` as static; `out/media/clients/` has 39 files. Report `du -sh out`.

- [ ] **Step 5: Commit**
```bash
git add -A
git commit -m "feat: add Testimonials and ContactCta, compose the Home page" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 11: Browser verification, e2e, docs

**Files:**
- Create: `tests/e2e/home.spec.ts`
- Modify: `content/README.md`, `docs/ai-context.md`

**Interfaces:**
- Consumes: the built site on `http://localhost:4173`.

- [ ] **Step 1: Write the e2e tests** `tests/e2e/home.spec.ts`

```ts
import { expect, test } from "@playwright/test";

test.describe("home page", () => {
  test("has every section and all 13 services", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(await page.getByRole("heading", { level: 2 }).count()).toBeGreaterThanOrEqual(6);
    const serviceLinks = page.locator('a[href^="/services/"][href$="/"]').filter({ hasText: /^\d{3}/ });
    await expect(serviceLinks).toHaveCount(13);
  });

  test("scrolling the whole page raises no console errors or hydration warnings", async ({ page }) => {
    const problems: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error" || message.type() === "warning") problems.push(message.text());
    });
    page.on("pageerror", (error) => problems.push(error.message));
    await page.goto("/");
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 500) {
        window.scrollTo(0, y);
        await new Promise((resolve) => setTimeout(resolve, 60));
      }
    });
    expect(problems).toEqual([]);
  });

  test("content below the fold becomes visible after scrolling to it", async ({ page }) => {
    await page.goto("/");
    const contact = page.getByRole("heading", { level: 2 }).last();
    await contact.scrollIntoViewIfNeeded();
    await expect(contact).toBeVisible();
    await expect(page.locator("[data-reveal]").last()).toHaveCSS("opacity", "1");
  });
});

test.describe("desktop hero", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("the main call to action is inside the first screen", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: /talk to our team/i })).toBeInViewport();
  });
});

test.describe("small phone", () => {
  test.use({ viewport: { width: 375, height: 800 } });

  test("no horizontal scroll anywhere on the page", async ({ page }) => {
    await page.goto("/");
    const widths = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      inner: window.innerWidth,
    }));
    expect(widths.scroll).toBeLessThanOrEqual(widths.inner);
  });
});
```
Note: the `/talk to our team/i` locator and the `\d{3}` filter read visible copy; if `home.yaml` wording changes, update the locator to match (this is the one place e2e depends on Home copy; prefer `getByRole("link").first()` inside the hero if the owner changes it often).

- [ ] **Step 2: Run unit, build and e2e**

Run: `pnpm test && pnpm typecheck && pnpm lint && pnpm test:e2e`
Expected: all pass. If the hero-CTA-in-viewport test fails at 1440×900, reduce the **maximum** of `--text-display` in `src/app/globals.css` from `9.5rem` to `7.5rem` (keep the rest of the clamp), re-run, and report both heights; this is the only allowed design-token change in this task.

- [ ] **Step 3: Visual verification (required)**

Build and preview (`pnpm build` then `pnpm preview` in the background; reuse a running server if present). With Playwright chromium take full-page screenshots into `C:\Users\user\AppData\Local\Temp\claude\d--Pixelbot-Clients-Envirosphere-Envirosphere-app-new\e92c4810-8c98-4928-b817-776aab111b72\scratchpad\home\`: `home-375.png`, `home-768.png`, `home-1440.png`; for the desktop one also take **viewport** screenshots at scroll positions that show the pinned Process story at ~25%, ~50% and ~90% (`process-25.png`, `process-50.png`, `process-90.png`) by scrolling to the process section's top and then by `window.innerHeight * n`. Inspect each (Read tool) and report concrete defects (overflow, overlapping text, unreadable contrast, awkward wraps, empty gaps, logos too small/large). Fix defects that are plain bugs; list design judgments for the controller instead of changing them. Stop any preview server you started.

- [ ] **Step 4: Update the docs**

`content/README.md`: add a section "Home page" with one bullet per block in `content/pages/home.yaml` (what it controls and where its images come from: `about-photo` and the `client-*` keys in `media.yaml`), the rule "client logos: add the file to `public/media/clients/`, add an entry to `media.yaml`, then add its key to `clients.logos`", and a note that the `process` block is a draft to be reviewed. `docs/ai-context.md`: replace the "Current focus" line with `Plan 2 (Motion kit + Home) done. Next: Plan 3 (inner pages + brand assets). See docs/superpowers/plans/.`

- [ ] **Step 5: Commit**
```bash
git add -A
git commit -m "test: add Home e2e checks; docs for the Home content" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

## Self-Review

**Spec coverage (PRD §5 Home, rules 33/34, review carry-overs):**
- Hero, about, services 001–013, stats, client marquee, scroll-pinned process, testimonials, contact CTA: Tasks 7–10. ✔
- FAQ: deliberately omitted (the current site has none); to be added when the owner supplies questions.
- Scroll-driven effects: ScrollWords + Parallax (About), pinned story (Process), counters (Stats), marquee (Clients), SplitText (headings): Tasks 3, 4, 7–10. ✔
- Carry-overs: hero hidden until hydration (I1) → CSS `rise` + `MotionConfig` + Reveal simplification (Task 1); Reveal type holes (Task 1); `text-display`/`h1` reconcile + header token (Task 1); chrome strings to content, Escape-to-close, decorative logo alt, footer nav landmark, SectionLabel tone + tabular-nums, NBSP/BOM escapes (Task 2); `getImage` memoization dropped as YAGNI (build reads are cheap).
- Content rule 33: all section copy/images/links from `home.yaml`, `media.yaml`, `services/*.md`, `site.yaml` (Tasks 2, 6, 10). ✔
- Not yet covered (later plans, by design): inner pages and service text (3), forms and Button default type (4), SEO/CSP/raster OG (5).

**Placeholder scan:** `TODO(content)` markers in YAML are intentional (rule 33). No TBD steps.

**Type consistency:** `ImageAsset`/`Cta` defined in `sections/types.ts` and used by Hero/About/Clients/ServicesIndex/ContactCta; `getImageAsset` returns the same shape (`media.ts` `ImageAsset`, structurally identical). `Counter` requires `locale`; `Stats` and the page pass `site.locale`. `SectionLabel` `tone` is introduced in Task 2 and used by Tasks 7–9; the `index` prop is passed from the page. `Marquee` CSS var `--marquee-duration` matches the `--animate-marquee` token from Task 1. `Header`/`Footer` `labels` props are defined in Task 2 and supplied by `layout.tsx` in the same task.

**Known risks flagged in-step:** `@keyframes` inside `@theme` (Task 1 Step 9 fallback); jsdom APIs for Motion (Task 3 Step 4); download blocked by the old host's firewall (Task 5, Playwright fallback in code); 1440×900 hero fit (Task 11 Step 2); process copy is a draft for the owner.
