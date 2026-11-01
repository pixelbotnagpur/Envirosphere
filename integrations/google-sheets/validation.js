/**
 * Pure validation helpers for the Apps Script form endpoint.
 *
 * Plain JavaScript with no imports and no Apps Script globals, so the same file runs
 * in the Apps Script editor (add it as a second file next to Code.gs) and in the
 * Vitest unit tests (tests/unit/apps-script-validation.test.ts).
 */

/** Keep in sync with the file names in content/services/*.md (a unit test enforces this). */
var SERVICE_SLUGS = [
  "crz-clearance",
  "emp-implementation",
  "environmental-audit",
  "environmental-clearance",
  "environmental-due-diligence",
  "environmental-monitoring",
  "esg-audit",
  "forest-clearance",
  "post-ec-compliance",
  "spcb-compliance",
  "statutory-approvals",
  "water-audit",
  "water-wastewater-treatment",
  "general",
];

var LIMITS = {
  name: 100,
  organization: 100,
  email: 120,
  phone: 20,
  service: 60,
  role: 120,
  message: 2000,
  coverLetter: 2000,
  turnstileToken: 2048,
  cvName: 255,
};

var MIN_FILL_MS = 3000;
var MAX_FILL_MS = 24 * 60 * 60 * 1000;
var CV_MAX_BYTES = 5 * 1024 * 1024;
/** Base64 grows data by 4/3; refuse anything clearly larger before decoding it. */
var CV_MAX_BASE64_CHARS = Math.ceil((CV_MAX_BYTES * 4) / 3) + 8;
var MAX_BODY_CHARS = CV_MAX_BASE64_CHARS + 20000;

var GLOBAL_LIMIT_PER_MINUTE = 20;
var EMAIL_LIMIT_PER_WINDOW = 5;

var CV_TYPES = {
  pdf: { mime: "application/pdf", magic: [0x25, 0x50, 0x44, 0x46] },
  docx: {
    mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    magic: [0x50, 0x4b, 0x03, 0x04],
  },
};

