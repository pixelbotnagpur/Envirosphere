import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SectionLabel } from "./section-label";

const NBSP = "\u00A0";

describe("SectionLabel", () => {
  it("renders bracketed text with an index", () => {
    render(<SectionLabel index="001">services</SectionLabel>);
    expect(screen.getByText("[ 001 / services ]")).toBeInTheDocument();
  });

  it("renders bracketed text without an index", () => {
    render(<SectionLabel>services</SectionLabel>);
    expect(screen.getByText("[ services ]")).toBeInTheDocument();
  });

  it("binds the brackets to the adjacent text with non-breaking spaces", () => {
    const { container } = render(<SectionLabel index="001">services</SectionLabel>);
    expect(container.querySelector("p")?.textContent).toBe(`[${NBSP}001 / services${NBSP}]`);
  });

  it("binds the brackets without an index too", () => {
    const { container } = render(<SectionLabel>services</SectionLabel>);
    expect(container.querySelector("p")?.textContent).toBe(`[${NBSP}services${NBSP}]`);
  });

  it("uses the muted tone by default and the inverse tone on dark sections", () => {
    const { rerender } = render(<SectionLabel>one</SectionLabel>);
    expect(screen.getByText(/one/)).toHaveClass("text-muted-foreground", "tabular-nums");
    rerender(<SectionLabel tone="inverse">one</SectionLabel>);
    expect(screen.getByText(/one/)).toHaveClass("text-secondary");
    expect(screen.getByText(/one/)).not.toHaveClass("text-muted-foreground");
  });
});
