import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Stats } from "./stats";

const props = {
  index: "003",
  label: "In numbers",
  locale: "en-IN",
  items: [
    { value: 250, suffix: "+", label: "Clients" },
    { value: 2, suffix: "", label: "Certifications" },
  ],
};

describe("Stats", () => {
  it("shows every figure with its suffix and label", () => {
    render(<Stats {...props} />);
    expect(screen.getByText("Clients")).toBeInTheDocument();
    expect(screen.getByText("Certifications")).toBeInTheDocument();
    expect(screen.getByText("250")).toBeInTheDocument();
    expect(screen.getByText("+")).toBeInTheDocument();
  });

  it("is a list of statistics for assistive tech", () => {
    render(<Stats {...props} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  it("renders each stat as a Forest card on a light section", () => {
    const { container } = render(<Stats {...props} />);
    const cards = container.querySelectorAll("[data-card]");
    expect(cards).toHaveLength(2);
    expect(container.querySelector("[data-card-grid]")).not.toBeNull();
    expect(container.querySelectorAll(".bg-primary.text-primary-foreground.rounded-card")).toHaveLength(2);
    expect(container.querySelector("section")).toHaveClass("bg-surface");
    expect(container.querySelector("section")).not.toHaveClass("bg-secondary");
  });

  it("can sit on the dark Forest background, with softly tinted cards and light text", () => {
    const { container } = render(<Stats {...props} tone="primary" />);
    const section = container.querySelector("section");
    expect(section).toHaveClass("bg-primary", "text-primary-foreground");
    expect(section).not.toHaveClass("bg-surface");
    const cards = container.querySelectorAll("[data-card] > div > div");
    expect(cards).toHaveLength(2);
    for (const card of cards) {
      expect(card).toHaveClass("bg-primary-foreground/5", "border-primary-foreground/15");
      expect(card).not.toHaveClass("bg-primary");
    }
    // The small label switches to its light tone so it stays readable on the dark section.
    expect(screen.getByText(/In numbers/)).toHaveClass("text-secondary");
  });

  it("can sit on the Bone background instead", () => {
    const { container } = render(<Stats {...props} tone="background" />);
    expect(container.querySelector("section")).toHaveClass("bg-background");
  });
});
