# How to edit the website content

Everything you can change without a developer lives in two places:

- `content/`: all text, lists and settings (this folder)
- `public/media/`: all images, logos, videos and PDF files

## Change text
1. Open the file for that page (for example `content/pages/home.yaml`).
2. Edit the words after the colon. Keep the spaces and the dashes `-` at the start of list items.
3. Save, then ask for a rebuild. To publish it yourself, follow `docs/DEPLOY-HOSTINGER.md`: `pnpm check:launch`, `pnpm build`, `pnpm package:hostinger`, then upload the whole `hostinger-dist` folder (not the `out` folder on its own).

Save files as UTF-8 (the default in Notepad and VS Code).

Upload everything inside the `hostinger-dist` folder (it holds `out`, `server.mjs` and `package.json`). The `.htaccess` file is not used on the Node.js plan, so you do not need to upload or edit it.

If something is wrong, the build stops and tells you the file and the field that needs fixing,
for example: `content/site.yaml → contact.email: Invalid email address`.

## Replace an image
1. Put the new file in `public/media/` (same file name keeps everything working with no other change).
2. If you use a new file name, open `content/media.yaml` and change the `src:` line for that image.
3. Update `alt:` to describe the picture in a few words. Screen readers and Google read it.

### Add or replace a picture: size and format
- Accepted: JPG, PNG or WebP photos. Logos: SVG, or a small WebP with a transparent background.
- Recommended size: full-width pictures (Home banner, service pictures) at least 2400 px wide; gallery, card and portrait pictures about 1200 px wide. Smaller files look soft on large and high-density screens, and the site never enlarges a picture.
- After putting new JPG/PNG files in `public/media/`, run `pnpm optimize:images`. It resizes them and writes a `.webp` next to each (about 80 percent smaller). Then change the `src:` in `content/media.yaml` to the `.webp` name and delete the old JPG/PNG (the original stays in git history).
- `pnpm optimize:images --dry` only shows what it would do; `--force` redoes files that already have a newer `.webp`. The social-sharing picture `brand/og-image.jpg` stays a JPG on purpose.
- A test keeps `public/media` under 6 MB in total and every photo under 400 KB, so an oversized upload is caught before the site is built.

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
- `image`: a key from `content/media.yaml` (see "Replace an image" above). The picture is shown at the top of the page, and as the small picture in this service's row in "What we offer" on the Home page. Optional: delete the line and the row shows a plain placeholder box instead.
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
Controls the layout and copy of the home page (`content/pages/home.yaml`), top to bottom:

