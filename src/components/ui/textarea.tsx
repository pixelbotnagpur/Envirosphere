import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends React.ComponentProps<"textarea"> {
  hasError?: boolean;
}

export function Textarea({ className, hasError, rows = 4, ...props }: TextareaProps) {
  return (
    <textarea
      rows={rows}
      aria-invalid={hasError ? "true" : undefined}
      className={cn(
        "flex min-h-24 w-full rounded-control border bg-background px-4 py-3 font-body font-normal text-base text-foreground transition-colors placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
        hasError ? "border-destructive" : "border-border hover:border-foreground/40",
        className,
      )}
      {...props}
    />
  );
}
