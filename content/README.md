# How to edit the website content

Everything you can change without a developer lives in two places:

- `content/`: all text, lists and settings (this folder)
- `public/media/`: all images, logos, videos and PDF files

## Change text
1. Open the file for that page (for example `content/pages/home.yaml`).
2. Edit the words after the colon. Keep the spaces and the dashes `-` at the start of list items.
3. Save, then ask for a rebuild (or run `pnpm build`) and upload the `out` folder to Hostinger.

Save files as UTF-8 (the default in Notepad and VS Code).

When you upload the site to Hostinger, upload everything inside the `out` folder including the hidden `.htaccess` file.

If something is wrong, the build stops and tells you the file and the field that needs fixing,
for example: `content/site.yaml → contact.email: Invalid email address`.

## Replace an image
1. Put the new file in `public/media/` (same file name keeps everything working with no other change).
2. If you use a new file name, open `content/media.yaml` and change the `src:` line for that image.
3. Update `alt:` to describe the picture in a few words. Screen readers and Google read it.

Image file names are case-sensitive on the live server: `Logo.svg` and `logo.svg` are different files.
Always use the exact same capitals in `media.yaml`.

## Add or remove a service
Each service is one file in `content/services/`. Copy an existing file, rename it
(lowercase, dashes, for example `crz-clearance.md`), and edit the text. Delete the file to remove it.
The `order:` number controls the position in lists.

- Each service needs its own `order:` number; two services cannot share one.
- Only `.md` files belong in `content/services/`.

## Home page
Controls the layout and copy of the home page (`content/pages/home.yaml`):

- `hero`: Top banner with accreditation eyebrow, main title, subtitle, CTA links, and scroll indicator.
- `about`: Firm overview text, paragraphs, and CTA button. Its image comes from the `about-photo` key in `content/media.yaml` (`public/media/images/about.webp`).
- `services`: Section heading, intro, and CTA button. The 13 services displayed in the list are automatically loaded from `content/services/*.md` ordered by their `order:` field.
- `stats`: Key metrics and animated counter items (clients, ongoing projects, certifications).
- `clients`: Logo marquee rows. Each logo comes from a `client-*` key in `content/media.yaml` (`public/media/clients/*.webp`).
- `process`: Four-step scroll-pinned workflow narrative. *Note: this block is a draft to be reviewed by the owner.*
- `testimonials`: Client quotes, names, and roles.
- `contact`: Closing call-to-action banner with phone and email contact options (values sourced from `content/site.yaml`).

To add client logos: add the file to `public/media/clients/`, add an entry to `media.yaml`, then add its key to `clients.logos`.

## What you cannot change here
Colors and fonts are part of the design. Ask the developer, for example "make the accent color a deeper ochre".

## Check your changes
Run `pnpm content:check`. It prints `Content OK` or tells you what to fix.
