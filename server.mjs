// Tiny static file server for the Next.js static export (out/), for Hostinger's Node.js plan.
// Node built-ins only. No Next.js server features, no runtime dependencies (rule 70).
// Run: `pnpm start` (or `node server.mjs`). PORT is provided by Hostinger; SITE_ROOT overrides ./out.
// Optional: HSTS_MAX_AGE (seconds) raises the staged HSTS value without editing this file.
import { createReadStream, existsSync, realpathSync, statSync } from "node:fs";
import { realpath, readFile, stat } from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { gzip } from "node:zlib";

// ===== SECURITY HEADERS: mirror of public/.htaccess (that file is the single source of truth) =====
// tests/unit/server.test.ts fails if CSP, HSTS or the other values below drift from .htaccess.
export const CONTENT_SECURITY_POLICY =
  "default-src 'self'; script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https://script.google.com https://script.googleusercontent.com https://challenges.cloudflare.com; frame-src https://challenges.cloudflare.com; frame-ancestors 'self'; object-src 'none'; base-uri 'self'; form-action 'self';";

// HSTS is STAGED: max-age=300 (5 min). After HTTPS is confirmed on every page for a week, raise it
// (86400, then 2592000, then 31536000), either here or with the HSTS_MAX_AGE environment variable.
// Add includeSubDomains only when ALL subdomains serve HTTPS; add preload only as a deliberate last
// step (it is hard to undo). See docs/DEPLOY-HOSTINGER.md.
export const STRICT_TRANSPORT_SECURITY = "max-age=300";

export const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "SAMEORIGIN",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Strict-Transport-Security": STRICT_TRANSPORT_SECURITY,
  "Content-Security-Policy": CONTENT_SECURITY_POLICY,
};
// ===== END SECURITY HEADERS =====

const TEXT_TYPES = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".json": "application/json",
  ".map": "application/json",
  ".webmanifest": "application/manifest+json",
  ".txt": "text/plain",
  ".xml": "application/xml",
  ".svg": "image/svg+xml",
};
const BINARY_TYPES = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".pdf": "application/pdf",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
};

const GZIP_MIN_BYTES = 1024;
const GZIP_CACHE_MAX_ENTRIES = 200;
const GZIP_CACHE_MAX_BYTES = 32 * 1024 * 1024;
const NO_CACHE = "no-cache";
const IMMUTABLE = "public, max-age=31536000, immutable";
const MEDIA_CACHE = "public, max-age=86400, must-revalidate";

const gzipAsync = (buf) =>
  new Promise((resolve, reject) => gzip(buf, { level: 6 }, (e, out) => (e ? reject(e) : resolve(out))));

/** Content-Type for a file name (text types get charset=utf-8). */
export function contentTypeFor(file) {
  const ext = path.extname(file).toLowerCase();
  if (TEXT_TYPES[ext]) return `${TEXT_TYPES[ext]}; charset=utf-8`;
  return BINARY_TYPES[ext] ?? "application/octet-stream";
}

const isCompressible = (file) => path.extname(file).toLowerCase() in TEXT_TYPES;

/** Cache-Control for a URL path (forward slashes, already decoded). */
export function cacheControlFor(urlPath) {
  if (urlPath.startsWith("/_next/static/")) return IMMUTABLE;
  const ext = path.extname(urlPath).toLowerCase();
  if (ext === "" || ext === ".html" || ext === ".txt" || ext === ".xml") return NO_CACHE;
  return MEDIA_CACHE;
}

/**
 * Turns a raw request target into safe path segments, or null when it is malformed or hostile.
 * Rejects: non-origin-form targets, NUL, backslashes, double-encoding, "." / ".." segments,
 * Windows drive/stream colons and hidden files (except .well-known). Empty segments ("//") collapse.
 */
