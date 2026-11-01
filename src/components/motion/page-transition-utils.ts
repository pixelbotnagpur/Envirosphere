/** The slice of a MouseEvent that decides whether a click is a plain, same-tab navigation. */
export interface ClickLike {
  button: number;
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  defaultPrevented: boolean;
}

const stripTrailingSlash = (pathname: string) => (pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname);

/**
 * True when a click on `anchor` is an internal page navigation that the curtain transition should take over.
 * Everything else (new tab, modifier or middle click, external, download, hash-only, same page, opted out,
 * inside a dialog) is left to the browser / Next.js untouched.
 */
export function shouldIntercept(
  event: ClickLike,
  anchor: HTMLAnchorElement,
  currentUrl: string,
): boolean {
  if (event.defaultPrevented) return false;
  if (event.button !== 0) return false;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;

  const target = anchor.getAttribute("target");
  if (target && target !== "_self") return false;
  if (anchor.hasAttribute("download")) return false;
  if (anchor.hasAttribute("data-no-transition")) return false;
  if (anchor.closest('[role="dialog"]')) return false;

  const href = anchor.getAttribute("href");
  if (!href || !href.startsWith("/") || href.startsWith("//")) return false;

  let next: URL;
  let current: URL;
  try {
    current = new URL(currentUrl);
    next = new URL(href, current);
  } catch {
    return false;
  }
  if (next.origin !== current.origin) return false;
  // Same page (including query or hash changes, and "/about" vs "/about/") and cross-page hash links
  // navigate normally.
  if (stripTrailingSlash(next.pathname) === stripTrailingSlash(current.pathname)) return false;
  if (next.hash) return false;
  return true;
}

/** Keep the reveal this far ahead of the safety timeout so the two never race. */
export const SAFETY_MARGIN_MS = 250;

/**
 * How much longer the curtain must stay up once the new route is ready, so the leaf finishes its trip.
 * `elapsedMs` is the time since the cover started, `safetyLeftMs` what remains on the safety timeout.
 * Zero when the animation is already done; never long enough to run into the safety timeout.
 */
export function revealWaitMs(elapsedMs: number, travelMs: number, safetyLeftMs: number): number {
  const remaining = travelMs - elapsedMs;
  const ceiling = Math.max(0, safetyLeftMs - SAFETY_MARGIN_MS);
  return Math.min(Math.max(0, remaining), ceiling);
}
