import { NextResponse } from 'next/server';
import { z } from 'zod';

/**
 * Contact form handler. Validates server-side and forwards to the configured
 * form backend (the source site used Formspree). Set CONTACT_FORM_ENDPOINT.
 */
const Body = z.object({
  fullname: z.string().trim().min(1).max(200),
  _replyto: z.union([z.literal(''), z.string().trim().email().max(320)]).optional(),
  phone: z.string().trim().max(50).optional(),
  message: z.string().trim().max(5000).optional(),
  _gotcha: z.string().optional(),
});

export async function POST(req: Request) {
  let json: unknown;
  try { json = await req.json(); } catch { return NextResponse.json({ error: 'Invalid request.' }, { status: 400 }); }
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'Please check the form and try again.' }, { status: 422 });
  const data = parsed.data;
  if (data._gotcha) return NextResponse.json({ ok: true }); // bot honeypot: accept silently

  const endpoint = process.env.CONTACT_FORM_ENDPOINT;
  if (!endpoint) {
    return NextResponse.json({ error: 'The contact form is not configured yet. Please email us directly.' }, { status: 503 });
  }
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ fullname: data.fullname, email: data._replyto, _replyto: data._replyto, phone: data.phone, message: data.message }),
  });
  if (!res.ok) return NextResponse.json({ error: 'Your message could not be sent. Please try again or email us directly.' }, { status: 502 });
  return NextResponse.json({ ok: true });
}
