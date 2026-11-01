import { describe, expect, it } from "vitest";
import { buildOrganizationJsonLd, serializeJsonLd } from "./json-ld";
import { loadSite } from "@/lib/content";
import type { Site } from "@/lib/validators/content";

const org = (site: Site) => buildOrganizationJsonLd(site, "/media/logo.png")["@graph"][0] as Record<string, unknown>;

describe("buildOrganizationJsonLd", () => {
  it("builds the address from contact.addressParts in site.yaml", () => {
    const site = loadSite();
    const parts = site.contact.addressParts;
    expect(parts).toBeDefined();
    expect(org(site).address).toEqual({
      "@type": "PostalAddress",
      streetAddress: parts?.streetAddress,
      addressLocality: parts?.locality,
      addressRegion: parts?.region,
      postalCode: parts?.postalCode,
      addressCountry: parts?.country,
    });
  });

  it("omits the address instead of guessing when addressParts is absent", () => {
    const site = loadSite();
    const without = { ...site, contact: { ...site.contact, addressParts: undefined } };
    const data = org(without);
    expect(data).not.toHaveProperty("address");
    expect(JSON.stringify(data)).not.toMatch(/Maharashtra|411017/);
  });

  it("does not hardcode places for the branch offices", () => {
    const site = loadSite();
    const without = { ...site, contact: { ...site.contact, addressParts: undefined } };
    expect(JSON.stringify(org(without).department)).not.toMatch(/Maharashtra|"IN"/);
  });
});

describe("serializeJsonLd", () => {
  it("escapes < so the script tag cannot be closed early, and stays valid JSON", () => {
    const text = serializeJsonLd({ name: "</script><script>alert(1)</script>" });
    expect(text).not.toContain("<");
    expect(text).toContain("\\u003c/script>");
    expect(JSON.parse(text).name).toBe("</script><script>alert(1)</script>");
  });
});
