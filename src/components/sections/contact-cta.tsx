import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";
import { SplitText } from "@/components/motion/split-text";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { SectionLabel } from "@/components/ui/section-label";
import { mailtoHref, telHref } from "@/lib/links";
import type { Cta } from "./types";

export interface ContactCtaProps {
  index?: string;
  label: string;
  heading: string;
  body: string;
  primaryCta: Cta;
  phone: string;
  email: string;
  phoneLabel: string;
  emailLabel: string;
}

export function ContactCta({
  index,
  label,
  heading,
  body,
  primaryCta,
  phone,
  email,
  phoneLabel,
  emailLabel,
}: ContactCtaProps) {
  return (
    <section className="bg-secondary py-section text-secondary-foreground">
      <Container>
        <SectionLabel index={index} className="text-secondary-foreground">
          {label}
        </SectionLabel>
        <h2 className="mt-8 max-w-6xl text-h1">
          <SplitText text={heading} />
        </h2>
        <Reveal className="mt-12 flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
          <p className="max-w-2xl text-lead font-light">{body}</p>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <Button asChild size="lg">
              <Link href={primaryCta.href}>{primaryCta.label}</Link>
            </Button>
            <div className="flex flex-col gap-1 text-sm">
              <a href={telHref(phone)} className="underline-offset-4 hover:underline">
                {phoneLabel}: {phone}
              </a>
              <a href={mailtoHref(email)} className="underline-offset-4 hover:underline">
                {emailLabel}: {email}
              </a>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
