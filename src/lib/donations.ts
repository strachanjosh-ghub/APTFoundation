/**
 * Donation provider abstraction.
 *
 * The source site's donations are processed by Raisely (Stripe-backed, with
 * Australian Communities Foundation / Global Development Group receipting and
 * dollar-for-dollar matching). This site does NOT simulate payments and never
 * handles card data. Instead, the donation UI collects the donor's choices and
 * hands off to the configured provider's hosted, PCI-compliant checkout.
 *
 * Providers:
 *  - raisely (default): hand-off to the cause's Raisely donation page. Requires the
 *    Raisely campaign to remain live (DONATION_RAISELY_BASE_URL).
 *  - stripe: placeholder for a future Stripe Checkout integration (server route
 *    creating a Checkout Session). Not implemented — see docs/DONATIONS.md.
 *  - none: donation UI shows contact details instead of a checkout hand-off.
 */
export type DonationInterval = 'once' | 'monthly';

export interface DonationIntent {
  causeSlug: string;
  amount?: number; // whole currency units
  interval: DonationInterval;
  currency: string;
}

export interface DonationProvider {
  id: 'raisely' | 'stripe' | 'none';
  /** URL the donor is sent to complete payment, or null when unavailable. */
  checkoutUrl(intent: DonationIntent): string | null;
}

export function raiselyProvider(baseUrl: string): DonationProvider {
  return {
    id: 'raisely',
    checkoutUrl({ causeSlug, amount, interval }) {
      const url = new URL(`/t/${encodeURIComponent(causeSlug)}`, baseUrl);
      // Prefill parameters. Raisely's support for these query params on v3 donation
      // forms must be verified against the live campaign (docs/DONATIONS.md).
      if (amount) url.searchParams.set('amount', String(amount));
      if (interval === 'monthly') url.searchParams.set('interval', 'MONTH');
      return url.toString();
    },
  };
}

export const noneProvider: DonationProvider = { id: 'none', checkoutUrl: () => null };

export function getDonationProvider(): DonationProvider {
  const id = (process.env.NEXT_PUBLIC_DONATION_PROVIDER || 'raisely') as DonationProvider['id'];
  if (id === 'raisely') return raiselyProvider(process.env.NEXT_PUBLIC_DONATION_RAISELY_BASE_URL || 'https://one-tomorrow.raiselysite.com');
  if (id === 'stripe') {
    // Not implemented: requires a server route that creates a Stripe Checkout Session. See docs/DONATIONS.md.
    console.warn('Stripe donation provider is not implemented; donations disabled.');
    return noneProvider;
  }
  return noneProvider;
}
