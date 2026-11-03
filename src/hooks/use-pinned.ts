import { useSyncExternalStore } from "react";

// 64rem is Tailwind's lg breakpoint; below 44rem tall the pinned layouts would be clipped, so they stack instead.
const QUERY = "(min-width: 64rem) and (min-height: 44rem) and (prefers-reduced-motion: no-preference)";

function subscribe(onChange: () => void) {
  const media = window.matchMedia(QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

/** True when scroll-pinned layouts should run. False on the server so the stacked layout is the baseline. */
export function usePinned(): boolean {
  return useSyncExternalStore(subscribe, () => window.matchMedia(QUERY).matches, () => false);
}
