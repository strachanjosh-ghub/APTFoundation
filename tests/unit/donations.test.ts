import { describe, expect, it } from 'vitest';
import { raiselyProvider, noneProvider } from '@/lib/donations';

describe('donation provider abstraction', () => {
  it('hands off to the Raisely hosted page for the cause', () => {
    const p = raiselyProvider('https://one-tomorrow.raiselysite.com');
    const url = new URL(p.checkoutUrl({ causeSlug: 'rural-aid', amount: 50, interval: 'monthly', currency: 'AUD' })!);
    expect(url.origin + url.pathname).toBe('https://one-tomorrow.raiselysite.com/t/rural-aid');
    expect(url.searchParams.get('amount')).toBe('50');
    expect(url.searchParams.get('frequency')).toBe('MONTH');
  });
  it('never collects payment data and can be disabled', () => {
    expect(noneProvider.checkoutUrl({ causeSlug: 'x', interval: 'once', currency: 'AUD' })).toBeNull();
  });
});
