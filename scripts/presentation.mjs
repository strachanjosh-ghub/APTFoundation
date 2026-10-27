/**
 * Presentation layer (design decisions, not editorial changes).
 *
 * Applied by scripts/migrate.mjs after the verbatim migration and the approved
 * editorial changes. It only changes imagery, block types and link targets for
 * a cleaner, more consistent site. It never changes text, so the fidelity checks
 * still hold. Approved by the site owner, 27 Oct 2026 ("adjust images if it means
 * the website appears cleaner and more consistent").
 *
 * Rules:
 *  1. Every page opens with a photographic hero, using existing site imagery.
 *  2. Decorative full-width image strips are removed (the same stock photos were
 *     repeated across pages). The causes map is kept as a contained figure.
 *  3. Charity logo grids become cause cards (photo + logo + summary + donate).
 *  4. The APT Travel Group brand row appears once per page (home: top only).
 *  5. OneTomorrow-green artwork uses navy recolours (scripts/brand-images.py),
 *     and the OneTomorrow logo tile is replaced by an APT Foundation tile.
 *  6. Site-wide "Donate" calls to action go to /donate, where donors choose a cause.
 *  7. Each cause's "What difference will your money make?" amounts become
 *     structured impact amounts that the donation panel offers as one-tap choices.
 */

const M = (f) => `/media/${f}`;
const HERO = {
  home: M('ot-generic-hand-holding-tree-planting-1407793820-s-cropped-jpg-9f5579.jpg'),
  'about-us': M('o-as-vie-a-43-r-9606-apt-exp-1-11-19-1920-x-600-jpg-294149.jpg'),
  causes: M('ot-ricefields-aerial-620701974-i-jpg-e5db53.jpg'),
  contact: M('o-misc-hands-philanthropy-1014930184-s-jpg-15067b.jpg'),
  news: M('a-au-wa-kimberley-guide-hands-with-berries-52-apt-1920-x-600-jpg-1b6567.jpg'),
  'responsible-travel': M('a-as-myanmar-workshop-tour-92-apt-1920-x-600-jpg-d05957.jpg'),
  'antarctic-science-foundation-legacy': M('a-ant-antarctica-iceberg-3212663-l-i-1920-x-600-jpg-29848a.jpg'),
  // The source used OneTomorrow's green leaf artwork (ot-18-campaign-image) on these; replaced with photography.
  donate: M('children-20151103-1539320-1920-x-600-jpg-338528.jpg'),
  faqs: M('o-qld-daintree-rainforest-canopy-strip-1239507334-s-1920-x-400-jpg-82a2aa.jpg'),
  'privacy-policy': M('ot-misc-pine-trees-strip-1121038793-1920-x-400-jpg-81575e.jpg'),
};
const RECOLOURED = {
  [M('ot-108-world-map-of-causes-2025-png-3527a1.png')]: M('world-map-of-causes-apt.png'),
  [M('infographic-separate-2-white-3-logos-01-png-c0b036.png')]: M('step-01-you-donate-apt.png'),
  [M('infographic-separate-2-white-3-logos-02-png-fb4c52.png')]: M('step-02-we-double-apt.png'),
  [M('infographic-separate-2-white-3-logos-03-png-ce48c9.png')]: M('step-03-make-a-difference-apt.png'),
  [M('onetomorrow-400-x-400-png-9e9404.png')]: '/brand/apt-foundation-tile.svg',
};
const GENERAL_FUND_HERO = M('o-au-australian-outback-aerial-1019817386-i-1920-x-400-jpg-9c00b6.jpg');
const DONATE_PATH = '/donate';
const OLD_DONATE = '/t/donate-to-one-tomorrow';
const BRAND_LOGOS = /(apt-logo|tm-logo|captains-choice|botanica|antarctica-flights)/;

function remapImages(obj) {
  const s = JSON.stringify(obj);
  let out = s;
  for (const [from, to] of Object.entries(RECOLOURED)) out = out.split(from).join(to);
  return JSON.parse(out);
}

