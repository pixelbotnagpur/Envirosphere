# RULE 32: Reusable, Props-Driven Components

## The rule
Every UI element is built ONCE in `src/components/ui` and reused everywhere via
props. Never copy a component and edit the copy. Never re-implement an
existing component inside an app. A fix or design change lands in one file
and propagates to every usage.

## Component contract
```tsx
// src/components/ui/button.tsx — the canonical pattern
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils"; // clsx + tailwind-merge

const buttonVariants = cva(
  // base — tokens only (RULE 31), never raw values
  "inline-flex items-center justify-center rounded-[--radius] font-body font-normal transition-colors focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        accent: "bg-accent text-accent-foreground hover:bg-accent/90",
        outline: "border border-border bg-transparent hover:bg-surface",
        ghost: "hover:bg-surface",
      },
      size: { sm: "h-8 px-3 text-sm", md: "h-10 px-4", lg: "h-12 px-6 text-lg" },
    },
    defaultVariants: { variant: "default", size: "md" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({ className, variant, size, asChild, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
```

## Requirements
1. **Variants via props (CVA).** New look = new variant value, not a new component.
2. **`className` escape hatch** merged with `cn()` — callers may extend, never fork.
3. **Composition over configuration:** compound components
   (`<Card><CardHeader/><CardContent/></Card>`), `children`, `asChild`
   (Radix Slot) instead of boolean-prop explosions (`isLink`, `hasIcon`…).
4. **Spread + forward native props** (`...props`) and support `ref`
   (React 19: ref is a normal prop) so components stay drop-in for HTML.
5. **Behavior from Radix primitives** (dialog, dropdown, tooltip) — accessible
   by default; style them with tokens. Never hand-roll focus traps/ARIA.
6. **Typed props, exported.** `interface XProps` exported next to the component;
   variants typed with `VariantProps<typeof xVariants>`.
7. **No app-specific logic in `src/components/ui`** — no data fetching, no content
   imports. Pure presentation + interaction; data arrives via props.
8. **Icons:** lucide-react, sized via tokens. `Sparkles`/`Sparkle`/`WandSparkles` are banned (rule 34).
9. **Body-font weight ≤ 400** in every variant (rule 31). Weight contrast comes from `font-heading`.

## Decision gate before writing any component
1. Exists in `src/components/ui` (or `src/components/motion`)? → use it.
2. Close but not quite? → add a variant or prop to the shared one.
3. Genuinely new + used by 2+ screens? → build in `src/components/ui`.
4. Truly one-off page section? → `src/components/sections`, still tokens + props.