var PHONE_PATTERN = /^(?=(?:\D*\d){8})\+?[0-9 ()-]{8,20}$/;
var EMAIL_PATTERN = /^[^\s@<>()",;:]+@[^\s@<>()",;:]+\.[^\s@<>()",;:]{2,}$/;
/** Letters/digits (any script) first, then common title punctuation. No = @ or control characters. */
var ROLE_PATTERN = /^[\p{L}\p{N}][\p{L}\p{N}\p{M} .,:&()'\u2019\/+\u2013\u2014-]*$/u;

/** Neutralises spreadsheet formulas and removes control characters. Returns a trimmed string. */
function sanitize(val) {
  if (val === null || val === undefined) return "";
  var raw = String(val).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "");
  var str = raw.trim();
  if (/^[\t\r]/.test(raw) || /^[=+\-@]/.test(str)) {
    return "'" + str;
  }
  return str;
}

/** Phone cell value: a leading apostrophe makes Sheets keep it as text (no formula or number conversion). */
function phoneCell(phone) {
  return "'" + String(phone === null || phone === undefined ? "" : phone).trim();
}

function isValidEmail(email) {
  return (
    typeof email === "string" &&
    email.length <= LIMITS.email &&
    !/[\r\n]/.test(email) &&
    EMAIL_PATTERN.test(email)
  );
}

/**
 * `fillMs` is the number of milliseconds the visitor had the form open, measured in the
 * browser (performance.now), so Google's clock and the visitor's clock never get compared.
 * Must be a finite integer between 3 s and 24 h. Missing or invalid values fail.
 */
function checkFillTime(fillMs) {
  if (typeof fillMs !== "number" || !isFinite(fillMs) || Math.floor(fillMs) !== fillMs) return false;
  return fillMs >= MIN_FILL_MS && fillMs <= MAX_FILL_MS;
}

function isHoneypotTripped(payload) {
  return Boolean(payload && payload.website && String(payload.website).trim().length > 0);
}

function tooLong(value, max) {
  return typeof value === "string" && value.length > max;
}

function asText(value) {
  return typeof value === "string" ? value : value === null || value === undefined ? "" : null;
}

/**
 * Validates and cleans an inquiry. Returns { ok: true, clean } or { ok: false, message }.
 * Cheap checks only; safe to run before taking any lock.
 */
function validateInquiry(payload) {
  var fields = ["name", "organization", "email", "phone", "service", "message"];
  for (var i = 0; i < fields.length; i++) {
    var text = asText(payload[fields[i]]);
    if (text === null) return { ok: false, message: "Invalid form data" };
    if (tooLong(text, LIMITS[fields[i]])) {
      return { ok: false, message: "One of the fields is too long (" + fields[i] + ")" };
    }
  }
  var email = String(payload.email || "").trim();
  var phone = String(payload.phone || "").trim();
  var name = sanitize(payload.name);
  var message = sanitize(payload.message);
  if (!name || !email || !phone || !message) {
    return { ok: false, message: "Required fields missing (Name, Email, Phone, Message)" };
  }
  if (!isValidEmail(email)) return { ok: false, message: "Please enter a valid email address" };
  if (!PHONE_PATTERN.test(phone)) return { ok: false, message: "Please enter a valid phone number" };
  var service = String(payload.service || "").trim();
  if (SERVICE_SLUGS.indexOf(service) === -1) {
    return { ok: false, message: "Please select a valid service" };
  }
  return {
    ok: true,
    clean: {
      name: name,
      organization: sanitize(payload.organization || "N/A"),
      email: email,
      phone: phone,
      service: service,
      message: message,
    },
  };
}

/**
 * Validates the text fields of an application. `allowedRoles` is an array of role titles
 * or null when the owner has not set the ALLOWED_ROLES script property. The application form is
 * only reachable from a listed job, so there is no generic role.
 */
function validateApplication(payload, allowedRoles) {
  var fields = ["name", "email", "phone", "role", "coverLetter"];
  for (var i = 0; i < fields.length; i++) {
    var text = asText(payload[fields[i]]);
    if (text === null) return { ok: false, message: "Invalid form data" };
    if (tooLong(text, LIMITS[fields[i]])) {
      return { ok: false, message: "One of the fields is too long (" + fields[i] + ")" };
    }
  }
  var name = sanitize(payload.name);
  var email = String(payload.email || "").trim();
  var phone = String(payload.phone || "").trim();
  var role = String(payload.role || "").trim();
  if (!name || !email || !phone || !role || !payload.cvFile) {
    return { ok: false, message: "Required application fields or CV document missing" };
  }
  if (!isValidEmail(email)) return { ok: false, message: "Please enter a valid email address" };
  if (!PHONE_PATTERN.test(phone)) return { ok: false, message: "Please enter a valid phone number" };
  if (!ROLE_PATTERN.test(role)) return { ok: false, message: "Please select a valid position" };
  if (allowedRoles && allowedRoles.indexOf(role) === -1) {
    return { ok: false, message: "Please select a valid position" };
  }
  return {
    ok: true,
    clean: {
      name: name,
      email: email,
      phone: phone,
      role: sanitize(role),
      coverLetter: sanitize(payload.coverLetter || "N/A"),
    },
  };
}

/** Own-property lookup so names like "constructor" or "__proto__" never resolve to a type. */
function cvTypeFor(ext) {
  return Object.prototype.hasOwnProperty.call(CV_TYPES, ext) ? CV_TYPES[ext] : null;
}

function extensionOf(fileName) {
  var match = /\.([A-Za-z0-9]+)$/.exec(String(fileName || ""));
  return match ? match[1].toLowerCase() : "";
}

function bytesStartWith(bytes, magic) {
  if (!bytes || bytes.length < magic.length) return false;
  for (var i = 0; i < magic.length; i++) {
    // Apps Script returns signed bytes (-128..127); mask to 0..255.
    if ((bytes[i] & 0xff) !== magic[i]) return false;
  }
  return true;
}

/**
 * Checks a CV before it is decoded. Returns { ok: true, ext, mime } or { ok: false, message }.
 */
function checkCvMetadata(cv) {
  if (!cv || typeof cv !== "object") return { ok: false, message: "CV document missing" };
  var ext = extensionOf(cv.name);
  var type = cvTypeFor(ext);
  if (!type) return { ok: false, message: "CV must be a PDF or DOCX file" };
  if (typeof cv.name !== "string" || cv.name.length > LIMITS.cvName) {
    return { ok: false, message: "CV file name is too long" };
  }
  if (cv.type !== type.mime) {
    return { ok: false, message: "CV file type does not match its extension" };
  }
  if (typeof cv.data !== "string" || cv.data.length === 0 || cv.data.length > CV_MAX_BASE64_CHARS) {
    return { ok: false, message: "CV file must be 5 MB or smaller" };
  }
  if (!/^[A-Za-z0-9+\/=\s]+$/.test(cv.data)) {
    return { ok: false, message: "CV file data is not valid" };
  }
  return { ok: true, ext: ext, mime: type.mime };
}

/** Checks the decoded bytes: size cap and magic bytes matching the extension. */
function checkCvBytes(bytes, ext) {
  if (!bytes || bytes.length === 0) return { ok: false, message: "CV file is empty" };
  if (bytes.length > CV_MAX_BYTES) return { ok: false, message: "CV file must be 5 MB or smaller" };
  var type = cvTypeFor(ext);
  if (!type || !bytesStartWith(bytes, type.magic)) {
    return { ok: false, message: "CV file content does not match its type" };
  }
  return { ok: true };
}

/** Stored name: timestamp + sanitised base name, never the raw user text. */
function safeCvFilename(nowMs, rawName, ext) {
  var stamp = new Date(nowMs).toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "").replace("T", "-");
  var base = String(rawName || "").replace(/\.[A-Za-z0-9]+$/, "");
  base = base.replace(/[^A-Za-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "cv";
  return "CV_" + stamp + "_" + base + "." + ext;
}

/** Counter-based limit used for both the global and the per-email throttle. */
function isOverLimit(currentCount, max) {
  return Number(currentCount || 0) >= max;
}

/**
 * Decides what to do about Turnstile. `secret` is the TURNSTILE_SECRET script property.
 * Returns "skip" (no secret configured), "reject" (secret set but no usable token) or "verify".
 */
function turnstileAction(secret, token) {
  if (!secret) return "skip";
  if (typeof token !== "string" || token.length === 0 || token.length > LIMITS.turnstileToken) {
    return "reject";
  }
  return "verify";
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    SERVICE_SLUGS: SERVICE_SLUGS,
    ROLE_PATTERN: ROLE_PATTERN,
    LIMITS: LIMITS,
    MIN_FILL_MS: MIN_FILL_MS,
    MAX_FILL_MS: MAX_FILL_MS,
    CV_MAX_BYTES: CV_MAX_BYTES,
    CV_MAX_BASE64_CHARS: CV_MAX_BASE64_CHARS,
    MAX_BODY_CHARS: MAX_BODY_CHARS,
    GLOBAL_LIMIT_PER_MINUTE: GLOBAL_LIMIT_PER_MINUTE,
    EMAIL_LIMIT_PER_WINDOW: EMAIL_LIMIT_PER_WINDOW,
    sanitize: sanitize,
    phoneCell: phoneCell,
    isValidEmail: isValidEmail,
    checkFillTime: checkFillTime,
    isHoneypotTripped: isHoneypotTripped,
    validateInquiry: validateInquiry,
    validateApplication: validateApplication,
    checkCvMetadata: checkCvMetadata,
    checkCvBytes: checkCvBytes,
    safeCvFilename: safeCvFilename,
    isOverLimit: isOverLimit,
    turnstileAction: turnstileAction,
  };
}
