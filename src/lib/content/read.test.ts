// @vitest-environment node
import { mkdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { makeTree } from "@tests/unit/helpers/tree";
import { mediaSchema } from "@/lib/validators/content";
import { ContentError, readMarkdownFile, readYamlFile } from "./read";

const faqSchema = z.object({
  items: z.array(z.object({ question: z.string(), answer: z.string() })),
});

describe("readYamlFile", () => {
  it("parses and validates a file", () => {
    const { content } = makeTree({
      "content/faq.yaml": "items:\n  - { question: Why?, answer: Because. }\n",
    });
    expect(readYamlFile("faq.yaml", faqSchema, content).items).toHaveLength(1);
  });

  it("names the file and the exact field when validation fails", () => {
    const { content } = makeTree({
      "content/faq.yaml":
        "items:\n  - { question: A, answer: B }\n  - { question: C, answer: D }\n  - { question: E }\n",
    });
    expect(() => readYamlFile("faq.yaml", faqSchema, content)).toThrowError(
      /content\/faq\.yaml → items\[2\]\.answer/,
    );
  });

  it("reports invalid YAML with the file name", () => {
    const { content } = makeTree({ "content/faq.yaml": "items: [unclosed" });
    expect(() => readYamlFile("faq.yaml", faqSchema, content)).toThrowError(/content\/faq\.yaml/);
  });

  it("reports a missing file", () => {
    const { content } = makeTree({ "content/other.yaml": "a: 1" });
    expect(() => readYamlFile("faq.yaml", faqSchema, content)).toThrowError(
      /content\/faq\.yaml: file is missing/,
    );
  });

  it("throws ContentError", () => {
    const { content } = makeTree({ "content/other.yaml": "a: 1" });
    expect(() => readYamlFile("faq.yaml", faqSchema, content)).toThrowError(ContentError);
  });
});

describe("readYamlFile edge cases", () => {
  it("strips a leading BOM", () => {
    const { content } = makeTree({
      "content/faq.yaml": "\uFEFFitems:\n  - { question: Why?, answer: Because. }\n",
    });
    expect(readYamlFile("faq.yaml", faqSchema, content).items).toHaveLength(1);
  });

  it("reports an empty file", () => {
    const { content } = makeTree({ "content/faq.yaml": "" });
    expect(() => readYamlFile("faq.yaml", faqSchema, content)).toThrowError(
      /content\/faq\.yaml: the file is empty/,
    );
  });

  it("reports a comment-only file", () => {
    const { content } = makeTree({ "content/faq.yaml": "# nothing here\n" });
    expect(() => readYamlFile("faq.yaml", faqSchema, content)).toThrowError(
      /content\/faq\.yaml: the file is empty/,
    );
  });

  it("shows the key hint for a bad media key", () => {
    const { content } = makeTree({
      "content/media.yaml": "Hero Home:\n  src: /media/a.jpg\n  alt: x\n",
    });
    expect(() => readYamlFile("media.yaml", mediaSchema, content)).toThrowError(
      /content\/media\.yaml → Hero Home: use lowercase letters, numbers and dashes/,
    );
  });

  it("reports a path that cannot be opened as a file", () => {
    const { content } = makeTree({ "content/other.yaml": "a: 1" });
    mkdirSync(path.join(content, "faq.yaml"));
    expect(() => readYamlFile("faq.yaml", faqSchema, content)).toThrowError(ContentError);
    expect(() => readYamlFile("faq.yaml", faqSchema, content)).toThrowError(
      /content\/faq\.yaml: could not open the file/,
    );
  });
});

describe("readMarkdownFile", () => {
  const schema = z.object({ title: z.string() });

  it("splits front matter from body", () => {
    const { content } = makeTree({ "content/a.md": "---\ntitle: Hello\n---\nBody here.\n" });
    expect(readMarkdownFile("a.md", schema, content)).toEqual({
      data: { title: "Hello" },
      body: "Body here.",
    });
  });

  it("requires a front matter block", () => {
    const { content } = makeTree({ "content/a.md": "Just text" });
    expect(() => readMarkdownFile("a.md", schema, content)).toThrowError(
      /content\/a\.md: .*front matter/,
    );
  });

  it("validates front matter fields", () => {
    const { content } = makeTree({ "content/a.md": "---\nname: x\n---\nBody" });
    expect(() => readMarkdownFile("a.md", schema, content)).toThrowError(/content\/a\.md → title/);
  });

  describe("front matter robustness", () => {
    const ok = { data: { title: "Hello" }, body: "Body here." };

    it("strips a BOM", () => {
      const { content } = makeTree({ "content/a.md": "\uFEFF---\ntitle: Hello\n---\nBody here.\n" });
      expect(readMarkdownFile("a.md", schema, content)).toEqual(ok);
    });

    it("allows trailing spaces after both --- lines", () => {
      const { content } = makeTree({
        "content/a.md": "---  \ntitle: Hello\n--- \t\nBody here.\n",
      });
      expect(readMarkdownFile("a.md", schema, content)).toEqual(ok);
    });

    it("allows leading blank lines", () => {
      const { content } = makeTree({ "content/a.md": "\n\n---\ntitle: Hello\n---\nBody here.\n" });
      expect(readMarkdownFile("a.md", schema, content)).toEqual(ok);
    });

    it("handles CRLF throughout", () => {
      const { content } = makeTree({ "content/a.md": "---\r\ntitle: Hello\r\n---\r\nBody here.\r\n" });
      expect(readMarkdownFile("a.md", schema, content)).toEqual(ok);
    });

    it("allows the closing --- at end of file without a newline", () => {
      const { content } = makeTree({ "content/a.md": "---\ntitle: Hello\n---" });
      expect(readMarkdownFile("a.md", schema, content)).toEqual({ data: { title: "Hello" }, body: "" });
    });

    it("reports a missing field for an empty front matter block", () => {
      const { content } = makeTree({ "content/a.md": "---\n---\nBody\n" });
      expect(() => readMarkdownFile("a.md", schema, content)).toThrowError(/content\/a\.md → title/);
    });

    it("does not treat ---- as a closing line", () => {
      const { content } = makeTree({ "content/a.md": "---\ntitle: Hello\n----\nBody here.\n" });
      expect(() => readMarkdownFile("a.md", schema, content)).toThrowError(/content\/a\.md: .*front matter/);
    });

    it("keeps a ---- line in the body when the block is closed properly", () => {
      const { content } = makeTree({ "content/a.md": "---\ntitle: Hello\n---\n----\nBody here.\n" });
      expect(readMarkdownFile("a.md", schema, content).body).toBe("----\nBody here.");
    });
  });
});
