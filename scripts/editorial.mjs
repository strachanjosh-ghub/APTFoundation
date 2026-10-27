/**
 * Approved editorial changes, applied on top of the verbatim migration.
 *
 * Every change here was explicitly requested by the site owner and is applied
 * identically by the migration (scripts/migrate.mjs) and by the fidelity checks
 * (scripts/fidelity.ts), so the checks still prove that nothing else changed.
 *
 *  1. 27 Oct 2026 (Josh Strachan): the inconsistent donation-matching statements are
 *     standardised on the most common wording ($200,000 per year / $1,000 per donor,
 *     used on all 14 cause pages).
 *  2. 27 Oct 2026 (Josh Strachan): "OneTomorrow" is renamed "The APT Foundation"
 *     ("the APT Foundation" mid-sentence). Variants covered: OneTomorrow, One Tomorrow,
 *     Onetomorrow, each optionally followed by "Charitable Fund" (absorbed into the new name).
 *     URLs, email addresses and file names are not changed.
 */

export const EDITORIAL_CHANGES = [
  { id: 'matching-statement', date: '2026-10-27', requestedBy: 'Josh Strachan', description: 'Standardise matching statement on "$200,000 per year and up to $1,000 per individual donor" (most common wording).' },
  { id: 'rename', date: '2026-10-27', requestedBy: 'Josh Strachan', description: 'Rename "OneTomorrow" / "OneTomorrow Charitable Fund" to "The APT Foundation".' },
];

const MATCHING = [
  [/up to \$150,000 per year (?:and|&amp;|&) up to \$1000\.00 per individual donor/g, 'up to $200,000 per year and up to $1,000 per individual donor'],
];

const NAME = /(\b[Tt]he\s+)?(?:One ?Tomorrow|Onetomorrow|ONE ?TOMORROW)(\s+Charitable\s+Fund)?/g;
const BLOCK_TAG = /^<\/?(p|h[1-6]|li|ul|ol|div|br|td|th|tr|table|blockquote|figure|figcaption|section)\b/i;

/** Rename within one plain-text run. `atStart` = this run begins a sentence/block. */
function renameText(text, atStart) {
  return text.replace(NAME, (m, the, _fund, offset) => {
    if (the) return `${the}APT Foundation`;
    const before = text.slice(0, offset);
    const trimmed = before.replace(/\s+$/, '');
    const sentenceStart = trimmed === '' ? atStart : /[.!?:*"“‘(—–-]$/.test(trimmed);
    return sentenceStart ? 'The APT Foundation' : 'the APT Foundation';
  });
}

/** Apply approved changes to a plain string or an HTML fragment (text nodes only). */
export function applyEditorial(input) {
  if (typeof input !== 'string' || !input) return input;
  let s = input;
  for (const [re, to] of MATCHING) s = s.replace(re, to);
  if (!/One ?Tomorrow|Onetomorrow|ONE ?TOMORROW/.test(s)) return s;
  const parts = s.split(/(<[^>]+>)/);
  let atStart = true;
  return parts.map((part) => {
    if (part.startsWith('<') && part.endsWith('>')) {
      if (BLOCK_TAG.test(part)) atStart = true;
      return part; // never touch tag/attribute content (URLs, emails)
    }
    if (!part.trim()) return part;
    const out = renameText(part, atStart);
    atStart = /[.!?:]\s*$/.test(part);
    return out;
  }).join('');
}

const SKIP_KEYS = new Set(['src', 'href', 'originalUrl', 'path', 'slug', 'id', 'localPath', 'usedBy', 'source', 'originalEndpoint', 'deliveryEndpoint', 'email', 'causeId', 'refs', 'raisely', 'routing', 'project', 'campaignPath', 'sourceName', 'sourceTagline', 'sourceCopyright', 'sourceLogo', 'donationCampaignId']);

/** Deep-apply to every editorial string in a content object. */
export function applyEditorialDeep(obj, key) {
  if (key && SKIP_KEYS.has(key)) return obj;
  if (typeof obj === 'string') return applyEditorial(obj);
  if (Array.isArray(obj)) return obj.map((v) => applyEditorialDeep(v));
  if (obj && typeof obj === 'object') return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, applyEditorialDeep(v, k)]));
  return obj;
}
