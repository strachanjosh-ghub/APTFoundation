/**
 * APT Foundation brand configuration: the ONLY place brand identity lives.
 *
 * Source: "APT Luxury Travel Brand Guidelines, Version 7 (11 Nov 2024)", a print-oriented
 * guide. The digital adaptations are documented in docs/BRAND.md. In summary:
 *  - Only the guide's colours are used (HEX values given in the guide). Digital UI
 *    needs a few neutrals (borders, muted text, soft surfaces); these are opacity tints
 *    of Navy and Sandstone, not new hues, in line with "new colours should never be created".
 *  - Tuscan Tile (#d44b33) reaches 4.33:1 on white, which fails WCAG AA for body text.
 *    It is therefore used only as an accent (rules, focus ring, highlights), never for text or buttons.
 *  - Typefaces are Adobe Fonts (Thermal VF, Beaufort Pro, Maison), loaded via an Adobe Fonts
 *    web project (NEXT_PUBLIC_ADOBE_FONTS_KIT) with metric-compatible system fallbacks.
 *  - The APT monogram lockup must never be recreated or altered, so "APT Foundation" is set
 *    as a typographic wordmark until an approved APT Foundation lockup is supplied.
 */
const palette = {
  // Primary colours
  black: '#000000', // C0 M0 Y0 K100 · PMS Black
  navy: '#1b1f52', // C100 M95 Y30 K38 · PMS 2757 C
  // Secondary colours (use sparingly to pull out important information)
  oceanBlue: '#234093', // C100 M90 Y5 K0 · PMS 286 C
  tuscanTile: '#d44b33', // C14 M86 Y91 K0 · PMS 1655 C
  sandstone: '#e3d6c3', // C10 M13 Y22 K0 · PMS 4685 C
  white: '#ffffff',
} as const;

export const brand = {
  name: 'APT Foundation',
  shortName: 'APT Foundation',
  /** Small descriptor under the text wordmark (mirrors the source logo's 'CHARITABLE FUND' line). */
  tagline: 'Charitable Fund',
  /**
   * Approved APT Foundation lockup, when supplied (e.g. '/brand/apt-foundation-navy.svg').
   * Per the guide: navy logo on white (primary), white on navy (primary on colour),
   * white on black (sparingly). Minimum digital width 70px (50px small-application wordmark).
   */
  logo: null as null | { src: string; alt: string; width: number; height: number },
  /** White version for navy backgrounds (footer). */
  logoReversed: null as null | { src: string; alt: string; width: number; height: number },
  copyrightHolder: 'APT Foundation',
  // NEXT_PUBLIC_SITE_URL, else Netlify's primary site URL (URL), else Netlify's deploy URL for previews.
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || (process.env.CONTEXT === 'production' ? process.env.URL : process.env.DEPLOY_PRIME_URL) || process.env.URL || 'https://www.aptfoundation.org',
  palette,
  /** Semantic tokens consumed by the UI (all derived from the palette above). */
  colors: {
    primary: palette.navy, // headings, wordmark, primary buttons, header/footer
    primaryContrast: palette.white,
    accent: palette.sandstone, // donate CTA on dark backgrounds, soft section backgrounds
    accentContrast: palette.navy,
    secondary: palette.oceanBlue, // links, hover states
    highlight: palette.tuscanTile, // decorative accent only (rules, focus ring) — not for text
    text: palette.navy,
    textMuted: 'rgba(27, 31, 82, 0.76)', // Navy at 76%: 6.8:1 on white, 4.8:1 on Sandstone tint
    surface: palette.white,
    surfaceAlt: 'rgba(227, 214, 195, 0.35)', // Sandstone tint
    border: 'rgba(27, 31, 82, 0.16)', // Navy tint
    focus: palette.tuscanTile, // 4.3:1 on white, 3.6:1 on navy (meets the 3:1 non-text contrast requirement)
    overlay: 'rgba(27, 31, 82, 0.72)', // Navy overlay so white text on imagery stays legible
  },
  /**
   * Typefaces per the guide. Font family names must match the Adobe Fonts web
   * project CSS (verify the exact names in the project's "Use these fonts" panel).
   */
  fonts: {
    campaign: "'thermal-variable', 'beaufort-pro', Georgia, 'Times New Roman', serif", // Thermal VF: campaign headlines (hero)
    heading: "'beaufort-pro', Georgia, 'Times New Roman', serif", // Beaufort Pro Medium/Regular: headings, subheadings, offers
    body: "'maison-neue', 'Maison', system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif", // Maison Book: body
  },
  fontWeights: { headingStrong: 500, headingRegular: 400, body: 400, cta: 500 },
  /** Square-cornered, restrained geometry, matching the guide's print layouts. */
  radius: '2px',
} as const;

export type Brand = typeof brand;
