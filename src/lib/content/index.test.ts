// @vitest-environment node
import { describe, expect, it } from "vitest";
import { makeTree } from "@tests/unit/helpers/tree";
import { validFiles } from "@tests/unit/helpers/fixtures";
import {
  loadAboutPage,
  loadAll,
  loadContactPage,
  loadDownloadsPage,
  loadForms,
  loadGalleryPage,
  loadService,
  loadServices,
  loadServicesPage,
  loadWhyUsPage,
  socialLinks,
} from "./index";
import { ContentError } from "./read";

describe("loadAll", () => {
  it("loads valid content", () => {
    const { content, publicDir } = makeTree(validFiles());
    const all = loadAll(content, publicDir);
    expect(all.site.name).toBe("Test Co");
    expect(all.home.hero.title).toBe("Test title");
    expect(all.services.map((s) => s.slug)).toEqual(["environmental-audit"]);
  });

  it("loads the services page block", () => {
    const { content, publicDir } = makeTree(validFiles());
    const all = loadAll(content, publicDir);
    expect(all.servicesPage.serviceDetail.previousLabel).toBe("Previous service");
    expect(loadServicesPage(content).serviceDetail.contact.primaryCta.href).toBe("/contact/");
  });

  it("loads the inner page files", () => {
    const { content, publicDir } = makeTree(validFiles());
    const all = loadAll(content, publicDir);
    expect(all.aboutPage.hero.title).toBe("About heading.");
    expect(all.whyUsPage.pillars.map((p) => p.icon)).toEqual(["shield-check", "layers"]);
    expect(all.contactPage.headOffice.city).toBe("Pune");
    expect(all.galleryPage.seo.title).toBe("Gallery");
    expect(all.downloadsPage.emptyText).toBe("No documents yet.");
    expect(all.servicesPage.hub.viewLabel).toBe("View Specifications");
    expect(all.careers.hero.title).toBe("Careers at Test.");
    expect(loadAboutPage(content).story.image).toBe("about-photo");
    expect(loadWhyUsPage(content).feature.image).toBe("about-photo");
    expect(loadContactPage(content).branches.itemSuffix).toBe("Branch");
    expect(loadGalleryPage(content).hero.eyebrow).toBe("Gallery");
    expect(loadDownloadsPage(content).downloadLabel).toBe("Download Document");
  });

  it.each([
    ["about.yaml", "story:\n  heading: Our story\n  paragraphs: [First paragraph., Second paragraph.]\n  image: about-photo", "story:\n  heading: Our story\n  paragraphs: [First paragraph., Second paragraph.]\n  image: nope", /content\/pages\/about\.yaml → story\.image: "nope" is not listed/],
    ["about.yaml", "    image: about-photo", "    image: nope", /content\/pages\/about\.yaml → accreditation\.feature\.image: "nope" is not listed/],
    ["why-us.yaml", "feature:\n  image: about-photo", "feature:\n  image: nope", /content\/pages\/why-us\.yaml → feature\.image: "nope" is not listed/],
  ])("fails when an image key in %s is unknown", (file, from, to, message) => {
    const files = validFiles();
    const key = `content/pages/${file}`;
    expect(files[key]).toContain(from);
    files[key] = files[key].replace(from, to);
    const { content, publicDir } = makeTree(files);
    expect(() => loadAll(content, publicDir)).toThrowError(message);
  });

  it("loads the forms file and names the file and field when a form text is missing", () => {
    const { content, publicDir } = makeTree(validFiles());
    expect(loadAll(content, publicDir).forms.inquiry.submitLabel).toBe("Submit Inquiry");
    expect(loadForms(content).application.fields.cv.label).toContain("Curriculum Vitae");

    const files = validFiles();
    files["content/forms.yaml"] = files["content/forms.yaml"].replace(/^ {2}submitLabel: Submit Inquiry\r?\n/m, "");
    const broken = makeTree(files);
    expect(() => loadAll(broken.content, broken.publicDir)).toThrowError(/content\/forms\.yaml → inquiry\.submitLabel/);
  });

  it("fails with a plain message when forms.yaml is missing", () => {
    const files = validFiles();
    delete files["content/forms.yaml"];
    const { content, publicDir } = makeTree(files);
    expect(() => loadAll(content, publicDir)).toThrowError(/content\/forms\.yaml: file is missing/);
  });

  it("fails with a plain message when a page file is missing", () => {
    const files = validFiles();
    delete files["content/pages/about.yaml"];
    const { content, publicDir } = makeTree(files);
    expect(() => loadAll(content, publicDir)).toThrowError(/content\/pages\/about\.yaml/);
  });

  it("names the file and field when a page text is missing", () => {
    const files = validFiles();
    files["content/pages/gallery.yaml"] = files["content/pages/gallery.yaml"].replace("  title: Gallery.\n", "");
    const { content, publicDir } = makeTree(files);
    expect(() => loadAll(content, publicDir)).toThrowError(/content\/pages\/gallery\.yaml → hero\.title/);
  });

  it("names the allowed icons when an icon is unknown", () => {
    const files = validFiles();
    files["content/pages/why-us.yaml"] = files["content/pages/why-us.yaml"].replace("icon: layers", "icon: rocket");
    const { content, publicDir } = makeTree(files);
    expect(() => loadAll(content, publicDir)).toThrowError(
      /content\/pages\/why-us\.yaml → pillars\[1\]\.icon: unknown icon; use one of: award/,
    );
  });

  it("fails when the contact head office city is not an office in site.yaml", () => {
    const files = validFiles();
    files["content/pages/contact.yaml"] = files["content/pages/contact.yaml"].replace("city: Pune", "city: Goa");
    const { content, publicDir } = makeTree(files);
    expect(() => loadAll(content, publicDir)).toThrowError(
      /content\/pages\/contact\.yaml → headOffice\.city: "Goa" is not one of the offices in content\/site\.yaml \(Pune\)/,
    );
  });

  it("fails with a plain message when a serviceDetail label is missing", () => {
    const files = validFiles();
    files["content/pages/services.yaml"] = files["content/pages/services.yaml"].replace("  nextLabel: Next service\n", "");
    const { content, publicDir } = makeTree(files);
    expect(() => loadAll(content, publicDir)).toThrowError(/content\/pages\/services\.yaml → serviceDetail\.nextLabel/);
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

  it("loads jobs, gallery and downloads", () => {
    const { content, publicDir } = makeTree(validFiles());
    const all = loadAll(content, publicDir);
    expect(all.jobs.map((j) => j.id)).toEqual(["engineer"]);
    expect(all.gallery.map((g) => g.id)).toEqual(["field-day"]);
    expect(all.downloads.map((d) => d.id)).toEqual(["brochure"]);
  });

  it("fails when a gallery item references an unknown image key", () => {
    const files = validFiles();
    files["content/gallery.yaml"] = files["content/gallery.yaml"].replace("image: about-photo", "image: nope");
    const { content, publicDir } = makeTree(files);
    expect(() => loadAll(content, publicDir)).toThrowError(
      /content\/gallery\.yaml → "field-day" image: "nope" is not listed/,
    );
  });

  it("fails when a download fileKey is unknown", () => {
    const files = validFiles();
    files["content/downloads.yaml"] = files["content/downloads.yaml"].replace("fileKey: logo", "fileKey: nope");
    const { content, publicDir } = makeTree(files);
    expect(() => loadAll(content, publicDir)).toThrowError(
      /content\/downloads\.yaml → "brochure" fileKey: "nope" is not listed/,
    );
  });

  it("fails with a plain message when jobs.yaml is malformed", () => {
    const files = validFiles();
    files["content/jobs.yaml"] = "- id: broken\n  title: Missing the rest\n";
    const { content, publicDir } = makeTree(files);
    expect(() => loadAll(content, publicDir)).toThrowError(ContentError);
    expect(() => loadAll(content, publicDir)).toThrowError(/jobs\.yaml/);
  });

  it("fails when the about image key is unknown", () => {
    const files = validFiles();
    files["content/pages/home.yaml"] = files["content/pages/home.yaml"].replace(
      "paragraphs: [First paragraph., Second paragraph.]\n  image: about-photo",
      "paragraphs: [First paragraph., Second paragraph.]\n  image: nope",
    );
    const { content, publicDir } = makeTree(files);
    expect(() => loadAll(content, publicDir)).toThrowError(/content\/pages\/home\.yaml → about\.image: "nope"/);
  });
});

describe("Home field archive, visual break and images", () => {
  const edit = (from: string, to: string) => {
    const files = validFiles();
    const key = "content/pages/home.yaml";
    expect(files[key]).toContain(from);
    files[key] = files[key].replace(from, to);
    return makeTree(files);
  };

  it.each([
    ["{ image: about-photo, tag: ONE", "{ image: nope, tag: ONE", /fieldArchive\.items\[0\]\.image: "nope" is not listed/],
    ["visualBreak:\n  image: about-photo", "visualBreak:\n  image: nope", /visualBreak\.image: "nope" is not listed/],
    ["  image: about-photo\n  highlights", "  image: nope\n  highlights", /hero\.image: "nope" is not listed/],
  ])("fails when an image key is unknown (%#)", (from, to, message) => {
    const { content, publicDir } = edit(from, to);
    expect(() => loadAll(content, publicDir)).toThrowError(message);
  });

  it("fails and names the file and field when a How we work picture is not in media.yaml", () => {
    const { content, publicDir } = edit("{ title: One, body: First step. }", "{ title: One, body: First step., image: nope }");
    expect(() => loadAll(content, publicDir)).toThrowError(
      /content\/pages\/home\.yaml → process\.steps\[0\]\.image: "nope" is not listed/,
    );
  });

  it("accepts a step with a picture and a step without one", () => {
    const { content, publicDir } = edit("{ title: One, body: First step. }", "{ title: One, body: First step., image: about-photo }");
    const all = loadAll(content, publicDir);
    expect(all.home.process.steps.map((step) => step.image)).toEqual(["about-photo", undefined]);
  });

  it("fails with a plain message when the slider position words lack {current} or {total}", () => {
    const { content, publicDir } = edit("position: Testimonial {current} of {total}", "position: Testimonial number");
    expect(() => loadAll(content, publicDir)).toThrowError(
      /content\/pages\/home\.yaml → testimonials\.controls\.position: must contain \{current\} and \{total\}/,
    );
  });

  it("fails when the slider button words are missing", () => {
    const { content, publicDir } = edit("    next: Next testimonial\n", "");
    expect(() => loadAll(content, publicDir)).toThrowError(/content\/pages\/home\.yaml → testimonials\.controls\.next/);
  });

  it("fails with a plain message unless Field work has exactly four photos", () => {
    const { content, publicDir } = edit("    - { image: about-photo, tag: FOUR, caption: Fourth caption. }\n", "");
    expect(() => loadAll(content, publicDir)).toThrowError(
      /content\/pages\/home\.yaml → fieldArchive\.items: Field work shows exactly four photos/,
    );
  });

  it("fails when a hero fact is not one of the stats", () => {
    const { content } = edit("highlights: [Clients]", "highlights: [Customers]");
    expect(() => loadAll(content)).toThrowError(
      /content\/pages\/home\.yaml → hero\.highlights\[0\]: "Customers" is not one of the stats below \(Clients, Projects\)/,
    );
  });

  it("fails when the page title is missing", () => {
    const { content, publicDir } = edit("  title: Test Co home\n", "");
    expect(() => loadAll(content, publicDir)).toThrowError(/content\/pages\/home\.yaml → seo\.title/);
  });
});

describe("loadServices", () => {
  it.each([
    ["nothing", ""],
    ["spaces and blank lines", "   \n\n  "],
  ])("rejects a service whose text is %s", (_label, text) => {
    const files = validFiles();
    files["content/services/environmental-audit.md"] = `---\ntitle: A\norder: 1\nsummary: S\n---\n${text}`;
    const { content } = makeTree(files);
    expect(() => loadServices(content)).toThrowError(
      "content/services/environmental-audit.md: the service text below the --- line is empty; write the service description there",
    );
  });

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
