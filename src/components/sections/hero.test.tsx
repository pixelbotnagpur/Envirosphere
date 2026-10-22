import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Hero } from "./hero";

const props = {
  eyebrow: "QCI NABET",
  title: "Clearances handled with precision.",
  subtitle: "We help clients secure consents.",
  primaryCta: { label: "Talk to our team", href: "/contact/" },
  secondaryCta: { label: "Our services", href: "/services/" },
  scrollLabel: "Scroll",
};

describe("Hero", () => {
  it("renders the title as the page's only h1", () => {
    render(<Hero {...props} />);
    expect(screen.getByRole("heading", { level: 1, name: props.title })).toBeInTheDocument();
  });

  it("links both calls to action", () => {
    render(<Hero {...props} />);
    expect(screen.getByRole("link", { name: "Talk to our team" })).toHaveAttribute("href", "/contact/");
    expect(screen.getByRole("link", { name: "Our services" })).toHaveAttribute("href", "/services/");
  });

  it("works without a secondary call to action", () => {
    render(<Hero {...props} secondaryCta={undefined} />);
    expect(screen.queryByRole("link", { name: "Our services" })).toBeNull();
  });

  it("uses CSS entrance classes, never JS-hidden styles, so it is visible before hydration", () => {
    const { container } = render(<Hero {...props} />);
    expect(container.querySelector("[data-reveal]")).toBeNull();
    expect(screen.getByRole("heading", { level: 1 })).toHaveClass("rise");
  });
});
