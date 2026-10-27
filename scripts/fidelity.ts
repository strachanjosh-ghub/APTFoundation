/**
 * Content fidelity checks: compares migrated content objects against the raw
 * source snapshot. Used by `npm run validate:content` and the test suite.
 */
import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'node-html-parser';
import { Article, Cause, Page, Site } from '../src/lib/schemas';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const C = (p: string) => path.join(ROOT, 'content', p);
const readJson = (f: string) => JSON.parse(fs.readFileSync(f, 'utf8'));

export const norm = (s: string) =>
  s.replace(/\uFEFF/g, '').replace(/&nbsp;|\u00a0/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();
const textOf = (html: string) => norm(parse(`<div>${html.replace(/<br\s*\/?>/g, ' ')}</div>`).text);

/** Text units (paragraphs, headings, list items) of an HTML fragment. */
function units(html: string): string[] {
  const root = parse(`<div>${html}</div>`, { comment: false });
  return root.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, label').map((n) => norm(n.text)).filter((t) => t.length > 0);
}

// Source text that is platform chrome or dynamically generated (rendered by components from data)
const IGNORE = [
  /^You are currently on page/, /^Step \d$/, /^Donate to .*\*?$/, /^Donating in /, /^This section shows logos/,
  /^Read more$/, /^Back$/, /^One-time$/, /^Monthly$/, /^\$[\d,]+$/,
];

export interface Result { id: string; type: 'Page' | 'Cause' | 'Article'; validation: 'exact' | 'reviewed' | 'incomplete'; missing: string[]; notes: string[] }

function collectPageText(p: Page, site: Site): string {
  const parts: string[] = [];
  if (p.hero) parts.push(p.hero.heading, p.hero.html || '', ...(p.hero.ctas || []).map((c) => c.label));
  for (const b of p.contentBlocks) {
    const anyB = b as Record<string, unknown>;
    if (typeof anyB.html === 'string') parts.push(anyB.html);
    if (Array.isArray(anyB.ctas)) parts.push(...(anyB.ctas as { label: string }[]).map((c) => c.label));
    if (b.type === 'faq') b.items.forEach((i) => parts.push(`<h3>${i.question}</h3>`, i.html));
    if (b.type === 'steps') b.items.forEach((i) => parts.push(`<h3>${i.title}</h3>`, i.html));
    if (b.type === 'logoGrid') b.items.forEach((i) => parts.push(i.label));
    if (b.type === 'contactForm') parts.push(...site.contact.form.fields.map((f) => f.label));
    if (b.type === 'donationForm' && b.heading) parts.push(b.heading);
  }
  return parts.map((x) => textOf(x)).join(' \n ');
}

export function runFidelity(): Result[] {
  const raw = readJson(C('raw/onetomorrow-source-snapshot.json'));
  const site = Site.parse(readJson(C('site.json')));
  const results: Result[] = [];

  // Pages: every source text unit must appear verbatim in the migrated page
  for (const f of fs.readdirSync(C('pages'))) {
    const page = Page.parse(readJson(C(`pages/${f}`)));
    const rendered = raw.rendered[page.path]?.html || '';
    const root = parse(rendered, { comment: true });
    const sections = root.querySelectorAll('section');
    const migrated = collectPageText(page, site);
    const missing: string[] = [];
    const notes: string[] = [];
    for (const s of sections) {
      const html = s.innerHTML;
      if (/You are currently on page/.test(html) && /\/(posts|t)\//.test(html)) { notes.push('Dynamic listing section rendered from content objects.'); continue; }
      if (/apt-logo-primary-blue/.test(html) && s === sections[sections.length - 1]) continue; // global partner brands strip
      for (const u of units(html)) {
        if (IGNORE.some((r) => r.test(u))) continue;
        if (!migrated.includes(u)) missing.push(u);
      }
    }
    results.push({ id: page.id, type: 'Page', validation: missing.length ? 'incomplete' : 'exact', missing, notes });
  }

  // Causes: description and quote must equal the source profile fields
  const srcCauses = Object.fromEntries(raw.causes.map((c: { path: string }) => [c.path, c]));
  for (const f of fs.readdirSync(C('causes'))) {
    const cause = Cause.parse(readJson(C(`causes/${f}`)));
    const src = srcCauses[cause.slug];
    const missing: string[] = [];
    if (units(cause.description).join('\n') !== units(src.public?.richProfileDescription || '').join('\n')) missing.push('description text differs from source richProfileDescription');
    if (norm(cause.quote) !== norm(src.description || '')) missing.push('quote differs from source description');
    if (cause.name !== src.name.trim()) missing.push('name differs');
    results.push({ id: cause.id, type: 'Cause', validation: missing.length ? 'incomplete' : 'exact', missing, notes: [] });
  }

  // Articles: body text and title must equal the source post
  const srcPosts = Object.fromEntries(raw.posts.map((p: { path: string }) => [p.path, p]));
  for (const f of fs.readdirSync(C('articles'))) {
    const a = Article.parse(readJson(C(`articles/${f}`)));
    const src = srcPosts[a.slug];
    const missing: string[] = [];
    if (units(a.body).join('\n') !== units(src.body).join('\n')) missing.push('body text differs from source');
    if (a.title !== src.title) missing.push('title differs');
    results.push({ id: a.id, type: 'Article', validation: missing.length ? 'incomplete' : 'exact', missing, notes: [] });
  }
  return results;
}

/** Every internal link in content must resolve to a route, anchor or redirect. */
export function brokenInternalLinks(): { from: string; href: string }[] {
  const pages = fs.readdirSync(C('pages')).map((f) => readJson(C(`pages/${f}`)));
  const causes = fs.readdirSync(C('causes')).map((f) => readJson(C(`causes/${f}`)));
  const arts = fs.readdirSync(C('articles')).map((f) => readJson(C(`articles/${f}`)));
  const routes = new Set<string>([...pages.map((p) => p.path), ...causes.map((c) => c.path), ...arts.map((a) => a.path), '/sitemap.xml']);
  const redirects = ['/t/conservation-international-greater-mekong', '/t/downtown-eastside-womens-centre', '/t/peace-village-international', '/t/rainforest-4-foundation', '/contact', '/privacypolicy', '/privacy-policy', '/privacy', '/blog', '/about', '/one-tomorrow', '/one-tomorrow/posts'];
  const ok = (href: string) => {
    const p = href.split('#')[0].split('?')[0] || '/';
    return routes.has(p) || redirects.includes(p.toLowerCase()) || [...routes].some((r) => r.toLowerCase() === p.toLowerCase());
  };
  const out: { from: string; href: string }[] = [];
  const scan = (from: string, obj: unknown) => {
    const s = JSON.stringify(obj);
    for (const m of s.matchAll(/"href":"(\/[^"]*)"/g)) if (!ok(m[1])) out.push({ from, href: m[1] });
    for (const m of s.matchAll(/href=\\"(\/[^"\\]*)\\"/g)) if (!ok(m[1])) out.push({ from, href: m[1] });
  };
  pages.forEach((p) => scan(p.path, p)); causes.forEach((c) => scan(c.path, c)); arts.forEach((a) => scan(a.path, a));
  scan('site.json', readJson(C('site.json')));
  return out;
}

/** Media referenced in content that is not self-hosted or missing from /public. */
export function mediaProblems(): string[] {
  const files = ['site.json', ...['pages', 'causes', 'articles'].flatMap((d) => fs.readdirSync(C(d)).map((f) => `${d}/${f}`))];
  const problems: string[] = [];
  for (const f of files) {
    const s = fs.readFileSync(C(f), 'utf8');
    for (const m of s.matchAll(/raisely-images\.imgix\.net[^"\\ ]*/g)) problems.push(`${f}: hotlinked ${m[0]}`);
    for (const m of s.matchAll(/(\/media\/[^"\\ ?]+)/g)) if (!fs.existsSync(path.join(ROOT, 'public', m[1]))) problems.push(`${f}: missing file ${m[1]}`);
  }
  return [...new Set(problems)];
}
