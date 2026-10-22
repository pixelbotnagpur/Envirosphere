import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SplitText } from "./split-text";

describe("SplitText", () => {
  it("keeps the full sentence as the accessible name", () => {
    render(
      <h2>
        <SplitText text="Hello brave world" />
      </h2>,
    );
    expect(screen.getByRole("heading", { name: "Hello brave world" })).toBeInTheDocument();
  });

  it("wraps every word so the no-JS fallback can reveal it", () => {
    const { container } = render(<SplitText text="Hello brave world" />);
    expect(container.querySelectorAll("[data-reveal]")).toHaveLength(3);
  });

  it("hides the visual words from assistive tech to avoid double reading", () => {
    const { container } = render(<SplitText text="Hello brave world" />);
    expect(container.querySelector("[aria-hidden='true']")).not.toBeNull();
  });
});
