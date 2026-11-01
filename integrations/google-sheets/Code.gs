/**
 * Envirosphere Consultant & Engineers — Google Apps Script Form Handler
 *
 * Receives form submissions from the static website, validates them on the server,
 * guards against formula injection and spam bots, logs rows to Google Sheets, stores CV
 * attachments in Google Drive, and alerts the office inbox.
 *
 * This project has TWO files: Code.gs (this file) and validation.js (pure helpers).
 * Both must be pasted into the Apps Script editor; see SETUP.md.
 *
 * Script Properties (Project Settings):
 *   NOTIFY_EMAIL      where alerts are sent (optional)
 *   DRIVE_FOLDER_ID   REQUIRED for job applications; CVs are refused when this is not set
 *   TURNSTILE_SECRET  optional; when SET, every submission needs a valid Turnstile token
 *   ALLOWED_ROLES     optional, job titles separated by | ; when set, only these roles
 *                     (plus "General Application") are accepted
 */

var GENERIC_ERROR = "We could not process your submission right now. Please try again or contact us directly.";
var BOT_SUCCESS = "Submission received successfully";

/**
 * HTTP GET health check endpoint
 */
function doGet() {
  return ContentService.createTextOutput(
    JSON.stringify({
      status: "ok",
      service: "Envirosphere Form Web App",
      timestamp: new Date().toISOString(),
    })
  ).setMimeType(ContentService.MimeType.JSON);
}

/**
 * HTTP POST form submission endpoint.
 * Order matters: everything cheap and lock-free runs first; the script lock is held only
 * while appending to the Sheet (see appendRowLocked).
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse(false, "Invalid request payload");
    }
    if (e.postData.contents.length > MAX_BODY_CHARS) {
      return jsonResponse(false, "Request is too large");
    }

    var payload;
    try {
      payload = JSON.parse(e.postData.contents);
    } catch (err) {
      return jsonResponse(false, "Malformed JSON format");
    }
    if (!payload || typeof payload !== "object") {
      return jsonResponse(false, "Invalid request payload");
    }

    // 1. Honeypot: fake success so bots cannot tune against us
    if (isHoneypotTripped(payload)) {
      return jsonResponse(true, BOT_SUCCESS);
    }

    // 2. Fill time (elapsed ms measured by the browser) is REQUIRED and must be at least 3 s
    if (!checkFillTime(payload.fillMs)) {
      return jsonResponse(false, "Please wait a few seconds and submit the form again.");
    }

    // 3. Field validation (length caps, formats, allow-lists)
    var isApplication = payload.type === "application";
    var checked;
    var cvInfo = null;
    if (isApplication) {
      checked = validateApplication(payload, getAllowedRoles());
      if (checked.ok) {
        cvInfo = checkCvMetadata(payload.cvFile);
        if (!cvInfo.ok) checked = cvInfo;
      }
    } else {
      checked = validateInquiry(payload);
    }
    if (!checked.ok) {
      return jsonResponse(false, checked.message);
    }

    // 4. Cloudflare Turnstile: fail CLOSED whenever the secret is configured
    var turnstileSecret = getTurnstileSecret();
    var action = turnstileAction(turnstileSecret, payload.turnstileToken);
    if (action === "reject" || (action === "verify" && !verifyTurnstile(payload.turnstileToken, turnstileSecret))) {
      return jsonResponse(false, "Bot verification failed. Please refresh the page and try again.");
    }

    // 5. Throttles: global (IP limits are not possible in Apps Script) plus per email
    var throttleMessage = checkThrottles(checked.clean.email);
    if (throttleMessage) {
      return jsonResponse(false, throttleMessage);
    }

    return isApplication ? handleApplication(checked.clean, payload.cvFile, cvInfo) : handleInquiry(checked.clean);
  } catch (error) {
    // Details go to the execution log only (no payload contents); the client gets a generic message.
    Logger.log("doPost failed: " + (error && error.name ? error.name : "Error"));
    return jsonResponse(false, GENERIC_ERROR);
  }
}

/**
 * Handles client consultation inquiries
 */
function handleInquiry(clean) {
  var sheet = getOrCreateTab("Inquiries", [
    "Timestamp",
    "Full Name",
    "Organization",
    "Email",
    "Phone Number",
    "Service Required",
    "Project Brief",
    "Status",
  ]);

  appendRowLocked(sheet, [
    new Date(),
    clean.name,
    clean.organization,
    sanitize(clean.email),
    phoneCell(clean.phone),
    clean.service,
    clean.message,
    "New",
  ]);

  sendAlert(
    "New Consultation Inquiry: " + clean.name + " (" + clean.service + ")",
    "A new project consultation inquiry has been submitted:\n\n" +
      "Name: " + clean.name + "\n" +
      "Organization: " + clean.organization + "\n" +
      "Email: " + clean.email + "\n" +
      "Phone: " + clean.phone + "\n" +
      "Service: " + clean.service + "\n\n" +
      "Project Details:\n" + clean.message + "\n"
  );

  return jsonResponse(true, "Thank you. Your consultation request has been registered with our team.");
}

/**
 * Handles job applications and CV uploads
 */
