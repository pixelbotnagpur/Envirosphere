"use client";

import { useReducedMotion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { useScrollHidden } from "@/hooks/use-scroll-direction";
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

  const reduced = useReducedMotion();
  // Never hide while the menu is open or when motion is reduced; focus-within (CSS) also keeps it in view.
  const hidden = useScrollHidden(!open && !reduced);

  // `shown` keeps the mobile panel in the page while it closes; `panelOpen` runs a frame after it appears,
  // so the opening animation has a closed state to start from.
  const [shown, setShown] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const openMenu = () => {
    setOpen(true);
    setShown(true);
  };
  const closeMenu = () => {
    setOpen(false);
    setPanelOpen(false);
  };
  useEffect(() => {
    if (open) {
      let second = 0;
      const first = window.requestAnimationFrame(() => {
        second = window.requestAnimationFrame(() => setPanelOpen(true));
      });
      return () => {
        window.cancelAnimationFrame(first);
        window.cancelAnimationFrame(second);
      };
    }
    const timer = window.setTimeout(() => setShown(false), reduced ? 0 : 950);
    return () => window.clearTimeout(timer);
  }, [open, reduced]);

  const isDarkHero = (transparentAtTop ?? true) && !scrolled;
  // Light text sits on the dark hero and on the open Forest menu panel.
  const lightText = isDarkHero || open;

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
      closeMenu();
      toggleRef.current?.focus();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <header
      data-hidden={hidden}
      className={cn(
        "group fixed top-0 right-0 left-0 z-(--z-header) w-full transition-transform duration-(--duration-base) ease-out-expo focus-within:translate-y-0",
        hidden ? "-translate-y-full" : "translate-y-0",
      )}
    >
      {/* Sliding background container that slides down on scroll */}
      <div
        aria-hidden="true"
        className={cn(
          "absolute inset-0 -z-10 border-b border-border bg-background/90 shadow-card backdrop-blur-md transition-all duration-(--duration-base) ease-out-expo",
          lightText || hidden ? "-translate-y-full opacity-0" : "translate-y-0 opacity-100",
          // Keep the card shadow from peeking below a hidden header, but show the bar when focus is inside.
          hidden && "group-focus-within:translate-y-0 group-focus-within:opacity-100",
        )}
      />

      <Container className="flex h-header items-center justify-between gap-6">
        <Link href="/" className="flex items-center gap-3" onClick={closeMenu}>
          <span
            className={cn(
              "inline-flex items-center justify-center rounded-pill transition-all duration-(--duration-base)",
              lightText ? "ring-1 ring-primary-foreground/25" : "ring-0",
            )}
          >
            <Image src={logo.src} alt="" width={logo.width} height={logo.height} priority />
          </span>
          <span
            className={cn(
              "font-heading text-h4 transition-colors duration-(--duration-base)",
              lightText ? "text-primary-foreground" : "text-foreground",
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
                "text-sm underline-offset-8 transition-colors duration-(--duration-base) hover:underline",
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
            data-open={open}
            className={cn(
              "group/toggle relative inline-flex size-11 items-center justify-center rounded-pill border transition-colors duration-(--duration-base) lg:hidden",
              lightText ? "border-primary-foreground/30 text-primary-foreground" : "border-border text-foreground",
            )}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? labels.closeMenu : labels.openMenu}
            onClick={open ? closeMenu : openMenu}
          >
            {/* Two lines that cross into an X: transform only. */}
            <span
              aria-hidden="true"
              className="absolute h-px w-5 -translate-y-1 bg-current transition-transform duration-(--duration-base) ease-out-expo group-data-[open=true]/toggle:translate-y-0 group-data-[open=true]/toggle:rotate-45"
            />
            <span
              aria-hidden="true"
              className="absolute h-px w-5 translate-y-1 bg-current transition-transform duration-(--duration-base) ease-out-expo group-data-[open=true]/toggle:translate-y-0 group-data-[open=true]/toggle:-rotate-45"
            />
          </button>
        </div>
      </Container>

      <nav
        id="mobile-nav"
        aria-label={labels.mobileNav}
        hidden={!shown}
        data-open={panelOpen}
        className="menu-panel absolute top-0 left-0 -z-10 h-dvh w-full bg-primary text-primary-foreground lg:hidden"
      >
        {/* data-lenis-prevent lets the panel scroll natively under Lenis; it sits below the header bar. */}
        <Container
          data-lenis-prevent
          className="flex h-full flex-col gap-1 overflow-y-auto overscroll-contain pt-[calc(var(--spacing-header)+1.5rem)] pb-10"
        >
          {nav.map((item, position) => (
            <Link
              key={item.href}
              href={item.href}
              style={{ "--i": position } as React.CSSProperties}
              className="menu-item group/link flex items-baseline gap-4 border-b border-primary-foreground/15 py-4 font-heading text-h2"
              onClick={closeMenu}
            >
              <span aria-hidden="true" className="w-8 text-label tabular-nums text-primary-foreground/60">
                {String(position + 1).padStart(2, "0")}
              </span>
              <span className="transition-transform duration-(--duration-base) ease-out-expo group-hover/link:translate-x-2">
                {item.label}
              </span>
            </Link>
          ))}
          {cta ? (
            <Button
              asChild
              variant="accent"
              className="menu-item mt-8 self-start"
              style={{ "--i": nav.length } as React.CSSProperties}
            >
              <Link href={cta.href} onClick={closeMenu}>
                {cta.label}
              </Link>
            </Button>
          ) : null}
        </Container>
      </nav>
    </header>
  );
}
