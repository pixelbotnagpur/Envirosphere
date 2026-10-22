"use client";

import "lenis/dist/lenis.css";
import { ReactLenis } from "lenis/react";
import { MotionConfig, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { lenisOptions } from "@/lib/motion";

/** The only Lenis instance in the app. Reduced-motion users get native scrolling and no transform animation. */
export function LenisProvider({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();
  return (
    <MotionConfig reducedMotion="user">
      {reduced ? (
        children
      ) : (
        <ReactLenis root options={lenisOptions}>
          {children}
        </ReactLenis>
      )}
    </MotionConfig>
  );
}
