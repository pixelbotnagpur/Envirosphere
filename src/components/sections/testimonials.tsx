import { Reveal } from "@/components/motion/reveal";
import { SplitText } from "@/components/motion/split-text";
import { Container } from "@/components/ui/container";
import { SectionLabel } from "@/components/ui/section-label";

export interface TestimonialsProps {
  index?: string;
  label: string;
  heading: string;
  items: { quote: string; name: string; role?: string }[];
}

function Author({ name, role }: { name: string; role?: string }) {
  return (
    <figcaption className="mt-6 text-sm">
      <span className="text-foreground">{name}</span>
      {role ? <span className="text-muted-foreground">, {role}</span> : null}
    </figcaption>
  );
}

export function Testimonials({ index, label, heading, items }: TestimonialsProps) {
  const [featured, ...rest] = items;
  return (
    <section className="bg-surface py-section">
      <Container>
        <SectionLabel index={index}>{label}</SectionLabel>
        <h2 className="mt-8 max-w-4xl text-h2">
          <SplitText text={heading} />
        </h2>
        {featured ? (
          <Reveal className="mt-16 max-w-5xl">
            <figure>
              <blockquote className="font-heading text-h2">{featured.quote}</blockquote>
              <Author name={featured.name} role={featured.role} />
            </figure>
          </Reveal>
        ) : null}
        {rest.length > 0 ? (
          <div className="mt-16 grid gap-6 md:grid-cols-3">
            {rest.map((item, position) => (
              <Reveal key={item.name} delay={position * 0.1}>
                <figure className="h-full rounded-card bg-background p-8">
                  <blockquote className="text-lead font-light">{item.quote}</blockquote>
                  <Author name={item.name} role={item.role} />
                </figure>
              </Reveal>
            ))}
          </div>
        ) : null}
      </Container>
    </section>
  );
}
