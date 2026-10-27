/**
 * Structured content models. Every JSON file in /content is validated against
 * these schemas at build time (see src/lib/content.ts and scripts/validate-content.ts).
 * The schemas are CMS-agnostic so the content can later be imported into a
 * headless CMS (Sanity, Contentful, Payload, etc.) one model per schema.
 */
import { z } from 'zod';

export const MediaAsset = z.object({
  src: z.string().min(1),
  alt: z.string().optional(),
  href: z.string().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
});
export type MediaAsset = z.infer<typeof MediaAsset>;

export const CTA = z.object({
  label: z.string().min(1),
  href: z.string().min(1),
  variant: z.enum(['primary', 'secondary', 'link']).optional(),
});
export type CTA = z.infer<typeof CTA>;

export const SEO = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  ogImage: z.string().optional(),
  canonicalPath: z.string().optional(),
  noindex: z.boolean().optional(),
});

/** Sanitised HTML fragment holding original editorial content verbatim. */
export const RichText = z.string();

export const Hero = z.object({
  eyebrow: z.string().optional(),
  heading: z.string().min(1),
  html: RichText.optional(),
  backgroundImage: MediaAsset.optional(),
  ctas: z.array(CTA).optional(),
});
export type Hero = z.infer<typeof Hero>;

const base = { anchor: z.string().optional() };

export const ContentBlock = z.discriminatedUnion('type', [
  z.object({ type: z.literal('hero'), ...base, ...Hero.shape }),
  z.object({ type: z.literal('richText'), ...base, html: RichText, ctas: z.array(CTA).optional(), backgroundImage: MediaAsset.optional() }),
  z.object({ type: z.literal('mediaText'), ...base, html: RichText, images: z.array(MediaAsset).min(1), imagePosition: z.enum(['left', 'right']), ctas: z.array(CTA).optional() }),
  z.object({ type: z.literal('imageBand'), ...base, image: MediaAsset }),
  z.object({ type: z.literal('figure'), ...base, image: MediaAsset, caption: z.string().optional() }),
  z.object({ type: z.literal('logoGrid'), ...base, heading: z.string().optional(), items: z.array(z.object({ image: MediaAsset, label: z.string(), href: z.string().optional() })).min(1) }),
  z.object({ type: z.literal('cardGrid'), ...base, heading: z.string().optional(), items: z.array(z.object({ title: z.string(), html: RichText.optional(), image: MediaAsset.optional(), href: z.string().optional() })) }),
  z.object({ type: z.literal('steps'), ...base, items: z.array(z.object({ image: MediaAsset.optional(), title: z.string(), html: RichText })).min(1) }),
  z.object({ type: z.literal('cta'), ...base, html: RichText.optional(), ctas: z.array(CTA).min(1) }),
  z.object({ type: z.literal('gallery'), ...base, images: z.array(MediaAsset).min(1) }),
  z.object({ type: z.literal('video'), ...base, url: z.string().url(), title: z.string() }),
  z.object({ type: z.literal('accordion'), ...base, items: z.array(z.object({ title: z.string(), html: RichText })) }),
  z.object({ type: z.literal('faq'), ...base, items: z.array(z.object({ question: z.string(), html: RichText })).min(1) }),
  z.object({ type: z.literal('statistics'), ...base, items: z.array(z.object({ value: z.string(), label: z.string() })) }),
  z.object({ type: z.literal('quote'), ...base, html: RichText, cite: z.string().optional() }),
  z.object({ type: z.literal('relatedContent'), ...base, heading: z.string().optional(), refs: z.array(z.string()) }),
  z.object({ type: z.literal('donationCta'), ...base, causeId: z.string().optional(), label: z.string().optional() }),
  z.object({ type: z.literal('donationForm'), ...base, causeId: z.string(), heading: z.string().optional(), allowCauseChoice: z.boolean().optional(), introHtml: RichText.optional() }),
  z.object({ type: z.literal('embed'), ...base, html: RichText }),
  z.object({ type: z.literal('partnerBrands'), ...base }),
  z.object({ type: z.literal('causeGrid'), ...base, heading: z.string().optional(), variant: z.enum(['full', 'featured']).optional() }),
  z.object({ type: z.literal('newsFeed'), ...base, pageSize: z.number().int().positive(), showPagination: z.boolean() }),
  z.object({ type: z.literal('contactForm'), ...base }),
]);
export type ContentBlock = z.infer<typeof ContentBlock>;

export const Status = z.enum(['draft', 'published']);

