"use client";

import { useLenis } from "lenis/react";
import { animate } from "motion/react";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { duration, ease, TRANSITION_SAFETY_MS } from "@/lib/motion";
import { revealWaitMs, shouldIntercept } from "./page-transition-utils";
import { RouteSprout } from "./route-sprout";

type Phase = "idle" | "cover" | "wait" | "reveal";

const CLIP_HIDDEN_BELOW = "inset(100% 0% 0% 0%)";
const CLIP_FULL = "inset(0% 0% 0% 0%)";
const CLIP_HIDDEN_ABOVE = "inset(0% 0% 100% 0%)";

const reducedQuery = "(prefers-reduced-motion: reduce)";

/**
 * Global route curtain. One instance in the root layout; internal link clicks are intercepted by
 * delegation, so no link needs to know about it. The panel is only ever rendered on the client after
 * a click, so the static HTML and first paint are untouched.
 */
export function PageTransition() {
  const router = useRouter();
  const pathname = usePathname();
  const lenis = useLenis();

  const [phase, setPhaseState] = useState<Phase>("idle");
  const [announcement, setAnnouncement] = useState("");
  const phaseRef = useRef<Phase>("idle");
  const hrefRef = useRef("");
  const lastPathRef = useRef(pathname);
  const panelRef = useRef<HTMLDivElement>(null);
  const safetyRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dwellRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startedAtRef = useRef(0);
  const safetyAtRef = useRef(0);
  const lenisRef = useRef(lenis);
  useEffect(() => {
    lenisRef.current = lenis;
  }, [lenis]);

  const setPhase = useCallback((next: Phase) => {
    phaseRef.current = next;
    setPhaseState(next);
  }, []);

  const clearSafety = useCallback(() => {
    if (safetyRef.current) clearTimeout(safetyRef.current);
    safetyRef.current = null;
    if (dwellRef.current) clearTimeout(dwellRef.current);
    dwellRef.current = null;
  }, []);

  const scrollToTop = useCallback(() => {
    if (lenisRef.current) lenisRef.current.scrollTo(0, { immediate: true, force: true });
    else window.scrollTo(0, 0);
  }, []);

  /** Moves focus to the new page and announces its title to assistive tech. */
  const landOnPage = useCallback(() => {
    const main = document.getElementById("main");
    if (main) main.focus({ preventScroll: true });
    setAnnouncement(document.title);
    // Next updates document.title just after the route commits; read it again once it has settled.
    window.setTimeout(() => setAnnouncement(document.title), 200);
  }, []);

  const finish = useCallback(() => {
    clearSafety();
    document.getElementById("main")?.classList.remove("page-enter");
    setPhase("idle");
  }, [clearSafety, setPhase]);

  // Intercept internal link clicks (capture phase, before Next's Link handler sees them).
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const anchor = (event.target as Element | null)?.closest?.("a");
      if (!anchor) return;
      if (window.matchMedia(reducedQuery).matches) return;
      if (!shouldIntercept(event, anchor, window.location.href)) return;
      event.preventDefault();
      if (phaseRef.current !== "idle") return;
      hrefRef.current = anchor.getAttribute("href") as string;
      startedAtRef.current = performance.now();
      setPhase("cover");
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [setPhase]);

  // Back/forward while the curtain is still closing: drop the pending navigation (the browser is
  // already moving) instead of pushing the old target after it.
  useEffect(() => {
    const onPopState = () => {
      if (phaseRef.current === "cover") finish();
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [finish]);

  // COVER: wipe the panel up over the page, then navigate.
  useEffect(() => {
    if (phase !== "cover" || !panelRef.current) return;
    let cancelled = false;
    const controls = animate(
      panelRef.current,
      { clipPath: [CLIP_HIDDEN_BELOW, CLIP_FULL] },
      { duration: duration.transition.cover, ease: ease.inOutQuart },
    );
    controls.then(() => {
      if (cancelled || phaseRef.current !== "cover") return;
      setPhase("wait");
      clearSafety();
      safetyAtRef.current = performance.now() + TRANSITION_SAFETY_MS;
      safetyRef.current = setTimeout(finish, TRANSITION_SAFETY_MS);
      router.push(hrefRef.current);
    });
    return () => {
      cancelled = true;
      controls.stop();
    };
  }, [phase, router, setPhase, clearSafety, finish]);

  // The new route committed: wait for it to paint, then reveal (or just land, for back/forward).
  useEffect(() => {
    if (pathname === lastPathRef.current) return;
    lastPathRef.current = pathname;
    let raf = 0;
    raf = requestAnimationFrame(() => {
      raf = requestAnimationFrame(() => {
        if (phaseRef.current === "wait") {
          // Hold the curtain until the sprout has finished drawing (zero when it already has).
          const now = performance.now();
          const wait = revealWaitMs(
            now - startedAtRef.current,
            duration.travel * 1000,
            safetyAtRef.current - now,
          );
          if (wait <= 0) setPhase("reveal");
          else {
            dwellRef.current = setTimeout(() => {
              dwellRef.current = null;
              if (phaseRef.current === "wait") setPhase("reveal");
            }, wait);
          }
        } else if (phaseRef.current === "idle") landOnPage();
      });
    });
    return () => cancelAnimationFrame(raf);
  }, [pathname, setPhase, landOnPage]);

  // REVEAL: lift the panel away while the new content rises in.
  useEffect(() => {
    if (phase !== "reveal" || !panelRef.current) return;
    let cancelled = false;
    scrollToTop();
    landOnPage();
    document.getElementById("main")?.classList.add("page-enter");
    const controls = animate(
      panelRef.current,
      { clipPath: [CLIP_FULL, CLIP_HIDDEN_ABOVE] },
      { duration: duration.transition.reveal, ease: ease.inOutQuart },
    );
    controls.then(() => {
      if (!cancelled) finish();
    });
    return () => {
      cancelled = true;
      controls.stop();
    };
  }, [phase, scrollToTop, landOnPage, finish]);

  useEffect(() => clearSafety, [clearSafety]);

  return (
    <>
      <div data-route-announcer aria-live="polite" className="sr-only">
        {announcement}
      </div>
      {phase === "idle" ? null : (
        <div
          ref={panelRef}
          aria-hidden="true"
          data-page-transition={phase}
          style={{ clipPath: CLIP_HIDDEN_BELOW }}
          className={
            "fixed inset-x-0 top-0 z-(--z-transition) h-lvh overflow-hidden bg-primary " +
            (phase === "reveal" ? "pointer-events-none" : "pointer-events-auto")
          }
        >
          <RouteSprout />
        </div>
      )}
    </>
  );
}
