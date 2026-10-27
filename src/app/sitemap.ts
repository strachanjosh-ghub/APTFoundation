import type { MetadataRoute } from 'next';
import { brand } from '@config/brand';
import { getArticles, getCauses, getPages } from '@/lib/content';

export default function sitemap(): MetadataRoute.Sitemap {
  const u = (p: string) => new URL(p, brand.siteUrl).toString();
  return [
    ...getPages().filter((p) => !p.seo.noindex).map((p) => ({ url: u(p.path), changeFrequency: 'monthly' as const, priority: p.path === '/' ? 1 : 0.7 })),
    ...getCauses().map((c) => ({ url: u(c.path), changeFrequency: 'monthly' as const, priority: 0.8 })),
    ...getArticles().map((a) => ({ url: u(a.path), lastModified: a.publishedDate, changeFrequency: 'yearly' as const, priority: 0.5 })),
  ];
}
