import { cn } from "@/lib/utils";

export interface SectionLabelProps extends React.ComponentProps<"p"> {
  /** Section number such as "001". */
  index?: string;
}

export function SectionLabel({ index, className, children, ...props }: SectionLabelProps) {
  return (
    <p
      className={cn("font-body text-label uppercase tracking-label text-muted-foreground", className)}
      {...props}
    >
      [ {index ? `${index} / ` : ""}
      {children} ]
    </p>
  );
}
