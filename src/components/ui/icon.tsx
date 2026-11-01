import {
  Award,
  Briefcase,
  Building2,
  Factory,
  FileCheck2,
  FileText,
  Globe,
  Layers,
  Leaf,
  MapPin,
  ShieldCheck,
  Users,
  Waves,
  type LucideIcon,
} from "lucide-react";
import type { IconName } from "@/lib/icon-names";

/** Every name the owner may use in content (see src/lib/icon-names.ts). */
const ICONS: Record<IconName, LucideIcon> = {
  award: Award,
  briefcase: Briefcase,
  building: Building2,
  factory: Factory,
  "file-check": FileCheck2,
  "file-text": FileText,
  globe: Globe,
  layers: Layers,
  leaf: Leaf,
  "map-pin": MapPin,
  "shield-check": ShieldCheck,
  users: Users,
  waves: Waves,
};

export interface IconProps extends Omit<React.ComponentProps<"svg">, "name"> {
  name: IconName;
}

/** Decorative icon picked by content name. Hidden from screen readers. */
export function Icon({ name, ...props }: IconProps) {
  const Component = ICONS[name];
  return <Component aria-hidden="true" {...props} />;
}
