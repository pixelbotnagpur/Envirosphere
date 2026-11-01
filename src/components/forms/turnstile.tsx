"use client";

import * as React from "react";

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

interface TurnstileApi {
  render: (
    el: HTMLElement,
    options: {
      sitekey: string;
      callback: (token: string) => void;
      "error-callback": () => void;
      "expired-callback": () => void;
    },
  ) => string;
  reset: (widgetId?: string) => void;
  remove: (widgetId?: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let scriptPromise: Promise<TurnstileApi> | null = null;

/** Loads the Cloudflare script once per page, no matter how many widgets mount. */
export function loadTurnstile(): Promise<TurnstileApi> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise<TurnstileApi>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () =>
      window.turnstile ? resolve(window.turnstile) : reject(new Error("turnstile missing"));
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error("turnstile failed to load"));
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

/** The site key is baked in at build time; the widget is off when it is not set. */
export const getTurnstileSiteKey = (): string => (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "").trim();
export const isTurnstileEnabled = (): boolean => getTurnstileSiteKey() !== "";

export interface TurnstileProps {
  /** Receives the one-time token, or null when it expires or the challenge errors. */
  onToken: (token: string | null) => void;
  /** Change this number to throw away the current token and show a fresh challenge. */
  resetKey?: number;
  className?: string;
}

export function Turnstile({ onToken, resetKey = 0, className }: TurnstileProps) {
  const siteKey = getTurnstileSiteKey();
  const containerRef = React.useRef<HTMLDivElement>(null);
  const onTokenRef = React.useRef(onToken);

  React.useEffect(() => {
    onTokenRef.current = onToken;
  }, [onToken]);

  React.useEffect(() => {
    if (!siteKey || !containerRef.current) return;
    const container = containerRef.current;
    let widgetId: string | undefined;
    let cancelled = false;

    loadTurnstile()
      .then((api) => {
        if (cancelled) return;
        widgetId = api.render(container, {
          sitekey: siteKey,
          callback: (token) => onTokenRef.current(token),
          // Turnstile retries a failed challenge by itself; resetting here would fight it.
          "error-callback": () => onTokenRef.current(null),
          "expired-callback": () => {
            onTokenRef.current(null);
            if (widgetId) api.reset(widgetId);
          },
        });
      })
      .catch(() => onTokenRef.current(null));

    return () => {
      cancelled = true;
      if (widgetId && window.turnstile) window.turnstile.remove(widgetId);
      onTokenRef.current(null);
    };
  }, [siteKey, resetKey]);

  if (!siteKey) return null;
  return <div ref={containerRef} className={className} />;
}
