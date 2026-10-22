import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Parallax } from "./parallax";

describe("Parallax", () => {
  it("renders children inside a clipping wrapper", () => {
    const { container } = render(
      <Parallax className="rounded-card">
        <p>content</p>
      </Parallax>,
    );
    expect(screen.getByText("content")).toBeInTheDocument();
    expect(container.firstElementChild).toHaveClass("overflow-hidden", "rounded-card");
  });
});
