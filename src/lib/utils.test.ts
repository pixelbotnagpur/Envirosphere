import { describe, expect, it } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("merges conflicting tailwind utilities, last wins", () => {
    expect(cn("px-4", "px-6")).toBe("px-6");
  });

  it("keeps a type-scale token and a color token together", () => {
    expect(cn("text-h1", "text-primary")).toBe("text-h1 text-primary");
  });

  it("lets a later type-scale token replace an earlier one", () => {
    expect(cn("text-h1", "text-h3")).toBe("text-h3");
  });

  it("drops falsy values", () => {
    expect(cn("a", false && "b", undefined, "c")).toBe("a c");
  });
});
