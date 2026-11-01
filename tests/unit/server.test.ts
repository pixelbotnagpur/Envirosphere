// @vitest-environment node
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import http from "node:http";
import type { AddressInfo } from "node:net";
import os from "node:os";
import path from "node:path";
import { gunzipSync } from "node:zlib";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  CONTENT_SECURITY_POLICY,
  SECURITY_HEADERS,
  STRICT_TRANSPORT_SECURITY,
  cacheControlFor,
  contentTypeFor,
  createHandler,
} from "../../server.mjs";

const tmp = mkdtempSync(path.join(os.tmpdir(), "server-test-"));
const root = path.join(tmp, "site");
const outside = path.join(tmp, "outside");
const BIG_HTML = "<html><body>" + "<p>Envirosphere test page</p>".repeat(200) + "</body></html>";
const write = (rel: string, content: string | Buffer) => {
  const full = path.join(root, rel);
  mkdirSync(path.dirname(full), { recursive: true });
  writeFileSync(full, content);
};

let server: http.Server;
let port: number;

type Res = { status: number; headers: http.IncomingHttpHeaders; body: Buffer };
function get(rawPath: string, opts: { method?: string; headers?: Record<string, string> } = {}): Promise<Res> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      { host: "127.0.0.1", port, path: rawPath, method: opts.method ?? "GET", headers: opts.headers },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => resolve({ status: res.statusCode!, headers: res.headers, body: Buffer.concat(chunks) }));
      },
    );
    req.on("error", reject);
    req.end();
  });
}

beforeAll(async () => {
  write("index.html", BIG_HTML);
  write("index.txt", "x".repeat(2000));
  write("about/index.html", "<html>about</html>");
  write("404.html", "<html>custom not found</html>");
  write("robots.txt", "User-agent: *");
  write("sitemap.xml", "<urlset/>");
  write("tiny.css", "a{}");
  write("big.css", "a{color:red}".repeat(200));
  write("_next/static/chunks/a.js", "console.log(1);".repeat(200));
  write("_next/static/media/f.woff2", Buffer.alloc(3000, 1));
  write("media/photo.webp", Buffer.alloc(3000, 2));
  write("media/clip.mp4", Buffer.from("0123456789".repeat(10)));
  write("media/doc.pdf", Buffer.alloc(50, 3));
  write(".secret", "hidden");
  mkdirSync(outside, { recursive: true });
  writeFileSync(path.join(tmp, "secret.txt"), "TOP SECRET");
  writeFileSync(path.join(outside, "secret.txt"), "TOP SECRET");
  symlinkSync(outside, path.join(root, "link"), "junction");
  server = http.createServer(createHandler({ root, env: {} }));
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  port = (server.address() as AddressInfo).port;
});
afterAll(async () => {
  await new Promise((r) => server.close(r));
  rmSync(tmp, { recursive: true, force: true });
});

describe("path traversal", () => {
  const attempts = [
    "/../package.json",
    "/%2e%2e/package.json",
    "/%2E%2E/%2E%2E/package.json",
    "/..%2f..%2fetc/passwd",
    "/..%2F..%2Fsecret.txt",
    "/../secret.txt",
    "//../secret.txt",
    "///etc/passwd",
    "/..\\secret.txt",
    "/%5c..%5csecret.txt",
    "/%252e%252e/secret.txt",
    "/%2e%2e%2fsecret.txt",
    "/index.html%00.txt",
    "/%00",
    "/media/../../secret.txt",
    "/c:/windows/win.ini",
    "/.secret",
    "/%",
  ];
  for (const attempt of attempts) {
    it(`never leaks ${JSON.stringify(attempt)}`, async () => {
      const res = await get(attempt);
      expect(res.body.toString()).not.toContain("TOP SECRET");
      expect(res.body.toString()).not.toContain("hidden");
      expect(res.body.toString()).not.toContain('"name": "envirosphere"');
      expect([400, 404]).toContain(res.status);
    });
  }

  it("does not follow a symlink that points outside the root", async () => {
    const res = await get("/link/secret.txt");
    expect(res.status).toBe(404);
    expect(res.body.toString()).not.toContain("TOP SECRET");
  });

  it("collapses // inside the root and never redirects to another host", async () => {
    const res = await get("//about");
    expect(res.status).toBe(308);
    expect(res.headers.location).toBe("/about/");
  });
});

