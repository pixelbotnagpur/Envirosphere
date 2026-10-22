import { readFileSync } from "node:fs";
import { parse } from "yaml";

/** Reads content/site.yaml so e2e assertions never hardcode interface strings. */
export const site = parse(readFileSync("content/site.yaml", "utf8")) as {
  ui: {
    skipToContent: string;
    openMenu: string;
    notFound: { heading: string };
  };
};
