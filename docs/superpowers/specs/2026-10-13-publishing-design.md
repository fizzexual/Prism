# Publishing — design

## Goal
An exported site that is ready for the real web: found by search engines, good
looking when shared, pages linked to each other, and a Publish flow that takes
you from "done" to "live" without guessing.

## Data
```
project.site = { url: 'https://example.com', lang: 'en', favicon: '' }
page.seo     = { title: '', description: '', image: '', noindex: false }
```
- `url` must be https; it is used for canonical, og:url, absolute og:image and the sitemap.
- `lang` is a BCP-47-ish tag (`en`, `bg`, `pt-BR`).
- `favicon` is a data URL of an uploaded png/ico/svg (≤ 100 KB) or an https URL.
- SEO `image` is an https URL or a site-relative path (`/og.png`, made absolute with `url`).
- `title` ≤ 70 characters and `description` ≤ 200; longer values are trimmed when exported.
- Everything is validated (`seo.js`) before it is written into HTML, and attribute-escaped.

## Head of every exported page
- `<html lang>`
- `<title>`: the SEO title, else "Page — Site" (the home page uses the site name alone)
- `meta description`
- `link canonical`, but only when a site URL is set
- Open Graph: title, description, type=website, url, image
- `twitter:card`: `summary_large_image` with an image, `summary` without
- `meta robots noindex` when the page is hidden from search
- `link rel=icon` when a favicon is set

## Links between pages
- A Link's `href` can be `page:<pageId>`. The export resolves it to that page's file
  (`index.html`, `about.html`…). A deleted page resolves to `#`.
- Buttons get an optional link too. A linked button exports as `<a>` with the
  button's classes, so it looks the same and navigates; a button without a link
  stays a `<button>`.
- Panel: a Link/Button "Links to" picker (a page or a custom URL).

## Publish
The Publish dialog:
1. A checklist: site URL set, every page has a title and description, favicon set.
   Each item is fixable in place. Nothing is required, but each missing item explains why it matters.
2. **Download site (.zip)**: every page plus `sitemap.xml` and `robots.txt` (both only
   when a site URL is set). It always produces a ZIP, so hosting is one drag-and-drop.
3. Exact hosting steps for Netlify Drop, GitHub Pages and any static host.

No account login happens inside Prism: one-click deploy would need the user's
hosting credentials, and that stays a manual step.
