import { Counter } from "@/components/motion/counter";
import { Reveal } from "@/components/motion/reveal";
import { Container } from "@/components/ui/container";
import { SectionLabel } from "@/components/ui/section-label";
import { cn } from "@/lib/utils";

export interface StatsProps {
  index?: string;
  label: string;
  items: { value: number; suffix: string; label: string }[];
  locale: string;
  /**
   * Background of the section; pick the one that differs from the neighbours. "primary" is the dark Forest
   * section (light text, softly tinted cards); the others hold solid Forest cards.
   */
  tone?: "surface" | "background" | "primary";
}

const SECTION = {
  surface: "bg-surface",
  background: "bg-background",
  primary: "bg-primary text-primary-foreground",
} as const;

// On the dark section a solid Forest card would vanish, so the card is a faint Bone tint with a hairline.
const CARD = {
  surface: "bg-primary",
  background: "bg-primary",
  primary: "border border-primary-foreground/15 bg-primary-foreground/5",
} as const;

export function Stats({ index, label, items, locale, tone = "surface" }: StatsProps) {
  return (
    <section className={cn("py-section", SECTION[tone])}>
      <Container>
        <SectionLabel index={index} tone={tone === "primary" ? "inverse" : "muted"}>
          {label}
        </SectionLabel>
        <ul data-card-grid="" className="mt-16 grid grid-cols-2 gap-6 lg:grid-cols-4">
          {items.map((item) => (
            <li key={item.label} data-card="" className="flex">
              <Reveal className="flex w-full">
                <div className={cn("flex w-full flex-col rounded-card p-6 text-primary-foreground sm:p-8", CARD[tone])}>
                  <p className="border-b border-primary-foreground/20 pb-4 font-heading text-h1">
                    <Counter value={item.value} locale={locale} />
                    {item.suffix ? <span>{item.suffix}</span> : null}
                  </p>
                  <p className="mt-4 text-lead font-light text-primary-foreground/80">
                    {item.label}
                  </p>
                </div>
              </Reveal>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
