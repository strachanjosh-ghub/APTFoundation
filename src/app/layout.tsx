import type { Metadata } from 'next';
import type { CSSProperties, ReactNode } from 'react';
import Script from 'next/script';
import { brand } from '@config/brand';
import { getSite } from '@/lib/content';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import './globals.css';

const site = getSite();

export const metadata: Metadata = {
  metadataBase: new URL(brand.siteUrl),
  title: { default: brand.name, template: `%s • ${brand.name}` },
  description: site.seo.defaultDescription,
  openGraph: { type: 'website', siteName: brand.name, images: site.seo.defaultOgImage ? [site.seo.defaultOgImage] : undefined },
  twitter: { card: 'summary_large_image' },
};

const tokens = {
  '--color-primary': brand.colors.primary,
  '--color-primary-contrast': brand.colors.primaryContrast,
  '--color-accent': brand.colors.accent,
  '--color-accent-contrast': brand.colors.accentContrast,
  '--color-secondary': brand.colors.secondary,
  '--color-text': brand.colors.text,
  '--color-text-muted': brand.colors.textMuted,
  '--color-surface': brand.colors.surface,
  '--color-surface-alt': brand.colors.surfaceAlt,
  '--color-border': brand.colors.border,
  '--color-focus': brand.colors.focus,
  '--font-heading': brand.fonts.heading,
  '--font-body': brand.fonts.body,
  '--radius': brand.radius,
} as CSSProperties;

export default function RootLayout({ children }: { children: ReactNode }) {
  const gtm = process.env.NEXT_PUBLIC_GTM_ID;
  return (
    <html lang="en-AU" style={tokens}>
      <body>
        {gtm ? (
          <Script id="gtm" strategy="afterInteractive">{`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtm}');`}</Script>
        ) : null}
        <a className="skip-link" href="#main">Skip to content</a>
        <SiteHeader navigation={site.navigation.primary} donate={site.globalCtas.donate} />
        <main id="main" tabIndex={-1}>{children}</main>
        <SiteFooter links={site.footer.links} />
      </body>
    </html>
  );
}
