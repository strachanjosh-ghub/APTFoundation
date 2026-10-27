import type { MetadataRoute } from 'next';
import { brand } from '@config/brand';

export default function robots(): MetadataRoute.Robots {
  // Only the production deploy is indexable. Netlify sets CONTEXT (production | deploy-preview | branch-deploy | dev);
  // Vercel sets VERCEL_ENV. Elsewhere, default to indexable.
  const ctx = process.env.CONTEXT || process.env.VERCEL_ENV;
  const allow = ctx ? ctx === 'production' : true;
  return {
    rules: allow ? { userAgent: '*', allow: '/', disallow: '/api/' } : { userAgent: '*', disallow: '/' },
    sitemap: new URL('/sitemap.xml', brand.siteUrl).toString(),
  };
}
