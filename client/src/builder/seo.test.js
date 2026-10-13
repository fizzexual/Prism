import { describe, it, expect } from 'vitest';
import { normalizeSite, normalizeSeo, headTags, resolvePageHref, sitemapXml, robotsTxt, publishChecklist } from './seo.js';

const project = (over = {}) => ({
  name: 'Acme',
  site: { url: 'https://acme.example', lang: 'en', favicon: '' },
  pages: [
    { id: 'home', name: 'Home', rootId: 'r1', seo: { title: 'Acme — Rockets', description: 'We build rockets.', image: '/og.png' } },
    { id: 'about', name: 'About', rootId: 'r2', seo: { title: '', description: '', noindex: true } },
  ],
  ...over,
});
const files = ['index.html', 'about.html'];

describe('normalizeSite / normalizeSeo', () => {
  it('fills defaults', () => {
    expect(normalizeSite(undefined)).toEqual({ url: '', lang: 'en', favicon: '' });
    expect(normalizeSeo(undefined)).toEqual({ title: '', description: '', image: '', noindex: false });
  });
  it('keeps only https site URLs (without a trailing slash) and sane languages', () => {
    expect(normalizeSite({ url: 'https://acme.example/' }).url).toBe('https://acme.example');
    expect(normalizeSite({ url: 'http://acme.example' }).url).toBe('');
    expect(normalizeSite({ url: 'javascript:alert(1)' }).url).toBe('');
    expect(normalizeSite({ lang: 'pt-BR' }).lang).toBe('pt-BR');
    expect(normalizeSite({ lang: 'en"><script>' }).lang).toBe('en');
  });
  it('accepts favicons that are small images or https URLs', () => {
    expect(normalizeSite({ favicon: 'data:image/png;base64,iVBORw0KGgo=' }).favicon).toBe('data:image/png;base64,iVBORw0KGgo=');
    expect(normalizeSite({ favicon: 'data:text/html;base64,PHNjcmlwdD4=' }).favicon).toBe('');
    expect(normalizeSite({ favicon: 'data:image/png;base64,' + 'A'.repeat(140000) }).favicon).toBe('');
  });
  it('trims long titles/descriptions and only allows https or site-relative images', () => {
    expect(normalizeSeo({ title: 'x'.repeat(90) }).title).toHaveLength(70);
    expect(normalizeSeo({ description: 'y'.repeat(300) }).description).toHaveLength(200);
    expect(normalizeSeo({ image: '/img/og.png' }).image).toBe('/img/og.png');
    expect(normalizeSeo({ image: 'https://cdn.x/og.jpg' }).image).toBe('https://cdn.x/og.jpg');
    expect(normalizeSeo({ image: 'javascript:x' }).image).toBe('');
  });
});

describe('headTags', () => {
  it('writes title, description, canonical, Open Graph and Twitter tags for the home page', () => {
    const p = project();
    const h = headTags(p, p.pages[0], 'index.html');
    expect(h).toContain('<title>Acme — Rockets</title>');
    expect(h).toContain('<meta name="description" content="We build rockets." />');
    expect(h).toContain('<link rel="canonical" href="https://acme.example/" />');
    expect(h).toContain('<meta property="og:url" content="https://acme.example/" />');
    expect(h).toContain('<meta property="og:image" content="https://acme.example/og.png" />');
    expect(h).toContain('<meta name="twitter:card" content="summary_large_image" />');
    expect(h).not.toContain('noindex');
  });
  it('falls back to "Page — Site", marks noindex, and links non-home pages by file name', () => {
    const p = project();
    const h = headTags(p, p.pages[1], 'about.html');
    expect(h).toContain('<title>About — Acme</title>');
    expect(h).toContain('<meta name="robots" content="noindex" />');
    expect(h).toContain('<link rel="canonical" href="https://acme.example/about.html" />');
    expect(h).toContain('<meta name="twitter:card" content="summary" />');
  });
  it('omits URL-based tags when no site URL is set, and escapes everything', () => {
    const p = project({ site: { url: '' } });
    p.pages[0].seo = { title: '"><script>alert(1)</script>', description: 'a & b <c>' };
    const h = headTags(p, p.pages[0], 'index.html');
    expect(h).not.toContain('canonical');
    expect(h).not.toContain('og:url');
    expect(h).not.toContain('<script>');
    expect(h).toContain('a &amp; b &lt;c&gt;');
  });
  it('adds the favicon', () => {
    const p = project({ site: { url: '', favicon: 'data:image/png;base64,iVBORw0KGgo=' } });
    expect(headTags(p, p.pages[0], 'index.html')).toContain('<link rel="icon" href="data:image/png;base64,iVBORw0KGgo=" />');
  });
});

describe('resolvePageHref', () => {
  it('turns page links into exported file names; unknown pages become #', () => {
    const p = project();
    expect(resolvePageHref('page:about', p, files)).toBe('about.html');
    expect(resolvePageHref('page:home', p, files)).toBe('index.html');
    expect(resolvePageHref('page:gone', p, files)).toBe('#');
    expect(resolvePageHref('https://x.com', p, files)).toBe('https://x.com');
  });
});

describe('sitemap / robots', () => {
  it('lists indexable pages with absolute URLs', () => {
    const xml = sitemapXml(project(), files);
    expect(xml).toContain('<loc>https://acme.example/</loc>');
    expect(xml).not.toContain('about.html'); // noindex
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
  });
  it('robots.txt points at the sitemap', () => {
    expect(robotsTxt(project())).toBe('User-agent: *\nAllow: /\n\nSitemap: https://acme.example/sitemap.xml\n');
  });
  it('without a site URL there is no sitemap', () => {
    expect(sitemapXml(project({ site: {} }), files)).toBeNull();
    expect(robotsTxt(project({ site: {} }))).toBe('User-agent: *\nAllow: /\n');
  });
});

describe('publishChecklist', () => {
  it('reports what is missing, per item (pages hidden from search do not need SEO text)', () => {
    const p = project();
    p.pages.push({ id: 'pricing', name: 'Pricing', rootId: 'r3', seo: {} });
    const items = publishChecklist(p);
    expect(items.find((i) => i.key === 'url').ok).toBe(true);
    expect(items.find((i) => i.key === 'favicon').ok).toBe(false);
    const seo = items.find((i) => i.key === 'seo');
    expect(seo.ok).toBe(false);
    expect(seo.detail).toBe('Pricing'); // About is noindex, so it is not listed
  });
});
