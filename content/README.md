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

## Edit, add or remove a service
Each service is one file in `content/services/` (for example `crz-clearance.md`). The file has two parts:

```
---
title: CRZ Clearance
order: 7
image: photo-g18
summary: One or two sentences, shown on the service cards and under the page title.
---
The text of the service page goes here, below the second --- line.
```

- `title`: the page heading and the name in menus and cards.
- `order`: position in lists and the previous/next links. Each service needs its own number.
- `summary`: short description (also used by Google).
- `image`: a key from `content/media.yaml` (see "Replace an image" above). The picture is shown at the top of the page. Optional.
- The text below the second `---` line must not be empty; `pnpm content:check` stops with a message if it is.
- To add a service, copy a file, rename it (lowercase, dashes, `.md`) and edit it. Delete the file to remove it. Only `.md` files belong in this folder.

Writing the text (Markdown):
- Leave a blank line between paragraphs.
- Start a line with `## ` for a sub-heading (the service title is already the main heading; do not repeat it).
- Start lines with `- ` for a bulleted list, or `1. ` for a numbered list.
- Links: `[text](https://example.com)`. Links to other pages of this site start with `/`, for example `[Contact](/contact/)`.
- There is no bold. `**word**` is shown underlined and `*word*` in the green colour, never heavy type; use them sparingly.
- Raw HTML and images inside the text are ignored. Pictures come only from `media.yaml`.

Labels on every service page (breadcrumb, "Previous service", "Next service") and the closing contact box are in `content/pages/services.yaml` under `serviceDetail`.

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

## The other pages (About, Why Us, Services, Contact, Careers, Gallery, Downloads)
Every word you see on these pages is in `content/pages/<page>.yaml`. Each file starts with the same two blocks:

- `seo`: `title` is the browser tab and Google headline (the site name is added for you), `description` is the grey text under it in search results.
- `hero`: the green banner at the top. `eyebrow` is the small label above, `title` is the main heading (the only h1 of the page), `lead` is the short line beside it (optional).

Pictures are always a key from `content/media.yaml` (for example `photo-aco-meet`), never a file path.
Phone numbers, email, address and the list of offices are typed once in `content/site.yaml`; the pages only show them.
Where a card has an `icon:`, pick one of: `award`, `briefcase`, `building`, `factory`, `file-check`, `file-text`, `globe`, `layers`, `leaf`, `map-pin`, `shield-check`, `users`, `waves`. Any other name stops the build and lists these.

### `pages/about.yaml`
- `story`: heading and `paragraphs` (a list, add or remove paragraphs freely) beside the tall picture; `image` is a media key (now `about-photo`).
- `accreditation`: section `label`, `heading`, `lead`, and a picture card `feature` (`image` media key, now `photo-aco-meet`, plus `eyebrow`, `title`, `text`).
- `offices`: `label`, `heading`, `lead` and the `icon` used on every office card. The cards themselves (city, address) come from `offices` in `content/site.yaml`.
- `cta`: green panel at the bottom with `primaryCta` and optional `secondaryCta` (each `label` and `href`).

### `pages/why-us.yaml`
- `pillars`: the cards, two per row. Each has `icon`, `title`, `text`. Add or remove entries freely.
- `feature`: picture card under the cards (`image` media key, now `photo-treatment-plant`, `eyebrow`, `title`, `text`).
- `cta`: green panel at the bottom, like on About.
- The row of big numbers on this page is the `stats` block of `pages/home.yaml`, so numbers are edited in one place.

### `pages/services.yaml`
- `hub`: the Services page. `seo`, `hero`, `listLabel` (read aloud by screen readers for the list), `viewLabel` (text at the bottom of every card), and `cta` (the sage panel at the bottom: `label`, `heading`, `lead`, `primaryCta`, optional `secondaryCta`). The cards come from `content/services/*.md`.
- `serviceDetail`: labels on every single service page (breadcrumb, previous/next, closing contact box, tab title for an unknown address).

### `pages/contact.yaml`
- `enquiry`: label, heading and intro above the enquiry form (the form fields themselves are built in code).
- `direct`: phone and email card. `phoneLabels` is one label per phone number of `content/site.yaml`, in order; with two labels the first two numbers show, add a third label to show a third number. `emailSubject` is the subject filled in when someone clicks the email address.
- `headOffice`: `city` must be one of the cities under `offices` in `content/site.yaml` (the address shown is `contact.address` there), plus `label` and `heading` of the card.
- `branches`: label and heading of the list of the other offices; each entry reads "`<city> <itemSuffix>`".

### `pages/careers.yaml`, `jobs.yaml`
- `seo`, `hero`, then `openings`: `label` and `heading` above the list, `countOne` / `countMany` (the "Showing 2 open positions" note; `{count}` is replaced by the number), and the texts shown while there are no openings.
- `content/jobs.yaml`: open positions. Leave it as `[]` when there are none: the Careers page then says so and offers a general application form.

### `pages/gallery.yaml`, `gallery.yaml`
- `pages/gallery.yaml` holds `seo` and `hero` only.
- `content/gallery.yaml` holds the photographs, one entry each: `title`, `category`, `image` (media key), optional `caption`.

### `pages/downloads.yaml`, `downloads.yaml`
- `pages/downloads.yaml`: `seo`, `hero`, `emptyText` (shown while there are no files) and `downloadLabel` (button on each file).
- `content/downloads.yaml`: files to download. Leave it as `[]` until real files exist: the Downloads page then shows the `emptyText` message, the menu link is removed (delete or add the `Downloads` line in `content/site.yaml` under `nav`) and the page stays out of the sitemap and search engines.

## What you cannot change here
Colors and fonts are part of the design. Ask the developer, for example "make the accent color a deeper ochre".

## Check your changes
Run `pnpm content:check`. It prints `Content OK` or tells you what to fix.
