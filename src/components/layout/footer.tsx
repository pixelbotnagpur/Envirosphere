import Link from "next/link";
import { Container } from "@/components/ui/container";
import { SectionLabel } from "@/components/ui/section-label";
import { mailtoHref, telHref } from "@/lib/links";
import type { NavItem } from "./header";

export interface FooterProps {
  name: string;
  tagline: string;
  contact: { email: string; phones: string[]; address: string };
  offices: { name: string; city: string }[];
  nav: NavItem[];
  social: { label: string; href: string }[];
  labels: { contact: string; explore: string };
}

export function Footer({ name, tagline, contact, offices, nav, social, labels }: FooterProps) {
  return (
    <footer className="bg-primary py-section text-primary-foreground">
      <Container className="grid gap-16 lg:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <p className="font-heading text-h2">{name}</p>
          <p className="mt-4 max-w-md text-lead text-primary-foreground/80">{tagline}</p>
        </div>

        <div className="flex flex-col gap-3">
          <SectionLabel tone="inverse">{labels.contact}</SectionLabel>
          <a className="underline-offset-4 hover:underline" href={mailtoHref(contact.email)}>
            {contact.email}
          </a>
          {contact.phones.map((phone) => (
            <a key={phone} className="underline-offset-4 hover:underline" href={telHref(phone)}>
              {phone}
            </a>
          ))}
          <address className="mt-2 not-italic text-primary-foreground/80">{contact.address}</address>
          <ul className="mt-2 flex flex-col gap-1 text-sm text-primary-foreground/80">
            {offices.map((office) => (
              <li key={`${office.name}-${office.city}`}>
                {office.name}, {office.city}
              </li>
            ))}
          </ul>
        </div>

        <nav aria-label={labels.explore} className="flex flex-col gap-3">
          <SectionLabel tone="inverse">{labels.explore}</SectionLabel>
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="underline-offset-4 hover:underline">
              {item.label}
            </Link>
          ))}
          {social.map((item) => (
            <a
              key={item.href}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="underline-offset-4 hover:underline"
            >
              {item.label}
            </a>
          ))}
        </nav>
      </Container>

      <Container className="mt-16 border-t border-primary-foreground/20 pt-6 text-sm text-primary-foreground/70">
        <p>
          © {new Date().getFullYear()} {name}
        </p>
      </Container>
    </footer>
  );
}