- `seo`: the page title (used exactly as written, no "| Envirosphere" added) and the description shown in search results.
- `hero`: Top banner with accreditation eyebrow, main title, subtitle, CTA links and scroll label. `image` is the background photo (a key from `content/media.yaml`; leave it out for a plain green band). `highlights` lists the labels of stats from the `stats` block below (for example `[Clients, Ongoing projects]`): their numbers appear as short facts under the buttons, so a number is only ever typed once. `keywords` are the words at the bottom right, shown separated by dots.
- `about`: Firm overview text, paragraphs, and CTA button. `image` is the photo beside the text (a key from `content/media.yaml`; it is `ecological-survey` today, change the key to change the photo).
- `visualBreak`: the full-screen photo before "What we offer". It stays pinned to the top of the screen while you scroll: the big word on it (the `label` of `services` below) is revealed, then the Services section slides up over the photo like a window. `image` is a media key; the office cities from `content/site.yaml` show at its bottom (`showOffices: false` hides them). Optional `tag` (small pill at the top left) and `quote`. People who prefer reduced motion see a plain photo band with the word already shown.
- `services`: `label` is the big centered word on the photo above (it is not repeated in the section). `heading`, `intro` and `cta` (the "All services" button) are the first lines of the Services section. Below them is one row per service, loaded from `content/services/*.md` ordered by `order:`: number, title, a small picture (the service's `image`, or a placeholder box if it has none), the summary and an arrow. On a mouse screen the row under the pointer fills with green while the others fade; touch screens just show the rows.
- `stats`: Key metrics and animated counter items (clients, ongoing projects, certifications). Shown on the dark green background.
- `clients`: Logo marquee rows. Each logo comes from a `client-*` key in `content/media.yaml` (`public/media/clients/*.webp`).
- `fieldArchive`: "Field work": `label`, `heading`, `body`, the top button `topCta`, and the photos as a bento grid (tiles of different sizes). Use exactly four `items` for the tidy layout (each: `image`, `tag`, `caption`); after the photos comes one wide tile that links to the full gallery, using the `bottomCta` label and link.
- `process`: "How we work" (draft wording: please review). Each step has a `title`, a `body` and an optional `image` (a name from `media.yaml`). On a desktop the section stays pinned while you scroll: the picture on the left is revealed through a mask as each step becomes active, and that step's card on the right lights up. Steps without an `image` show a placeholder box. On phones and short screens it is a simple list with each picture revealed as it scrolls into view.
- `testimonials`: "Client testimonials", shown as a slider with one quote at a time. `items` are the quotes (`quote`, `name`, optional `role`); visitors move with the arrow buttons, the bars, the left and right arrow keys, or by dragging. `controls` are the words screen readers use (`previous`, `next`, and `position`, where `{current}` and `{total}` are replaced by the numbers). Confirm the clients agree to be quoted.
- `contact`: Closing call-to-action banner with phone and email contact options (values sourced from `content/site.yaml`).

`pnpm content:check` verifies every image key used on the Home page (hero, about, field photos, visual break, client logos) and each service's `image` (the small picture in its row) and tells you the file and field of a wrong one.

To add client logos: add the file to `public/media/clients/`, add an entry to `media.yaml`, then add its key to `clients.logos`.

## The two forms (`content/forms.yaml`)
Every word of the enquiry form (Contact page) and the job application window (Careers page) is in `content/forms.yaml`:
- `common`: the "please check these fields" heading, the sending/verification texts, `tooFast` (shown when the form is sent within 3 seconds of opening, e.g. after autofill: nothing is sent and the visitor presses the button again), and `submit` (what is shown after sending when the server sends no text of its own; `{status}` and `{error}` are replaced when shown).
- `inquiry` and `application`: each field's `label` and `placeholder` (`summaryLabel` is the shorter name used in the "please check" list), the error messages (`errors`), button texts and the success texts. In the application window `{role}` is replaced by the job title and `{size}` by the file size.
- The phone number and email shown when sending fails are NOT written here: they are the ones in `content/site.yaml`. For job applications the email is `contact.careersEmail` when you add that line to `site.yaml`; if you leave it out the main `contact.email` is used (no other address is ever invented).
- The texts of each opening on the Careers page ("Key Requirements:", "Apply with CV", "Apply via Email", the email subject with `{title}`) are in `pages/careers.yaml` under `openings`.

## The other pages (About, Why Us, Services, Contact, Careers, Gallery, Downloads)
Every word you see on these pages is in `content/pages/<page>.yaml`. Each file starts with the same two blocks:

- `seo`: `title` is the browser tab and Google headline (the site name is added for you), `description` is the grey text under it in search results.
- `hero`: the green banner at the top. `eyebrow` is the small label above, `title` is the main heading (the only h1 of the page), `lead` is the short line beside it (optional).

Pictures are always a key from `content/media.yaml` (for example `photo-aco-meet`), never a file path.
Phone numbers, email, address and the list of offices are typed once in `content/site.yaml`; the pages only show them.
`contact.addressParts` in `content/site.yaml` repeats the address in five parts (street, locality, region, postal code, country code such as `IN`). It is used only for Google's business information, never shown on a page. Fill in all five or delete the block; without it no address is sent to Google. Keep it equal to `contact.address`.
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
- `enquiry`: label, heading and intro above the enquiry form (the form fields themselves are in `content/forms.yaml`).
- `direct`: phone and email card. `phoneLabels` is one label per phone number of `content/site.yaml`, in order; with two labels the first two numbers show, add a third label to show a third number. `emailSubject` is the subject filled in when someone clicks the email address.
- `headOffice`: `city` must be one of the cities under `offices` in `content/site.yaml` (the address shown is `contact.address` there), plus `label` and `heading` of the card.
- `branches`: label and heading of the list of the other offices; each entry reads "`<city> <itemSuffix>`".

### `pages/careers.yaml`, `jobs.yaml`
- `seo`, `hero`, then `openings`: `label` and `heading` above the list, `countOne` / `countMany` (the "Showing 2 open positions" note; `{count}` is replaced by the number), the texts shown while there are no openings, and the labels shown on each opening (`requirementsLabel`, `applyWithCvLabel`, `applyByEmailLabel`, `emailSubject` with `{title}`).
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
