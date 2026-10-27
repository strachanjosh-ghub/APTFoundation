# Deployment and maintenance

## Requirements

- Node.js 20.9+ (tested on 22)
- Any Next.js-capable host. Vercel is the zero-config option; any Node host (Azure App Service, AWS Amplify, a container) works with `npm run build && npm start`. Every page is statically generated; only `/api/contact` and the redirect proxy need a server runtime.

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Yes | Canonical origin, e.g. `https://www.aptfoundation.org`. Used for canonical URLs, the sitemap and Open Graph |
| `NEXT_PUBLIC_DONATION_PROVIDER` | Yes | `raisely` (default), `stripe` (not implemented, which disables donations) or `none` |
| `NEXT_PUBLIC_DONATION_RAISELY_BASE_URL` | If `raisely` | Hosted Raisely campaign origin. Default `https://one-tomorrow.raiselysite.com` |
| `CONTACT_FORM_ENDPOINT` | Yes for contact | Formspree (or compatible JSON POST) endpoint. Without it the form returns a clear "not configured" error |
| `NEXT_PUBLIC_GTM_ID` | No | Google Tag Manager container for the new site |
| `CONTENT_PREVIEW` | No | `true` renders draft content (preview environments only) |

No secrets are committed. `CONTACT_FORM_ENDPOINT` is read only on the server.

## Deploy to Vercel

1. Import the GitHub repository in Vercel (framework: Next.js, default settings).
2. Add the environment variables above for Production and Preview.
3. Deploy. Preview deployments get `robots.txt` set to disallow automatically (based on `VERCEL_ENV`).
4. Add the custom domain, then update `NEXT_PUBLIC_SITE_URL`.

## Deploy to a Node host or container

```bash
npm ci
npm run build
NODE_ENV=production PORT=3000 npm start
```

## Go-live checklist

- [ ] Official APT Foundation brand assets applied in `config/brand.ts` (logo to `/public/brand/`)
- [ ] Decision taken on editorial references to "OneTomorrow" (see `MISSING-CONTENT.md`)
- [ ] `CONTACT_FORM_ENDPOINT` set to an inbox APT Foundation owns, and a test message received
- [ ] Donation hand-off verified end to end on the live Raisely campaign (see `DONATIONS.md`)
- [ ] `npm test` and `npm run test:e2e` green against the production URL (`E2E_BASE_URL=https://… npm run test:e2e`)
- [ ] DNS: if `one-tomorrow.raiselysite.com` or another old domain is retired, point it at the new site. Original paths are preserved, so links keep working
- [ ] Analytics container configured (`NEXT_PUBLIC_GTM_ID`)
- [ ] Sitemap submitted in Google Search Console

## Maintenance

- **Content changes**: edit `/content/*.json`, then `npm run validate:content && npm test`, then commit. CI and hosting rebuild automatically.
- **New images**: add them to `/public/media/` and reference them as `/media/<file>`.
- **Brand changes**: `config/brand.ts` only.
- **Dependencies**: `npm outdated`, then update and rerun both test suites.
- **Refreshing from the source** (while Raisely is still live): capture a new snapshot (see the header of `scripts/migrate.mjs`), run `npm run migrate`, and review the diff. Manual edits to migrated objects are overwritten, so stop re-running the migration once editors start changing content.
