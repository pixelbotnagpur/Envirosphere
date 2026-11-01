/**
 * Icons the owner may pick by name in content/*.yaml (`icon:` on a card). Names are the lucide
 * icon names in lowercase with dashes. To allow another icon add it here AND in
 * src/components/ui/icon.tsx; the compiler checks both lists stay equal.
 */
export const ICON_NAMES = [
  "award",
  "briefcase",
  "building",
  "factory",
  "file-check",
  "file-text",
  "globe",
  "layers",
  "leaf",
  "map-pin",
  "shield-check",
  "users",
  "waves",
] as const;

export type IconName = (typeof ICON_NAMES)[number];
