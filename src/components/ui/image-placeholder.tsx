import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** Stands in for a picture that has not been added yet. Decorative: it carries no text. */
export function ImagePlaceholder({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-placeholder=""
      aria-hidden="true"
      className={cn("flex items-center justify-center bg-secondary text-secondary-foreground/60", className)}
      {...props}
    >
      <ImageIcon className="size-10" strokeWidth={1} />
    </div>
  );
}
