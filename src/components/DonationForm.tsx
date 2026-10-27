'use client';
import { useId, useState } from 'react';
import type { Site } from '@/lib/schemas';
import { getDonationProvider, type DonationInterval } from '@/lib/donations';

type Config = Site['donation'];

/**
 * Donation entry point (step 1 of the source's 3-step Raisely flow: amount →
 * details → payment). Steps 2–3 are completed on the provider's secure hosted
 * checkout. No payment details are collected or stored here.
 */
export function DonationForm({ causeSlug, causeName, heading, config }: { causeSlug: string; causeName: string; heading?: string; config: Config }) {
  const uid = useId();
  const [interval, setInterval] = useState<DonationInterval>('once');
  const [amount, setAmount] = useState<number | null>(config.renderedAmounts[2] ?? null);
  const [custom, setCustom] = useState('');
  const [error, setError] = useState('');
  const provider = getDonationProvider();
  // One-time amounts as rendered on the source; monthly amounts from the source campaign configuration.
  const amounts = interval === 'once' ? config.renderedAmounts : config.amounts.monthly;

  function proceed(e: React.FormEvent) {
    e.preventDefault();
    const value = custom ? Number(custom) : amount;
    if (!value || !Number.isFinite(value) || value < 2) {
      setError('Please choose or enter an amount of $2 or more.');
      return;
    }
    setError('');
    const url = provider.checkoutUrl({ causeSlug, amount: value, interval, currency: config.currency });
    if (url) window.location.assign(url);
  }

  return (
    <form className="donate-panel" onSubmit={proceed} noValidate aria-labelledby={`${uid}-h`}>
      <h2 id={`${uid}-h`}>{heading || `Donate to ${causeName}`}</h2>
      <ol className="donate-steps" aria-label="Donation steps">
        {config.steps.map((s, i) => <li key={s} aria-current={i === 0 ? 'step' : undefined}>{s}</li>)}
      </ol>
      <div className="segmented" role="group" aria-label="Donation frequency">
        {(['once', 'monthly'] as const).map((iv, i) => (
          <button key={iv} type="button" aria-pressed={interval === iv} onClick={() => { setInterval(iv); setAmount(null); }}>{config.intervals[i]}</button>
        ))}
      </div>
      <div className="amounts" role="group" aria-label="Donation amount">
        {amounts.map((a) => (
          <button key={a} type="button" aria-pressed={!custom && amount === a} onClick={() => { setAmount(a); setCustom(''); setError(''); }}>
            ${a.toLocaleString('en-AU')}
          </button>
        ))}
      </div>
      <div className="field">
        <label htmlFor={`${uid}-custom`} className="visually-hidden">Enter custom amount</label>
        <div className="input-prefix">
          <span aria-hidden="true">$</span>
          <input id={`${uid}-custom`} type="number" inputMode="decimal" min={2} step="any" name="amount" placeholder="Enter custom amount" value={custom}
            onChange={(e) => { setCustom(e.target.value); setError(''); }} aria-invalid={error ? true : undefined} aria-describedby={error ? `${uid}-err` : `${uid}-cur`} />
        </div>
        <span id={`${uid}-cur`} className="donate-panel__note">Donating in Australian Dollars</span>
        {error ? <span className="field__error" id={`${uid}-err`} role="alert">{error}</span> : null}
      </div>
      {provider.id === 'none' ? (
        <p className="donate-panel__note">Online donations are currently unavailable. Please contact us to donate.</p>
      ) : (
        <button type="submit" className="btn btn--primary" style={{ width: '100%' }}>
          {interval === 'monthly' ? 'Continue to monthly donation' : 'Continue to donate'}
        </button>
      )}
      <p className="donate-panel__methods">Accepted payment methods: {config.paymentMethods.join(', ')}.</p>
    </form>
  );
}
