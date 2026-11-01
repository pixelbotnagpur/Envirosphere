// @vitest-environment node
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { loadServices } from "@/lib/content";

vi.mock("lenis/react", () => ({ ReactLenis: ({ children }: { children?: unknown }) => children, useLenis: () => undefined }));

const STATIC_ROUTES = ["/", "/about/", "/services/", "/why-us/", "/careers/", "/gallery/", "/downloads/", "/contact/"];

describe("home page internal links", () => {
  it("every internal href resolves to a generated route", async () => {
    const { default: HomePage } = await import("@/app/page");
    const html = renderToStaticMarkup(HomePage());
    const hrefs = [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
    const internal = hrefs
      .filter((h) => h.startsWith("/"))
      .map((h) => h.split("#")[0])
      .filter((h) => h !== "" && !h.startsWith("/_next") && !h.startsWith("/media/"));
    expect(internal.length).toBeGreaterThan(5);

    const routes = new Set([...STATIC_ROUTES, ...loadServices().map((s) => `/services/${s.slug}/`)]);
    const broken = [...new Set(internal)].filter((h) => !routes.has(h));
    expect(broken).toEqual([]);
  });
});