export function parseTarget(rawUrl) {
  if (typeof rawUrl !== "string" || !rawUrl.startsWith("/")) return null;
  const q = rawUrl.indexOf("?");
  const rawPath = q === -1 ? rawUrl : rawUrl.slice(0, q);
  const search = q === -1 ? "" : rawUrl.slice(q).split("#")[0];
  if (/[\\\0]/.test(rawPath)) return null;
  let decoded;
  try {
    decoded = decodeURIComponent(rawPath);
  } catch {
    return null;
  }
  if (/[\\\0]/.test(decoded) || /%[0-9a-f]{2}/i.test(decoded) || /[\u0000-\u001f]/.test(decoded)) return null;
  const parts = decoded.split("/");
  const segments = [];
  for (const part of parts) {
    if (part === "") continue;
    if (part === "." || part === "..") return null;
    if (part.includes(":")) return null;
    if (part.startsWith(".") && part !== ".well-known") return null;
    segments.push(part);
  }
  const trailingSlash = decoded.endsWith("/") || segments.length === 0;
  const urlPath = "/" + segments.join("/") + (trailingSlash && segments.length ? "/" : "");
  return { segments, trailingSlash, urlPath, search };
}

/**
 * Builds a Location value from a parsed target: path segments are re-encoded (so non-ASCII, DEL or spaces
 * never make an invalid header) and the raw query keeps only printable ASCII. Always starts with a single "/".
 */
function locationFor(target, { slash = target.trailingSlash } = {}) {
  const pathPart = "/" + target.segments.map(encodeURIComponent).join("/") + (slash && target.segments.length ? "/" : "");
  const search = target.search.replace(/[^!-~]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase().padStart(2, "0"));
  return pathPart + search;
}

const inside = (rootReal, p) => p === rootReal || p.startsWith(rootReal + path.sep);

async function statSafe(p) {
  try {
    return await stat(p);
  } catch {
    return null;
  }
}

/** Resolves a parsed target inside rootReal. Returns { file, stats } | { redirect } | null. */
async function resolveTarget(rootReal, target) {
  let candidate = path.join(rootReal, ...target.segments);
  if (!inside(rootReal, candidate)) return null;
  let stats = await statSafe(candidate);
  if (!stats) return null;
  if (stats.isDirectory()) {
    const index = path.join(candidate, "index.html");
    const indexStats = await statSafe(index);
    if (!indexStats || !indexStats.isFile()) return null;
    if (!target.trailingSlash) return { redirect: locationFor(target, { slash: true }) };
    candidate = index;
    stats = indexStats;
  } else if (target.trailingSlash && target.segments.length) {
    return null; // "/robots.txt/" is not a file
  }
  if (!stats.isFile()) return null;
  let real;
  try {
    real = await realpath(candidate); // blocks symlinks that point outside the root
  } catch {
    return null;
  }
  if (!inside(rootReal, real)) return null;
  return { file: real, stats, servedPath: target.segments.length ? "/" + target.segments.join("/") : "/" };
}

const etagFor = (s) => `W/"${s.size.toString(16)}-${Math.floor(s.mtimeMs).toString(16)}"`;

