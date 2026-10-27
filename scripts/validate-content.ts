/**
 * npm run validate:content
 * Validates all content objects against their schemas, checks fidelity against
 * the raw snapshot, checks internal links and media, and writes the results
 * into content/migration-register.json and docs/MIGRATION-REGISTER.md.
 */
import fs from 'node:fs';
import path from 'node:path';
import { brokenInternalLinks, mediaProblems, runFidelity } from './fidelity';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const regFile = path.join(ROOT, 'content/migration-register.json');
const reg = JSON.parse(fs.readFileSync(regFile, 'utf8'));

const results = runFidelity();
const byId = new Map(results.map((r) => [`${r.type}:${r.id}`, r]));
for (const e of reg.entries) {
  const r = byId.get(`${e.contentType}:${e.contentId}`);
  if (!r) { e.contentValidation = 'incomplete'; e.migrationStatus = 'partial'; continue; }
  e.contentValidation = r.validation;
  e.migrationStatus = r.validation === 'incomplete' ? 'partial' : 'complete';
  e.validationIssues = r.missing;
}
const links = brokenInternalLinks();
const media = mediaProblems();
reg.validatedAt = new Date().toISOString();
reg.summary = {
  total: reg.entries.length,
  exact: reg.entries.filter((e: { contentValidation: string }) => e.contentValidation === 'exact').length,
  incomplete: reg.entries.filter((e: { contentValidation: string }) => e.contentValidation === 'incomplete').length,
  brokenInternalLinks: links,
  mediaProblems: media,
};
fs.writeFileSync(regFile, JSON.stringify(reg, null, 2) + '\n');

// Human-readable register
const md = [
  '# Content migration and validation register',
  '',
  `Source: ${reg.source} (captured ${reg.capturedAt}). Validated: ${reg.validatedAt}.`,
  '',
  `**${reg.summary.exact} of ${reg.summary.total}** content objects validated as exact text matches against the source snapshot. Broken internal links: ${links.length}. Media problems: ${media.length}.`,
  '',
  '| Original URL | New URL | Content type | Content ID | Migration status | Content validation | Assets | Notes |',
  '|---|---|---|---|---|---|---|---|',
  ...reg.entries.map((e: Record<string, unknown>) => `| ${e.originalUrl} | ${e.newUrl} | ${e.contentType} | ${e.contentId} | ${e.migrationStatus} | ${e.contentValidation} | ${e.assets} | ${[e.notes, ...((e.validationIssues as string[]) || []).map((x) => 'Missing: ' + x)].filter(Boolean).join('; ').replace(/\|/g, '\\|')} |`),
  '',
  '## Link corrections applied during migration',
  '',
  '| Context | Original href | Migrated href |',
  '|---|---|---|',
  ...reg.linkFixes.map((l: Record<string, string>) => `| ${l.context} | \`${l.from}\` | \`${l.to}\` |`),
  '',
  '## Brand artwork replaced',
  '',
  ...reg.brandReplacements.map((b: Record<string, string>) => `- ${b.context}: \`${b.asset}\` → ${b.replacedWith}`),
  '',
  '## Source pages not migrated',
  '',
  ...reg.excluded.map((x: Record<string, string>) => `- ${x.originalUrl} (${x.title}): ${x.reason}`),
  '',
].join('\n');
fs.mkdirSync(path.join(ROOT, 'docs'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'docs/MIGRATION-REGISTER.md'), md);

console.log(JSON.stringify({ exact: reg.summary.exact, total: reg.summary.total, incomplete: results.filter((r) => r.validation === 'incomplete').map((r) => ({ id: r.id, missing: r.missing.slice(0, 5) })), links, media }, null, 2));
if (reg.summary.incomplete || links.length || media.length) process.exitCode = 1;
