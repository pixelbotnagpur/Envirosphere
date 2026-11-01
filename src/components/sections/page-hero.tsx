import { Container } from "@/components/ui/container";
import { SectionLabel } from "@/components/ui/section-label";

export interface PageHeroProps {
  /** Section number shown in the label, e.g. "001". */
  index?: string;
  eyebrow: string;
  /** The one h1 of the page. */
  title: string;
  /** Short line shown to the right of the title on wide screens. */
  lead?: string;
}

/** Forest banner at the top of every inner page. */
export function PageHero({ index = "001", eyebrow, title, lead }: PageHeroProps) {
  return (
    <section className="hero-atmosphere relative w-full bg-primary pt-28 pb-16 text-primary-foreground sm:pt-36 sm:pb-20">
      <Container>
        <SectionLabel tone="inverse" index={index}>
          {eyebrow}
        </SectionLabel>
        <div className="mt-8 grid gap-8 lg:grid-cols-12 lg:items-end">
          <h1 className="text-display max-w-4xl tracking-tight text-primary-foreground lg:col-span-8">
            {title}
          </h1>
          {lead ? (
            <p className="text-lead text-primary-foreground/85 font-light lg:col-span-4">{lead}</p>
          ) : null}
        </div>
      </Container>
    </section>
  );
}
