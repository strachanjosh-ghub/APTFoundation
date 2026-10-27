/**
 * Content layer. Reads structured JSON content objects from /content and
 * validates them. Pages never import JSON directly — they go through here,
 * so the storage backend can be swapped for a headless CMS by reimplementing
 * these functions.
 */
import fs from 'node:fs';
import path from 'node:path';
import { Article, Cause, Page, Site } from './schemas';

const CONTENT_DIR = path.join(process.cwd(), 'content');

function readJson(file: string): unknown {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function loadDir<T>(dir: string, schema: { parse: (x: unknown) => T }): T[] {
  const full = path.join(CONTENT_DIR, dir);
  return fs
    .readdirSync(full)
    .filter((f) => f.endsWith('.json'))
    .map((f) => {
      try {
        return schema.parse(readJson(path.join(full, f)));
      } catch (e) {
        throw new Error(`Invalid content object ${dir}/${f}: ${(e as Error).message}`);
      }
    });
}

let cache: { site: Site; pages: Page[]; causes: Cause[]; articles: Article[] } | null = null;

function load() {
  if (cache && process.env.NODE_ENV === 'production') return cache;
  const includeDrafts = process.env.CONTENT_PREVIEW === 'true';
  const published = <T extends { status: string }>(xs: T[]) => (includeDrafts ? xs : xs.filter((x) => x.status === 'published'));
  cache = {
    site: Site.parse(readJson(path.join(CONTENT_DIR, 'site.json'))),
    pages: published(loadDir('pages', Page)),
    causes: published(loadDir('causes', Cause)).sort((a, b) => a.order - b.order),
    articles: published(loadDir('articles', Article)).sort((a, b) =>
      (b.publishedDate || '').localeCompare(a.publishedDate || '') ||
      String(b.source?.createdAt ?? '').localeCompare(String(a.source?.createdAt ?? ''))),
  };
  return cache;
}

export const getSite = () => load().site;
export const getPages = () => load().pages;
export const getPageByPath = (p: string) => load().pages.find((x) => x.path.toLowerCase() === p.toLowerCase());
export const getCauses = () => load().causes;
export const getCause = (slug: string) => load().causes.find((c) => c.slug === slug);
export const getArticles = () => load().articles;
export const getArticle = (slug: string) => load().articles.find((a) => a.slug === slug);

/** Plain-text excerpt helper, reproducing the source site's "first N chars..." card behaviour. */
export function excerpt(html: string, n: number): string {
  const text = html.replace(/<br\s*\/?>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();
  return text.length > n ? text.slice(0, n) + '...' : text;
}

/** Dates on the source were displayed in Australian Eastern time, e.g. "17 Jun 2025". */
export function formatDate(iso?: string): string {
  if (!iso) return '';
  const parts = new Intl.DateTimeFormat('en-AU', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Australia/Melbourne' }).formatToParts(new Date(iso));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  return `${get('day')} ${get('month').slice(0, 3)} ${get('year')}`;
}

/** Minimal cause list for the client-side donation panel. */
export const getDonationCauses = () =>
  load().causes.map((c) => ({ slug: c.slug, name: c.name, isGeneralFund: c.isGeneralFund, impactAmounts: c.impactAmounts }));
