// @vitest-environment node
/**
 * Guard for rule 33 (content-driven): visible prose lives in content/, never in JSX.
 *
 * Scans src/app/**\/page.tsx and src/components/sections/**\/*.tsx (not tests) with the TypeScript
 * parser and reports file:line for:
 *  - JSX text that shows words (any run of 3+ letters, after dropping HTML entities);
 *  - string props / object properties named title, description, label, alt, aria-label, placeholder,
 *    heading, text, caption, eyebrow, subtitle, lead whose value has 4+ characters including a
 *    letter (ids, class lists, urls and lowercase code tokens are ignored);
 *  - string or template literals inside a JSX expression ({"..."}, {cond ? "..." : ""}) that read
 *    like a sentence (3+ words or 20+ letters), outside className/href/aria-role/data-* attributes.
 *
 * Never allowed: classNames, hrefs, role/aria tokens other than aria-label, `data-*`, identifiers.
 *
 * HOW TO FIX A HIT: move the text into the page's file in content/ (see content/README.md), add the
 * field to the Zod schema, and pass it down as a prop. Do NOT add the file to an allowlist unless
 * the text is genuinely not site copy, and then explain why next to the entry.
 */
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";

/** Files whose text is not site copy. Each entry needs a reason. */
const ALLOWLIST: Record<string, string> = {};

/**
 * TODO(C2b): package C2b moves the Home page, form copy and shared home sections to content/ and
 * empties this list. Every file here still holds hardcoded copy.
 */
const PENDING_C2B: readonly string[] = [
  "src/app/page.tsx",
  "src/components/sections/services-index.tsx",
  "src/components/sections/hero.tsx",
  "src/components/sections/visual-break.tsx",
  "src/components/sections/field-archive.tsx",
];

/**
 * TODO(C2a): inner pages still being moved to content/ by package C2a; each page commit removes its
 * entry and the list is deleted with the last one.
 */
const PENDING_C2A: readonly string[] = [
  "src/app/services/page.tsx",
  "src/app/services/[slug]/page.tsx",
];

const PROSE_PROPS = new Set([
  "title",
  "description",
  "label",
  "alt",
  "aria-label",
  "ariaLabel",
  "placeholder",
  "heading",
  "text",
  "caption",
  "eyebrow",
  "subtitle",
  "lead",
]);
/** Attributes that never carry prose, so literals inside them are ignored. */
const CODE_ATTRS = /^(className|class|href|src|role|id|key|type|name|htmlFor|target|rel|variant|size|tone|as|index|sizes|loading|fetchPriority|data-.*|aria-(?!label$).*)$/;

const repo = process.cwd();
const rel = (file: string) => file.replace(/\\/g, "/");

function listFiles(): string[] {
  const walk = (dir: string) =>
    (readdirSync(path.join(repo, dir), { recursive: true }) as string[]).map((f) =>
      rel(path.join(dir, f)),
    );
  const pages = walk("src/app").filter((f) => f.endsWith("/page.tsx"));
  const sections = walk("src/components/sections").filter(
    (f) => f.endsWith(".tsx") && !/\.test\./.test(f),
  );
  return [...pages, ...sections].sort();
}

