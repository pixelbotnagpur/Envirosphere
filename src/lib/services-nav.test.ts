import { describe, expect, it } from "vitest";
import { serviceNeighbours } from "./services-nav";

const list = [{ slug: "a" }, { slug: "b" }, { slug: "c" }];

describe("serviceNeighbours", () => {
  it("returns the previous and next service in the given order", () => {
    expect(serviceNeighbours(list, "b")).toEqual({ previous: { slug: "a" }, next: { slug: "c" } });
  });

  it("has no previous service for the first one and no next for the last", () => {
    expect(serviceNeighbours(list, "a")).toEqual({ previous: undefined, next: { slug: "b" } });
    expect(serviceNeighbours(list, "c")).toEqual({ previous: { slug: "b" }, next: undefined });
  });

  it("returns no neighbours for an unknown slug", () => {
    expect(serviceNeighbours(list, "zzz")).toEqual({ previous: undefined, next: undefined });
  });
});