function handleApplication(clean, cvFile, cvInfo) {
  // CVs are personal data: refuse to store them anywhere but the dedicated folder.
  var folderId = PropertiesService.getScriptProperties().getProperty("DRIVE_FOLDER_ID");
  if (!folderId) {
    Logger.log("Application refused: DRIVE_FOLDER_ID script property is not set");
    return jsonResponse(false, GENERIC_ERROR);
  }

  var fileUrl;
  try {
    var bytes = Utilities.base64Decode(cvFile.data);
    var bytesCheck = checkCvBytes(bytes, cvInfo.ext);
    if (!bytesCheck.ok) {
      return jsonResponse(false, bytesCheck.message);
    }
    var storedName = safeCvFilename(new Date().getTime(), cvFile.name, cvInfo.ext);
    var blob = Utilities.newBlob(bytes, cvInfo.mime, storedName);
    var savedFile = DriveApp.getFolderById(folderId).createFile(blob);
    fileUrl = savedFile.getUrl();
  } catch (driveErr) {
    Logger.log("CV upload failed: " + (driveErr && driveErr.name ? driveErr.name : "Error"));
    return jsonResponse(false, GENERIC_ERROR);
  }

  var sheet = getOrCreateTab("Applications", [
    "Timestamp",
    "Candidate Name",
    "Role Applied",
    "Email",
    "Phone Number",
    "Cover Note",
    "CV File Link",
    "Status",
  ]);

  appendRowLocked(sheet, [
    new Date(),
    clean.name,
    clean.role,
    sanitize(clean.email),
    phoneCell(clean.phone),
    clean.coverLetter,
    fileUrl,
    "New",
  ]);

  sendAlert(
    "New Career Application: " + clean.name + " for " + clean.role,
    "A new candidate application has been submitted:\n\n" +
      "Candidate Name: " + clean.name + "\n" +
      "Position: " + clean.role + "\n" +
      "Email: " + clean.email + "\n" +
      "Phone: " + clean.phone + "\n" +
      "CV Attachment Link: " + fileUrl + "\n\n" +
      "Candidate Note:\n" + clean.coverLetter + "\n"
  );

  return jsonResponse(true, "Thank you. Your application and CV have been received.");
}

/**
 * Appends one row while holding the script lock. This is the ONLY place the lock is taken,
 * so slow work (Turnstile, Drive, email) never serialises other visitors.
 */
function appendRowLocked(sheet, row) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    sheet.appendRow(row);
  } finally {
    lock.releaseLock();
  }
}

/**
 * Global throttle (all visitors together) and a per-email throttle.
 * CacheService counters are approximate, which is fine for abuse control.
 * Returns an error message, or "" when the submission may continue.
 */
function checkThrottles(email) {
  var cache = CacheService.getScriptCache();
  var minuteBucket = Math.floor(new Date().getTime() / 60000);
  var globalKey = "global_" + minuteBucket;
  if (isOverLimit(cache.get(globalKey), GLOBAL_LIMIT_PER_MINUTE)) {
    return "We are receiving many requests right now. Please try again in a minute.";
  }
  var emailKey = "rate_" + Utilities.base64EncodeWebSafe(String(email).toLowerCase());
  if (isOverLimit(cache.get(emailKey), EMAIL_LIMIT_PER_WINDOW)) {
    return "Submission limit reached. Please wait a few minutes before trying again.";
  }
  cache.put(globalKey, String(Number(cache.get(globalKey) || 0) + 1), 120);
  cache.put(emailKey, String(Number(cache.get(emailKey) || 0) + 1), 600);
  return "";
}

function getTurnstileSecret() {
  var props = PropertiesService.getScriptProperties();
  return props.getProperty("TURNSTILE_SECRET") || props.getProperty("TURNSTILE_SECRET_KEY") || "";
}

function getAllowedRoles() {
  var raw = PropertiesService.getScriptProperties().getProperty("ALLOWED_ROLES");
  if (!raw) return null;
  var roles = raw
    .split("|")
    .map(function (r) {
      return r.trim();
    })
    .filter(function (r) {
      return r.length > 0;
    });
  return roles.length > 0 ? roles : null;
}

/**
 * Retrieves an existing Sheet tab or initializes it with header columns
 */
function getOrCreateTab(tabName, headers) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(tabName);
  if (!sheet) {
    sheet = ss.insertSheet(tabName);
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
  }
  return sheet;
}

/**
 * Sends an email alert to the designated notifications inbox
 */
function sendAlert(subject, body) {
  var notifyEmail = PropertiesService.getScriptProperties().getProperty("NOTIFY_EMAIL");
  if (!notifyEmail) return;

  try {
    MailApp.sendEmail({
      to: notifyEmail,
      subject: "[Envirosphere Web] " + subject.replace(/[\r\n]+/g, " "),
      body: body,
    });
  } catch (e) {
    // Log mail failure without interrupting the request
    Logger.log("Failed to send notification email: " + (e && e.name ? e.name : "Error"));
  }
}

/**
 * Validates a Cloudflare Turnstile token
 */
function verifyTurnstile(token, secret) {
  try {
    var response = UrlFetchApp.fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "post",
      payload: {
        secret: secret,
        response: token,
      },
      muteHttpExceptions: true,
    });
    var result = JSON.parse(response.getContentText());
    return result.success === true;
  } catch (e) {
    Logger.log("Turnstile validation error: " + (e && e.name ? e.name : "Error"));
    return false;
  }
}

/**
 * Helper to construct JSON response
 */
function jsonResponse(success, message) {
  var output = {
    success: success,
    message: message,
    timestamp: new Date().toISOString(),
  };
  return ContentService.createTextOutput(JSON.stringify(output)).setMimeType(
    ContentService.MimeType.JSON
  );
}
