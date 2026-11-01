import { describe, expect, it } from "vitest";
import { checkLaunchEnv, parseEnvFile } from "../../scripts/check-launch.mjs";

const good = {
  NEXT_PUBLIC_FORMS_ENDPOINT: "https://script.google.com/macros/s/AKfycbxREAL/exec",
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: "0x4AAAAAAAreal",
};

describe("checkLaunchEnv", () => {
  it("passes when both values are real", () => {
    expect(checkLaunchEnv(good)).toEqual({ ok: true, problems: [] });
  });

  it("fails with a plain message when the endpoint is missing or blank", () => {
    for (const env of [{ ...good, NEXT_PUBLIC_FORMS_ENDPOINT: undefined }, { ...good, NEXT_PUBLIC_FORMS_ENDPOINT: "  " }]) {
      const r = checkLaunchEnv(env);
      expect(r.ok).toBe(false);
      expect(r.problems.join(" ")).toContain("NEXT_PUBLIC_FORMS_ENDPOINT is missing");
    }
  });

  it("fails when the endpoint is the e2e test endpoint or not https", () => {
    const e2e = checkLaunchEnv({ ...good, NEXT_PUBLIC_FORMS_ENDPOINT: "https://script.google.com/macros/s/e2e/exec" });
    expect(e2e.ok).toBe(false);
    expect(e2e.problems[0]).toContain("test endpoint");
    expect(checkLaunchEnv({ ...good, NEXT_PUBLIC_FORMS_ENDPOINT: "http://x.example/exec" }).ok).toBe(false);
  });

  it("fails when the Turnstile site key is missing or a Cloudflare dummy key", () => {
    const missing = checkLaunchEnv({ ...good, NEXT_PUBLIC_TURNSTILE_SITE_KEY: "" });
    expect(missing.ok).toBe(false);
    expect(missing.problems[0]).toContain("launch requirement");
    expect(checkLaunchEnv({ ...good, NEXT_PUBLIC_TURNSTILE_SITE_KEY: "1x00000000000000000000AA" }).ok).toBe(false);
  });

  it("reports every problem at once", () => {
    expect(checkLaunchEnv({}).problems).toHaveLength(2);
  });
});

describe("parseEnvFile", () => {
  it("reads KEY=value lines, ignoring comments, blanks and quotes", () => {
    const parsed = parseEnvFile(
      '# comment\n\nNEXT_PUBLIC_FORMS_ENDPOINT="https://x.example/exec"\nNEXT_PUBLIC_TURNSTILE_SITE_KEY=abc # note\r\nOTHER=\n',
    );
    expect(parsed).toEqual({
      NEXT_PUBLIC_FORMS_ENDPOINT: "https://x.example/exec",
      NEXT_PUBLIC_TURNSTILE_SITE_KEY: "abc",
      OTHER: "",
    });
  });
});
