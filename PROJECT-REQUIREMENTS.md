# Envirosphere — Project Requirements

## 1. Project Overview
- **Product:** Premium redesign of the marketing website for Envirosphere Consultant &
  Engineers (Pune, India): a QCI-NABET accredited (Cat A) environmental consultancy that
  handles clearances, compliance, audits, monitoring and treatment-plant engineering.
- **Current site (content + asset source):** https://envirosphere.co.in/
- **Design reference:** https://neiden.framer.media/ — use it for editorial minimalism, big
  display type, numbered sections (`001`), bracketed labels (`[ services / ]`), generous
  whitespace and scroll storytelling. **Do not copy it:** no layouts, copy or assets.
- **Type:** Static marketing site. One Next.js app, **not a monorepo**, exported to plain
  HTML/CSS/JS (`out/`) and served by a small Node server on Hostinger's Node.js plan.
- **No user login, no database, no application server logic.** A dependency-free `server.mjs` only serves the files. Forms post to Google Sheets (§3.8).
- **Target users:** Plant and project heads, EHS managers and developers in industry,
  infrastructure and real estate who need EC, CRZ, forest, PCB consents or audits. Also
  government bodies and job seekers.
- **Success metric:** Qualified enquiries (form + call/WhatsApp clicks) per month,
  Lighthouse ≥ 90 on every category, and a premium look and feel that clients notice.

## 2. Tech Stack (latest stable as of 2026-10-22; swap only with a recorded reason)
| Layer | Choice | Notes |
|---|---|---|
| Runtime | Node 24 LTS | pin in `.nvmrc` + `engines` (build machine only) |
| Package manager | pnpm | single `package.json`, no workspaces |
| Framework | **Next.js 16.4.x**, App Router, **`output: "export"`** | static HTML in `out/`; see §3.9 limits |
| UI runtime | React 19.2 | ref is a normal prop; no `forwardRef` |
| Language | TypeScript 5.x strict | no `any`, no `@ts-ignore` without a reason |
| Styling | Tailwind CSS v4 (CSS-first `@theme`) | all tokens in `src/app/globals.css` |
| Components | shadcn/ui + Radix primitives + CVA | live in `src/components/ui` |
| Animation | **Motion** (`motion`, formerly Framer Motion) | import from `motion/react` |
| Smooth scroll | **Lenis** (`lenis`, `lenis/react`) | one root `<ReactLenis root>` provider |
| Icons | lucide-react | **`Sparkles` icon family banned** (§3.5) |
| Fonts | `next/font/google`, self-hosted at build | exactly 2 families: Syne + Manrope (§3.2) |
| Content | **Files in `/content`** (YAML + Markdown) + `/public/media` | §3.10. Read and validated at build time |
| Forms | React Hook Form + Zod → **Google Apps Script → Google Sheet** | §3.8 |
| Spam protection | Honeypot + min-fill-time + Cloudflare Turnstile (free) | Turnstile verified inside Apps Script |
| Images | Build-time optimization (WebP/AVIF, responsive sizes) | static export has no image server |
| Testing | Vitest + Testing Library + Playwright | see §6 |
| Lint/format | ESLint (flat config) + Prettier | `next lint` is gone in v16; run `eslint` directly |
| Hosting | **Hostinger Node.js plan** | `server.mjs` serves the static `out/` (no Next.js server features); `public/.htaccess` stays as an Apache/LiteSpeed fallback |

Not used: user accounts/login, database, CMS server, API routes, server actions,
middleware, Turborepo, tRPC, payments. Add any only after approval.

## 3. Non-negotiable rules

### 3.1 Brand colors (nature palette): name a role and the agent knows the token
Components use **semantic tokens only**. "Make the card primary" means `bg-primary
text-primary-foreground`. Values are defined once in `globals.css` (rule 31).

