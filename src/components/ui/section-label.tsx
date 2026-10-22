import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const labelVariants = cva("font-body text-label uppercase tracking-label tabular-nums", {
  variants: {
    tone: { muted: "text-muted-foreground", inverse: "text-secondary" },
  },
  defaultVariants: { tone: "muted" },
});

export interface SectionLabelProps
  extends React.ComponentProps<"p">,
    VariantProps<typeof labelVariants> {
  /** Section number such as "001". */
  index?: string;
}

export function SectionLabel({ index, tone, className, children, ...props }: SectionLabelProps) {
  // Non-breaking spaces keep the brackets attached to their text so a bracket never wraps alone.
  return (
    <p className={cn(labelVariants({ tone }), className)} {...props}>
      {"[ "}
      {index ? `${index} / ` : ""}
      {children}
      {" ]"}
    </p>
  );
}
