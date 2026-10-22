"use client";

import { Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

export interface NavItem {
  label: string;
  href: string;
}

export interface HeaderProps {
  name: string;
  logo: { src: string; alt: string; width: number; height: number };
  nav: NavItem[];
  cta?: NavItem;
}

export function Header({ name, logo, nav, cta }: HeaderProps) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-(--z-header) border-b border-border bg-background/85 backdrop-blur">
      <Container className="flex h-header items-center justify-between gap-6">
        <Link href="/" className="flex items-center gap-3" onClick={() => setOpen(false)}>
          <Image src={logo.src} alt={logo.alt} width={logo.width} height={logo.height} priority />
          <span className="font-heading text-h4">{name}</span>
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-8 lg:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm underline-offset-8 transition-colors hover:underline"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {cta ? (
            <Button asChild variant="accent" size="sm" className="hidden lg:inline-flex">
              <Link href={cta.href}>{cta.label}</Link>
            </Button>
          ) : null}
          <button
            type="button"
            className="inline-flex size-11 items-center justify-center rounded-pill border border-border lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </button>
        </div>
      </Container>

      <nav id="mobile-nav" aria-label="Mobile" hidden={!open} className="border-t border-border lg:hidden">
        {/* data-lenis-prevent lets the panel scroll natively under Lenis; the cap is the viewport minus the header bar. */}
        <Container
          data-lenis-prevent
          className="flex max-h-[calc(100dvh-var(--spacing-header))] flex-col gap-1 overflow-y-auto py-6"
        >
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="py-3 font-heading text-h3"
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          {cta ? (
            <Button asChild variant="accent" className="mt-4 self-start">
              <Link href={cta.href} onClick={() => setOpen(false)}>
                {cta.label}
              </Link>
            </Button>
          ) : null}
        </Container>
      </nav>
    </header>
  );
}
