import type { MetadataRoute } from 'next';
import { brand } from '@config/brand';

export default function robots(): MetadataRoute.Robots {
  const allow = process.env.VERCEL_ENV ? process.env.VERCEL_ENV === 'production' : true;
  return {
    rules: allow ? { userAgent: '*', allow: '/', disallow: '/api/' } : { userAgent: '*', disallow: '/' },
    sitemap: new URL('/sitemap.xml', brand.siteUrl).toString(),
  };
}
