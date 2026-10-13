/**
 * Publishing: site/page settings validation, <head> tags, page links, sitemap,
 * robots.txt and the publish checklist. Pure — unit-tested.
 * Spec: docs/superpowers/specs/2026-10-13-publishing-design.md
 */

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const attr = (s) => esc(s).replace(/"/g, '&quot;');

const HTTPS_URL = /^https:\/\/[^\s"'<>()\\]+$/;
const LANG = /^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$/;
const FAVICON_DATA = /^data:image\/(png|x-icon|vnd\.microsoft\.icon|svg\+xml|gif|jpeg|webp);base64,[A-Za-z0-9+/]+=*$/;
const MAX_FAVICON_CHARS = Math.ceil((100 * 1024 * 4) / 3); // 100 KB as base64
const SITE_PATH = /^\/[A-Za-z0-9._~\-/]*$/;

/** One unique file name per page; the first page is always index.html. */
export function pageFileNames(pages) {
  const used = new Set(['index']);
  return pages.map((p, i) => {
    if (i === 0) return 'index.html';
    const base = String(p.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `page-${i + 1}`;
    let name = base;
    for (let n = 2; used.has(name); n++) name = `${base}-${n}`;
    used.add(name);
    return `${name}.html`;
  });
}

export const TITLE_MAX = 70;
export const DESCRIPTION_MAX = 200;

/** project.site = { url (https, no trailing slash), lang, favicon }. */
export function normalizeSite(site) {
  const s = site && typeof site === 'object' ? site : {};
  const url = typeof s.url === 'string' && HTTPS_URL.test(s.url.trim()) ? s.url.trim().replace(/\/+$/, '') : '';
  const lang = typeof s.lang === 'string' && LANG.test(s.lang) ? s.lang : 'en';
  const f = typeof s.favicon === 'string' ? s.favicon : '';
  const favicon = (FAVICON_DATA.test(f) && f.length <= MAX_FAVICON_CHARS) || HTTPS_URL.test(f) ? f : '';
  return { url, lang, favicon };
}

/** page.seo = { title, description, image (https or site-relative), noindex }. */
export function normalizeSeo(seo) {
  const s = seo && typeof seo === 'object' ? seo : {};
  const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
  const image = typeof s.image === 'string' && (HTTPS_URL.test(s.image) || SITE_PATH.test(s.image)) ? s.image : '';
  return { title: str(s.title, TITLE_MAX), description: str(s.description, DESCRIPTION_MAX), image, noindex: Boolean(s.noindex) };
}

const isHome = (project, page) => project.pages[0]?.id === page.id || project.pages[0] === page;
const pageUrl = (site, file) => (site.url ? `${site.url}/${file === 'index.html' ? '' : file}` : '');

/** The title a page will have when published. */
export function pageTitle(project, page) {
  const seo = normalizeSeo(page.seo);
  if (seo.title) return seo.title;
  return isHome(project, page) ? project.name || 'Home' : `${page.name} — ${project.name}`;
}

/** <head> tags for one exported page (title, description, canonical, Open Graph, Twitter, robots, icon). */
export function headTags(project, page, fileName) {
  const site = normalizeSite(project.site);
  const seo = normalizeSeo(page.seo);
  const title = pageTitle(project, page);
  const url = pageUrl(site, fileName);
  const image = seo.image.startsWith('/') ? (site.url ? site.url + seo.image : '') : seo.image;
  const tags = [`<title>${esc(title)}</title>`];
  if (seo.description) tags.push(`<meta name="description" content="${attr(seo.description)}" />`);
  if (url) tags.push(`<link rel="canonical" href="${attr(url)}" />`);
  if (seo.noindex) tags.push('<meta name="robots" content="noindex" />');
  tags.push(`<meta property="og:type" content="website" />`, `<meta property="og:title" content="${attr(title)}" />`);
  if (seo.description) tags.push(`<meta property="og:description" content="${attr(seo.description)}" />`);
  if (url) tags.push(`<meta property="og:url" content="${attr(url)}" />`);
  if (image) tags.push(`<meta property="og:image" content="${attr(image)}" />`);
  tags.push(`<meta name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}" />`);
  if (site.favicon) tags.push(`<link rel="icon" href="${attr(site.favicon)}" />`);
  return tags.map((t) => `  ${t}`).join('\n');
}

/** Resolve a `page:<id>` link to the exported file name (unknown page -> '#'); other hrefs pass through. */
export function resolvePageHref(href, project, fileNames) {
  const m = /^page:(.+)$/.exec(String(href || ''));
  if (!m) return href;
  const i = project.pages.findIndex((p) => p.id === m[1]);
  return i === -1 ? '#' : fileNames[i];
}

/** sitemap.xml listing indexable pages (null without a site URL). */
export function sitemapXml(project, fileNames) {
  const site = normalizeSite(project.site);
  if (!site.url) return null;
  const urls = project.pages
    .map((p, i) => ({ p, file: fileNames[i] }))
    .filter(({ p }) => !normalizeSeo(p.seo).noindex)
    .map(({ file }) => `  <url><loc>${esc(pageUrl(site, file))}</loc></url>`);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
}

export function robotsTxt(project) {
  const site = normalizeSite(project.site);
  return `User-agent: *\nAllow: /\n${site.url ? `\nSitemap: ${site.url}/sitemap.xml\n` : ''}`;
}

/** What a site still needs before publishing — each item says why it matters. */
export function publishChecklist(project) {
  const site = normalizeSite(project.site);
  const missing = project.pages.filter((p) => { const s = normalizeSeo(p.seo); return !s.noindex && (!s.title || !s.description); });
  return [
    { key: 'url', label: 'Site address', ok: Boolean(site.url), why: 'Needed for search engines (sitemap, canonical links) and for social share previews.' },
    { key: 'seo', label: 'Page titles & descriptions', ok: missing.length === 0, detail: missing.map((p) => p.name).join(', '), why: 'They are what people see in Google results and in link previews.' },
    { key: 'favicon', label: 'Favicon', ok: Boolean(site.favicon), why: 'The little icon in browser tabs and bookmarks.' },
  ];
}
