'use client';
import { useState } from 'react';
import type { Site } from '@/lib/schemas';

type Form = Site['contact']['form'];
type Status = { kind: 'idle' } | { kind: 'sending' } | { kind: 'success' } | { kind: 'error'; message: string };

/**
 * Contact form. Fields, labels and placeholders are the original site's.
 * Validation mirrors the source: only "Your Full Name" is required (the email
 * and message labels say "(required)" but the original form did not enforce
 * them — recorded in docs/MISSING-CONTENT.md for a business decision).
 * Email format is validated when supplied.
 */
export function ContactForm({ form }: { form: Form }) {
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget).entries()) as Record<string, string>;
    const errs: Record<string, string> = {};
    for (const f of form.fields) {
      const v = (data[f.name] || '').trim();
      if (f.required && !v) errs[f.name] = 'This field is required.';
      if (f.type === 'email' && v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) errs[f.name] = 'Please enter a valid email address.';
    }
    setErrors(errs);
    if (Object.keys(errs).length) {
      const first = form.fields.find((f) => errs[f.name]);
      if (first) document.getElementById(`cf-${first.name}`)?.focus();
      return;
    }
    setStatus({ kind: 'sending' });
    try {
      const res = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Your message could not be sent.');
      setStatus({ kind: 'success' });
      e.currentTarget?.reset();
    } catch (err) {
      setStatus({ kind: 'error', message: (err as Error).message });
    }
  }

  if (status.kind === 'success') {
    return <div className="notice notice--success" role="status">{form.successMessage}</div>;
  }

  return (
    <form onSubmit={onSubmit} noValidate aria-label="Contact form">
      {status.kind === 'error' ? <div className="notice notice--error" role="alert">{status.message}</div> : null}
      {/* honeypot */}
      <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px' }}>
        <label htmlFor="cf-website">Website</label>
        <input id="cf-website" name="_gotcha" tabIndex={-1} autoComplete="off" />
      </div>
      {form.fields.map((f) => {
        const err = errors[f.name];
        const common = {
          id: `cf-${f.name}`, name: f.name, placeholder: f.placeholder, required: f.required,
          'aria-invalid': err ? true : undefined, 'aria-describedby': err ? `cf-${f.name}-err` : undefined,
          autoComplete: f.type === 'email' ? 'email' : f.type === 'tel' ? 'tel' : f.name === 'fullname' ? 'name' : undefined,
        } as const;
        return (
          <div className="field" key={f.name}>
            <label htmlFor={`cf-${f.name}`}>{f.label}</label>
            {f.type === 'textarea' ? <textarea {...common} /> : <input type={f.type} {...common} />}
            {err ? <span className="field__error" id={`cf-${f.name}-err`}>{err}</span> : null}
          </div>
        );
      })}
      <button type="submit" className="btn btn--primary" disabled={status.kind === 'sending'}>
        {status.kind === 'sending' ? 'Sending…' : form.submitLabel}
      </button>
    </form>
  );
}
