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
 *  3. 27 Oct 2026 (Josh Strachan): the acronym "ATG" is not used. "APT Travel Group (ATG)"
 *     becomes "the APT Travel Group"; a standalone "ATG" becomes "the APT Travel Group";
 *     and the group is always referred to with "the" ("The" at the start of a sentence).
 */

export const EDITORIAL_CHANGES = [
  { id: 'matching-statement', date: '2026-10-27', requestedBy: 'Josh Strachan', description: 'Standardise matching statement on "$200,000 per year and up to $1,000 per individual donor" (most common wording).' },
  { id: 'rename', date: '2026-10-27', requestedBy: 'Josh Strachan', description: 'Rename "OneTomorrow" / "OneTomorrow Charitable Fund" to "The APT Foundation".' },
  { id: 'no-atg', date: '2026-10-27', requestedBy: 'Josh Strachan', description: 'Remove the acronym "ATG"; always "the APT Travel Group".' },
];

const MATCHING = [
  [/up to \$150,000 per year (?:and|&amp;|&) up to \$1000\.00 per individual donor/g, 'up to $200,000 per year and up to $1,000 per individual donor'],
];

const NAME = /(\b[Tt]he\s+)?(?:One ?Tomorrow|Onetomorrow|ONE ?TOMORROW)(\s+Charitable\s+Fund)?/g;
const DETERMINERS = new Set(['a', 'an', 'every', 'each', 'our', 'their', 'its', 'this', 'that', 'these', 'those', 'wider', 'whole', 'entire', 'all', 'any', 'fellow', 'current', 'former', 'melbourne', 'sydney', 'brisbane', 'australian', 'your', 'my', 'his', 'her']);
const GROUP = /(\b[Tt]he\s+)?(?:APT Travel Group|\bATG)(?=s\b|\b|’|')(’s|'s|s\b)?/g;
const BLOCK_TAG = /^<\/?(p|h[1-6]|li|ul|ol|div|br|td|th|tr|table|blockquote|figure|figcaption|section)\b/i;

function isSentenceStart(text, offset, atStart) {
  const trimmed = text.slice(0, offset).replace(/\s+$/, '');
  return trimmed === '' ? atStart : /[.!?:*"“‘(\[—–-]$/.test(trimmed);
}

/** Rename within one plain-text run. `atStart` = this run begins a sentence/block. */
function renameText(text, atStart) {
  let t = text.replace(NAME, (m, the, _fund, offset) => {
    if (the) return `${the}APT Foundation`;
    return isSentenceStart(text, offset, atStart) ? 'The APT Foundation' : 'the APT Foundation';
  });
  // rule 3: no "ATG"; always "the APT Travel Group"
  t = t.replace(/\s*\(ATG\)/g, '');
  const src = t;
  t = t.replace(GROUP, (m, the, poss, offset) => {
    const possessive = poss ? (poss === 's' ? '’s' : poss) : '';
    if (the) return `${the}APT Travel Group${possessive}`;
    // No article after determiners/modifiers ("every APT Travel Group guest", "the wider APT Travel Group family")
    const prev = (src.slice(0, offset).match(/([A-Za-z’']+)\s*$/) || [])[1] || '';
    if (DETERMINERS.has(prev.toLowerCase())) return `APT Travel Group${possessive}`;
    return `${isSentenceStart(src, offset, atStart) ? 'The' : 'the'} APT Travel Group${possessive}`;
  });
  return t;
}

/** Apply approved changes to a plain string or an HTML fragment (text nodes only). */
export function applyEditorial(input) {
  if (typeof input !== 'string' || !input) return input;
  let s = input;
  for (const [re, to] of MATCHING) s = s.replace(re, to);
  if (!/One ?Tomorrow|Onetomorrow|ONE ?TOMORROW|\bATG\b|APT Travel Group/.test(s)) return s;
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