describe("routing", () => {
  it("serves / as index.html", async () => {
    const res = await get("/");
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toBe("text/html; charset=utf-8");
    expect(res.body.toString()).toBe(BIG_HTML);
    expect(res.headers["content-length"]).toBe(String(Buffer.byteLength(BIG_HTML)));
  });

  it("serves a directory with a trailing slash from its index.html", async () => {
    const res = await get("/about/");
    expect(res.status).toBe(200);
    expect(res.body.toString()).toBe("<html>about</html>");
  });

  it("redirects /about to /about/ with 308 and keeps the query string", async () => {
    const res = await get("/about?utm=1&x=2");
    expect(res.status).toBe(308);
    expect(res.headers.location).toBe("/about/?utm=1&x=2");
  });

  it("returns a real 404 status with the 404.html body", async () => {
    const res = await get("/nope/");
    expect(res.status).toBe(404);
    expect(res.headers["content-type"]).toBe("text/html; charset=utf-8");
    expect(res.body.toString()).toBe("<html>custom not found</html>");
  });

  it("does not treat a file URL with a trailing slash as the file", async () => {
    expect((await get("/robots.txt/")).status).toBe(404);
  });

  it("answers /health with ok and no caching", async () => {
    const res = await get("/health");
    expect(res.status).toBe(200);
    expect(res.body.toString()).toBe("ok");
    expect(res.headers["cache-control"]).toMatch(/no-cache/);
  });

  it("rejects non GET/HEAD methods with 405 and an Allow header", async () => {
    for (const method of ["POST", "PUT", "DELETE", "PATCH", "OPTIONS"]) {
      const res = await get("/", { method });
      expect(res.status).toBe(405);
      expect(res.headers.allow).toBe("GET, HEAD");
    }
  });

  it("HEAD returns the headers and no body", async () => {
    const res = await get("/about/", { method: "HEAD" });
    expect(res.status).toBe(200);
    expect(res.headers["content-length"]).toBe(String(Buffer.byteLength("<html>about</html>")));
    expect(res.body.length).toBe(0);
    const nf = await get("/nope/", { method: "HEAD" });
    expect(nf.status).toBe(404);
    expect(nf.body.length).toBe(0);
  });
});

