import { Container } from "@/components/ui/container";
import { SectionLabel } from "@/components/ui/section-label";
import { cn } from "@/lib/utils";

export interface ContentSectionProps {
  index?: string;
  label: string;
  heading: string;
  lead?: string;
  /** Section background: "surface" is Sand, "background" is Bone. */
  tone?: "surface" | "background";
  /** Widest the lead text may grow, to keep the line length comfortable. */
  leadWidth?: "2xl" | "3xl";
  children?: React.ReactNode;
}

/** Numbered label, h2 and lead, with the section body below. */
export function ContentSection({
  index,
  label,
  heading,
  lead,
  tone = "background",
  leadWidth = "3xl",
  children,
}: ContentSectionProps) {
  return (
    <section
      className={cn("border-t border-border py-section", tone === "surface" ? "bg-surface" : "bg-background")}
    >
      <Container>
        <SectionLabel index={index}>{label}</SectionLabel>
        <h2 className="mt-6 text-h2 tracking-tight">{heading}</h2>
        {lead ? (
          <p
            className={cn(
              "mt-4 text-lead text-muted-foreground font-light",
              leadWidth === "2xl" ? "max-w-2xl" : "max-w-3xl",
            )}
          >
            {lead}
          </p>
        ) : null}
        {children}
      </Container>
    </section>
  );
}
