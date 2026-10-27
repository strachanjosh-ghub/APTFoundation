/**
 * APT Foundation brand configuration: the ONLY place brand identity lives.
 *
 * Everything visual (name, logo, colours, type) is read from here and exposed
 * as CSS custom properties in src/app/layout.tsx. Swap these values when the
 * official APT Foundation brand assets are supplied; no component changes needed.
 *
 * STATUS: PLACEHOLDER — awaiting official APT Foundation brand assets.
 * The values below are neutral interim tokens, not an approved brand.
 */
export const brand = {
  name: 'APT Foundation',
  shortName: 'APT Foundation',
  /** Small descriptor under the text wordmark (mirrors the source logo's 'CHARITABLE FUND' line). */
  tagline: 'Charitable Fund',
  /** Set to a file in /public/brand/ (e.g. '/brand/apt-foundation-logo.svg') when supplied. */
  logo: null as null | { src: string; alt: string; width: number; height: number },
  /** Reversed (light-on-dark) logo for the footer, if supplied. */
  logoReversed: null as null | { src: string; alt: string; width: number; height: number },
  copyrightHolder: 'APT Foundation',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://www.aptfoundation.org',
  colors: {
    primary: '#0b2a4a', // deep navy (placeholder)
    primaryContrast: '#ffffff',
    accent: '#b8893b', // warm gold (placeholder)
    accentContrast: '#1b1b1b',
    secondary: '#2f6b5a', // eucalyptus green (placeholder)
    text: '#2b2d36',
    textMuted: '#5d6170',
    surface: '#ffffff',
    surfaceAlt: '#f4f2ee',
    border: '#e1ddd5',
    focus: '#1a73e8',
  },
  fonts: {
    heading: "Georgia, 'Times New Roman', serif",
    body: "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  },
  radius: '6px',
} as const;

export type Brand = typeof brand;
