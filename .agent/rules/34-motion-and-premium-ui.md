# RULE 34: Motion, Scroll & Premium UI

## Libraries
- **Lenis** (`lenis`): one `<ReactLenis root>` in `src/components/motion/lenis-provider.tsx`,
  mounted in the root layout. Never create a second Lenis instance. Anchor links and
  route changes scroll through `useLenis()`.
- **Motion** (`motion`, formerly Framer Motion): import from `motion/react`. Never install
  the legacy `framer-motion` package.
- Reusable wrappers live in `src/components/motion` (Reveal, SplitText, Parallax, Pin,
  Marquee, Counter, ImageReveal). Sections compose these and never re-implement them.

## Scroll-driven patterns (use where they serve the story)
- Hero: split-line headline reveal, slow image/video scale-down on scroll.
- Sticky/pinned storytelling for process steps and the services index (`useScroll` +
  `useTransform` on a tall container with a sticky child).
- Parallax depth on imagery (small ranges, 5–15%).
- Clip-path / mask reveals for images. Counters for stats when in view.
- Horizontal scroll for gallery/projects on desktop; plain vertical stack on mobile.
- Infinite marquee for client logos (pauses on hover and for reduced motion).

## Performance rules
- Animate only `transform`, `opacity`, `clip-path`, `filter`. Never width/height/top/left.
- Use `useScroll`/`useTransform`/`useSpring` (motion values, no React re-renders).
  No `scroll` event listeners with `setState`.
- Motion components are client leaves. Pages and sections stay RSC wherever possible.
- `viewport={{ once: true }}` for entrance reveals. No re-animating on every pass.
- Durations and easings come from tokens (`--duration-*`, `--ease-*`, mirrored in
  `src/lib/motion.ts`). No inline `0.6` or cubic-bezier literals in components.

## Accessibility
- `prefers-reduced-motion`: Lenis disabled (native scroll), no parallax/pin/marquee
  movement, entrances become opacity-only fades. Use Motion's `useReducedMotion`.
- Content is fully readable with JS disabled or before hydration (no hidden-by-default text
  without a fallback).

## Premium UI bar (benchmark: editorial minimal, as in neiden.framer.media)
- Large expressive headings, generous whitespace, strict grid, hairline borders,
  numbered sections, bracketed labels, restrained accent use.
- Custom hover states (underline draw, image zoom ≤ 1.05, magnetic CTA optional).
- No generic AI-template look: no gradient blobs, no glassmorphism by default, no
  emoji, no stock "AI" iconography.
- **Banned icons:** `Sparkles`, `Sparkle`, `WandSparkles` (and any future sparkle variants)
  from lucide or any icon set, plus the ✨ emoji. Enforced by ESLint `no-restricted-imports`.
