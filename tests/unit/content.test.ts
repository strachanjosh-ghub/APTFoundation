import { describe, expect, it } from 'vitest';
import { getArticles, getCauses, getPages, getSite, excerpt, formatDate } from '@/lib/content';
import { brokenInternalLinks, mediaProblems, runFidelity } from '../../scripts/fidelity';

describe('CMS schema validation', () => {
  it('loads and validates every content object', () => {
    expect(getSite().navigation.primary.length).toBeGreaterThan(0);
    expect(getPages().length).toBe(10);
    expect(getCauses().length).toBe(14);
    expect(getArticles().length).toBe(31);
  });

  it('includes all 13 named partner charities plus the general fund', () => {
    const names = getCauses().map((c) => c.name);
    for (const n of ['Antarctic Science Foundation', "Blue Dragon Children's Foundation", 'Gondwana Rainforest Trust', 'Grizzly Bear Foundation', 'Habitat for Humanity', 'Kilimatembo School', 'Médecins San Frontieres (Doctors Without Borders)', 'Opportunities of Development thru Art (ODA)', 'Royal Flying Doctor Service (RFDS)', 'Rural Aid', 'Terry Fox Foundation', 'Thin Green Line', 'Wunan Foundation']) {
      expect(names).toContain(n);
    }
    expect(getCauses().filter((c) => c.isGeneralFund)).toHaveLength(1);
  });

  it('has unique paths across all routes', () => {
    const paths = [...getPages(), ...getCauses(), ...getArticles()].map((x) => x.path.toLowerCase());
    expect(new Set(paths).size).toBe(paths.length);
  });
});

describe('content fidelity against the source snapshot', () => {
  const results = runFidelity();
  it.each(results.map((r) => [`${r.type} ${r.id}`, r] as const))('%s matches the source text exactly', (_, r) => {
    expect(r.missing).toEqual([]);
    expect(r.validation).toBe('exact');
  });

  it('has no broken internal links', () => expect(brokenInternalLinks()).toEqual([]));
  it('self-hosts all media (no Raisely image CDN dependency)', () => expect(mediaProblems()).toEqual([]));
});

describe('helpers', () => {
  it('builds source-style excerpts', () => {
    expect(excerpt('<p>Hello <b>world</b></p>', 5)).toBe('Hello...');
    expect(excerpt('<p>Hi</p>', 5)).toBe('Hi');
  });
  it('formats dates in Australian Eastern time like the source', () => {
    expect(formatDate('2025-06-16T14:00:00.000Z')).toBe('17 Jun 2025');
  });
});
