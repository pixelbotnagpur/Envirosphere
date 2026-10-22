import { Counter } from "@/components/motion/counter";
import { Reveal } from "@/components/motion/reveal";
import { Container } from "@/components/ui/container";
import { SectionLabel } from "@/components/ui/section-label";

export interface StatsProps {
  index?: string;
  label: string;
  items: { value: number; suffix: string; label: string }[];
  locale: string;
}

export function Stats({ index, label, items, locale }: StatsProps) {
  return (
    <section className="bg-secondary py-section text-secondary-foreground">
      <Container>
        <SectionLabel index={index} className="text-secondary-foreground">
          {label}
        </SectionLabel>
        <ul className="mt-16 grid grid-cols-2 gap-x-6 gap-y-16 lg:grid-cols-4">
          {items.map((item) => (
            <li key={item.label} className="border-t border-secondary-foreground/45 pt-6">
              <Reveal>
                <p className="font-heading text-h1">
                  <Counter value={item.value} locale={locale} />
                  {item.suffix ? <span>{item.suffix}</span> : null}
                </p>
                <p className="mt-4 text-lead font-light">{item.label}</p>
              </Reveal>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
