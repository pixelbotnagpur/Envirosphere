# Google Apps Script Form Endpoint Deployment Guide

This guide walks you through deploying the Google Apps Script Web App that receives submissions from the Envirosphere website, logs them to Google Sheets, saves CV documents to Google Drive, and sends email alerts.

---

## Step 1: Create the Google Sheet
1. Open [Google Sheets](https://sheets.new) and create a new spreadsheet.
2. Name it **"Envirosphere Website Submissions"**.
3. Create two tabs (or let the script auto-create them on first submit):
   - **`Inquiries`**: `Timestamp`, `Full Name`, `Organization`, `Email`, `Phone Number`, `Service Required`, `Project Brief`, `Status`
   - **`Applications`**: `Timestamp`, `Candidate Name`, `Role Applied`, `Email`, `Phone Number`, `Cover Note`, `CV File Link`, `Status`

---

## Step 2: Create Google Drive Folder for CVs
1. Go to [Google Drive](https://drive.google.com).
2. Create a folder named **"Envirosphere Job Applications"**.
3. Open the folder and copy the **Folder ID** from the URL:
   `https://drive.google.com/drive/folders/<FOLDER_ID_HERE>`

---

## Step 3: Paste the Script Code
1. In your Google Sheet, click **Extensions > Apps Script**.
2. Rename the project to **"Envirosphere Web App"**.
3. Replace the entire contents of `Code.gs` with the code in `integrations/google-sheets/Code.gs`.

---

## Step 4: Configure Script Properties
1. In the Apps Script editor, click the **Project Settings (gear icon)** on the left sidebar.
2. Scroll down to **Script Properties** and click **Edit script properties**.
3. Add the following key-value pairs:
   - `NOTIFY_EMAIL`: Your notifications email address (e.g. `info@envirosphere.co.in` or HR email).
   - `DRIVE_FOLDER_ID`: The Folder ID copied from Step 2.
   - `TURNSTILE_SECRET_KEY`: (Optional) Your Cloudflare Turnstile secret key if using bot challenge.
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

---

## Step 6: Configure Environment Variable
In your project's `.env.local` or deployment settings:
```bash
NEXT_PUBLIC_FORMS_ENDPOINT=https://script.google.com/macros/s/<YOUR_DEPLOYMENT_ID>/exec
```

Your forms are now fully integrated and operational.
