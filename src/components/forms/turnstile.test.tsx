import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Turnstile } from "./turnstile";

type Options = {
  sitekey: string;
  callback: (t: string) => void;
  "error-callback": () => void;
  "expired-callback": () => void;
};

describe("Turnstile", () => {
  let options: Options | undefined;
  const api = {
    render: vi.fn((_el: HTMLElement, o: Options) => {
      options = o;
      return "w1";
    }),
    reset: vi.fn(),
    remove: vi.fn(),
  };

  beforeEach(() => {
    options = undefined;
    api.render.mockClear();
    api.reset.mockClear();
    api.remove.mockClear();
    window.turnstile = api;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    delete window.turnstile;
  });

  it("renders nothing and never loads the script when no site key is set", () => {
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "");
    const { container } = render(<Turnstile onToken={() => undefined} />);
    expect(container).toBeEmptyDOMElement();
    expect(api.render).not.toHaveBeenCalled();
    expect(document.querySelector('script[src*="challenges.cloudflare.com"]')).toBeNull();
  });

  it("renders the widget with the site key and reports the token", async () => {
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "site-key-123");
    const onToken = vi.fn();
    render(<Turnstile onToken={onToken} />);
    await vi.waitFor(() => expect(api.render).toHaveBeenCalledTimes(1));
    expect(options?.sitekey).toBe("site-key-123");
    options?.callback("tok-1");
    expect(onToken).toHaveBeenLastCalledWith("tok-1");
  });

  it("clears the token on error without resetting (Turnstile retries itself) and resets on expiry", async () => {
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "site-key-123");
    const onToken = vi.fn();
    render(<Turnstile onToken={onToken} />);
    await vi.waitFor(() => expect(api.render).toHaveBeenCalled());
    options?.["error-callback"]();
    expect(onToken).toHaveBeenLastCalledWith(null);
    expect(api.reset).not.toHaveBeenCalled();
    options?.["expired-callback"]();
    expect(onToken).toHaveBeenLastCalledWith(null);
    expect(api.reset).toHaveBeenCalledTimes(1);
    expect(api.reset).toHaveBeenCalledWith("w1");
  });

  it("loads the Cloudflare script only once for several widgets", async () => {
    delete window.turnstile;
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "site-key-123");
    const { loadTurnstile } = await import("./turnstile");
    void loadTurnstile().catch(() => undefined);
    void loadTurnstile().catch(() => undefined);
    expect(document.querySelectorAll('script[src^="https://challenges.cloudflare.com/turnstile/v0/api.js"]')).toHaveLength(1);
  });
});