function notModified(req, etag, mtime) {
  const inm = req.headers["if-none-match"];
  if (inm) {
    if (inm.trim() === "*") return true;
    const bare = (v) => v.trim().replace(/^W\//, "");
    return inm.split(",").some((t) => bare(t) === bare(etag));
  }
  const ims = req.headers["if-modified-since"];
  if (ims) {
    const t = Date.parse(ims);
    return !Number.isNaN(t) && Math.floor(mtime.getTime() / 1000) * 1000 <= t;
  }
  return false;
}

/** Parses a single "bytes=a-b" range. Returns {start,end} | "invalid" | null (ignore header). */
function parseRange(header, size) {
  const m = /^bytes=(\d*)-(\d*)$/.exec((header ?? "").trim());
  if (!m || (m[1] === "" && m[2] === "")) return null;
  let start;
  let end;
  if (m[1] === "") {
    const n = Number(m[2]);
    if (n === 0) return "invalid";
    start = Math.max(size - n, 0);
    end = size - 1;
  } else {
    start = Number(m[1]);
    end = m[2] === "" ? size - 1 : Math.min(Number(m[2]), size - 1);
  }
  if (start >= size || start > end) return "invalid";
  return { start, end };
}

/**
 * Builds the request handler. `root` is the folder to serve; `env` supplies optional overrides
 * (HSTS_MAX_AGE); `log` receives one access-log line per request (default: silent).
 */
export function createHandler({ root, env = {}, log = () => {} }) {
  const rootReal = realpathSync(root);
  const gzipCache = new Map(); // key: path|mtime|size -> Buffer, oldest first
  let gzipCacheBytes = 0;

  const securityHeaders = { ...SECURITY_HEADERS };
  if (/^\d+$/.test(String(env.HSTS_MAX_AGE ?? ""))) {
    securityHeaders["Strict-Transport-Security"] = `max-age=${env.HSTS_MAX_AGE}`;
  }

  async function gzipped(file, stats) {
    const key = `${file}|${stats.mtimeMs}|${stats.size}`;
    const hit = gzipCache.get(key);
    if (hit) return hit;
    const out = await gzipAsync(await readFile(file));
    if (out.length <= GZIP_CACHE_MAX_BYTES) {
      gzipCache.set(key, out);
      gzipCacheBytes += out.length;
      for (const [k, v] of gzipCache) {
        if (gzipCache.size <= GZIP_CACHE_MAX_ENTRIES && gzipCacheBytes <= GZIP_CACHE_MAX_BYTES) break;
        gzipCache.delete(k);
        gzipCacheBytes -= v.length;
      }
    }
    return out;
  }

  function send(req, res, status, headers, body) {
    const buf = typeof body === "string" ? Buffer.from(body) : body;
    res.writeHead(status, {
      ...securityHeaders,
      ...headers,
      "Content-Length": buf ? buf.length : 0,
    });
    res.end(req.method === "HEAD" || !buf ? undefined : buf);
  }

  const redirect = (req, res, location) =>
    send(req, res, 308, { Location: location, "Cache-Control": NO_CACHE }, "");

  async function notFound(req, res) {
    let body = "Not found";
    let type = "text/plain; charset=utf-8";
    const page = await statSafe(path.join(rootReal, "404.html"));
    if (page?.isFile()) {
      body = await readFile(path.join(rootReal, "404.html"));
      type = "text/html; charset=utf-8";
    }
    send(req, res, 404, { "Content-Type": type, "Cache-Control": NO_CACHE }, body);
  }

  async function serveFile(req, res, found) {
    const { file, stats, servedPath } = found;
    const etag = etagFor(stats);
    const type = contentTypeFor(file);
    const base = {
      "Content-Type": type,
      "Cache-Control": cacheControlFor(servedPath),
      ETag: etag,
      "Last-Modified": stats.mtime.toUTCString(),
    };
    const compressible = isCompressible(file) && stats.size >= GZIP_MIN_BYTES;
    if (isCompressible(file)) base.Vary = "Accept-Encoding";
    if (notModified(req, etag, stats.mtime)) {
      const headers304 = { ...base };
      delete headers304["Content-Type"];
      res.writeHead(304, { ...securityHeaders, ...headers304 });
      return res.end();
    }
    if (compressible && /\bgzip\b/i.test(String(req.headers["accept-encoding"] ?? ""))) {
      const body = await gzipped(file, stats);
      return send(req, res, 200, { ...base, "Content-Encoding": "gzip" }, body);
    }
    base["Accept-Ranges"] = "bytes";
    let status = 200;
    let start = 0;
    let end = stats.size - 1;
    const rangeHeader = req.headers.range;
    if (rangeHeader && !req.headers["if-range"] && stats.size > 0) {
      const range = parseRange(rangeHeader, stats.size);
      if (range === "invalid") {
        res.writeHead(416, { ...securityHeaders, ...base, "Content-Range": `bytes */${stats.size}`, "Content-Length": 0 });
        return res.end();
      }
      if (range) {
        status = 206;
        ({ start, end } = range);
        base["Content-Range"] = `bytes ${start}-${end}/${stats.size}`;
      }
    }
    const length = stats.size === 0 ? 0 : end - start + 1;
    res.writeHead(status, { ...securityHeaders, ...base, "Content-Length": length });
    if (req.method === "HEAD" || length === 0) return res.end();
    await new Promise((resolve) => {
      const stream = createReadStream(file, { start, end });
      stream.on("error", () => {
        res.destroy();
        resolve();
      });
      res.on("close", () => {
        stream.destroy();
        resolve();
      });
      stream.pipe(res);
    });
  }

  async function route(req, res) {
    if (req.method !== "GET" && req.method !== "HEAD") {
      return send(req, res, 405, { Allow: "GET, HEAD", "Content-Type": "text/plain; charset=utf-8" }, "Method not allowed");
    }
    const target = parseTarget(req.url);
    if (!target) {
      return send(req, res, 400, { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": NO_CACHE }, "Bad request");
    }
    if (target.urlPath === "/health") {
      return send(req, res, 200, { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache, no-store" }, "ok");
    }
    const proto = req.headers["x-forwarded-proto"];
    if (proto !== undefined && String(proto).split(",")[0].trim().toLowerCase() !== "https") {
      const host = String(req.headers.host ?? "");
      if (/^[a-z0-9.-]+(:\d+)?$/i.test(host)) {
        return redirect(req, res, `https://${host}${locationFor(target)}`);
      }
    }
    const found = await resolveTarget(rootReal, target);
    if (!found) return notFound(req, res);
    if (found.redirect) return redirect(req, res, found.redirect);
    return serveFile(req, res, found);
  }

  return async function handler(req, res) {
    const started = Date.now();
    res.on("finish", () => {
      const p = String(req.url ?? "").split("?")[0].slice(0, 200);
      log(`${req.method} ${JSON.stringify(p)} ${res.statusCode} ${Date.now() - started}ms`);
    });
    try {
      await route(req, res);
    } catch (err) {
      log(`error: ${err instanceof Error ? err.message : "unknown"}`);
      if (res.headersSent) {
        res.destroy();
        return;
      }
      try {
        send(req, res, 500, { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": NO_CACHE }, "Internal server error");
      } catch {
        res.destroy();
      }
    }
  };
}

function main() {
  // Default: the "out" folder next to this file, so it works whatever folder the host starts it from.
  const root = process.env.SITE_ROOT ? path.resolve(process.env.SITE_ROOT) : fileURLToPath(new URL("./out", import.meta.url));
  if (!existsSync(root) || !statSync(root).isDirectory()) {
    console.error(`\nCannot start: the folder "${root}" does not exist.\nRun "pnpm build" first (it creates the "out" folder), or set SITE_ROOT.\n`);
    process.exit(1);
  }
  // PORT is provided by Hostinger. "--port N" is for local use (pnpm preview), cross-platform.
  const flag = process.argv.indexOf("--port");
  const port = Number(flag > 0 ? process.argv[flag + 1] : process.env.PORT) || 3000;
  const server = http.createServer(createHandler({ root, env: process.env, log: (line) => console.log(line) }));
  server.on("clientError", (_err, socket) => socket.destroy());
  server.listen(port, "0.0.0.0", () => console.log(`Serving ${root} on http://0.0.0.0:${port}`));
  const shutdown = (signal) => {
    console.log(`${signal} received, shutting down`);
    server.close(() => process.exit(0));
    server.closeIdleConnections();
    setTimeout(() => process.exit(0), 10_000).unref();
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) main();