const words = (s: string) => s.split(/\s+/).filter((w) => /[A-Za-z]{2,}/.test(w));
const letters = (s: string) => (s.match(/[A-Za-z]/g) ?? []).length;
const looksLikeCode = (s: string) => /^[a-z0-9_.:/#?&=%-]+$/.test(s) || /^[./#]/.test(s);

export function findProse(fileName: string, source: string): string[] {
  const sf = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const out: string[] = [];
  const report = (node: ts.Node, kind: string, value: string) => {
    const { line } = sf.getLineAndCharacterOfPosition(node.getStart(sf));
    out.push(`${fileName}:${line + 1} ${kind}: ${JSON.stringify(value.trim().slice(0, 60))}`);
  };
  const literalText = (n: ts.Node): string | undefined => {
    if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) return n.text;
    if (ts.isTemplateExpression(n))
      return n.head.text + n.templateSpans.map((s) => s.literal.text).join(" ");
    return undefined;
  };
  const insideCodeAttr = (n: ts.Node): boolean => {
    for (let p: ts.Node | undefined = n.parent; p; p = p.parent) {
      if (ts.isJsxAttribute(p)) return CODE_ATTRS.test(p.name.getText(sf));
      if (ts.isJsxElement(p) || ts.isJsxSelfClosingElement(p)) return false;
    }
    return false;
  };
  const insideJsxExpression = (n: ts.Node): boolean => {
    for (let p: ts.Node | undefined = n.parent; p; p = p.parent) {
      if (ts.isJsxExpression(p)) return true;
      if (ts.isJsxAttribute(p)) return !CODE_ATTRS.test(p.name.getText(sf));
      if (ts.isFunctionLike(p) && !ts.isArrowFunction(p)) return false;
    }
    return false;
  };

  const visit = (node: ts.Node) => {
    if (ts.isJsxText(node)) {
      const text = node.text.replace(/&[a-zA-Z]+;|&#\d+;/g, " ").trim();
      if (/[A-Za-z]{3,}/.test(text)) report(node, "JSX text", text);
    } else if (ts.isJsxAttribute(node) && node.initializer) {
      const name = node.name.getText(sf);
      const init = ts.isJsxExpression(node.initializer) ? node.initializer.expression : node.initializer;
      const value = init ? literalText(init) : undefined;
      if (PROSE_PROPS.has(name) && value !== undefined) {
        const v = value.trim();
        if (v.length >= 4 && letters(v) > 0 && !looksLikeCode(v)) report(node, `prop ${name}`, v);
      }
    } else if (ts.isPropertyAssignment(node)) {
      const name = node.name.getText(sf).replace(/^["']|["']$/g, "");
      const value = literalText(node.initializer);
      if (PROSE_PROPS.has(name) && value !== undefined) {
        const v = value.trim();
        if (v.length >= 4 && letters(v) > 0 && !looksLikeCode(v)) report(node, `property ${name}`, v);
      }
    }
    if (
      (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node) || ts.isTemplateExpression(node)) &&
      insideJsxExpression(node) &&
      !insideCodeAttr(node) &&
      !ts.isJsxAttribute(node.parent)
    ) {
      const value = literalText(node) ?? "";
      if (words(value).length >= 3 || letters(value) >= 20) report(node, "text in JSX expression", value);
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return out;
}

describe("no hardcoded copy in pages and sections (rule 33)", () => {
  const files = listFiles();

  it("scans the pages and the sections", () => {
    expect(files.length).toBeGreaterThan(15);
  });

  it("detects prose the heuristic is meant to catch", () => {
    const sample = `export const A = () => (
      <section aria-label="Services List" className="mt-4 grid">
        <h1>Gallery.</h1>
        <p>{cond ? "Showing open positions today" : ""}</p>
        <a href="/contact/" data-card="" role="list">{label}</a>
      </section>
    );
    export const meta = { title: "About Us today", description: "x" };`;
    const hits = findProse("sample.tsx", sample);
    expect(hits.length).toBe(4);
    expect(findProse("ok.tsx", `export const B = () => <a href="/x/" className="flex gap-4" id="main-content" aria-hidden="true">&rarr;</a>;`)).toEqual([]);
  });

  it("every allowlist entry exists and has a reason", () => {
    for (const [file, reason] of Object.entries(ALLOWLIST)) {
      expect(files, `${file} is allowlisted but not scanned`).toContain(file);
      expect(reason.length, `${file} needs a reason`).toBeGreaterThan(10);
    }
    for (const file of [...PENDING_C2B, ...PENDING_C2A]) expect(files, `${file} is listed but does not exist`).toContain(file);
  });

  it("holds no prose literals outside the allowlists", () => {
    const skipped = new Set([...Object.keys(ALLOWLIST), ...PENDING_C2B, ...PENDING_C2A]);
    const hits = files
      .filter((f) => !skipped.has(f))
      .flatMap((f) => findProse(f, readFileSync(path.join(repo, f), "utf8")));
    expect(hits).toEqual([]);
  });
});
