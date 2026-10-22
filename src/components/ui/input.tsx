import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.ComponentProps<"input"> {
  hasError?: boolean;
}

export function Input({ className, type = "text", hasError, ...props }: InputProps) {
  return (
    <input
      type={type}
      aria-invalid={hasError ? "true" : undefined}
      className={cn(
        "flex h-11 w-full rounded-control border bg-background px-4 py-2 font-body font-normal text-base text-foreground transition-colors placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
        hasError ? "border-destructive" : "border-border hover:border-foreground/40",
        className,
      )}
      {...props}
    />
  );
}
