// @vitest-environment node
import { describe, expect, it } from "vitest";
import { makeTree } from "@tests/unit/helpers/tree";
import { validFiles } from "@tests/unit/helpers/fixtures";
import { loadAll, loadService, loadServices, socialLinks } from "./index";
import { ContentError } from "./read";

describe("loadAll", () => {
  it("loads valid content", () => {
    const { content, publicDir } = makeTree(validFiles());
    const all = loadAll(content, publicDir);
    expect(all.site.name).toBe("Test Co");
    expect(all.home.hero.title).toBe("Test title");
    expect(all.services.map((s) => s.slug)).toEqual(["environmental-audit"]);
  });

  it("fails when site.yaml points at an unknown logo key", () => {
    const files = validFiles();
    files["content/site.yaml"] = files["content/site.yaml"].replace("logoKey: logo", "logoKey: missing");
    const { content, publicDir } = makeTree(files);
    expect(() => loadAll(content, publicDir)).toThrowError(
      /content\/site\.yaml → logoKey: "missing" is not listed in content\/media\.yaml/,
    );
  });

  it("fails when a service references a missing image key", () => {
    const files = validFiles();
    files["content/services/environmental-audit.md"] =
      "---\ntitle: A\norder: 1\nsummary: S\nimage: nope\n---\nBody";
    const { content, publicDir } = makeTree(files);
    expect(() => loadAll(content, publicDir)).toThrowError(
      /content\/services\/environmental-audit\.md → image: "nope" is not listed/,
    );
  });

  it("fails when a media file is missing from public/", () => {
    const files = validFiles();
    delete files["public/media/brand/logo.svg"];
    files["public/other.txt"] = "x";
    const { content, publicDir } = makeTree(files);
    expect(() => loadAll(content, publicDir)).toThrowError(ContentError);
    expect(() => loadAll(content, publicDir)).toThrowError(/file not found/);
  });

  it("fails when a client logo key is not in media.yaml", () => {
    const files = validFiles();
    files["content/pages/home.yaml"] = files["content/pages/home.yaml"].replace("client-c,", "client-missing,");
    const { content, publicDir } = makeTree(files);
    expect(() => loadAll(content, publicDir)).toThrowError(
      /content\/pages\/home\.yaml → clients\.logos\[2\]: "client-missing" is not listed/,
    );
  });

  it("fails when the about image key is unknown", () => {
    const files = validFiles();
    files["content/pages/home.yaml"] = files["content/pages/home.yaml"].replace("image: about-photo", "image: nope");
    const { content, publicDir } = makeTree(files);
    expect(() => loadAll(content, publicDir)).toThrowError(/content\/pages\/home\.yaml → about\.image: "nope"/);
  });
});

describe("loadServices", () => {
  it("sorts by order and derives the slug from the file name", () => {
    const files = validFiles();
    files["content/services/water-audit.md"] = "---\ntitle: Water audit\norder: 2\nsummary: S\n---\nB";
    files["content/services/air.md"] = "---\ntitle: Air\norder: 3\nsummary: S\n---\nB";
    const { content } = makeTree(files);
    expect(loadServices(content).map((s) => s.slug)).toEqual(["environmental-audit", "water-audit", "air"]);
  });

  it("rejects a file name that is not a url-safe slug", () => {
    const files = validFiles();
    files["content/services/Bad Name.md"] = "---\ntitle: A\norder: 5\nsummary: S\n---\nB";
    const { content } = makeTree(files);
    expect(() => loadServices(content)).toThrowError(/content\/services\/Bad Name\.md: .*lowercase/);
  });

  it("rejects two services that share the same order number", () => {
    const files = validFiles();
    files["content/services/water-audit.md"] = "---\ntitle: Water\norder: 1\nsummary: S\n---\nB";
    const { content } = makeTree(files);
    expect(() => loadServices(content)).toThrowError(ContentError);
    expect(() => loadServices(content)).toThrowError(
      'content/services: "environmental-audit.md" and "water-audit.md" both use order 1; give each service a different number',
    );
  });

  it("rejects files in services/ that are not lowercase .md", () => {
    for (const name of ["Foo.MD", "x.markdown", "notes.txt"]) {
      const files = validFiles();
      files[`content/services/${name}`] = "x";
      const { content } = makeTree(files);
      expect(() => loadServices(content)).toThrowError(ContentError);
      expect(() => loadServices(content)).toThrowError(
        `content/services/${name}: only .md files are allowed here (rename to lowercase .md or remove it)`,
      );
    }
  });

  it("silently ignores hidden files and sub-folders in services/", () => {
    const files = validFiles();
    files["content/services/.DS_Store"] = "x";
    files["content/services/drafts/old.md"] = "x";
    const { content } = makeTree(files);
    expect(loadServices(content).map((s) => s.slug)).toEqual(["environmental-audit"]);
  });

  it("returns an empty list when there is no services folder", () => {
    const { content } = makeTree({ "content/site.yaml": "a: 1" });
    expect(loadServices(content)).toEqual([]);
  });

  it("finds a single service by slug or returns undefined", () => {
    const files = validFiles();
    const { content } = makeTree(files);
    expect(loadService("environmental-audit", content)?.title).toBe("Environmental audit");
    expect(loadService("non-existent", content)).toBeUndefined();
  });
});

describe("socialLinks", () => {
  it("lists only the links that are set, with display labels", () => {
    const { content, publicDir } = makeTree(validFiles());
    const { site } = loadAll(content, publicDir);
    expect(socialLinks(site)).toEqual([
      { label: "LinkedIn", href: "https://www.linkedin.com/company/test" },
    ]);
  });
});
