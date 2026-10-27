#!/usr/bin/env node
/**
 * Repeatable content migration: Raisely snapshot -> structured CMS content objects.
 *
 *   node scripts/migrate.mjs [path/to/onetomorrow-source-snapshot.json]
 *
 * Input:  content/raw/onetomorrow-source-snapshot.json (captured from the live Raisely site:
 *         Raisely public API responses + rendered DOM per route).
 * Output: content/site.json, content/pages/*.json, content/causes/*.json,
 *         content/articles/*.json, content/assets.json, content/migration-register.json
 *
 * Editorial text is never rewritten. The only transformations are structural
 * (splitting sections into typed blocks), removal of Raisely platform chrome,
 * removal of empty spacer paragraphs, and rewriting of internal absolute URLs
 * to relative routes. Every change to a hyperlink is logged in the register.
 */
import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'node-html-parser';
import { applyEditorialDeep, EDITORIAL_CHANGES } from './editorial.mjs';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const SRC = process.argv[2] || path.join(ROOT, 'content/raw/onetomorrow-source-snapshot.json');
const OUT = path.join(ROOT, 'content');
const ORIGIN = 'https://one-tomorrow.raiselysite.com';
const D = JSON.parse(fs.readFileSync(SRC, 'utf8'));

const register = [];
const linkFixes = [];
const brandReplacements = [];
const assets = new Map(); // baseUrl -> {originalUrl, localPath, usedBy:Set}

