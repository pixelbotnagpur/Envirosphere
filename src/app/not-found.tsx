import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { SectionLabel } from "@/components/ui/section-label";
import { loadSite } from "@/lib/content";

export default function NotFound() {
  const { ui } = loadSite();
  return (
    <section className="pt-[calc(var(--spacing-header)+var(--spacing-section))] pb-section">
      <Container>
        <SectionLabel index="404">{ui.notFound.label}</SectionLabel>
        <h1 className="mt-6 text-h1">{ui.notFound.heading}</h1>
        <Button asChild className="mt-10">
          <Link href="/">{ui.notFound.cta}</Link>
        </Button>
      </Container>
    </section>
  );
}
