# APT Foundation website

Rebuild of the OneTomorrow Charitable Fund website (`one-tomorrow.raiselysite.com`, hosted on Raisely) as an independently deployable Next.js application, rebranded as the **APT Foundation**, hosted on **Netlify** (`netlify.toml`; see `docs/DEPLOYMENT.md`).

- **All original editorial content is preserved**, with only owner-approved editorial changes applied on top: "OneTomorrow" renamed "The APT Foundation", and the donation-matching statement standardised (`scripts/editorial.mjs`). Every page, cause and article is checked automatically against the source snapshot with those changes applied (55/55 match; see `docs/MIGRATION-REGISTER.md`).
- **All content is in structured, schema-validated CMS objects.** Editors change JSON in `/content`; no code changes are needed.
- **Brand identity is isolated in `config/brand.ts`**, applied from the APT brand guidelines (colours, typefaces, logo rules) and adapted for screen and accessibility. See `docs/BRAND.md`.

## Quick start

```bash
npm install
npm run dev            # http://localhost:3000
npm run build && npm start
```

Copy `.env.example` to `.env.local` and set values (see `docs/DEPLOYMENT.md`).

## Architecture

| Layer | Location | Notes |
|---|---|---|
| Presentation | `src/app/*`, `src/components/*` | Next.js App Router, React Server Components, static generation (SSG) for every content route |
| Content | `content/*.json`, `src/lib/schemas.ts`, `src/lib/content.ts` | Platform-independent JSON content objects validated with Zod; `content.ts` is the only data access layer (swap for a headless CMS here) |
| Business logic | `src/lib/donations.ts`, `src/app/api/contact/route.ts`, `src/components/DonationForm.tsx`, `src/components/ContactForm.tsx` | Donation provider abstraction (no payment data handled), contact form API |
| Configuration | `config/brand.ts`, `content/site.json`, `next.config.ts`, `src/proxy.ts`, `.env` | Brand tokens, navigation/footer/SEO/donation config, redirects, case-insensitive legacy URLs |

### Routes (original URLs preserved)

| Route | Template | Source |
|---|---|---|
| `/` | home | `content/pages/home.json` |
| `/about-us` (`#difference`, `#background`), `/faqs`, `/responsible-travel`, `/causes`, `/news`, `/Contact`, `/donate`, `/PrivacyPolicy`, `/antarctic-science-foundation` | `[...slug]`: generic page template | `content/pages/*.json` |
| `/t/:slug` (14 causes) | cause detail | `content/causes/*.json` |
| `/one-tomorrow/posts/:slug` (31 articles) | news article | `content/articles/*.json` |
| `/sitemap.xml`, `/robots.txt` | generated | |
| `/api/contact` | contact form handler | |

Redirects: `/contact` → `/Contact`, `/privacypolicy` → `/PrivacyPolicy` (any casing), `/blog` → `/news`, `/about` → `/about-us`, `/one-tomorrow` → `/`, plus four retired cause pages → `/causes`.

### Content model (`src/lib/schemas.ts`)

- **Page**: `id, title, slug, path, template, parentId?, hero?, contentBlocks[], seo, status, originalUrl`
- **Cause**: `id, name, slug, path, order, isGeneralFund, region, logo, heroImage, footerImage, quote, description (rich text), contentBlocks[], donationCampaignId, donationHeading, fundraising{…}, seo, status`
- **Article**: `id, title, slug, path, originalUrl, publishedDate, author, body (original HTML), heroImage, relatedArticles[], seo, status`
- **Site** (global, `content/site.json`): navigation, footer, partner brands, social sharing, contact details and form config, default SEO, global CTAs, donation configuration
- **Content blocks** (reusable, each with a component in `src/components/blocks/BlockRenderer.tsx`): `hero, richText, mediaText, imageBand, logoGrid, cardGrid, steps, cta, gallery, video, accordion, faq, statistics, quote, relatedContent, donationCta, donationForm, embed, partnerBrands, causeGrid, newsFeed, contactForm`

Shared content is referenced, not duplicated: for example `{ "type": "partnerBrands" }` renders the global brand strip from `site.json`, and `causeGrid` and `newsFeed` render from the cause and article objects.

## Editing content

See `docs/CONTENT-EDITING.md`. In short: edit the JSON in `/content`, run `npm run validate:content`, and commit. Draft objects (`"status": "draft"`) are hidden unless `CONTENT_PREVIEW=true`.

## Re-running the migration

```bash
npm run migrate            # content/raw/onetomorrow-source-snapshot.json -> content/*
npm run validate:content   # fidelity + links + media checks; writes docs/MIGRATION-REGISTER.md
```

The raw source snapshot (Raisely API responses plus the rendered DOM of every route, captured 27 Oct 2026) is kept in `content/raw/` for auditing.

## Tests

```bash
npm test               # unit: schema validation, content fidelity (every object vs source), links, media, donation provider, contact API
npm run test:e2e       # Playwright (desktop + mobile): every route renders, redirects, navigation, pagination, FAQ, contact and donation journeys, axe WCAG 2.2 AA checks
```

## Documentation

- `docs/DEPLOYMENT.md`: deployment and maintenance
- `docs/BRAND.md`: how the APT brand guidelines are applied digitally
- `docs/DONATIONS.md`: donation integration and configuration
- `docs/CONTENT-EDITING.md`: editor guide and headless-CMS migration path
- `docs/MIGRATION-REGISTER.md`: per-page migration and validation register (generated)
- `docs/MISSING-CONTENT.md`: outstanding content, decisions and dependencies
