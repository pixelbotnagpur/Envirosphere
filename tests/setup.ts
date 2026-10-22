import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, vi } from "vitest";
import { cleanupTrees } from "./unit/helpers/tree";

import React from "react";

// next/link normalizes hrefs using the build-time trailingSlash flag, which is
// unset under jsdom and strips the trailing slash the tests assert on.
vi.mock("next/link", () => ({
  default: ({ href, ...p }: { href: string } & Record<string, unknown>) =>
    React.createElement("a", { href, ...p }),
}));

afterEach(() => cleanup());
afterAll(cleanupTrees);

// jsdom lacks these browser APIs that Motion uses; node-environment tests skip this block.
if (typeof window !== "undefined") {
  class IntersectionObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  }
  Object.defineProperty(window, "IntersectionObserver", {
    writable: true,
    configurable: true,
    value: IntersectionObserverStub,
  });
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
      dispatchEvent: () => false,
    }),
  });
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  Object.defineProperty(window, "ResizeObserver", {
    writable: true,
    configurable: true,
    value: ResizeObserverStub,
  });
}