| Role (what you say) | Token / utility | Name | OKLCH | ≈ Hex | Use |
|---|---|---|---|---|---|
| **Primary** | `primary` | Forest | `oklch(0.31 0.05 155)` | `#1E3A2B` | dark sections, primary buttons, key headings |
| Primary foreground | `primary-foreground` | Bone | `oklch(0.96 0.012 90)` | `#F5F2EA` | text on primary |
| **Secondary** | `secondary` | Sage | `oklch(0.78 0.045 135)` | `#AEBDA2` | soft cards, tags, secondary buttons, dividers on dark |
| Secondary foreground | `secondary-foreground` | Bark | `oklch(0.22 0.02 155)` | `#16201A` | text on secondary |
| **Accent** | `accent` | Ochre | `oklch(0.74 0.12 75)` | `#D39E45` | CTAs, highlights, active states, counters. Use sparingly (≤ 5% of a screen) |
| Accent foreground | `accent-foreground` | Bark | `oklch(0.22 0.02 155)` | `#16201A` | text on accent |
| Background | `background` | Bone | `oklch(0.96 0.012 90)` | `#F5F2EA` | page background |
| Foreground | `foreground` | Bark | `oklch(0.22 0.02 155)` | `#16201A` | body text |
| Surface | `surface` | Sand | `oklch(0.92 0.02 88)` | `#E9E3D5` | cards and panels on background |
| Muted foreground | `muted-foreground` | Lichen grey | `oklch(0.50 0.02 150)` | `#5F6B61` | captions, meta, labels |
| Border | `border` | Linen | `oklch(0.86 0.02 95)` | `#D6D0C2` | hairlines (1px) |
| Destructive | `destructive` | Clay red | `oklch(0.53 0.16 30)` | `#B63C2E` | form errors only |

- The hex column is for humans only. Code uses tokens, never hex.
- Every `x` / `x-foreground` pair must pass WCAG AA (4.5:1).
- Focus ring: two-tone (Bone band + Forest outline) so it stays ≥ 3:1 on light and dark sections (WCAG C40).
- Dark mode is optional. A "dark section" means `bg-primary text-primary-foreground`.

### 3.2 Typography: exactly 2 font families
| Role | Token | Family | Weights allowed |
|---|---|---|---|
| Headings / display | `--font-heading` → `font-heading` | **Syne** | **400 (Regular) only** |
| Body / UI / labels | `--font-body` → `font-body` | **Manrope** | **300 and 400 only, never above 400** |

- No third family, including mono. Numbers and labels use Manrope 400 with tabular nums.
- Body emphasis comes from color, size or the heading font, **never from weight > 400**.
  No `font-medium`, `font-semibold` or `font-bold` on body text. Load only 300/400 for Manrope.
- Display headings: large and fluid (`clamp()` tokens), leading ≈ 0.95–1.1,
  slight negative tracking, sentence case or lowercase editorial style.
- Labels: Manrope 400, uppercase, wide tracking, in brackets: `[ 003 / services ]`.
- Type scale is defined as tokens (`--text-display`, `--text-h1` … `--text-sm`).

### 3.3 Premium motion & scroll (rule 34)
- Lenis smooth scroll site-wide. Motion for reveals, parallax and scroll-linked effects
  (`useScroll`, `useTransform`, `useSpring`).
- Scroll-driven sections: pinned/sticky storytelling (process steps, services), parallax
  imagery, text line-by-line reveals, counters on stats, horizontal scroll gallery,
  image clip-path/scale reveals, marquee of client logos.
- Animate only `transform`, `opacity`, `clip-path` and `filter`. Never animate layout props.
- `prefers-reduced-motion`: Lenis off, no parallax or pinning, simple fades only.
- Durations and easings come from tokens. No inline magic numbers.

### 3.4 Design tokens, components, content-driven
- No raw hex/rgb/px/font values in components. Tokens only (rule 31).
- Every UI element is built once in `src/components/ui` and extended through props/CVA (rule 32).
- No client identity, copy or asset paths in components. Everything comes from `/content` (rule 33).

### 3.5 Icons
- lucide-react only, stroke icons, consistent size tokens.
- **Banned everywhere:** `Sparkles`, `Sparkle`, `WandSparkles` and any sparkle/star-burst
  "AI magic" icon, plus the ✨ emoji. ESLint `no-restricted-imports` enforces this.

### 3.6 Accessibility & performance
- WCAG 2.2 AA: contrast, keyboard navigation, visible `:focus-visible` ring token,
  semantic landmarks, labelled inputs, alt text on all imagery (from `media.yaml`).
- Core Web Vitals: LCP < 2.5s, INP < 200ms, CLS < 0.1. Hero LCP image is preloaded.
- Images pre-optimized at build with width/height set. Video is lazy and muted with a poster.
- Motion code lives in client components at the leaves. Pages stay RSC (rendered at build).

### 3.7 Security baseline
- No secrets ship in the static bundle. Only `NEXT_PUBLIC_*` values (form endpoint URL,
  Turnstile site key, site URL) reach the browser; they are public by design.
- Turnstile secret and notification email live in Apps Script **Script Properties**, never in the repo.
- The Google Sheet stays private (owner + named staff). It holds PII.
- Security headers (CSP, HSTS, X-Content-Type-Options, Referrer-Policy) and caching
  rules ship in `public/.htaccess` and are mirrored exactly by `server.mjs` (a test keeps them identical).

