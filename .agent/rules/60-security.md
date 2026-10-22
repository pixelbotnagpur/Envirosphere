# RULE 60: Security

- Static site: nothing secret may reach the bundle. Only `NEXT_PUBLIC_*` values that are
  public by design. Never put the Turnstile secret, Sheet IDs with edit rights or
  personal emails in the repo; they live in Apps Script Script Properties.
- Forms: Zod validation in the browser AND re-validation in Apps Script `doPost`
  (required fields, length caps, email/phone format). Honeypot, minimum fill time,
  Turnstile verification, CacheService throttle.
- CV uploads: PDF/DOC/DOCX only, ≤ 5 MB, checked in browser and in Apps Script; stored in
  a private Drive folder.
- Treat every Sheet cell value as untrusted: prefix values starting with `= + - @` with `'`
  to block formula injection.
- No PII (names, phones, emails) in console output or analytics events.
- Security headers (CSP, HSTS, Referrer-Policy, X-Content-Type-Options) in `public/.htaccess`.
- Dependencies: prefer existing deps; new dependency = justify in the plan first.
