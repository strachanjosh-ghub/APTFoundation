import { afterEach, describe, expect, it, vi } from 'vitest';
import { POST } from '@/app/api/contact/route';

const req = (body: unknown) => new Request('http://x/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

describe('contact API', () => {
  afterEach(() => { vi.unstubAllGlobals(); delete process.env.CONTACT_FORM_ENDPOINT; });

  it('rejects a submission without the required name', async () => {
    expect((await POST(req({ fullname: '' }))).status).toBe(422);
  });
  it('rejects an invalid email', async () => {
    expect((await POST(req({ fullname: 'A B', _replyto: 'nope' }))).status).toBe(422);
  });
  it('delivers to the endpoint configured in site.json by default (interim email via FormSubmit)', async () => {
    const f = vi.fn().mockResolvedValue(new Response('{}', { status: 200 })); vi.stubGlobal('fetch', f);
    expect((await POST(req({ fullname: 'A B' }))).status).toBe(200);
    expect(f.mock.calls[0][0]).toBe('https://formsubmit.co/ajax/Josh.Strachan@aptouring.com.au');
    expect(JSON.parse(f.mock.calls[0][1].body)._subject).toBe('APT Foundation website enquiry');
  });
  it('reports a delivery failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 500 })));
    expect((await POST(req({ fullname: 'A B' }))).status).toBe(502);
  });
  it('silently accepts honeypot submissions without forwarding', async () => {
    const f = vi.fn(); vi.stubGlobal('fetch', f);
    expect((await POST(req({ fullname: 'Bot', _gotcha: 'x' }))).status).toBe(200);
    expect(f).not.toHaveBeenCalled();
  });
  it('forwards valid submissions to the configured endpoint', async () => {
    process.env.CONTACT_FORM_ENDPOINT = 'https://formspree.io/f/test';
    const f = vi.fn().mockResolvedValue(new Response('{}', { status: 200 })); vi.stubGlobal('fetch', f);
    const res = await POST(req({ fullname: 'Ann Lee', _replyto: 'ann@example.com', message: 'Hi' }));
    expect(res.status).toBe(200);
    expect(f).toHaveBeenCalledWith('https://formspree.io/f/test', expect.objectContaining({ method: 'POST' }));
  });
});