describe("HTTPS redirect", () => {
  it("redirects with 308 when x-forwarded-proto is not https", async () => {
    const res = await get("/about/?a=1", { headers: { "x-forwarded-proto": "http", host: "example.com" } });
    expect(res.status).toBe(308);
    expect(res.headers.location).toBe("https://example.com/about/?a=1");
  });

  it("does not redirect https, HTTPS or when the header is absent", async () => {
    expect((await get("/", { headers: { "x-forwarded-proto": "https" } })).status).toBe(200);
    expect((await get("/", { headers: { "x-forwarded-proto": "HTTPS" } })).status).toBe(200);
    expect((await get("/")).status).toBe(200);
  });

  it("never redirects /health", async () => {
    const res = await get("/health", { headers: { "x-forwarded-proto": "http" } });
    expect(res.status).toBe(200);
  });

  it("encodes the path in the redirect: non-ASCII, DEL and spaces never cause a 500", async () => {
    const h = { "x-forwarded-proto": "http", host: "example.com" };
    for (const [raw, loc] of [
      ["/%E2%9C%93", "https://example.com/%E2%9C%93"],
      ["/%7F", "https://example.com/%7F"],
      ["/a%20b", "https://example.com/a%20b"],
      ["/a%20b/?q=1&r=%E2%9C%93", "https://example.com/a%20b/?q=1&r=%E2%9C%93"],
    ] as const) {
      const res = await get(raw, { headers: h });
      expect(res.status, raw).toBe(308);
      expect(res.headers.location, raw).toBe(loc);
    }
  });

  it("never turns the redirect into an open redirect", async () => {
    const h = { "x-forwarded-proto": "http", host: "example.com" };
    for (const raw of ["//evil.com", "//evil.com/x", "/%2F%2Fevil.com", "/%2Fevil.com", "///evil.com"]) {
      const res = await get(raw, { headers: h });
      if (res.status === 308) expect(res.headers.location, raw).toMatch(/^https:\/\/example\.com\//);
      expect(res.status, raw).not.toBe(500);
    }
  });

  it("does not build a redirect from an unusual Host header", async () => {
    const res = await get("/", { headers: { "x-forwarded-proto": "http", host: "evil.com/path" } });
    expect(res.headers.location ?? "").not.toContain("evil.com/path");
  });
});

describe("caching and validators", () => {
  it("applies the cache rule per path class", async () => {
    const cc = async (p: string) => (await get(p)).headers["cache-control"];
    expect(await cc("/_next/static/chunks/a.js")).toBe("public, max-age=31536000, immutable");
    expect(await cc("/_next/static/media/f.woff2")).toBe("public, max-age=31536000, immutable");
    expect(await cc("/")).toBe("no-cache");
    expect(await cc("/about/")).toBe("no-cache");
    expect(await cc("/robots.txt")).toBe("no-cache");
    expect(await cc("/sitemap.xml")).toBe("no-cache");
    expect(await cc("/index.txt")).toBe("no-cache");
    expect(await cc("/media/photo.webp")).toBe("public, max-age=86400, must-revalidate");
    expect(await cc("/media/clip.mp4")).toBe("public, max-age=86400, must-revalidate");
    expect(await cc("/media/doc.pdf")).toBe("public, max-age=86400, must-revalidate");
    expect(await cc("/nope/")).toBe("no-cache");
  });

  it("sends ETag and Last-Modified and answers 304 to a matching If-None-Match", async () => {
    const first = await get("/about/");
    expect(first.headers.etag).toBeTruthy();
    expect(first.headers["last-modified"]).toBeTruthy();
    const second = await get("/about/", { headers: { "if-none-match": first.headers.etag! } });
    expect(second.status).toBe(304);
    expect(second.body.length).toBe(0);
    expect(second.headers["content-security-policy"]).toBe(CONTENT_SECURITY_POLICY);
    const other = await get("/about/", { headers: { "if-none-match": 'W/"other"' } });
    expect(other.status).toBe(200);
  });

  it("answers 304 to a fresh If-Modified-Since", async () => {
    const first = await get("/about/");
    const res = await get("/about/", { headers: { "if-modified-since": first.headers["last-modified"]! } });
    expect(res.status).toBe(304);
  });
});

describe("gzip", () => {
  it("compresses large text when the client accepts gzip, with Vary", async () => {
    const res = await get("/", { headers: { "accept-encoding": "gzip, br" } });
    expect(res.status).toBe(200);
    expect(res.headers["content-encoding"]).toBe("gzip");
    expect(res.headers.vary).toMatch(/Accept-Encoding/i);
    expect(res.body.length).toBeLessThan(BIG_HTML.length);
    expect(res.headers["content-length"]).toBe(String(res.body.length));
    expect(gunzipSync(res.body).toString()).toBe(BIG_HTML);
    expect((await get("/", { headers: { "accept-encoding": "gzip" } })).body.equals(res.body)).toBe(true);
  });

  it("does not compress when gzip is not accepted, but still sets Vary", async () => {
    const res = await get("/", { headers: { "accept-encoding": "identity" } });
    expect(res.headers["content-encoding"]).toBeUndefined();
    expect(res.headers.vary).toMatch(/Accept-Encoding/i);
    expect(res.body.toString()).toBe(BIG_HTML);
  });

  it("skips small text files and already-compressed binary types", async () => {
    const h = { "accept-encoding": "gzip" };
    expect((await get("/tiny.css", { headers: h })).headers["content-encoding"]).toBeUndefined();
    expect((await get("/media/photo.webp", { headers: h })).headers["content-encoding"]).toBeUndefined();
    expect((await get("/_next/static/media/f.woff2", { headers: h })).headers["content-encoding"]).toBeUndefined();
    expect((await get("/big.css", { headers: h })).headers["content-encoding"]).toBe("gzip");
  });
});

describe("range requests", () => {
  it("serves a partial response for a byte range", async () => {
    const res = await get("/media/clip.mp4", { headers: { range: "bytes=5-14" } });
    expect(res.status).toBe(206);
    expect(res.headers["content-range"]).toBe("bytes 5-14/100");
    expect(res.body.toString()).toBe("56789" + "01234");
    expect(res.headers["accept-ranges"]).toBe("bytes");
  });

  it("supports suffix ranges and rejects unsatisfiable ones with 416", async () => {
    const suffix = await get("/media/clip.mp4", { headers: { range: "bytes=-4" } });
    expect(suffix.status).toBe(206);
    expect(suffix.body.toString()).toBe("6789");
    const bad = await get("/media/clip.mp4", { headers: { range: "bytes=500-600" } });
    expect(bad.status).toBe(416);
    expect(bad.headers["content-range"]).toBe("bytes */100");
  });
});

describe("content types", () => {
  const cases: [string, string][] = [
    ["a.html", "text/html; charset=utf-8"],
    ["a.css", "text/css; charset=utf-8"],
    ["a.js", "text/javascript; charset=utf-8"],
    ["a.mjs", "text/javascript; charset=utf-8"],
    ["a.json", "application/json; charset=utf-8"],
    ["a.webmanifest", "application/manifest+json; charset=utf-8"],
    ["a.txt", "text/plain; charset=utf-8"],
    ["a.xml", "application/xml; charset=utf-8"],
    ["a.svg", "image/svg+xml; charset=utf-8"],
    ["a.png", "image/png"],
    ["a.jpg", "image/jpeg"],
    ["a.webp", "image/webp"],
    ["a.avif", "image/avif"],
    ["a.gif", "image/gif"],
    ["a.ico", "image/x-icon"],
    ["a.woff", "font/woff"],
    ["a.woff2", "font/woff2"],
    ["a.pdf", "application/pdf"],
    ["a.mp4", "video/mp4"],
    ["a.unknown", "application/octet-stream"],
  ];
  for (const [file, type] of cases) {
    it(`${file} -> ${type}`, () => expect(contentTypeFor(file)).toBe(type));
  }
  it("cacheControlFor handles extension-less paths", () => {
    expect(cacheControlFor("/about/")).toBe("no-cache");
    expect(cacheControlFor("/x")).toBe("no-cache");
  });
});

describe("security headers", () => {
  const check = (res: Res) => {
    for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
      expect(res.headers[name.toLowerCase()], name).toBe(value);
    }
  };
  it("are present on 200, 308, 404, 405, 400, 304, 416 and health", async () => {
    check(await get("/"));
    check(await get("/about"));
    check(await get("/nope/"));
    check(await get("/", { method: "POST" }));
    check(await get("/%2e%2e/x"));
    check(await get("/health"));
    check(await get("/", { headers: { "x-forwarded-proto": "http", host: "example.com" } }));
    const first = await get("/about/");
    check(await get("/about/", { headers: { "if-none-match": first.headers.etag! } }));
    check(await get("/media/clip.mp4", { headers: { range: "bytes=999-" } }));
  });
  it("lets HSTS_MAX_AGE raise the staged value", async () => {
    const s = http.createServer(createHandler({ root, env: { HSTS_MAX_AGE: "86400" } }));
    await new Promise<void>((r) => s.listen(0, "127.0.0.1", r));
    const p = (s.address() as AddressInfo).port;
    const res = await fetch(`http://127.0.0.1:${p}/`);
    expect(res.headers.get("strict-transport-security")).toBe("max-age=86400");
    await new Promise((r) => s.close(r));
  });
});

