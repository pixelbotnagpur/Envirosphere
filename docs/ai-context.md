# Envirosphere — Architecture Brief (keep under 600 tokens)

## What it is
Premium static marketing site for Envirosphere Consultant & Engineers, an environmental
consultancy (EC, CRZ, forest clearance, PCB compliance, audits, ETP/STP). Users: industry
EHS and project heads. Phase: Plan 1 (Foundation) built; Home sections next. Hosted on Hostinger as static files.

## Data flow
Build time: loaders in `src/lib/content` read `content/*.yaml` + `content/services/*.md`,
validate with Zod, resolve media keys via `content/media.yaml` → `public/media/*`.
RSC pages render to static HTML in `out/`. Client components exist only at the leaves for
motion (Motion + Lenis) and forms.
Runtime: forms POST JSON (text/plain) to a Google Apps Script Web App
(`NEXT_PUBLIC_FORMS_ENDPOINT`), which validates, verifies Turnstile, appends a row to the
Google Sheet and stores CVs in Drive. No server, DB or login.

## Key modules
- `content/`: owner-editable "database" · `public/media/`: assets
- `src/app/globals.css`: all design tokens (palette, type scale, motion durations/easings)
- `src/components/ui`: CVA primitives · `src/components/motion`: LenisProvider, Reveal,
  Parallax, SplitText, Marquee, Counter, Pin · `src/components/sections`: page blocks
- `src/lib/validators`: Zod (content + forms) · `integrations/google-sheets/Code.gs`

## Invariants (never violate)
- Static export: nothing that needs a server at request time.
- No hardcoded content or media paths in components; everything from `content/`.
- Tokens only. Semantic names: primary/secondary/accent/background/surface/foreground.
- 2 fonts: Syne (headings, Regular 400 only), Manrope (body, ≤ 400 weight). No Sparkles icons.
- Reduced-motion disables Lenis/parallax/pinning.

## Current focus
Visual-first redesign matching Neiden benchmark complete (cinematic architectural hero split, visual break banner, featured disciplines photo cards, field operations archive). All 229 unit tests and 42 Playwright E2E tests passing green.

