# RULE 33: Content-Driven — Zero Hardcoded Content

## The rule
The site owner edits content and assets without touching code. Nothing about the client
(names, copy, numbers, contacts, links, image paths) is hardcoded in components, sections
or logic. If a text or image change needs a `.tsx` edit, the component is wrong. Fix it.

## Where things live (nothing else holds content)
1. `content/*.yaml` + `content/services/*.md`: identity, contact, nav, SEO, page copy,
   lists (services, clients, FAQ, jobs, gallery, downloads). Full map in
   `PROJECT-REQUIREMENTS.md` §3.10.
2. `content/media.yaml` + `public/media/`: every image, logo, video and PDF, by **key**
   (`hero-home`) → `{ src, alt }`. Components ask for keys, never paths.
3. `src/app/globals.css` `@theme`: ALL visuals via tokens (rule 31). Not in content.
4. `.env`: `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_FORMS_ENDPOINT`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`.

## Requirements
- Content is read **only at build time** through loaders in `src/lib/content/` and
  validated by Zod schemas in `src/lib/validators/content.ts`. Pages/sections receive
  typed props; client components never import loaders.
- Validation errors name the file and field in plain language so the owner can fix them.
- Keep the YAML shape friendly: flat where possible, comments explaining each block,
  optional fields have defaults, lists are ordered as displayed.
- Adding a new content field = update schema + loader + `content/README.md` together.
- Missing media key or missing file fails the build (no broken images in production).
- Markdown bodies render through one shared renderer with token-based prose styles.
- Never invent content (stats, clients, testimonials). Use only what the current site or
  the client provides; mark gaps as `TODO(content)`.
