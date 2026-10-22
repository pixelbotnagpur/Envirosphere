import * as React from "react";
import { cn } from "@/lib/utils";

export interface SelectProps extends React.ComponentProps<"select"> {
  hasError?: boolean;
}

export function Select({ className, children, hasError, ...props }: SelectProps) {
  return (
    <select
      aria-invalid={hasError ? "true" : undefined}
      className={cn(
        "flex h-11 w-full rounded-control border bg-background px-4 py-2 font-body font-normal text-base text-foreground transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        hasError ? "border-destructive" : "border-border hover:border-foreground/40",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}
