'use client';
import { useId, useMemo, useState } from 'react';
import type { Site } from '@/lib/schemas';
import { getDonationProvider, type DonationInterval } from '@/lib/donations';

type Config = Site['donation'];
export type DonationCause = { slug: string; name: string; isGeneralFund: boolean; impactAmounts?: { amount: number; text: string }[] };

/** Per-donor annual matching cap (from the site's matching statement). */
const MATCH_CAP = 1000;
const fmt = (n: number) => `$${n.toLocaleString('en-AU', { maximumFractionDigits: 2 })}`;

/**
 * Donation panel: choose cause (optional) → frequency → amount → hand off.
 * Cause-specific impact amounts are offered as one-tap choices where the cause has them.
 * Details and payment are completed on the provider's secure hosted checkout;
 * no payment details are collected or stored here.
 */
export function DonationForm({ causes, initialCause, heading, config, allowCauseChoice = false, compact = false }: {
  causes: DonationCause[]; initialCause: string; heading?: string; config: Config; allowCauseChoice?: boolean; compact?: boolean;
}) {
  const uid = useId();
  const [causeSlug, setCauseSlug] = useState(initialCause);
  const cause = causes.find((c) => c.slug === causeSlug) || causes[0];
  const [interval, setInterval] = useState<DonationInterval>('once');
  const options = useMemo(() => {
    if (cause?.impactAmounts?.length) return cause.impactAmounts;
    const list = interval === 'once' ? config.renderedAmounts : config.amounts.monthly;
    return list.map((amount) => ({ amount, text: '' }));
  }, [cause, interval, config]);
  const defaultAmount = options[Math.min(1, options.length - 1)]?.amount ?? null;
  const [picked, setPicked] = useState<number | null>(defaultAmount);
  const [custom, setCustom] = useState('');
  const [error, setError] = useState('');
  const provider = getDonationProvider();

  const amount = custom ? Number(custom) : picked;
  const valid = !!amount && Number.isFinite(amount) && amount >= 2;
  const hasImpact = options.some((o) => o.text);

  function changeCause(slug: string) {
    setCauseSlug(slug);
    const next = causes.find((c) => c.slug === slug);
    const opts = next?.impactAmounts?.length ? next.impactAmounts : config.renderedAmounts.map((a) => ({ amount: a }));
    setPicked(opts[Math.min(1, opts.length - 1)]?.amount ?? null);
    setCustom('');
    setError('');
  }

  function proceed(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) { setError('Please choose or enter an amount of $2 or more.'); return; }
    const url = provider.checkoutUrl({ causeSlug: cause.slug, amount: amount!, interval, currency: config.currency });
    if (url) window.location.assign(url);
  }

  return (
    <form className={`donate-panel${compact ? ' donate-panel--compact' : ''}`} onSubmit={proceed} noValidate aria-labelledby={`${uid}-h`}>
      <h2 id={`${uid}-h`} className="donate-panel__title">{heading || `Donate to ${cause?.name}`}</h2>
      <p className="donate-panel__step">Step 1 of 3 · Choose your gift</p>

      {allowCauseChoice ? (
        <div className="field">
          <label htmlFor={`${uid}-cause`}>I’d like to support</label>
          <select id={`${uid}-cause`} value={causeSlug} onChange={(e) => changeCause(e.target.value)}>
            {causes.filter((c) => c.isGeneralFund).map((c) => <option key={c.slug} value={c.slug}>Where it’s needed most: all causes</option>)}
            {causes.filter((c) => !c.isGeneralFund).map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
          </select>
        </div>
      ) : null}

      <div className="segmented" role="group" aria-label="Donation frequency">
        {(['once', 'monthly'] as const).map((iv, i) => (
          <button key={iv} type="button" aria-pressed={interval === iv} onClick={() => { setInterval(iv); if (!hasImpact) { setPicked(null); setCustom(''); } }}>{config.intervals[i]}</button>
        ))}
      </div>

      {hasImpact ? (
        <fieldset className="impact-options">
          <legend className="visually-hidden">Choose an amount</legend>
          {options.map((o) => (
            <label key={o.amount} className="impact-option" data-selected={!custom && picked === o.amount}>
              <input type="radio" name={`${uid}-amt`} checked={!custom && picked === o.amount} onChange={() => { setPicked(o.amount); setCustom(''); setError(''); }} />
              <span className="impact-option__amount">{fmt(o.amount)}</span>
              <span className="impact-option__text">{o.text}</span>
            </label>
          ))}
        </fieldset>
      ) : (
        <div className="amounts" role="group" aria-label="Donation amount">
          {options.map((o) => (
            <button key={o.amount} type="button" aria-pressed={!custom && picked === o.amount} onClick={() => { setPicked(o.amount); setCustom(''); setError(''); }}>
              {fmt(o.amount)}
            </button>
          ))}
        </div>
      )}

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

      <p className="match-note" aria-live="polite">
        <span className="match-note__badge" aria-hidden="true">×2</span>
        <span>{valid && interval === 'once'
          ? <>Matched dollar for dollar: your {fmt(amount!)} becomes <strong>{fmt(amount! + Math.min(amount!, MATCH_CAP))}</strong>.</>
          : valid
            ? <>Matched dollar for dollar each month, up to {fmt(MATCH_CAP)} a year.</>
            : <>Every gift is matched dollar for dollar.</>}</span>
      </p>

      {provider.id === 'none' ? (
        <p className="donate-panel__note">Online donations are currently unavailable. Please contact us to donate.</p>
      ) : (
        <button type="submit" className="btn btn--primary btn--block">
          {valid ? `Donate ${fmt(amount!)}${interval === 'monthly' ? ' monthly' : ''}` : 'Continue to donate'}
        </button>
      )}
      <p className="donate-panel__methods">
        <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1a5 5 0 00-5 5v4H6a2 2 0 00-2 2v9a2 2 0 002 2h12a2 2 0 002-2v-9a2 2 0 00-2-2h-1V6a5 5 0 00-5-5zm-3 9V6a3 3 0 016 0v4H9z" /></svg>
        {' '}Next, you’ll add your details and pay securely. Gifts over $2 are tax deductible. Accepts {config.paymentMethods.slice(0, 4).join(', ')} and more.
      </p>
    </form>
  );
}
