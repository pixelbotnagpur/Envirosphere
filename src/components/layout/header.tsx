"use client";

import { Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/utils";

export interface NavItem {
  label: string;
  href: string;
}

export interface HeaderProps {
  name: string;
  logo: { src: string; width: number; height: number };
  labels: { openMenu: string; closeMenu: string; mainNav: string; mobileNav: string };
  nav: NavItem[];
  cta?: NavItem;
  transparentAtTop?: boolean;
}

export function Header({ name, logo, labels, nav, cta, transparentAtTop }: HeaderProps) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);

  const isDarkHero = (transparentAtTop ?? true) && !scrolled && !open;

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      toggleRef.current?.focus();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <header className="fixed top-0 right-0 left-0 z-(--z-header) w-full transition-colors duration-base">
      {/* Sliding background container that slides down on scroll */}
      <div
        aria-hidden="true"
        className={cn(
          "absolute inset-0 -z-10 border-b border-border bg-background/90 shadow-card backdrop-blur-md transition-all duration-(--duration-base) ease-out-expo",
          isDarkHero ? "-translate-y-full opacity-0" : "translate-y-0 opacity-100",
        )}
      />

      <Container className="flex h-header items-center justify-between gap-6">
        <Link href="/" className="flex items-center gap-3" onClick={() => setOpen(false)}>
          <span
            className={cn(
              "inline-flex items-center justify-center rounded-full transition-all duration-base",
              isDarkHero ? "ring-1 ring-primary-foreground/25" : "ring-0",
            )}
          >
            <Image src={logo.src} alt="" width={logo.width} height={logo.height} priority />
          </span>
          <span
            className={cn(
              "font-heading text-h4 transition-colors duration-base",
              isDarkHero ? "text-primary-foreground" : "text-foreground",
            )}
          >
            {name}
          </span>
        </Link>

        <nav aria-label={labels.mainNav} className="hidden items-center gap-8 lg:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "text-sm underline-offset-8 transition-colors duration-base hover:underline",
                isDarkHero
                  ? "text-primary-foreground/80 hover:text-primary-foreground"
                  : "text-foreground/80 hover:text-foreground",
              )}
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
            ref={toggleRef}
            type="button"
            className={cn(
              "inline-flex size-11 items-center justify-center rounded-pill border transition-colors duration-base lg:hidden",
              isDarkHero
                ? "border-primary-foreground/30 text-primary-foreground"
                : "border-border text-foreground",
            )}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? labels.closeMenu : labels.openMenu}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </button>
        </div>
      </Container>

      <nav
        id="mobile-nav"
        aria-label={labels.mobileNav}
        hidden={!open}
        className="border-t border-border bg-background text-foreground lg:hidden"
      >
        {/* data-lenis-prevent lets the panel scroll natively under Lenis; the cap is the viewport minus the header bar. */}
        <Container
          data-lenis-prevent
          className="flex max-h-[calc(100dvh-var(--spacing-header))] flex-col gap-1 overflow-y-auto py-6"
        >
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="py-3 font-heading text-h3 text-foreground"
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
