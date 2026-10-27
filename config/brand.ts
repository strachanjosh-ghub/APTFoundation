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
 *  - Typefaces: free self-hosted lookalikes of the guide's Adobe fonts (see `fonts` below).
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
   * Typefaces: free, self-hosted (Fontsource) lookalikes for the guide's Adobe fonts,
   * chosen by side-by-side comparison with the guide's specimens (docs/BRAND.md):
   *  - Thermal VF Medium (campaign headlines) -> Gelasio SemiBold: sturdy wedge-serif text face with old-style figures
   *  - Beaufort Pro Regular/Medium (headings)  -> Spectral Regular/SemiBold (Beaufort Medium is heavier than Spectral Medium): wide classical capitals, low contrast, fine flared serifs
   *  - Maison Book/Light (body, CTAs)          -> Hanken Grotesk: neutral neo-grotesk with similar proportions
   * Loaded in src/app/layout.tsx; no third-party font requests.
   */
  fonts: {
    campaign: "'Gelasio', 'Spectral', Georgia, serif",
    heading: "'Spectral', Georgia, 'Times New Roman', serif",
    body: "'Hanken Grotesk Variable', system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif",
  },
  /** Guide: headings Beaufort Medium, subheadings Beaufort Regular, body Maison Book, CTAs Maison Light (Book used on screen for legibility). */
  fontWeights: { campaign: 600, headingStrong: 600, headingRegular: 400, body: 400, cta: 450 },
  /** Square-cornered, restrained geometry, matching the guide's print layouts. */
  radius: '2px',
} as const;

export type Brand = typeof brand;
