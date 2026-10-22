# RULE 31: Design Tokens, Color & Typography

## The rule
No hardcoded design values in components, ever: no hex/rgb/hsl, no magic px, no ad-hoc
font stacks, no one-off shadows, durations or easings. Every visual value resolves to a
token defined once in `src/app/globals.css`. Changing a token in ONE place restyles the app.

## Token tiers
1. **Primitives:** raw nature palette (`--color-forest-700`, `--color-sage-300`…). Only semantic tokens reference these.
2. **Semantic:** the ONLY tier components use (table below).
3. **Component (optional):** `--card-bg: var(--color-surface)` for heavy theming.

## Semantic palette: role names the user will say
| User says | Token → utility | Value (OKLCH) |
|---|---|---|
| primary | `--color-primary` → `bg-primary` / `text-primary` | Forest `oklch(0.31 0.05 155)` |
| primary foreground | `--color-primary-foreground` | Bone `oklch(0.96 0.012 90)` |
| secondary | `--color-secondary` | Sage `oklch(0.78 0.045 135)` |
| secondary foreground | `--color-secondary-foreground` | Bark `oklch(0.22 0.02 155)` |
| accent | `--color-accent` | Ochre `oklch(0.74 0.12 75)` |
| accent foreground | `--color-accent-foreground` | Bark |
| background | `--color-background` | Bone |
| foreground / text | `--color-foreground` | Bark |
| surface / card | `--color-surface` | Sand `oklch(0.92 0.02 88)` |
| muted text | `--color-muted-foreground` | `oklch(0.50 0.02 150)` |
| border | `--color-border` | Linen `oklch(0.86 0.02 95)` |
| ring | `--color-ring` | `var(--color-primary)`; descendants of `.bg-primary` get Ochre |
| destructive | `--color-destructive` | Clay `oklch(0.53 0.16 30)` (form errors only) |

- "Change card background to primary" means set the card to `bg-primary text-primary-foreground`,
  and switch nested muted text to a primary-foreground opacity variant.
  Change the **token** only when the user asks to change the color itself ("make primary darker").
- Accent ≤ 5% of any viewport. Primary carries the dark, immersive sections.
- Every `x` / `x-foreground` pair passes WCAG AA 4.5:1. Check when tokens change.

## Typography: exactly 2 families
```css
--font-heading: var(--font-fraunces), serif;   /* headings, display, pull quotes */
--font-body: var(--font-manrope), sans-serif;  /* everything else */
```
- Loaded via `next/font/google` in the root layout. **Manrope weights: 300, 400 only.**
- Body/UI text weight ≤ 400. `font-medium|semibold|bold` are forbidden on `font-body`.
  Emphasis = color, size, italic heading font, or underline.
- Headings: Fraunces 300–500, tight leading, negative tracking, fluid sizes.
- Type scale tokens (fluid `clamp()`): `--text-display`, `--text-h1`…`--text-h4`,
  `--text-lead`, `--text-base`, `--text-sm`, `--text-label`. No arbitrary `text-[..px]`.
- Labels: body font, 400, uppercase, `--tracking-label`, bracket style `[ 001 / about ]`.

## Other tokens (same discipline)
`--radius-*`, `--spacing` (base), section padding `--space-section`, container widths,
`--shadow-*`, motion `--duration-*` + `--ease-*` (rule 34), z-index scale.

## Usage
- ✅ `bg-primary text-primary-foreground rounded-card font-heading text-h1`
- ❌ `bg-[#1E3A2B]`, `style={{ color: "#333" }}`, `rounded-[7px]`, `font-semibold` on body text

## Adding a token
1. A semantic token already covers it? Use it.
2. Genuinely new: add primitive (if needed) + semantic token in `@theme`, then use it.
   Never inline the raw value "temporarily".
