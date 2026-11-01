import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Our custom @theme tokens must be known to tailwind-merge, otherwise it cannot
// tell that e.g. px-gutter and px-4 conflict and silently keeps both classes.
// Type-scale tokens (text-h1…) must be recognised as font sizes, otherwise
// tailwind-merge treats them as colors and strips the real color class.
// Keep the theme lists in sync with the @theme block in globals.css.
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      spacing: ["gutter", "section"],
      radius: ["control", "card", "pill"],
      container: ["content"],
      tracking: ["label"],
      shadow: ["card"],
      ease: ["out-expo", "in-out-quart"],
    },
    classGroups: {
      "font-size": [
        { text: ["display", "h1", "h2", "h3", "h4", "lead", "base", "sm", "label", "micro"] },
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