/** Pages */
export function presentPage(page) {
  let p = remapImages(page);
  const blocks = [];
  for (const b of p.contentBlocks) {
    if (b.type === 'imageBand') {
      if (/world-map-of-causes/.test(b.image.src)) { blocks.push({ type: 'figure', image: { ...b.image, alt: 'World map showing where the causes we support are located' } }); continue; }
      continue; // rule 2
    }
    if (b.type === 'logoGrid' && b.items.every((i) => BRAND_LOGOS.test(i.image.src))) { blocks.push({ type: 'partnerBrands' }); continue; } // rule 4
    if (b.type === 'logoGrid' && b.items.every((i) => (i.href || '').startsWith('/t/'))) { blocks.push({ type: 'causeGrid', variant: 'featured' }); continue; } // rule 3
    if (b.type === 'mediaText' && b.images.every((i) => /\.gif$/.test(i.src))) { blocks.push({ type: 'richText', html: b.html, ...(b.ctas ? { ctas: b.ctas } : {}) }); continue; }
    if (b.type === 'donationForm' && p.id === 'donate') { blocks.push({ ...b, allowCauseChoice: true }); continue; }
    blocks.push(b);
  }
  // rule 4: one brand row per page
  const brandIdx = blocks.map((b, i) => (b.type === 'partnerBrands' ? i : -1)).filter((i) => i >= 0);
  if (brandIdx.length > 1) blocks.splice(brandIdx[brandIdx.length - 1], 1);
  // Donate page: show the introduction beside the donation form (text unchanged)
  const formIdx = blocks.findIndex((b) => b.type === 'donationForm' && b.allowCauseChoice);
  if (formIdx > 0 && blocks[formIdx - 1].type === 'richText') {
    blocks[formIdx] = { ...blocks[formIdx], introHtml: blocks[formIdx - 1].html };
    blocks.splice(formIdx - 1, 1);
  }
  p.contentBlocks = blocks;

  // rule 1: photographic heroes
  if (p.id === 'antarctic-science-foundation-legacy' && !p.hero) {
    const first = p.contentBlocks.find((b) => b.type === 'richText' && /<h1>/.test(b.html));
    const h1 = first.html.match(/<h1>(.*?)<\/h1>/)[1];
    first.html = first.html.replace(/<p><\/p>/, '').replace(/<h1>.*?<\/h1>/, '');
    p.hero = { heading: h1 };
  }
  if (p.hero && HERO[p.id]) p.hero.backgroundImage = { src: HERO[p.id], alt: '' };

  // rule 6
  p = JSON.parse(JSON.stringify(p).split(`"href":"${OLD_DONATE}"`).join(`"href":"${DONATE_PATH}"`));
  return p;
}

/** Causes */
export function presentCause(cause) {
  const c = remapImages(cause);
  if (c.isGeneralFund) c.heroImage = { src: GENERAL_FUND_HERO, alt: '' };
  c.impactAmounts = impactAmounts(c.description);
  return c;
}

/** rule 7: "<p><b>$35 </b>can provide an essential first aid kit.</p>" -> { amount: 35, text } */
export function impactAmounts(html) {
  const out = [];
  const re = /<p[^>]*>(?:\s|&nbsp;|<(?:span|em|i)[^>]*>)*<(?:b|strong)>(?:\s|&nbsp;)*\$([\d,]+(?:\.\d\d)?)(?:\s|&nbsp;)*<\/(?:b|strong)>([\s\S]*?)<\/p>/g;
  let m;
  while ((m = re.exec(html))) {
    const amount = Number(m[1].replace(/,/g, ''));
    const text = m[2].replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
    if (amount > 0 && text) out.push({ amount, text });
  }
  return out.slice(0, 5);
}

/** Global site content */
export function presentSite(site) {
  const s = JSON.parse(JSON.stringify(site).split(`"href":"${OLD_DONATE}"`).join(`"href":"${DONATE_PATH}"`));
  return s;
}
