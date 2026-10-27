# Missing content, decisions and unresolved dependencies

## Blocking go-live

| # | Item | Status | Owner / action |
|---|---|---|---|
| 1 | **APT Foundation brand assets**: logo (SVG), colour palette, typefaces | Placeholders in `config/brand.ts` (text wordmark, navy/gold/green tokens) | Supply assets; developer updates `config/brand.ts` |
| 2 | **Editorial copy still says "OneTomorrow"** (headings, body text, FAQs, privacy policy, articles). Copied verbatim per the migration brief | Unchanged | Business decision: keep, or reword under APT Foundation. This is an editorial and legal rewrite, not a migration task |
| 3 | **Legal and governance identity**: the privacy policy, FAQs and bequest wording name "OneTomorrow Charitable Fund" as an ACF sub-fund and GDG partner | Unchanged | Legal to confirm the APT Foundation structure before any wording changes |
| 4 | **Contact details**: `info@onetomorrow.com.au`, (03) 8526 1631 / 1300 278 278, Moorabbin address | Migrated as published | Confirm or replace in `content/site.json` and `content/pages/contact.json` |
| 5 | **Contact form backend**: the original Formspree form (`formspree.io/f/xoqrdwlj`) belongs to OneTomorrow | Not wired | Set `CONTACT_FORM_ENDPOINT` to an APT Foundation-owned endpoint |
| 6 | **Donation checkout** is still the OneTomorrow-branded Raisely campaign | Hand-off implemented | See `DONATIONS.md`: verify the prefill parameters and rebrand the Raisely theme, or replace the provider |
| 7 | **OneTomorrow-branded imagery**: `onetomorrow-400-x-400` (general fund logo), `ot-108-world-map-of-causes-2025` (causes map), infographic step icons | In use | Supply APT Foundation versions; replace the files in `public/media/` or update the references |

## Source defects preserved verbatim (flag for editorial review)

- `/causes`: "Donations through  are tax deductible…". The organisation name is missing in the source (a template variable that never rendered).
- The matching statements are inconsistent across the source: "$150,000 per year and up to $1000.00 per individual donor" (`/donate` and the legacy Antarctic page) vs "$200,000 per year and up to $1,000" (cause template). Confirm the current figure.
- Spellings as published: "Médecins San Frontieres", "tax-deductable", "Médecins San Frontiers" (About Us).
- About Us: "for over 96 years" and "for over 97 years" in different sections.
- Contact form: "Your Email (required)" and "Message (required)" are labelled required, but the original form only enforced the name field. The behaviour was reproduced; decide whether to enforce them (`content/site.json` → `contact.form.fields[].required`).
- `/antarctic-science-foundation` is a legacy duplicate of `/t/antarctic-science-foundation`, not linked from navigation. It was preserved at its URL; consider redirecting it.

## Link corrections made (logged in `MIGRATION-REGISTER.md`)

- Internal absolute links (`one-tomorrow.raisely.com/…`, `one-tomorrow.raiselysite.com/…`) are now relative routes.
- Broken source links were fixed: the APT logo link (`…aptouring.com.au/ target="_blank"`), and domains written as relative paths (`/www.communityfoundation.org.au/…`, `/globaldevelopmentgroup.org/…`) now have `https://`.
- `mailto: info@…` (with a stray space) is now `mailto:info@…`.
- Four articles link to cause pages that **no longer exist on the source either** (Conservation International Greater Mekong, Downtown Eastside Women's Centre, Peace Village International, Rainforest 4 Foundation). They now redirect to `/causes`. The original text is unchanged.

## Not migrated (by design)

- Raisely platform functions: sign-up, login, password reset, dashboards, fundraiser profile create/edit, search, account and payment-method pages, peer-to-peer profile pages (`/:id`).
- `/page/about` ("How to create a birthday fundraiser"): an unedited Raisely theme placeholder with filler text, linked from nowhere.
- Raisely footer "Powered by Raisely" attribution and the original Google Analytics / GTM / Facebook pixel IDs. Configure new analytics with `NEXT_PUBLIC_GTM_ID`.
- Campaign progress totals: not shown on the rendered source; available via the Raisely API if wanted (`DONATIONS.md`).

## Unverified functionality

- Raisely donation-form amount and interval prefill via query string (`DONATIONS.md`).
- The homepage video (Vimeo 408230655) is embedded from Vimeo; playback was not tested from the build environment.
