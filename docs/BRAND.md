# Brand application: APT guidelines adapted for digital

Source: *APT Luxury Travel Brand Guidelines, Version 7 (11 Nov 2024)*. The guide is written mainly for print. This page records how each rule is applied on screen. All values live in `config/brand.ts`.

## Colour

| Guide colour | Print spec | Web value | Used for |
|---|---|---|---|
| Navy (primary) | C100 M95 Y30 K38 · PMS 2757 C | `#1b1f52` | Wordmark, headings, body text, primary buttons, header and footer, hero background, image overlays |
| Black (primary) | K100 · PMS Black | `#000000` | Reserved (guide: white-on-black only "sparingly and only if necessary") |
| Ocean Blue (secondary) | C100 M90 Y5 K0 · PMS 286 C | `#234093` | Text links and button hover states |
| Sandstone (secondary) | C10 M13 Y22 K0 · PMS 4685 C | `#e3d6c3` | The single key call to action on dark backgrounds (Donate), and a 35% tint for soft section backgrounds |
| Tuscan Tile (secondary) | C14 M86 Y91 K0 · PMS 1655 C | `#d44b33` | Decorative accents only: heading rules, quote rules, focus ring |

**Digital adaptations**

- **The hex values from the guide are used directly.** CMYK and PMS values apply to print only.
- **No new hues.** Interfaces need neutrals for borders, muted text and soft surfaces. These are opacity tints of Navy (16% borders, 76% muted text) and Sandstone (35% surfaces), never new colours, in line with "New colours should never be created".
- **Accessibility (WCAG 2.2 AA).** Contrast was measured for every pairing:
  - Navy on white: 15.4:1. Navy on Sandstone: 10.8:1. Ocean Blue on white: 9.4:1. White on Navy: 15.4:1.
  - Tuscan Tile on white is **4.33:1, below the 4.5:1 needed for body text**. On screen it is therefore never used for text or button labels; only for non-text accents, where 3:1 is required.
  - Automated axe checks on 10 key pages report no serious or critical issues.
- **Secondary colours are used sparingly,** as the guide asks: Sandstone marks the main donation action; Tuscan Tile marks emphasis.

## Typography

The guide's Adobe fonts are replaced by free, self-hosted lookalikes (Fontsource packages, served from the site itself, so there are no third-party font requests or licences to manage):

| Guide role | Guide typeface | Web typeface | Why |
|---|---|---|---|
| Campaign headlines | Thermal VF Medium | **Fraunces** (variable) | Soft, warm display serif with the same friendly curves; used for page heroes |
| Headings, subheadings | Beaufort Pro Medium / Regular | **Newsreader** (variable, optical sizes) | Crisp contemporary serif with similar proportions; weight 500 |
| Body copy | Maison Book | **DM Sans** (variable) | Clean geometric grotesque, close to Maison's shapes |
| CTAs, T&Cs | Maison Light | **DM Sans** 500 | Light weights at small screen sizes fall below comfortable legibility, so buttons use a medium weight |

## Logo

- The guide states the APT lockup "should never be recreated or altered" and must always include "Luxury Travel / since 1927". Making an "APT Foundation" logo from the APT monogram would break that rule, so **the header and footer use a typographic wordmark** ("APT Foundation", in Beaufort, Navy on white and white on Navy) until the brand team supplies an approved APT Foundation lockup. To use it, drop the files in `/public/brand/` and set `brand.logo` and `brand.logoReversed`.
- **Placement on colour:** Navy logo on white (header); white logo on Navy (footer). Matches the guide's primary combinations.
- **Logos are never altered.** The old greyscale filter on the partner-brand strip was removed, so brand logos show in their supplied colours.
- **Minimum size:** logo images render at least 70px wide (the guide's digital minimum).
- **Clear space:** logo tiles and the brand strip are padded so no copy or graphics sit next to a logo.
- **Logos on imagery:** text and logos over photos sit on a Navy overlay (72% to 35%), following the "legible in all applications" examples.

## Geometry

The guide's layouts are square-edged and restrained, so corners use a 2px radius and decoration is limited to thin Tuscan Tile rules.

## Imagery (presentation layer)

Rules in `scripts/presentation.mjs`, applied on top of the migrated content (text is never changed):

- Every page opens with a full-width photo hero (existing site photography) under a Navy overlay, so white text always meets contrast requirements.
- The repeated decorative stock-photo strips (the same "hands" images appeared on 8 pages) were removed.
- The source's green OneTomorrow leaf artwork used as page backgrounds was replaced with photography.
- The causes world map and the "How it works" step icons were recoloured from OneTomorrow green to APT Navy (`scripts/brand-images.py`). The OneTomorrow logo tile for the general fund was replaced with an APT Foundation tile (`/public/brand/apt-foundation-tile.svg`).
- Charities are presented as photo cards (photo, logo, region, summary, Donate) everywhere.
- In-page photos use a consistent 3:2 crop; logos and badges are shown uncropped.
