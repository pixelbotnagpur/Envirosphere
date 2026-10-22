import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Footer } from "./footer";

// next/link normalizes hrefs using the build-time trailingSlash flag, which is
// unset under jsdom and strips the trailing slash the tests assert on.
vi.mock("next/link", () => ({
  default: ({ href, ...p }: { href: string } & Record<string, unknown>) => <a href={href} {...p} />,
}));

const props = {
  name: "Envirosphere Consultant & Engineers",
  tagline: "Empowering Excellence",
  contact: {
    email: "info@envirosphere.co.in",
    phones: ["+91 9860220550"],
    address: "Rahatani, Pune - 411017",
  },
  offices: [{ name: "Head Office", city: "Pune" }],
  nav: [{ label: "About", href: "/about/" }],
  social: [{ label: "LinkedIn", href: "https://www.linkedin.com/company/test" }],
  labels: { contact: "Contact", explore: "Explore" },
};

describe("Footer", () => {
  it("shows contact details as working links", () => {
    render(<Footer {...props} />);
    expect(screen.getByRole("link", { name: "info@envirosphere.co.in" })).toHaveAttribute(
      "href",
      "mailto:info@envirosphere.co.in",
    );
    expect(screen.getByRole("link", { name: "+91 9860220550" })).toHaveAttribute("href", "tel:+919860220550");
  });

  it("lists offices, nav and social links", () => {
    render(<Footer {...props} />);
    expect(screen.getByText("Head Office, Pune")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "About" })).toHaveAttribute("href", "/about/");
    expect(screen.getByRole("link", { name: "LinkedIn" })).toHaveAttribute("rel", expect.stringContaining("noopener"));
  });

  it("shows the current year in the copyright line", () => {
    render(<Footer {...props} />);
    expect(screen.getByText(new RegExp(String(new Date().getFullYear())))).toBeInTheDocument();
  });

  it("exposes the explore links as a labelled navigation landmark", () => {
    render(<Footer {...props} />);
    expect(screen.getByRole("navigation", { name: "Explore" })).toBeInTheDocument();
  });
});
