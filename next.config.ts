import type { NextConfig } from 'next';

/**
 * Original Raisely URLs are preserved as real routes. These permanent redirects
 * cover legacy aliases. Note: Next.js redirect matching is case-insensitive, so
 * case variants (/contact -> /Contact) are handled in src/proxy.ts instead.
 */
const redirects = [
  { source: '/privacy-policy', destination: '/PrivacyPolicy' },
  { source: '/privacy', destination: '/PrivacyPolicy' },
  { source: '/blog', destination: '/news' },
  { source: '/about', destination: '/about-us' },
  { source: '/one-tomorrow', destination: '/' },
  { source: '/one-tomorrow/posts', destination: '/news' },
].map((r) => ({ ...r, permanent: true }));

/** Cause profiles linked from older news articles that no longer exist on the source (404 there too). */
const retiredCauses = ['conservation-international-greater-mekong', 'downtown-eastside-womens-centre', 'peace-village-international', 'rainforest-4-foundation']
  .map((slug) => ({ source: `/t/${slug}`, destination: '/causes', permanent: false }));

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
];

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async redirects() { return [...redirects, ...retiredCauses]; },
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      { source: '/media/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] },
    ];
  },
};

export default config;
