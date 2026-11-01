# Putting the website live on Hostinger (Node.js plan)

The website is a set of ready-made pages (the `out` folder). A very small program,
`server.mjs`, shows those pages to visitors on Hostinger's Node.js hosting. There is nothing
to install on Hostinger and no database.

## 1. What to buy

In Hostinger choose a plan whose feature list includes **Node.js Web Apps** (check the plan
comparison before buying; not every plan has it). Connect your
domain (envirosphere.co.in) to the plan and switch on the free SSL (https) certificate.

## 2. Build the site on your computer (every time)

Hostinger does not build the site. You build it on your computer, then upload the result.
The form address and Turnstile key are written into the pages while building, so set them first.

1. In the project folder, create or edit the file `.env.local` and set:
   ```
   NEXT_PUBLIC_SITE_URL=https://envirosphere.co.in
   NEXT_PUBLIC_FORMS_ENDPOINT=<your Google Apps Script address, see integrations/google-sheets/SETUP.md>
   NEXT_PUBLIC_TURNSTILE_SITE_KEY=<your Cloudflare Turnstile site key>
   ```
2. Check the settings: `pnpm check:launch` (it explains in plain words if something is missing).
3. Build: `pnpm build`
4. Create the upload folder: `pnpm package:hostinger`

Step 4 creates a folder called **`hostinger-dist`** holding exactly what must be uploaded:

| Item | What it is |
|---|---|
| `out/` | the website pages, pictures and files |
| `server.mjs` | the small program that serves the pages |
| `package.json` | tells Hostinger how to start it (Node 24, `npm start`) |

It refuses to run if the build is missing, still contains test values, or was built without your
real form address and Turnstile key (it reads the built pages to be sure), so you cannot upload
the wrong thing by mistake. If it says the settings are not ready, fix `.env.local`, run
`pnpm build` again, then repeat step 4.

The `.htaccess` file is not used on the Node.js plan, so there is nothing to upload or edit for it.

For a practice run only (never to upload), `pnpm package:hostinger --allow-missing-forms` skips the
form checks and prints a loud warning. It still refuses test values.

## 3. First-time setup in Hostinger

1. hPanel > **Websites** > **Add website** > **Node.js Apps** (or Websites > your site > Node.js).
2. Choose **Upload your website files** and upload the contents of `hostinger-dist`
   (or its zip). Upload the three items above at the top level, not inside another folder.
3. Set:
   - **Node.js version:** 24
   - **Entry file / start command:** `server.mjs` (or `npm start`, both do the same)
   - **Root directory:** the folder where `server.mjs` sits (usually the default)
   - **Port:** nothing to do. Hostinger chooses the port and passes it to the program.
   - No build command and no "install dependencies" are needed (the program uses nothing extra).
     If Hostinger insists on a build step, leave it empty or use `npm start`.
4. Press **Deploy / Restart**.

## 4. Updating the site after editing content

1. Edit the files in `content/` (see `content/README.md`).
2. Repeat section 2 (`pnpm check:launch`, `pnpm build`, `pnpm package:hostinger`).
3. Before replacing anything, keep a copy of the current live files (see Rollback).
4. In Hostinger upload the new `hostinger-dist` contents over the old ones (replace the `out`
   folder completely, so deleted pages disappear), then press **Restart**.

## 5. Check that it works

- Open `https://envirosphere.co.in/health`. It should show `ok`.
- Open the home page, click through a few pages, refresh on an inner page (for example
  `/about/`). It must still show the page.
- Send a test form from the Contact page and check the Google Sheet.
- Check the security headers (Command Prompt, PowerShell or Git Bash):
  ```
  curl -I https://envirosphere.co.in/
  ```
  The answer must include `Content-Security-Policy`, `Strict-Transport-Security`,
  `X-Content-Type-Options: nosniff`, `Referrer-Policy` and `X-Frame-Options`.
  Also try `curl -I http://envirosphere.co.in/` (must forward to https) and
  `curl -I https://envirosphere.co.in/nope/` (must say `404`).

## 6. Raising the HSTS lock-in later

HSTS tells browsers to always use https. It starts short (5 minutes, `max-age=300`) so a mistake
is easy to undo. After a full week where every page works over https, raise it in steps:
`86400` (1 day), then `2592000` (30 days), then `31536000` (1 year). Wait a few days between steps.

To change it without editing code, add an environment variable in the Hostinger Node.js app
settings: name `HSTS_MAX_AGE`, value for example `86400`, then Restart. Confirm with `curl -I`.
Only add `includeSubDomains` or `preload` if a developer confirms all subdomains use https
(preload is very hard to undo).

## 7. Rollback (going back to the previous version)

Before every update, zip the `hostinger-dist` folder you uploaded last time and keep it, for
example `site-2026-11-01.zip`. If the new version has a problem, upload the old zip's contents
the same way as an update and press Restart.

## 8. If something goes wrong

- **Blank page or "Application error":** the app did not start. Check that the entry file is
  `server.mjs`, Node is 24, the `out` folder was uploaded next to `server.mjs`, then Restart.
  The Node.js app's logs in hPanel show the reason.
- **Page shows 404 after refresh:** make sure you uploaded the whole `out` folder and use the
  addresses with the final slash (`/about/`). Without the slash the site forwards automatically.
- **Forms fail:** the form address was probably missing when you built. Run
  `pnpm check:launch`, rebuild, repackage and upload again. Also confirm the Google Apps Script
  is deployed as "Anyone" (see `integrations/google-sheets/SETUP.md`). The site's security
  rules must keep `script.google.com`, `script.googleusercontent.com` and
  `challenges.cloudflare.com` allowed.
- **Site not updating after an upload:** you may have forgotten to Restart, or your browser
  shows an old copy. Press Restart in Hostinger and refresh with Ctrl+F5. Pages are always
  re-checked; pictures can be kept for up to a day.
- **Works on `http` but not `https`:** wait until the SSL certificate shows as active in Hostinger.

## Notes for developers

- `pnpm start` runs the same server locally on `out/` (`PORT` defaults to 3000; `pnpm preview`
  uses 4173). `SITE_ROOT` points it at another folder.
- Security headers and their values are copied from `public/.htaccess` (single source of truth,
  enforced by `tests/unit/server.test.ts`). `.htaccess` is ignored on the Node.js plan and stays
  only as a fallback for Apache/LiteSpeed hosting.
- Behaviour: GET/HEAD only, `/about` forwards to `/about/` (308), real 404 status with
  `404.html`, `http` forwards to `https` when Hostinger's proxy says so (`X-Forwarded-Proto`),
  gzip for text over 1 KB, ETag/304, range requests for video and PDF, `/health`.
