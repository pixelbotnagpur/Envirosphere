import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { SectionLabel } from "@/components/ui/section-label";

export default function NotFound() {
  return (
    <section className="py-section">
      <Container>
        <SectionLabel index="404">page not found</SectionLabel>
        <h1 className="mt-6 text-h1">This page has moved or does not exist.</h1>
        <Button asChild className="mt-10">
          <Link href="/">Back to home</Link>
        </Button>
      </Container>
    </section>
  );
}
