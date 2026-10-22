import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SectionLabel } from "./section-label";

describe("SectionLabel", () => {
  it("renders bracketed text with an index", () => {
    render(<SectionLabel index="001">services</SectionLabel>);
    expect(screen.getByText("[ 001 / services ]")).toBeInTheDocument();
  });

  it("renders bracketed text without an index", () => {
    render(<SectionLabel>services</SectionLabel>);
    expect(screen.getByText("[ services ]")).toBeInTheDocument();
  });
});
