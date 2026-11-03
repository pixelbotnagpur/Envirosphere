import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import Link from "next/link";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PageTransition } from "./page-transition";

const push = vi.fn();
let pathname = "/";
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  usePathname: () => pathname,
}));

vi.mock("next/link", () => ({
  default: ({ href, ...p }: { href: string } & Record<string, unknown>) => <a href={href} {...p} />,
}));

vi.mock("lenis/react", () => ({ useLenis: () => undefined }));

// Resolve animations immediately; the real easing is covered by Playwright.
vi.mock("motion/react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("motion/react")>()),
  animate: () => Object.assign(Promise.resolve(), { stop: () => {} }),
}));

let reduced = false;
beforeEach(() => {
  push.mockReset();
  pathname = "/";
  reduced = false;
  window.matchMedia = ((query: string) => ({
    matches: reduced && query.includes("reduce"),
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    onchange: null,
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
});

function setup() {
  const view = render(
    <>
      <PageTransition />
      <Link href="/services/">Services</Link>
      <a href="https://other.test/">External</a>
      <main id="main" tabIndex={-1} />
    </>,
  );
  return view;
}

const panel = () => document.querySelector("[data-page-transition]");

describe("PageTransition", () => {
  it("renders no panel initially and exposes an empty polite live region", () => {
    setup();
    expect(panel()).toBeNull();
    const region = document.querySelector("[data-route-announcer]") as HTMLElement;
    expect(region).toHaveAttribute("aria-live", "polite");
    expect(region).toHaveTextContent("");
  });

  it("does not intercept clicks under reduced motion", () => {
    reduced = true;
    setup();
    const notPrevented = fireEvent.click(screen.getByText("Services"));
    expect(notPrevented).toBe(true);
    expect(panel()).toBeNull();
    expect(push).not.toHaveBeenCalled();
  });

  it("leaves external links alone", () => {
    setup();
    expect(fireEvent.click(screen.getByText("External"))).toBe(true);
    expect(panel()).toBeNull();
  });

  it("covers, navigates, then reveals and lands focus on main", async () => {
    document.title = "Services page";
    const view = setup();
    const notPrevented = fireEvent.click(screen.getByText("Services"));
    expect(notPrevented).toBe(false);

    const el = panel() as HTMLElement;
    expect(el).toHaveAttribute("aria-hidden", "true");
    expect(el.textContent).toBe("");
    const art = el.querySelector("[data-transition-art]") as HTMLElement;
    expect(art).toHaveAttribute("aria-hidden", "true");
    expect(art.className).toContain("pointer-events-none");
    // The graphic is centered on the screen: a sprout (stem and two leaves) inside a ring.
    expect(art.className).toContain("grid");
    expect(art.className).toContain("place-items-center");
    expect(art.className).toContain("inset-0");
    expect(el.querySelector("[data-transition-sprout]")).not.toBeNull();
    expect(el.querySelectorAll("[data-transition-leaf]")).toHaveLength(2);
    expect(el.className).toContain("z-(--z-transition)");
    expect(el.className).toContain("bg-primary");

    await waitFor(() => expect(push).toHaveBeenCalledWith("/services/"));
    expect(panel()).toHaveAttribute("data-page-transition", "wait");

    pathname = "/services/";
    await act(async () => {
      view.rerender(
        <>
          <PageTransition />
          <Link href="/services/">Services</Link>
          <a href="https://other.test/">External</a>
          <main id="main" tabIndex={-1} />
        </>,
      );
    });

    // The curtain holds until the sprout has finished drawing (about 0.6s from the click).
    await waitFor(() => expect(panel()).toBeNull(), { timeout: 3000 });
    expect(document.getElementById("main")).toHaveFocus();
    expect(document.querySelector("[data-route-announcer]") as HTMLElement).toHaveTextContent("Services page");
    expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
  });

  it("keeps the curtain up for the sprout's drawing even when the route is ready at once", async () => {
    const view = setup();
    fireEvent.click(screen.getByText("Services"));
    await waitFor(() => expect(push).toHaveBeenCalled());
    pathname = "/services/";
    await act(async () => {
      view.rerender(
        <>
          <PageTransition />
          <Link href="/services/">Services</Link>
          <main id="main" tabIndex={-1} />
        </>,
      );
      await new Promise((r) => setTimeout(r, 100));
    });
    expect(panel()).toHaveAttribute("data-page-transition", "wait");
    await waitFor(() => expect(panel()).toBeNull(), { timeout: 3000 });
  });

  it("cancels the pending push when Back is pressed during the cover phase", async () => {
    setup();
    fireEvent.click(screen.getByText("Services"));
    expect(panel()).toHaveAttribute("data-page-transition", "cover");
    act(() => {
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(push).not.toHaveBeenCalled();
    expect(panel()).toBeNull();
  });

  it("ignores a second click while a transition is running", async () => {
    setup();
    fireEvent.click(screen.getByText("Services"));
    expect(fireEvent.click(screen.getByText("Services"))).toBe(false);
    await waitFor(() => expect(push).toHaveBeenCalledTimes(1));
  });

  it("removes the panel if navigation never completes (safety timeout)", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    try {
      setup();
      fireEvent.click(screen.getByText("Services"));
      await act(async () => {
        await Promise.resolve();
      });
      expect(push).toHaveBeenCalled();
      expect(panel()).not.toBeNull();
      await act(async () => {
        vi.advanceTimersByTime(2600);
      });
      expect(panel()).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });
});
