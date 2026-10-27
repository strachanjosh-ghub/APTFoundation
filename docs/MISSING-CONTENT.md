# Missing content, decisions and unresolved dependencies

## Blocking go-live

| # | Item | Status | Owner / action |
|---|---|---|---|
| 1 | **APT Foundation logo lockup** | APT palette applied; free self-hosted lookalike fonts (`docs/BRAND.md`); typographic wordmark in place of a logo | Brand team: approved APT Foundation lockup (the APT monogram must not be altered) |
| 2 | **Rename applied**: "OneTomorrow" / "OneTomorrow Charitable Fund" is now "The APT Foundation" in all copy (owner request, 27 Oct 2026; rules in `scripts/editorial.mjs`). Email addresses, URLs and image files still use onetomorrow | Done | Review the copy for tone. Images with the OneTomorrow logo remain (item 7) |
| 3 | **Legal wording after the rename**: the privacy policy, FAQs and the **bequest wording** now say "the APT Foundation" is the ACF sub-fund and GDG partner. If the fund's registered name with ACF is still "OneTomorrow Charitable Fund", the bequest clause in particular could misdirect gifts | Needs review | Legal to confirm the fund's registered name with ACF/GDG before go-live |
| 4 | **Contact details**: `info@onetomorrow.com.au`, (03) 8526 1631 / 1300 278 278, Moorabbin address | Migrated as published | Confirm or replace in `content/site.json` and `content/pages/contact.json` |
| 5 | **Contact form delivery**: interim email to Josh.Strachan@aptouring.com.au via FormSubmit (`content/site.json` → `contact.form.deliveryEndpoint`). **FormSubmit emails an activation link on the first submission; it must be clicked before messages are delivered.** Messages pass through FormSubmit (a third-party service) | Interim | Replace with the Salesforce integration (override with `CONTACT_FORM_ENDPOINT`, or change the API route) |
| 6 | **Donation checkout** is still the OneTomorrow-branded Raisely campaign | Hand-off implemented; amount and monthly prefill verified | Rebrand the Raisely theme and receipts, or replace the provider (`DONATIONS.md`) |
| 7 | **OneTomorrow-branded imagery** | Done: map and step icons recoloured to navy, general fund tile replaced, green leaf backgrounds replaced with photography. **The homepage video (Vimeo 408230655) may still show OneTomorrow branding.** It couldn't be played from the build environment, so check it | Review the video; replace or remove the `video` block in `content/pages/home.json` (via `scripts/presentation.mjs`) if needed |

## Source defects preserved verbatim (flag for editorial review)

- `/causes`: "Donations through  are tax deductible…". The organisation name is missing in the source (a template variable that never rendered).
- Matching statements were inconsistent in the source ("$150,000 / $1000.00" on `/donate` and the legacy Antarctic page vs "$200,000 / $1,000" on all cause pages). **Standardised on the most common wording, $200,000 per year and up to $1,000 per individual donor** (owner request, 27 Oct 2026).
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
