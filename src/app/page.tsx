import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { SectionLabel } from "@/components/ui/section-label";
import { loadHome } from "@/lib/content";

export default function HomePage() {
  const { hero } = loadHome();
  return (
    <section className="bg-primary py-section text-primary-foreground">
      <Container>
        <Reveal>
          <SectionLabel className="text-secondary">{hero.eyebrow}</SectionLabel>
        </Reveal>
        <Reveal delay={0.1}>
          <h1 className="mt-8 max-w-5xl text-display break-words">{hero.title}</h1>
        </Reveal>
        <Reveal delay={0.2}>
          <p className="mt-10 max-w-2xl text-lead font-light text-primary-foreground/80">{hero.subtitle}</p>
        </Reveal>
        <Reveal delay={0.3}>
          <Button asChild variant="accent" size="lg" className="mt-12">
            <Link href={hero.primaryCta.href}>{hero.primaryCta.label}</Link>
          </Button>
        </Reveal>
      </Container>
    </section>
  );
}
