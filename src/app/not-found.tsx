import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { SectionLabel } from "@/components/ui/section-label";
import { loadSite } from "@/lib/content";

export default function NotFound() {
  const { ui } = loadSite();
  return (
    <section className="hero-atmosphere relative flex min-h-[70vh] flex-col justify-center w-full bg-primary pt-28 pb-16 text-primary-foreground sm:pt-36 sm:pb-20">
      <Container>
        <SectionLabel tone="inverse" index="404">{ui.notFound.label}</SectionLabel>
        <h1 className="mt-6 text-h1 text-primary-foreground">{ui.notFound.heading}</h1>
        <Button asChild variant="accent" size="lg" className="mt-10">
          <Link href="/">{ui.notFound.cta}</Link>
        </Button>
      </Container>
    </section>
  );
}
