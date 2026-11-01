import { describe, expect, it } from "vitest";
import { fillText } from "./text";

describe("fillText", () => {
  it("replaces each named placeholder", () => {
    expect(fillText("Apply for {role} ({role})", { role: "Chemist" })).toBe("Apply for Chemist (Chemist)");
  });

  it("leaves unknown placeholders as they are", () => {
    expect(fillText("{a} and {b}", { a: 1 })).toBe("1 and {b}");
  });
});
