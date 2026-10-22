import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Counter } from "./counter";

describe("Counter", () => {
  it("renders the final value on first paint (readable without JS)", () => {
    const { container } = render(<Counter value={250} locale="en-IN" />);
    expect(container).toHaveTextContent("250");
  });

  it("formats with the given locale", () => {
    const { container } = render(<Counter value={12500} locale="en-IN" />);
    expect(container).toHaveTextContent("12,500");
  });

  it("uses tabular figures so digits do not jitter while counting", () => {
    const { container } = render(<Counter value={5} locale="en-IN" />);
    expect(container.firstElementChild).toHaveClass("tabular-nums");
  });
});
