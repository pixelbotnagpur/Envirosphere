// @vitest-environment node
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { makeTree } from "@tests/unit/helpers/tree";
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
});
