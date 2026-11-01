# Google Apps Script Form Endpoint Deployment Guide

This guide walks you through deploying the Google Apps Script Web App that receives submissions from the Envirosphere website, logs them to Google Sheets, saves CV documents to Google Drive, and sends email alerts.

The script is made of **two files** that you paste into the Apps Script editor:

- `Code.gs` – the web app (receives requests, writes the Sheet, uploads CVs, sends email).
- `validation.js` – the checks (field limits, formats, CV file checks, throttle and Turnstile decisions).

---

## Step 1: Create the Google Sheet
1. Open [Google Sheets](https://sheets.new) and create a new spreadsheet.
2. Name it **"Envirosphere Website Submissions"**.
3. Create two tabs (or let the script auto-create them on first submit):
   - **`Inquiries`**: `Timestamp`, `Full Name`, `Organization`, `Email`, `Phone Number`, `Service Required`, `Project Brief`, `Status`
   - **`Applications`**: `Timestamp`, `Candidate Name`, `Role Applied`, `Email`, `Phone Number`, `Cover Note`, `CV File Link`, `Status`

### Who can see the data (important: it contains personal information)
- Do **not** use "Anyone with the link". Share the Sheet and the CV folder only with named people at Envirosphere (Viewer unless they must edit).
- The Sheet and the CVs hold names, phone numbers, emails and CVs. Decide how long you keep them (for example, delete CVs of unsuccessful candidates after 6 to 12 months) and clean the `Applications` tab and the Drive folder on that schedule.
- When someone leaves the company, remove their access to both the Sheet and the Drive folder.

---

## Step 2: Create Google Drive Folder for CVs
1. Go to [Google Drive](https://drive.google.com).
2. Create a folder named **"Envirosphere Job Applications"**. Keep it private (not shared by link).
3. Open the folder and copy the **Folder ID** from the URL:
   `https://drive.google.com/drive/folders/<FOLDER_ID_HERE>`

`DRIVE_FOLDER_ID` is **mandatory**. If it is not set, the script refuses to accept job applications (it will never fall back to the top level of your Drive).

---

## Step 3: Paste the Script Code
1. In your Google Sheet, click **Extensions > Apps Script**.
2. Rename the project to **"Envirosphere Web App"**.
3. Replace the entire contents of `Code.gs` with the code in `integrations/google-sheets/Code.gs`.
4. Click the **+** next to "Files", choose **Script**, name it `validation` (it becomes `validation.gs`) and paste the entire contents of `integrations/google-sheets/validation.js` into it.
5. Click **Save project**.

### Keep the service list in sync
`validation.js` contains a list called `SERVICE_SLUGS`: the 13 service names from `content/services/*.md` (the file name without `.md`) plus `general`. The script rejects any other service value. **If you add, rename or remove a service file in `content/services/`, update `SERVICE_SLUGS` in `validation.js`, paste the new version into Apps Script and redeploy (see "After you edit the code").** The test suite fails if the website's services and this list differ, so you will be told.

---

## Step 4: Configure Script Properties
1. In the Apps Script editor, click the **Project Settings (gear icon)** on the left sidebar.
2. Scroll down to **Script Properties** and click **Edit script properties**.
3. Add the following key-value pairs:
   - `NOTIFY_EMAIL`: Your notifications email address (e.g. `info@envirosphere.co.in` or HR email).
   - `DRIVE_FOLDER_ID`: The Folder ID copied from Step 2. **Required.**
   - `TURNSTILE_SECRET`: (Optional, recommended) Your Cloudflare Turnstile **secret** key (see Step 7). **When this is set, every submission must carry a valid Turnstile token; a missing or invalid one is rejected.** When it is not set, the check is skipped.
   - `ALLOWED_ROLES`: (Optional) Job titles separated by `|`, for example `Senior EIA Coordinator|Environmental Engineer`. When set, only these roles plus `General Application` are accepted. Keep it equal to the titles in `content/jobs.yaml`.
4. Click **Save script properties**.

---

## Step 5: Deploy as Web App
1. At the top right of the Apps Script editor, click **Deploy > New deployment**.
2. Click the gear icon next to "Select type" and choose **Web app**.
3. Fill in the deployment details:
   - **Description**: `Production v1`
   - **Execute as**: `Me (your email address)`
   - **Who has access**: `Anyone` *(Crucial: allows the static website to submit without Google authentication)*
4. Click **Deploy**.
5. When prompted, grant permissions (click *Advanced* > *Go to Envirosphere Web App (unsafe)* > *Allow*).
6. Copy the **Web App URL** (ends in `/exec`).

### After you edit the code
Saving the script does **not** change the live web app. Every time you change `Code.gs` or `validation.js`:
1. Click **Deploy > Manage deployments**.
2. Click the pencil (edit) icon on your deployment.
3. Under **Version** choose **New version**, then click **Deploy**.

The Web App URL stays the same.

---

## Step 6: Set the website environment variables (BEFORE building the site)
The website is a static export: `NEXT_PUBLIC_*` values are written into the built files when you run `pnpm build`. Setting them afterwards, or in the Hostinger "deployment settings", has **no effect**. Set them first, then build, then upload:

```bash
# .env.local (on the computer where you run the build)
NEXT_PUBLIC_FORMS_ENDPOINT=https://script.google.com/macros/s/<YOUR_DEPLOYMENT_ID>/exec
NEXT_PUBLIC_TURNSTILE_SITE_KEY=<your Turnstile site key>   # optional, see Step 7
```

Then run `pnpm build` and upload the new `out/` folder. Whenever you change either value, rebuild and re-upload.

Security headers: the site's Content-Security-Policy (in `public/.htaccess`, mirrored by the Node server) already allows `https://script.google.com`, `https://script.googleusercontent.com` (Apps Script redirects replies there) and `https://challenges.cloudflare.com` (Turnstile). If you ever replace the headers, keep those three origins or the forms will stop working.

---

## Step 7: Turn on Cloudflare Turnstile (optional but recommended)
1. In the [Cloudflare dashboard](https://dash.cloudflare.com/) open **Turnstile** and click **Add widget**.
2. Enter the site domain (`envirosphere.co.in`) and choose the **Managed** mode.
3. Copy the **Site key** and the **Secret key**.
4. Put the **Site key** in `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (Step 6), rebuild and re-upload the site. The challenge then appears above the Submit button on both forms.
5. Put the **Secret key** in the `TURNSTILE_SECRET` script property (Step 4). Then deploy a **New version** (Step 5).

Turn both on together. If the secret is set in Apps Script but the site was built without the site key, every submission will be rejected as a failed bot check. If the site has the site key but the secret is not set, the token is simply ignored.

---

## Built-in abuse protection (what the script enforces)
- Honeypot field and a **required** minimum fill time of 3 seconds (the form sends `fillMs`, the milliseconds it measured itself between opening the form and submitting; the server never compares clocks).
- Maximum lengths on every field, email and phone format checks, and a fixed list of allowed services (and optionally roles).
- CVs: only `.pdf` and `.docx` (legacy `.doc` is refused because any OLE file, including macro-enabled ones, shares its signature); the declared type must match the extension; the file content must start with the right signature (`%PDF`, or the zip header for `.docx`); at most 5 MB; stored under a generated name (timestamp plus a cleaned-up version of the file name).
- Turnstile verification whenever `TURNSTILE_SECRET` is set (fails closed).
- Throttling: at most 20 submissions per minute across the whole site (Apps Script cannot see visitor IP addresses, so this is a global limit) and at most 5 per email address per 10 minutes. If a real burst hits the global limit, visitors see a "try again in a minute" message.
- The Sheet is locked only for the moment a row is written; Drive uploads and emails do not block other visitors.
- Errors shown to visitors are generic. Details are written to **Executions** in the Apps Script editor (no submitted text is logged).

Your forms are now fully integrated and operational.