export const Page = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  path: z.string().startsWith('/'),
  template: z.enum(['home', 'standard', 'about', 'cause-listing', 'news-listing', 'faq', 'contact', 'donation', 'legal']),
  parentId: z.string().optional(),
  navigationTitle: z.string().optional(),
  hero: Hero.optional(),
  contentBlocks: z.array(ContentBlock),
  seo: SEO,
  status: Status,
  originalUrl: z.string().url().optional(),
  source: z.record(z.string(), z.unknown()).optional(),
});
export type Page = z.infer<typeof Page>;

export const Article = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  path: z.string().startsWith('/'),
  originalUrl: z.string().url(),
  publishedDate: z.string().optional(),
  author: z.string().optional(),
  summary: z.string().optional(),
  body: RichText,
  heroImage: MediaAsset.optional(),
  relatedArticles: z.array(z.string()).optional(),
  seo: SEO,
  status: Status,
  source: z.record(z.string(), z.unknown()).optional(),
});
export type Article = z.infer<typeof Article>;

export const Cause = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  path: z.string().startsWith('/'),
  originalUrl: z.string().url(),
  order: z.number(),
  isGeneralFund: z.boolean(),
  region: z.string().optional(),
  logo: MediaAsset.optional(),
  heroImage: MediaAsset.optional(),
  footerImage: MediaAsset.optional(),
  quote: z.string(),
  description: RichText,
  contentBlocks: z.array(ContentBlock),
  donationCampaignId: z.string().optional(),
  donationHeading: z.string().optional(),
  /** Cause-specific suggested amounts with their impact text (from the cause description). */
  impactAmounts: z.array(z.object({ amount: z.number().positive(), text: z.string() })).optional(),
  externalWebsite: z.string().url().optional(),
  fundraising: z.object({
    currency: z.string(),
    goal: z.number().optional(),
    totalAtMigration: z.number().optional(),
    donationCount: z.number().optional(),
    project: z.string().optional(),
    routing: z.string().optional(),
  }),
  seo: SEO,
  status: Status,
});
export type Cause = z.infer<typeof Cause>;

const NavItem = z.object({ title: z.string(), href: z.string(), style: z.string().optional(), children: z.array(z.object({ title: z.string(), href: z.string() })) });

export const Site = z.object({
  identity: z.object({ sourceName: z.string(), sourceTagline: z.string(), sourceLogo: MediaAsset.optional() }),
  navigation: z.object({ primary: z.array(NavItem) }),
  footer: z.object({ links: z.array(z.object({ title: z.string(), href: z.string() })), sourceCopyright: z.string().optional() }),
  partnerBrands: z.array(z.object({ name: z.string(), image: MediaAsset, href: z.string() })),
  social: z.object({
    shareEnabled: z.object({ facebook: z.boolean(), twitter: z.boolean(), email: z.boolean(), copy: z.boolean() }),
    shareText: z.string(),
    hashtag: z.string().optional(),
    emailSubject: z.string(),
    emailBody: z.string(),
    profiles: z.array(z.object({ network: z.string(), url: z.string().url() })),
  }),
  contact: z.object({
    organisation: z.string(),
    addressLines: z.array(z.string()),
    email: z.string().email(),
    phones: z.array(z.string()),
    form: z.object({
      intro: z.string(),
      fields: z.array(z.object({ name: z.string(), label: z.string(), type: z.enum(['text', 'email', 'tel', 'textarea']), placeholder: z.string().optional(), required: z.boolean(), note: z.string().optional() })),
      submitLabel: z.string(),
      originalEndpoint: z.string().url(),
      deliveryEndpoint: z.string().url().optional(),
      deliverySubject: z.string().optional(),
      successMessage: z.string(),
    }),
  }),
  seo: z.object({ defaultTitle: z.string(), defaultDescription: z.string(), defaultOgImage: z.string().optional() }),
  globalCtas: z.object({ donate: CTA }),
  donation: z.object({
    provider: z.enum(['raisely', 'stripe', 'none']),
    currency: z.string(),
    amounts: z.object({ once: z.array(z.number()), monthly: z.array(z.number()) }),
    renderedAmounts: z.array(z.number()),
    intervals: z.array(z.string()),
    matchingStatementHtml: RichText,
    thankYouTitle: z.string(),
    thankYouMessage: z.string(),
    steps: z.array(z.string()),
    detailsHeading: z.string(),
    paymentsHeading: z.string(),
    paymentMethods: z.array(z.string()),
    raisely: z.object({ campaignPath: z.string(), campaignUuid: z.string(), hostedBaseUrl: z.string().url() }),
  }),
  analytics: z.object({ sourceGtm: z.string().optional(), sourceGa: z.string().optional() }),
});
export type Site = z.infer<typeof Site>;

export const AssetRecord = z.object({ originalUrl: z.string().url(), localPath: z.string(), usedBy: z.array(z.string()), bytes: z.number().optional(), contentType: z.string().optional(), status: z.enum(['downloaded', 'missing']).optional() });