describe("single source of truth with public/.htaccess", () => {
  const htaccess = readFileSync(path.join(process.cwd(), "public", ".htaccess"), "utf8");
  const header = (name: string) => new RegExp(`Header always set ${name}\\s+"([^"]+)"`).exec(htaccess)?.[1];
  it("mirrors every security header value exactly", () => {
    expect(CONTENT_SECURITY_POLICY).toBe(header("Content-Security-Policy"));
    expect(STRICT_TRANSPORT_SECURITY).toBe(header("Strict-Transport-Security"));
    for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
      expect(value, name).toBe(header(name));
    }
    expect(Object.keys(SECURITY_HEADERS)).toHaveLength(6);
  });
});

describe("server.mjs dependencies and scripts", () => {
  it("imports only node: built-ins (no runtime dependency needed on Hostinger)", () => {
    const src = readFileSync(path.join(process.cwd(), "server.mjs"), "utf8");
    const specs = [...src.matchAll(/(?:from|import)\s*\(?\s*["']([^"']+)["']/g)].map((m) => m[1]);
    expect(specs.length).toBeGreaterThan(0);
    for (const spec of specs) expect(spec.startsWith("node:"), spec).toBe(true);
  });
  it("package.json starts the server and pins the Node engine", () => {
    const pkg = JSON.parse(readFileSync(path.join(process.cwd(), "package.json"), "utf8"));
    expect(pkg.engines.node).toBe(">=24");
    expect(pkg.scripts.start).toBe("node server.mjs");
  });
});

describe("smoke: real server on an ephemeral port", () => {
  it("answers fetch() for pages, 404, redirects and health", async () => {
    const res = await fetch(`http://127.0.0.1:${port}/about/`);
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("<html>about</html>");
    expect((await fetch(`http://127.0.0.1:${port}/missing/`)).status).toBe(404);
    expect(await (await fetch(`http://127.0.0.1:${port}/health`)).text()).toBe("ok");
    const redirected = await fetch(`http://127.0.0.1:${port}/about`, { redirect: "manual" });
    expect(redirected.status).toBe(308);
  });
});
