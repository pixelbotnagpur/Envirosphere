import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { motionValue } from "motion/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Header } from "./header";

const scrollY = motionValue(0);
let reduced = false;
vi.mock("motion/react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("motion/react")>()),
  useScroll: () => ({ scrollY }),
  useReducedMotion: () => reduced,
}));

// next/link normalizes hrefs using the build-time trailingSlash flag, which is
// unset under jsdom and strips the trailing slash the tests assert on.
vi.mock("next/link", () => ({
  default: ({ href, ...p }: { href: string } & Record<string, unknown>) => <a href={href} {...p} />,
}));

const props = {
  name: "Envirosphere",
  logo: { src: "/media/brand/logo.svg", width: 40, height: 40 },
  labels: { openMenu: "Open menu", closeMenu: "Close menu", mainNav: "Main", mobileNav: "Mobile" },
  nav: [
    { label: "Home", href: "/" },
    { label: "Services", href: "/services/" },
  ],
  cta: { label: "Get in touch", href: "/contact/" },
};

describe("Header", () => {
  it("renders nav links and the call to action", () => {
    render(<Header {...props} />);
    expect(screen.getAllByRole("link", { name: "Services" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: "Get in touch" }).length).toBeGreaterThan(0);
  });

  it("toggles the mobile menu with correct aria state", async () => {
    render(<Header {...props} />);
    const toggle = screen.getByRole("button", { name: "Open menu" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(toggle).toHaveAttribute("aria-controls", "mobile-nav");
    await userEvent.click(toggle);
    expect(screen.getByRole("button", { name: "Close menu" })).toHaveAttribute("aria-expanded", "true");
  });

  it("closes the mobile menu after choosing a link", async () => {
    render(<Header {...props} />);
    await userEvent.click(screen.getByRole("button", { name: "Open menu" }));
    const mobileNav = document.getElementById("mobile-nav") as HTMLElement;
    await userEvent.click(mobileNav.querySelector("a[href='/services/']") as HTMLElement);
    expect(screen.getByRole("button", { name: "Open menu" })).toBeInTheDocument();
    expect(mobileNav).toHaveAttribute("data-open", "false");
    // The panel leaves the page once its closing animation has played.
    await waitFor(() => expect(mobileNav).toHaveAttribute("hidden"), { timeout: 2000 });
  });

  it("hides #mobile-nav until the menu is opened", async () => {
    render(<Header {...props} />);
    const mobileNav = document.getElementById("mobile-nav") as HTMLElement;
    expect(mobileNav).toHaveAttribute("hidden");
    await userEvent.click(screen.getByRole("button", { name: "Open menu" }));
    expect(mobileNav).not.toHaveAttribute("hidden");
    // The reveal animation starts a moment after the panel appears.
    await waitFor(() => expect(mobileNav).toHaveAttribute("data-open", "true"));
  });

  it("makes the mobile menu scrollable and opts it out of Lenis smooth scroll", () => {
    render(<Header {...props} />);
    const mobileNav = document.getElementById("mobile-nav") as HTMLElement;
    const panel = mobileNav.firstElementChild as HTMLElement;
    expect(panel).toHaveAttribute("data-lenis-prevent");
    expect(panel).toHaveClass("overflow-y-auto");
  });

  it("closes the mobile menu with Escape and returns focus to the toggle", async () => {
    render(<Header {...props} />);
    const toggle = screen.getByRole("button", { name: "Open menu" });
    await userEvent.click(toggle);
    await userEvent.keyboard("{Escape}");
    expect(screen.getByRole("button", { name: "Open menu" })).toHaveFocus();
    expect(document.getElementById("mobile-nav")).toHaveAttribute("data-open", "false");
    await waitFor(() => expect(document.getElementById("mobile-nav")).toHaveAttribute("hidden"), { timeout: 2000 });
  });

  it("marks the logo image decorative because the brand name is visible text", () => {
    const { container } = render(<Header {...props} />);
    expect(container.querySelector("img")).toHaveAttribute("alt", "");
  });

  describe("hide on scroll down, show on scroll up", () => {
    beforeEach(() => {
      reduced = false;
      scrollY.set(0);
    });
    const header = () => document.querySelector("header") as HTMLElement;

    it("is visible at the top", () => {
      render(<Header {...props} />);
      expect(header()).toHaveAttribute("data-hidden", "false");
      expect(header()).toHaveClass("translate-y-0");
    });

    it("slides up on scroll down and returns on scroll up", () => {
      render(<Header {...props} />);
      act(() => scrollY.set(600));
      expect(header()).toHaveAttribute("data-hidden", "true");
      expect(header()).toHaveClass("-translate-y-full");
      act(() => scrollY.set(400));
      expect(header()).toHaveAttribute("data-hidden", "false");
    });

    it("stays visible while the mobile menu is open", async () => {
      render(<Header {...props} />);
      act(() => scrollY.set(600));
      expect(header()).toHaveAttribute("data-hidden", "true");
      await userEvent.click(screen.getByRole("button", { name: "Open menu" }));
      expect(header()).toHaveAttribute("data-hidden", "false");
    });

    it("keeps itself in view when focus is inside, via focus-within", () => {
      render(<Header {...props} />);
      expect(header()).toHaveClass("focus-within:translate-y-0");
    });

    it("never hides under reduced motion", () => {
      reduced = true;
      render(<Header {...props} />);
      act(() => scrollY.set(600));
      expect(header()).toHaveAttribute("data-hidden", "false");
    });
  });
});