### 3.8 Forms → Google Sheets
```
Browser form (RHF + Zod) ──POST JSON (text/plain, no CORS preflight)──▶
Google Apps Script Web App (doPost) ──▶ validates again + verifies Turnstile
   ├─▶ appends a row to Sheet tab "Inquiries" or "Applications" (timestamp, fields, page URL)
   ├─▶ career CV (PDF/DOC ≤ 5 MB) saved to a private Drive folder, link written in the row
   └─▶ optional email alert to the office inbox (MailApp)
```
- Apps Script source lives in the repo at `integrations/google-sheets/Code.gs` with a
  step-by-step `SETUP.md`. It is deployed as a Web App ("Execute as: me", "Access: anyone").
- Endpoint URL in `.env` as `NEXT_PUBLIC_FORMS_ENDPOINT`. Changing sheets = redeploy the script, no code change.
- The client shows success/error states. On failure it shows the phone/email fallback.
- Abuse limits: honeypot, minimum fill time, Turnstile, field length caps, CacheService
  throttle per email.

### 3.9 Static export constraints (`output: "export"`)
- Every route must be pre-renderable. Dynamic routes (`/services/[slug]`) use `generateStaticParams`.
- Not available: server actions, route handlers with request data, middleware/proxy,
  ISR, cookies/headers, Next image optimization server. Do not use them.
- `trailingSlash: true` so `/about/` maps to `about/index.html` (`server.mjs` and Apache/LiteSpeed both resolve it).
- `sitemap.xml`, `robots.txt`, OG images, 404 page are generated at build.
- Deploy = `pnpm build`, `pnpm package:hostinger`, then upload `hostinger-dist/` to the Hostinger Node.js app
  (`docs/DEPLOY-HOSTINGER.md`). `server.mjs` (Node built-ins only) serves `out/`; `pnpm start` runs it locally.

### 3.10 Content & assets as files ("local database")
The owner edits text and swaps images **without touching code**. All content lives in
plain files at the project root:
```
content/
├── README.md              # how to edit, in plain language (for the site owner)
├── site.yaml              # company name, tagline, contact, offices, socials, nav, SEO, stats
├── media.yaml             # every image/video/PDF: key → file path + alt text
├── pages/                 # home.yaml, about.yaml, why-us.yaml, careers.yaml, contact.yaml…
├── services/              # one Markdown file per service (front matter + body text)
├── clients.yaml           # client names + logo keys
├── testimonials.yaml
├── faq.yaml
├── gallery.yaml           # images, videos, events
├── downloads.yaml         # brochure, certificates, policies (PDF keys)
└── jobs.yaml              # current openings (empty list = "no openings" message)
public/media/              # the actual files: brand/, images/, clients/, gallery/, videos/, docs/
```
- **Why YAML + Markdown:** readable without coding knowledge, comments allowed, no
  commas/brackets to break, clean Git diffs, and works with static export. Long text
  (service pages) is Markdown; lists and settings are YAML.
- **Media by key, not by path:** pages reference `hero-home`, and `media.yaml` maps it to
  `/media/images/hero-home.jpg` + alt text. To replace an image, drop the new file in
  `public/media/` and edit one line (or keep the same filename and edit nothing).
- **Validated at build:** Zod schemas (`src/lib/validators/content.ts`) check every file.
  A typo stops the build with a plain message (`content/faq.yaml → item 3: "answer" is missing`).
  `pnpm content:check` runs the check alone.
- Colors and fonts are **not** in content files. They are design tokens; ask the agent
  ("change accent to a deeper ochre").
- Upgrade path (optional, later): Keystatic or Decap CMS can provide a visual editor
  over these same files without changing the site.

## 4. Architecture
```
/                      (single Next.js app, no workspaces)
├── content/                 # §3.10, the owner-editable "database"
├── public/
│   ├── media/               # images, logos, videos, PDFs
│   └── .htaccess            # Apache fallback: headers, caching, 404, trailing slash (ignored on Node plan)
├── server.mjs               # Node server for the static export (Hostinger Node.js)
├── integrations/google-sheets/  # Code.gs + SETUP.md (Apps Script)
├── src/
│   ├── app/                 # routes, layout, globals.css (tokens), sitemap, robots
│   ├── components/
│   │   ├── ui/              # primitives: Button, Card, Badge, Input, Dialog… (CVA)
│   │   ├── motion/          # LenisProvider, Reveal, Parallax, SplitText, Marquee, Counter, Pin
│   │   ├── sections/        # page sections composed from ui + motion, fed by content
│   │   └── layout/          # Header, Footer, MobileNav
│   ├── lib/
│   │   ├── content/         # loaders: read + parse + validate /content at build time
│   │   ├── forms/           # submit client for the Apps Script endpoint
│   │   └── validators/      # Zod schemas (content + forms)
│   └── hooks/
└── tests/                   # Playwright e2e
```
- Import alias `@/*` → `src/*`. No deep `../../..` imports.
- Content loaders run only at build (server components / `generateStaticParams`).
  Client components receive plain props.

