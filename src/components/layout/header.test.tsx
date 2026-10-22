import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Header } from "./header";

// next/link normalizes hrefs using the build-time trailingSlash flag, which is
// unset under jsdom and strips the trailing slash the tests assert on.
vi.mock("next/link", () => ({
  default: ({ href, ...p }: { href: string } & Record<string, unknown>) => <a href={href} {...p} />,
}));

const props = {
  name: "Envirosphere",
  logo: { src: "/media/brand/logo.svg", alt: "Envirosphere logo", width: 40, height: 40 },
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
    expect(mobileNav).toHaveAttribute("hidden");
  });

  it("hides #mobile-nav until the menu is opened", async () => {
    render(<Header {...props} />);
    const mobileNav = document.getElementById("mobile-nav") as HTMLElement;
    expect(mobileNav).toHaveAttribute("hidden");
    await userEvent.click(screen.getByRole("button", { name: "Open menu" }));
    expect(mobileNav).not.toHaveAttribute("hidden");
  });

  it("makes the mobile menu scrollable and opts it out of Lenis smooth scroll", () => {
    render(<Header {...props} />);
    const mobileNav = document.getElementById("mobile-nav") as HTMLElement;
    const panel = mobileNav.firstElementChild as HTMLElement;
    expect(panel).toHaveAttribute("data-lenis-prevent");
    expect(panel).toHaveClass("overflow-y-auto");
  });
});
