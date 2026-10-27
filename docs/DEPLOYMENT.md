# Deployment and maintenance

## Requirements

- Node.js 20.9+ (Netlify builds use Node 22, set in `netlify.toml`)
- **Hosting: Netlify.** Next.js 16 is supported with zero configuration through Netlify's OpenNext adapter (`@netlify/plugin-nextjs`, installed automatically; don't pin it). Pages are pre-rendered and served from Netlify's CDN; `/api/contact` runs as a Netlify Function; `src/proxy.ts` (case-insensitive legacy URLs) runs as a Netlify Edge Function. The proxy uses no filesystem access or native add-ons, so Netlify's Node middleware limitations don't apply.

## Deploy to Netlify

1. **Add new site → Import an existing project → GitHub → `strachanjosh-ghub/APTFoundation`.**
2. Build settings are read from `netlify.toml` (command `npm run build`, publish `.next`). Leave them as detected.
3. **Site configuration → Environment variables**, add:

| Variable | Value | Scope |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | The final domain, e.g. `https://www.aptfoundation.org`. If unset, Netlify's `URL` is used in production and the deploy URL for previews | Production |
| `NEXT_PUBLIC_ADOBE_FONTS_KIT` | Adobe Fonts web project ID (Thermal VF, Beaufort Pro, Maison). Add the Netlify domain and the custom domain to the project | All |
| `NEXT_PUBLIC_DONATION_PROVIDER` | `raisely` | All |
| `NEXT_PUBLIC_DONATION_RAISELY_BASE_URL` | `https://one-tomorrow.raiselysite.com` | All |
| `CONTACT_FORM_ENDPOINT` | Optional. Overrides `content/site.json → contact.form.deliveryEndpoint` (currently FormSubmit, emailing Josh.Strachan@aptouring.com.au). Use it for the Salesforce endpoint later | Production |
| `NEXT_PUBLIC_GTM_ID` | Optional analytics container | Production |
| `CONTENT_PREVIEW` | `true` on deploy previews only, if drafts should show | Deploy previews |

4. **Deploy site.** Each push to `main` deploys production; each pull request gets a deploy preview. `robots.txt` blocks indexing on everything except production (based on Netlify's `CONTEXT`).
5. **Domain management → Add a domain**, then point DNS at Netlify. HTTPS is provisioned automatically.
6. Optional: Netlify's own build checks run on every deploy. The GitHub Actions workflow (`.github/workflows/ci.yml`) also runs the full test suite on each push.

### Alternative contact delivery on Netlify

Netlify Forms could replace FormSubmit later, but Netlify's form detection needs a static HTML form, and this site posts through `/api/contact`. The simplest path to Salesforce is to point `CONTACT_FORM_ENDPOINT` at a Salesforce web-to-lead or Flow endpoint, or to change `src/app/api/contact/route.ts`.

## Other hosts

The app also runs on Vercel (zero config) or any Node host: `npm ci && npm run build && npm start`.

## Go-live checklist

- [ ] Approved APT Foundation lockup in `/public/brand/` and `config/brand.ts`; Adobe Fonts kit set
- [ ] Legal review of the renamed legal and bequest wording (see `MISSING-CONTENT.md`)
- [ ] Contact form: send a test message and click FormSubmit's one-time activation email
- [ ] Donation hand-off verified end to end on the live Raisely campaign (see `DONATIONS.md`)
- [ ] `npm test` and `npm run test:e2e` green against the Netlify URL (`E2E_BASE_URL=https://<site>.netlify.app npm run test:e2e`)
- [ ] DNS: if `one-tomorrow.raiselysite.com` or another old domain is retired, point it at the new site. Original paths are preserved, so links keep working
- [ ] Analytics container configured (`NEXT_PUBLIC_GTM_ID`)
- [ ] Sitemap submitted in Google Search Console

## Maintenance

- **Content changes**: edit `/content/*.json`, then `npm run validate:content && npm test`, then commit. CI and hosting rebuild automatically.
- **New images**: add them to `/public/media/` and reference them as `/media/<file>`.
- **Brand changes**: `config/brand.ts` only.
- **Dependencies**: `npm outdated`, then update and rerun both test suites.
- **Refreshing from the source** (while Raisely is still live): capture a new snapshot (see the header of `scripts/migrate.mjs`), run `npm run migrate`, and review the diff. Manual edits to migrated objects are overwritten, so stop re-running the migration once editors start changing content.