## 5. Feature requirements (v1)
All copy and assets are migrated from the current site into `/content` and `/public/media`,
restructured and lightly edited, never invented. Gaps are marked `TODO(content)`.
- **Home:** hero (statement headline, NABET Cat A trust line, primary CTA), who-we-are,
  services index (numbered 001–013), stats (250+ clients, 25+ ongoing projects,
  certifications), client logo marquee, process (scroll-pinned steps), testimonials,
  accreditations, FAQ, contact CTA, footer.
- **About:** story, mission, accreditations, branch network (Pune HQ; Mumbai, Tarapur,
  Nashik, Nagpur).
- **Services:** index page plus `/services/[slug]` for all 13 services (EIA/EC, PCB statutory
  compliance, six-monthly post-EC compliance, environmental audit, due diligence, EMP
  implementation, CRZ clearance, forest clearance, environmental monitoring, ETP/STP/WTP
  design and O&M, statutory approvals, ESG audit, water audit). One Markdown file each.
- **Why Us**, **Careers** (openings from `jobs.yaml` + application form with CV upload),
  **Gallery** (images, videos, events), **Downloads** (brochure, NABET certificate, policy,
  water-audit certificate).
- **Contact:** inquiry form → Google Sheet, phone/WhatsApp/email links, map embed, offices.
- **No login / client portal.**
- SEO: metadata from `content/site.yaml`, OG images, sitemap, robots, JSON-LD
  (Organization, LocalBusiness), canonical URLs.

## 6. Testing
- Unit (Vitest): content schemas (valid + broken fixtures), form validators, helpers.
- Component: forms (valid, invalid, network-error states), reduced-motion fallbacks.
- E2E (Playwright, against the built `out/` folder served locally): every page loads,
  nav works, contact form happy path with the endpoint mocked, mobile menu.
- Gates before deploy: lint, typecheck, test, `content:check`, build. Lighthouse on `/` and one service page.

## 7. Delivery & ops
- Build: `pnpm build` → `out/`, then `pnpm package:hostinger` → `hostinger-dist/` (`out/`, `server.mjs`,
  minimal `package.json`). Upload it to the Hostinger Node.js app (`docs/DEPLOY-HOSTINGER.md`).
- Env: `.env.example` lists `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_FORMS_ENDPOINT`,
  `NEXT_PUBLIC_TURNSTILE_SITE_KEY`.
- Monitoring: Hostinger uptime + Google Search Console. Form failures are visible in the
  Apps Script execution log.

## 8. Resolved decisions (2026-10-22)
1. **Login:** none. No client portal link.
2. **Content editing:** file-based `/content` (YAML + Markdown) + `/public/media`, validated at build (§3.10).
3. **Form delivery:** Google Sheets via Apps Script Web App, CVs to Google Drive (§3.8).
4. **Hosting:** Hostinger Node.js plan serving the static export from `out/` via `server.mjs` (§3.9; user decision 2026-11-01).
5. **Brand assets:** downloaded from envirosphere.co.in into `/public/media` as placeholders.
   The owner replaces them later via `media.yaml`.

## 9. Deviations from the boilerplate
| Change | Reason | Approved | Date |
|---|---|---|---|
| Single Next.js app, no monorepo/Turborepo/`packages/*` | User requirement: no monorepo | user | 2026-10-22 |
| No DB, auth, tRPC, BullMQ, payments or multi-tenancy | Static marketing site | user | 2026-10-22 |
| Static export (`output: "export"`) to Hostinger | Hosting choice | user | 2026-10-22 |
| Node server (`server.mjs`) serves the static export on Hostinger Node.js plan | User decision: "static and hosted on Hostinger Node.js"; no Next.js server features, no runtime dependencies | user | 2026-11-01 |
| Forms to Google Sheets via Apps Script instead of server email | User requirement; no server | user | 2026-10-22 |
| `site.config.ts` replaced by `/content/*.yaml` | Owner edits content without code | user | 2026-10-22 |
| Added Lenis + Motion, scroll-driven design (rule 34) | Premium design requirement | user | 2026-10-22 |
| Sparkles icon family banned | User requirement | user | 2026-10-22 |
| 2 font families, body weight ≤ 400 | User requirement | user | 2026-10-22 |
| Heading font Syne (Regular) instead of Fraunces | User preference (Vocago needs a paid license) | user | 2026-10-22 |
