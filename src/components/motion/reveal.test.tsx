import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Reveal } from "./reveal";

describe("Reveal", () => {
  it("renders its children", () => {
    render(<Reveal>Hello</Reveal>);
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });

  it("marks itself so the no-JS fallback can show it", () => {
    render(<Reveal>Hello</Reveal>);
    expect(screen.getByText("Hello")).toHaveAttribute("data-reveal");
  });

  it("passes className and native props through", () => {
    render(
      <Reveal className="mt-4" id="intro">
        Hello
      </Reveal>,
    );
    expect(screen.getByText("Hello")).toHaveClass("mt-4");
    expect(screen.getByText("Hello")).toHaveAttribute("id", "intro");
  });
});
