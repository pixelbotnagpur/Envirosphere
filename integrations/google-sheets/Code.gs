/**
 * Envirosphere Consultant & Engineers — Google Apps Script Form Handler
 *
 * Receives form submissions from the static website, performs server-side
 * validation, guards against formula injection & spam bots, logs rows to
 * Google Sheets, stores CV attachments in Google Drive, and alerts the office inbox.
 */

// Configuration loaded from Script Properties
var SCRIPT_PROPERTIES = PropertiesService.getScriptProperties();

/**
 * HTTP GET Health check endpoint
 */
function doGet(e) {
  return ContentService.createTextOutput(
    JSON.stringify({
      status: "ok",
      service: "Envirosphere Form Web App",
      timestamp: new Date().toISOString(),
    })
  ).setMimeType(ContentService.MimeType.JSON);
}

/**
 * HTTP POST Form submission endpoint
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    // Wait up to 10 seconds for concurrent requests
    lock.waitLock(10000);

    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse(false, "Invalid request payload");
    }

    var payload;
    try {
      payload = JSON.parse(e.postData.contents);
    } catch (err) {
      return jsonResponse(false, "Malformed JSON format");
    }

    // 1. Anti-abuse check (Honeypot + minimum fill time)
    if (payload.website && payload.website.toString().trim().length > 0) {
      // Fake success for bots to prevent adversarial tuning
      return jsonResponse(true, "Submission received successfully");
    }

    var now = new Date().getTime();
    if (payload.formLoadedAt && now - Number(payload.formLoadedAt) < 2500) {
      return jsonResponse(true, "Submission received successfully");
    }

    // 2. Cloudflare Turnstile Verification (if configured)
    var turnstileSecret = SCRIPT_PROPERTIES.getProperty("TURNSTILE_SECRET_KEY");
    if (turnstileSecret && payload.turnstileToken) {
      var isHuman = verifyTurnstile(payload.turnstileToken, turnstileSecret);
      if (!isHuman) {
        return jsonResponse(false, "Bot verification challenge failed");
      }
    }

    // 3. Rate limiting per email (max 5 submissions per 10 minutes)
    var userEmail = (payload.email || "").toString().toLowerCase().trim();
    if (userEmail) {
      var cache = CacheService.getScriptCache();
      var rateKey = "rate_" + Utilities.base64Encode(userEmail);
      var currentCount = Number(cache.get(rateKey) || 0);
      if (currentCount >= 5) {
        return jsonResponse(false, "Submission limit reached. Please wait a few minutes before trying again.");
      }
      cache.put(rateKey, String(currentCount + 1), 600); // 10 minutes
    }

    // 4. Route payload by type
    if (payload.type === "application") {
      return handleApplication(payload);
    } else {
      return handleInquiry(payload);
    }
  } catch (error) {
    return jsonResponse(false, "Processing error: " + error.toString());
  } finally {
    lock.releaseLock();
  }
}

/**
 * Handles Client Consultation Inquiries
 */
function handleInquiry(data) {
  var name = sanitize(data.name);
  var org = sanitize(data.organization || "N/A");
  var email = sanitize(data.email);
  var phone = sanitize(data.phone);
  var service = sanitize(data.service);
  var message = sanitize(data.message);

  if (!name || !email || !phone || !message) {
    return jsonResponse(false, "Required fields missing (Name, Email, Phone, Message)");
  }

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

  sheet.appendRow([
    new Date(),
    name,
    org,
    email,
    phone,
    service,
    message,
    "New",
  ]);

  sendAlert(
    "New Consultation Inquiry: " + name + " (" + service + ")",
    "A new project consultation inquiry has been submitted:\n\n" +
      "Name: " + name + "\n" +
      "Organization: " + org + "\n" +
      "Email: " + email + "\n" +
      "Phone: " + phone + "\n" +
      "Service: " + service + "\n\n" +
      "Project Details:\n" + message + "\n"
  );

  return jsonResponse(true, "Thank you. Your consultation request has been registered with our team.");
}

/**
 * Handles Job Applications & CV Uploads
 */
function handleApplication(data) {
  var name = sanitize(data.name);
  var email = sanitize(data.email);
  var phone = sanitize(data.phone);
  var role = sanitize(data.role);
  var coverLetter = sanitize(data.coverLetter || "N/A");
  var cvFile = data.cvFile;

  if (!name || !email || !phone || !role || !cvFile) {
    return jsonResponse(false, "Required application fields or CV document missing");
  }

  // Save CV file to Google Drive
  var fileUrl = "No file attached";
  try {
    var folderId = SCRIPT_PROPERTIES.getProperty("DRIVE_FOLDER_ID");
    var folder = folderId ? DriveApp.getFolderById(folderId) : DriveApp.getRootFolder();
    var decodedData = Utilities.base64Decode(cvFile.data);
    var blob = Utilities.newBlob(decodedData, cvFile.type || "application/pdf", name + " - " + cvFile.name);
    var savedFile = folder.createFile(blob);
    fileUrl = savedFile.getUrl();
  } catch (driveErr) {
    fileUrl = "Drive upload failed: " + driveErr.toString();
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

  sheet.appendRow([
    new Date(),
    name,
    role,
    email,
    phone,
    coverLetter,
    fileUrl,
    "New",
  ]);

  sendAlert(
    "New Career Application: " + name + " for " + role,
    "A new candidate application has been submitted:\n\n" +
      "Candidate Name: " + name + "\n" +
      "Position: " + role + "\n" +
      "Email: " + email + "\n" +
      "Phone: " + phone + "\n" +
      "CV Attachment Link: " + fileUrl + "\n\n" +
      "Candidate Note:\n" + coverLetter + "\n"
  );

  return jsonResponse(true, "Thank you. Your application and CV have been received.");
}

/**
 * Sanitizes input against formula injection (=, +, -, @)
 */
function sanitize(val) {
  if (val === null || val === undefined) return "";
  var str = val.toString().trim();
  if (/^[=+\-@]/.test(str)) {
    return "'" + str;
  }
  return str;
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
  var notifyEmail = SCRIPT_PROPERTIES.getProperty("NOTIFY_EMAIL");
  if (!notifyEmail) return;

  try {
    MailApp.sendEmail({
      to: notifyEmail,
      subject: "[Envirosphere Web] " + subject,
      body: body,
    });
  } catch (e) {
    // Log mail failure without interrupting sheet append
    Logger.log("Failed to send notification email: " + e.toString());
  }
}

/**
 * Validates Cloudflare Turnstile captcha
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
    Logger.log("Turnstile validation error: " + e.toString());
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
