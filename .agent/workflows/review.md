# /review — hostile senior review (Antigravity workflow; mirrors .claude/commands/review.md)
Review the current diff (staged + unstaged) as a hostile senior engineer. Hunt in order:
1. Static-export breakers (server actions, route handlers, middleware, cookies/headers) (rule 70);
   unvalidated form input, secrets in `NEXT_PUBLIC_*` or the bundle (rule 60)
2. Hardcoded design values: hex/px/font literals, body text weight > 400 (rule 31)
3. Banned `Sparkles`/`Sparkle`/`WandSparkles` icons or ✨ emoji (rule 34)
4. Motion: layout-prop animation, missing reduced-motion fallback, extra Lenis instance,
   `framer-motion` imports, scroll listeners with setState (rule 34)
5. Copy, contacts, numbers or media paths hardcoded in JSX instead of `content/` (rule 33)
6. Copy-edited components instead of CVA variants (rule 32); needless `"use client"`
7. Broken error handling (swallowed errors, missing awaits); contract drift from `src/lib/validators`
Output: findings as file:line — issue — fix (one line each). If clean, say
"clean" and list the 2 riskiest areas to still test manually.