// ---------- helpers ----------
const write = (rel, obj) => {
  const f = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  // Owner-approved editorial changes (rename, standardised statements) are applied to every
  // content object except the raw snapshot and the registers. See scripts/editorial.mjs.
  const out = /^(assets|migration-register)\.json$/.test(rel) ? obj : applyEditorialDeep(obj);
  fs.writeFileSync(f, JSON.stringify(out, null, 2) + '\n');
};
const slugify = (s) => s.toLowerCase().replace(/^\//, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'home';

function asset(url, usedBy) {
  if (!url) return undefined;
  if (url.startsWith('/')) url = ORIGIN + url;
  const base = url.split('?')[0];
  if (!/^https?:\/\//.test(base)) return undefined;
  if (!assets.has(base)) {
    const name = decodeURIComponent(base.split('/').pop()).replace(/[^a-zA-Z0-9._-]/g, '-');
    assets.set(base, { originalUrl: base, localPath: `/media/${name}`, usedBy: new Set() });
  }
  const rec = assets.get(base);
  rec.usedBy.add(usedBy);
  // Use the self-hosted copy once it has been downloaded into /public/media (see scripts/import-assets.mjs)
  const local = path.join(ROOT, 'public', rec.localPath);
  if (fs.existsSync(local)) { rec.status = 'downloaded'; rec.bytes = fs.statSync(local).size; return rec.localPath; }
  rec.status = 'missing';
  return base;
}
const media = (url, alt, usedBy) => {
  const src = asset(url, usedBy);
  return src ? { src, ...(alt ? { alt } : {}) } : undefined;
};

/** Normalise a link target. Internal absolute links become relative routes. */
function fixHref(href, ctx) {
  if (!href) return href;
  const orig = href;
  let h = href.trim();
  h = h.replace(/^https?:\/\/one-tomorrow\.raisely(site)?\.com/i, '');
  if (h === '') h = '/';
  if (h === '/blog') h = '/news';
  // Known source defects, corrected and logged
  if (/aptouring\.com\.au\/(%20| )target=/i.test(h)) h = 'https://www.aptouring.com.au/';
  if (/^\/(www\.)?[a-z0-9-]+(\.[a-z0-9-]+)+(\/|$)/i.test(h)) h = 'https://' + h.slice(1); // domain written as a relative path
  if (h.startsWith('mailto: ')) h = 'mailto:' + h.slice(8);
  if (h !== orig) linkFixes.push({ context: ctx, from: orig, to: h });
  return h;
}

function cleanHtml(html, ctx) {
  const root = parse(`<div>${html}</div>`, { comment: false });
  root.querySelectorAll('a').forEach((a) => {
    a.setAttribute('href', fixHref(a.getAttribute('href'), ctx));
    if (a.getAttribute('target') === '_blank') a.setAttribute('rel', 'noopener noreferrer');
    if (!a.text.trim() && !a.querySelector('img')) a.remove(); // empty anchors carry no content
  });
  root.querySelectorAll('img').forEach((img) => {
    const src = asset(img.getAttribute('src'), ctx);
    if (src) img.setAttribute('src', src);
  });
  let out = root.firstChild.innerHTML;
  out = out
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<p>(\s|&nbsp;|<br>|<strong><\/strong>|<em><\/em>|﻿)*<\/p>/g, '') // empty spacer paragraphs
    .replace(/\n{2,}/g, '\n')
    .trim();
  return out;
}

const textOf = (html) => parse(`<div>${html}</div>`).text.replace(/\s+/g, ' ').trim();

// ---------- section parsing ----------
function sectionsOf(route) {
  const r = D.rendered[route];
  if (!r || !r.html) return [];
  const root = parse(`<root>${r.html}</root>`, { comment: true });
  return root.querySelectorAll('section').map((s) => ({
    id: s.getAttribute('id'),
    bg: s.getAttribute('data-bg'),
    node: s,
    raw: s.innerHTML,
  }));
}

/** Split a section's inner HTML on block markers. */
function blocksIn(raw) {
  const parts = raw.split(/<!--block:([\w-]+)-->/);
  const out = [{ kind: 'text', html: parts[0] }];
  for (let i = 1; i < parts.length; i += 2) out.push({ kind: parts[i], html: parts[i + 1] || '' });
  return out.filter((b) => b.html.trim() || b.kind !== 'text');
}

const BRAND_RE = /(apt-logo|tm-logo|captains-choice|botanica|antarctica-flights)/;

/** Raisely custom components hold buttons; any other markup after them is ordinary content. */
function splitComponent(html, ctx) {
  const n = parse(`<div>${html}</div>`);
  const ctas = n.querySelectorAll('a').filter((a) => a.text.trim()).map((a) => ({ label: a.text.trim(), href: fixHref(a.getAttribute('href'), ctx) }));
  n.querySelectorAll('a').forEach((a) => a.remove());
  return { ctas, rest: n.firstChild.innerHTML };
}

function ctasFrom(html, ctx) {
  return parse(`<div>${html}</div>`).querySelectorAll('a').map((a) => ({
    label: a.text.trim(),
    href: fixHref(a.getAttribute('href'), ctx),
  })).filter((c) => c.label);
}

function convertSection(sec, ctx, opts = {}) {
  const raw = sec.raw.replace(/<!--bg:[^>]*-->/g, '');
  const text = textOf(raw.replace(/<!--[\s\S]*?-->/g, ''));
  const hasImg = /<img /.test(raw);
  const bgImage = sec.bg ? media(sec.bg, '', ctx) : undefined;

  if (!text && !hasImg) {
    return bgImage ? { type: 'imageBand', image: bgImage } : null;
  }
  const parts = blocksIn(raw);
  const images = parts.filter((p) => p.kind === 'image');

  // Logo grid (image + link items)
  if (images.length >= 3 && images.every((p) => /<a /.test(p.html))) {
    const items = images.map((p) => {
      const n = parse(p.html);
      const img = n.querySelector('img'); const a = n.querySelector('a');
      return {
        image: media(img.getAttribute('src'), img.getAttribute('alt') || '', ctx),
        label: a.text.trim(),
        href: fixHref(a.getAttribute('href'), ctx),
      };
    });
    if (items.every((i) => BRAND_RE.test(i.image.src)) && opts.isLastBrands) return { type: 'partnerBrands' };
    const video = parts.find((p) => p.kind === 'video');
    const blocks = [{ type: 'logoGrid', items }];
    if (video && opts.videoUrl) blocks.push({ type: 'video', url: opts.videoUrl, title: 'OneTomorrow video' });
    return blocks;
  }

  // Steps: image followed by h3 heading + text
  if (images.length >= 2 && images.every((p) => /<h3>/.test(p.html))) {
    return {
      type: 'steps',
      items: images.map((p) => {
        const n = parse(p.html);
        const img = n.querySelector('img');
        const h3 = n.querySelector('h3');
        img.remove(); h3.remove();
        return { image: media(img.getAttribute('src'), '', ctx), title: h3.text.trim(), html: cleanHtml(n.innerHTML, ctx) };
      }),
    };
  }

  // Generic: rich text, optionally with images (media + text)
  const ctas = [];
  let html = '';
  const imgs = [];
  let imageFirst = null;
  for (const p of parts) {
    if (p.kind === 'custom-component') { const sc = splitComponent(p.html, ctx); ctas.push(...sc.ctas); html += sc.rest; continue; }
    if (p.kind === 'image') {
      const n = parse(p.html);
      const img = n.querySelector('img');
      const a = n.querySelector('a');
      if (imageFirst === null) imageFirst = !textOf(html);
      imgs.push({ ...media(img.getAttribute('src'), img.getAttribute('alt') || '', ctx), ...(a ? { href: fixHref(a.getAttribute('href'), ctx) } : {}) });
      img.remove(); if (a && !a.text.trim()) a.remove();
      html += n.innerHTML;
      continue;
    }
    html += p.html;
  }
  html = cleanHtml(html, ctx);
  if (imgs.length) {
    return { type: 'mediaText', images: imgs, imagePosition: imageFirst ? 'left' : 'right', html, ...(ctas.length ? { ctas } : {}) };
  }
  if (!html && ctas.length) return { type: 'cta', ctas };
  return { type: 'richText', html, ...(ctas.length ? { ctas } : {}), ...(bgImage ? { backgroundImage: bgImage } : {}) };
}

function heroFrom(sec, ctx) {
  const raw = sec.raw.replace(/<!--bg:[^>]*-->/g, '');
  const n = parse(`<div>${raw}</div>`, { comment: true });
  const h1 = n.querySelector('h1');
  const heading = h1.text.trim();
  h1.remove();
  const parts = blocksIn(n.firstChild.innerHTML);
  let html = ''; const ctas = [];
  for (const p of parts) {
    if (p.kind === 'custom-component') { const sc = splitComponent(p.html, ctx); ctas.push(...sc.ctas); html += sc.rest; }
    else html += p.html;
  }
  // OneTomorrow's decorative brand artwork (ot-background-*.svg) is brand chrome, not editorial
  // content; it is replaced by the APT Foundation brand treatment and logged in the register.
  const brandArtwork = sec.bg && /ot-background-\d+-svg/.test(sec.bg);
  if (brandArtwork) brandReplacements.push({ context: ctx, asset: sec.bg.split('?')[0], replacedWith: 'APT Foundation brand hero (config/brand.ts)' });
  return {
    heading,
    ...(cleanHtml(html, ctx) ? { html: cleanHtml(html, ctx) } : {}),
    ...(sec.bg && !brandArtwork ? { backgroundImage: media(sec.bg, '', ctx) } : {}),
    ...(ctas.length ? { ctas } : {}),
  };
}

// ---------- pages ----------
const pageMeta = Object.fromEntries(D.pages.map((p) => [p.path, p]));
const PAGE_DEFS = [
  { route: '/', template: 'home', id: 'home' },
  { route: '/about-us', template: 'about', id: 'about-us' },
  { route: '/faqs', template: 'faq', id: 'faqs', parentId: 'about-us' },
  { route: '/responsible-travel', template: 'standard', id: 'responsible-travel' },
  { route: '/causes', template: 'cause-listing', id: 'causes' },
  { route: '/news', template: 'news-listing', id: 'news' },
  { route: '/Contact', template: 'contact', id: 'contact' },
  { route: '/donate', template: 'donation', id: 'donate' },
  { route: '/PrivacyPolicy', template: 'legal', id: 'privacy-policy' },
  { route: '/antarctic-science-foundation', template: 'standard', id: 'antarctic-science-foundation-legacy', note: 'Legacy standalone page (not linked from navigation); superseded by /t/antarctic-science-foundation but preserved at its original URL.' },
];
const VIDEO_URLS = { '/': 'https://vimeo.com/408230655' };
const ANCHORS = { 'Making a Difference': 'difference', 'Background': 'background' };

for (const def of PAGE_DEFS) {
  const ctx = def.route;
  const secs = sectionsOf(def.route);
  const meta = pageMeta[def.route] || {};
  const r = D.rendered[def.route];
  const blocks = [];
  let hero;
  const notes = def.note ? [def.note] : [];
  // index of the global brand row (last section containing brand logos)
  const brandIdx = secs.map((s, i) => (BRAND_RE.test(s.raw) && /block:image/.test(s.raw) ? i : -1)).filter((i) => i >= 0).pop();
  const faqItems = [];

  secs.forEach((sec, i) => {
    const raw = sec.raw;
    const firstContent = !hero && /<h1/.test(raw) && blocks.filter((b) => b.type !== 'imageBand').length === 0;
    if (firstContent && !/Enter custom amount/.test(raw)) {
      hero = heroFrom(sec, ctx);
      // a preceding bare image band becomes the hero background
      if (!hero.backgroundImage && blocks.length === 1 && blocks[0].type === 'imageBand') hero.backgroundImage = blocks.shift().image;
      return;
    }
    // Dynamic sections
    if (/You are currently on page/.test(raw) && /\/posts\//.test(raw)) {
      blocks.push({ type: 'newsFeed', pageSize: def.route === '/' ? 3 : 6, showPagination: def.route !== '/' });
      return;
    }
    if (/You are currently on page/.test(raw) && /\/t\//.test(raw)) {
      blocks.push({ type: 'causeGrid', heading: 'Our Causes Include' });
      return;
    }
    if (def.route === '/Contact' && /<form/.test(raw)) {
      const after = raw.split('</form>')[1] || '';
      blocks.push({ type: 'contactForm' });
      blocks.push({ type: 'richText', html: cleanHtml(after, ctx) });
      return;
    }
    if (/Step 1/.test(raw) && /Enter custom amount/.test(raw)) {
      // Donation form (Raisely component). Keep editorial text either side of it.
      const [before, afterRaw] = raw.split(/<!--block:custom-component-->\s*<button type="button">\s*<i>arrow_back/);
      const b = convertSection({ ...sec, raw: before }, ctx);
      if (b) blocks.push(...[].concat(b));
      const tail = (afterRaw || '').split(/This section shows logos for the available payment methods[^<]*/)[1] || '';
      const tailClean = tail.replace(/<img [^>]*admin\.raisely\.com[^>]*>/g, '');
      const donationHeading = (afterRaw || '').match(/<h2>(.*?)<\/h2>/);
      blocks.push({ type: 'donationForm', causeId: def.id === 'antarctic-science-foundation-legacy' ? 'antarctic-science-foundation' : 'donate-to-one-tomorrow', ...(donationHeading ? { heading: donationHeading[1] } : {}) });
      const t = convertSection({ ...sec, raw: tailClean }, ctx);
      if (t) blocks.push(...[].concat(t));
      return;
    }
    if (def.template === 'faq' && /^\s*<h3>/.test(raw)) {
      const n = parse(raw); const h3 = n.querySelector('h3'); const q = h3.text.trim(); h3.remove();
      faqItems.push({ question: q, html: cleanHtml(n.innerHTML, ctx) });
      if (!/<h3>/.test(secs[i + 1]?.raw || '')) blocks.push({ type: 'faq', items: faqItems.splice(0) });
      return;
    }
    const b = convertSection(sec, ctx, { isLastBrands: i === brandIdx, videoUrl: VIDEO_URLS[def.route] });
    if (!b) return;
    for (const blk of [].concat(b)) {
      if (blk.type === 'richText' || blk.type === 'mediaText') {
        const h2 = (blk.html.match(/^<h2>(.*?)<\/h2>/) || [])[1];
        if (h2 && ANCHORS[h2]) blk.anchor = ANCHORS[h2];
      }
      blocks.push(blk);
    }
  });

  // drop a bare imageBand sitting directly before the partner brands row (decorative spacer in source)
  const rawTitle = meta.title || r.title;
  const title = /\{\{/.test(rawTitle) ? (hero?.heading || D.campaign.name) : rawTitle;
  const page = {
    id: def.id,
    title,
    slug: slugify(def.route),
    path: def.route,
    template: def.template,
    ...(def.parentId ? { parentId: def.parentId } : {}),
    ...(hero ? { hero } : {}),
    contentBlocks: blocks,
    seo: {
      title,
      description: meta.metaDescription || D.campaign.config.social?.facebookDescription || undefined,
      ...(meta.image ? { ogImage: asset(meta.image, ctx) } : {}),
    },
    status: 'published',
    originalUrl: ORIGIN + def.route,
    source: { raiselyPageUuid: meta.uuid, updatedAt: meta.updatedAt },
  };
  write(`pages/${def.id}.json`, page);
  register.push({
    originalUrl: ORIGIN + def.route, newUrl: def.route, contentType: 'Page', contentId: def.id,
    migrationStatus: 'complete', contentValidation: 'pending', assets: [...assets.values()].filter((a) => a.usedBy.has(ctx)).length,
    notes: notes.join(' '),
  });
}

// ---------- causes ----------
const causeOrder = D.causes.map((c) => c.path);
for (const [i, c] of D.causes.entries()) {
  const route = `/t/${c.path}`;
  const ctx = route;
  const pub = c.public || {};
  const rendered = D.rendered[route]?.html || '';
  const donationHeading = (rendered.match(/<h2>(Donate to [^<]*)<\/h2>/) || [])[1];
  const isFund = c.path === 'donate-to-one-tomorrow';
  const cause = {
    id: c.path,
    name: c.name.trim(),
    slug: c.path,
    path: route,
    originalUrl: ORIGIN + route,
    order: i + 1,
    isGeneralFund: isFund,
    ...(pub.country ? { region: pub.country.trim() } : {}),
    logo: media(c.photoUrl, `${c.name.trim()} logo`, ctx),
    ...(pub.background_image ? { heroImage: media(pub.background_image, '', ctx) } : {}),
    ...(pub.footerImage ? { footerImage: media(pub.footerImage, '', ctx) } : {}),
    quote: c.description || '',
    description: cleanHtml(pub.richProfileDescription || '', ctx),
    contentBlocks: [],
    donationCampaignId: c.uuid,
    ...(donationHeading ? { donationHeading } : {}),
    fundraising: {
      currency: c.currency,
      goal: c.goal,
      totalAtMigration: c.campaignDisplayTotal ?? c.total,
      donationCount: c.donationCount,
      project: pub.project || undefined,
      routing: pub.routing || undefined,
    },
    seo: { title: `${c.name.trim()}`, description: textOf(c.description || '').slice(0, 160) || undefined },
    status: c.status === 'ACTIVE' ? 'published' : 'draft',
  };
  write(`causes/${c.path}.json`, cause);
  register.push({
    originalUrl: ORIGIN + route, newUrl: route, contentType: 'Cause', contentId: c.path,
    migrationStatus: 'complete', contentValidation: 'pending', assets: [cause.logo, cause.heroImage, cause.footerImage].filter(Boolean).length,
    notes: isFund ? 'General fund profile (OneTomorrow Charitable Fund); target of footer "Donate" link.' : '',
  });
}

// ---------- articles ----------
const fmtDate = (iso) => iso;
for (const p of D.posts) {
  const route = `/one-tomorrow/posts/${p.path}`;
  const ctx = route;
  const article = {
    id: p.path,
    title: p.title,
    slug: p.path,
    path: route,
    originalUrl: ORIGIN + route,
    publishedDate: fmtDate(p.date),
    ...(p.author ? { author: p.author } : {}),
    body: cleanHtml(p.body, ctx),
    ...(p.photoUrl ? { heroImage: media(p.photoUrl, p.title.trim(), ctx) } : {}),
    relatedArticles: [],
    seo: { title: p.title.trim() },
    status: 'published',
    source: { raiselyPostUuid: p.uuid, createdAt: p.createdAt, updatedAt: p.updatedAt },
  };
  write(`articles/${p.path}.json`, article);
  register.push({
    originalUrl: ORIGIN + route, newUrl: route, contentType: 'Article', contentId: p.path,
    migrationStatus: 'complete', contentValidation: 'pending', assets: article.heroImage ? 1 : 0, notes: '',
  });
}

// ---------- global site content ----------
const home = D.rendered['/'].html;
const footerNode = parse(home).querySelector('footer');
const menu = D.campaign.config.menu;
const brandSec = sectionsOf('/').filter((s) => BRAND_RE.test(s.raw)).pop();
const brandItems = blocksIn(brandSec.raw).filter((p) => p.kind === 'image').map((p) => {
  const n = parse(p.html); const img = n.querySelector('img'); const a = n.querySelector('a');
  return { name: img.getAttribute('alt'), image: media(img.getAttribute('src'), img.getAttribute('alt'), 'site'), href: fixHref(a.getAttribute('href'), 'site') };
});
const site = {
  identity: {
    // Chrome-level identity comes from config/brand.ts (APT Foundation). These are the source values.
    sourceName: D.campaign.name,
    sourceTagline: 'For nature. For humanity. For tomorrow.',
    sourceLogo: media('https://raisely-images.imgix.net/one-tomorrow/uploads/ot-main-logo-01-svg-385184.svg', 'OneTomorrow Logo', 'site'),
  },
  navigation: {
    primary: menu.map((m) => ({
      title: m.title,
      href: fixHref(m.link, 'nav'),
      ...(m.style ? { style: m.style } : {}),
      children: (m.subMenu || []).map((s) => ({ title: s.title, href: fixHref(s.link, 'nav') })),
    })),
  },
  footer: {
    links: footerNode.querySelectorAll('p a').map((a) => ({ title: a.text.trim(), href: fixHref(a.getAttribute('href'), 'footer') })),
    sourceCopyright: footerNode.querySelectorAll('p').map((p) => p.text).find((t) => /©/.test(t)),
  },
  partnerBrands: brandItems,
  social: {
    shareEnabled: { facebook: !!D.campaign.config.social.facebookEnabled, twitter: !!D.campaign.config.social.twitterEnabled, email: !!D.campaign.config.social.emailEnabled, copy: !!D.campaign.config.social.copyEnabled },
    shareText: D.campaign.config.social.twitterTweet,
    hashtag: D.campaign.config.social.twitterHashtag,
    emailSubject: D.campaign.config.social.emailSubject,
    emailBody: D.campaign.config.social.emailBody,
    profiles: [],
  },
  contact: {
    organisation: 'OneTomorrow Charitable Fund',
    addressLines: ['Level 1, Building 4, 15 Cochranes Road', 'Moorabbin, VIC 3189', 'Australia'],
    email: 'info@onetomorrow.com.au',
    phones: ['(03) 8526 1631', '1300 278 278'],
    form: {
      intro: "Let's connect!",
      fields: [
        { name: 'fullname', label: 'Your Full Name (required)', type: 'text', placeholder: 'First and Last', required: true },
        { name: '_replyto', label: 'Your Email (required)', type: 'email', placeholder: 'email@domain.tld', required: false, note: 'Labelled "(required)" in the source but not enforced by the original form.' },
        { name: 'phone', label: 'Your Phone Number', type: 'tel', placeholder: '#### ### ###', required: false },
        { name: 'message', label: 'Message (required)', type: 'textarea', required: false, note: 'Labelled "(required)" in the source but not enforced by the original form.' },
      ],
      submitLabel: 'Send',
      originalEndpoint: 'https://formspree.io/f/xoqrdwlj',
      // Interim delivery (27 Oct 2026): email to Josh Strachan via FormSubmit until the Salesforce integration replaces it.
      deliveryEndpoint: 'https://formsubmit.co/ajax/Josh.Strachan@aptouring.com.au',
      deliverySubject: 'APT Foundation website enquiry',
      successMessage: 'Thank you for contacting us. We will be in touch soon.',
    },
  },
  seo: {
    defaultTitle: D.campaign.name,
    defaultDescription: D.campaign.config.social.facebookDescription,
  },
  globalCtas: { donate: { label: 'Donate Now', href: '/t/donate-to-one-tomorrow' } },
  donation: {
    provider: 'raisely',
    currency: D.campaign.currency,
    amounts: {
      once: D.campaign.config.amounts.find((a) => a.interval === 'ONCE').amounts.map((a) => a.amount / 100),
      monthly: D.campaign.config.amounts.find((a) => a.interval === 'MONTH').amounts.map((a) => a.amount / 100),
    },
    renderedAmounts: [25, 50, 100, 500, 1000],
    intervals: ['One-time', 'Monthly'],
    matchingStatementHtml: '<p><em>* OneTomorrow Charitable Fund matches donations up to $200,000 per year and up to $1,000 per individual donor.</em></p><p><em>*gifts over $2 are tax deductible and received subject to our <a href="/PrivacyPolicy">donate/privacy policy</a>.</em></p>',
    thankYouTitle: D.campaign.config.donation.thankYouTitle,
    thankYouMessage: D.campaign.config.donation.thankYouMessage,
    steps: ['Step 1', 'Step 2', 'Step 3'],
    detailsHeading: D.campaign.config.donation.detailsHeading,
    paymentsHeading: D.campaign.config.donation.paymentsHeading,
    paymentMethods: ['Apple Pay', 'Google Pay', 'Visa', 'Mastercard', 'American Express', 'Diners Club', 'Discover', 'JCB', 'Union Pay'],
    raisely: { campaignPath: D.campaign.path, campaignUuid: D.campaign.uuid, hostedBaseUrl: ORIGIN },
  },
  analytics: { sourceGtm: D.campaign.config.site.gtm?.account, sourceGa: D.campaign.config.site.analytics?.account },
};
write('site.json', site);

// ---------- assets + register ----------
const assetList = [...assets.values()].map((a) => ({ ...a, usedBy: [...a.usedBy].sort() }));
write('assets.json', assetList);

const excluded = D.pages.filter((p) => !PAGE_DEFS.some((d) => d.route === p.path) && !['/t/:id', '/:profile/posts/:post', 'layout'].includes(p.path))
  .map((p) => ({ originalUrl: ORIGIN + p.path, title: p.title, reason: p.path === '/page/about' ? 'Raisely theme placeholder page ("How to create a birthday fundraiser") with template filler text; not linked anywhere on the site.' : 'Raisely platform function (accounts, fundraiser profiles, login, search). Not part of the public editorial site; handled by the donation provider.' }));

write('migration-register.json', { generatedAt: new Date().toISOString(), source: SRC.split('/').pop(), capturedAt: D.capturedAt, entries: register, linkFixes, brandReplacements, editorialChanges: EDITORIAL_CHANGES, excluded });
console.log(`pages=${PAGE_DEFS.length} causes=${D.causes.length} articles=${D.posts.length} assets=${assetList.length} linkFixes=${linkFixes.length} excluded=${excluded.length}`);
