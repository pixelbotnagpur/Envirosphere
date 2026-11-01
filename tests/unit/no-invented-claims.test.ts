// @vitest-environment node
/**
 * Tripwire for claims the owner has NOT confirmed.
 *
 * The site may only state facts that are on the old envirosphere.co.in or that the owner
 * supplied (see .superpowers/sdd/branch-review.md, package B). Every pattern below is a claim
 * that was once found in the code and removed because nobody could verify it: certifications,
 * rankings, counts, laboratories, response times, places the firm is not known to have an office.
 * This test scans src/ and content/ (not test files) and fails with file:line for each hit.
 *
 * HOW TO REMOVE AN ENTRY: when the owner confirms a claim is true (and, where it is a number or
 * certificate, supplies the evidence), delete that one line from BLOCKLIST and put the claim in
 * content/ (rule 33). Never loosen a pattern to hide a hit: either remove the text or confirm it.
 */
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const BLOCKLIST: readonly RegExp[] = [
  /ISO 9001/i,
  /empanel+ed/i,
  /Fortune 500/i,
  /multinational/i,
  /zero[- ](non-)?compliance|zero compliance violations/i,
  /zero liquid discharge|\bZLD\b/i,
  /Delhi/i,
  /Nicobar/i,
  /pan-?india/i,
  /nationwide/i,
  /\b\d+\+?\s*years\b/i,
  /years? (of )?(practice|experience)/i,
  /one business day/i,
  /highest national/i,
  /Authentic Field Record/i,
  /clearances delivered/i,
  /certified testing/i,
  /fast turnaround/i,
  /in-house/i,
  /accredited (analytical )?lab/i,
  /\bNABL\b/,
  /state-of-the-art/i,
  /trusted by/i,
  /track record/i,
  /vanguard|pioneer|premier|best-in-class|world-class|unparalleled|uncompromising/i,
  /\d+\s?% (of|success|compliance|accuracy|savings|reduction|growth|more|less)/i,
  /9:30|Monday\s*[–-]\s*Saturday/i,
  /WhatsApp (Business|Messaging)|wa\.me/i,
  /\bFAEs?\b|Functional Area Expert/i,
  /Water Act|Air Act|Hazardous Waste|EIA Notification|\bCEMS\b/,
  /\b(SEAC|SEIAA|CPCB|MPCB|CGWA)\b/,
  /Category B\b/,
  /careers@envirosphere/i,
  /\.doc\b(?!x)(?! files are not accepted)/i,
];

const repo = process.cwd();
const TEXT = /\.(ts|tsx|yaml|yml|md)$/;
const SKIP = /(\.test\.|node_modules|\.next|[\\/]out[\\/])/;

function collect(dir: string): string[] {
  return (readdirSync(path.join(repo, dir), { recursive: true }) as string[])
    .filter((f) => TEXT.test(f) && !SKIP.test(f))
    .map((f) => path.join(dir, f));
}

const files = [...collect("src"), ...collect("content")];

function hits(): string[] {
  const out: string[] = [];
  for (const file of files) {
    const lines = readFileSync(path.join(repo, file), "utf8").split(/\r?\n/);
    lines.forEach((line, i) => {
      for (const pattern of BLOCKLIST) {
        if (pattern.test(line)) out.push(`${file.replace(/\\/g, "/")}:${i + 1} ${pattern} -> ${line.trim()}`);
      }
    });
  }
  return out;
}

describe("no invented claims in src/ or content/", () => {
  it("scans a meaningful number of files", () => {
    expect(files.length).toBeGreaterThan(40);
  });

  it("contains none of the blocklisted claims", () => {
    expect(hits()).toEqual([]);
  });
});
