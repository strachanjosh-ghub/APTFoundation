# Donations and fundraising

## What the source site does (observed 27 Oct 2026)

- Every cause page (`/t/:id`), the general fund (`/t/donate-to-one-tomorrow`), `/donate` and the legacy `/antarctic-science-foundation` page embed Raisely's v3 donation form:
  - **Step 1**: One-time / Monthly toggle; amounts $25, $50, $100, $500, $1,000; custom amount; currency selector (default "Donating in Australian Dollars").
  - **Steps 2–3**: donor details ("Your Details") and payment ("Your Payment Details"), processed by Raisely on Stripe. Accepted: Apple Pay, Google Pay, Visa, Mastercard, American Express, Diners Club, Discover, JCB, UnionPay.
  - An optional platform-fee checkbox (described in the FAQs). Thank-you: "You've successfully made a donation of [donation.amount]!"
- Receipting and compliance sit with the Australian Communities Foundation (ACF) or Global Development Group (GDG), depending on the cause (`fundraising.routing` / `fundraising.project` on each cause object). Matching is dollar for dollar (standardised statement: up to $200,000 per year and up to $1,000 per individual donor).
- Raisely also offers peer-to-peer fundraiser profiles, sign-up, login and dashboards. These exist as platform routes but are **not used by the public site** (no fundraiser profiles exist; the "About Fundraising" page is an unedited theme placeholder), so they were not rebuilt.

## What this site does

`src/components/DonationForm.tsx` reproduces step 1 (frequency, preset and custom amounts, validation of at least $2, the step indicator) and hands the donor off to the configured provider through `src/lib/donations.ts`. **No payment flow is simulated, and no card data is collected or stored.**

| Provider (`NEXT_PUBLIC_DONATION_PROVIDER`) | Behaviour |
|---|---|
| `raisely` (default) | Redirects to `${NEXT_PUBLIC_DONATION_RAISELY_BASE_URL}/t/<cause>?amount=<n>[&frequency=MONTH]`, the cause's existing Raisely donation page, where details and payment are completed |
| `stripe` | Not implemented. Donations are disabled and a warning is logged |
| `none` | The donation panel shows a "currently unavailable" message |

## Required configuration and verification

1. **Keep the Raisely campaign live** while `raisely` is the provider. The cause slugs in `content/causes/*.json` must match the Raisely profile paths (they are the originals).
2. **Prefill (verified 27 Oct 2026 on the live form).** `?amount=50` pre-selects $50, and `&frequency=MONTH` pre-selects Monthly. (`interval=`, `recurring=` and similar are ignored by Raisely.) The donor's choice on this site therefore carries straight through to step 2 on Raisely.
3. **Rebrand the hosted checkout.** The Raisely campaign itself still carries OneTomorrow branding. Update the Raisely theme and receipt templates in the Raisely admin, or move to a new provider.

## Moving off Raisely (future)

To own checkout end to end, implement `stripe` in `src/lib/donations.ts` as:

- a server route (`/api/donations/checkout`) that creates a Stripe Checkout Session (mode `payment` or `subscription`) with metadata `{ cause, routing, project }`;
- a Stripe webhook (`/api/donations/webhook`) that records completed gifts and triggers receipts;
- receipting and DGR obligations agreed with ACF and GDG, the matching cap logic, and the fee-cover option.

Card data stays with Stripe throughout (PCI SAQ A).

## Campaign progress and totals

Raisely profiles hold goals and totals (recorded in each cause as `fundraising.goal` / `totalAtMigration` for reference). **Progress bars were not displayed on the rendered source pages at capture time**, so none are shown. If they're wanted, add a server component that reads `GET https://api.raisely.com/v3/profiles/<uuid>` (public) with revalidation.
