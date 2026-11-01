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
  globalIgnores([".next/**", ".next-e2e/**", "out/**", "hostinger-dist/**", "node_modules/**", "next-env.d.ts", "coverage/**", ".claude/worktrees/**", ".next-shot-*/**"]),
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
