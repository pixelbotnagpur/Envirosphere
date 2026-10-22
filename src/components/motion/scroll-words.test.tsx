import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ScrollWords } from "./scroll-words";

describe("ScrollWords", () => {
  it("renders every word in order", () => {
    const { container } = render(<ScrollWords text="Strategic planning for clearances" />);
    expect(container).toHaveTextContent("Strategic planning for clearances");
  });

  it("renders one span per word", () => {
    const { container } = render(<ScrollWords text="one two three" />);
    expect(container.querySelectorAll("[data-word]")).toHaveLength(3);
  });
});
