import { NextResponse, type NextRequest } from 'next/server';

/**
 * Case-insensitive routing for the source site's mixed-case URLs.
 * Raisely served /Contact and /PrivacyPolicy; links in the wild use other casings.
 */
const CANONICAL = ['/Contact', '/PrivacyPolicy', '/about-us', '/faqs', '/responsible-travel', '/causes', '/news', '/donate'];
const byLower = new Map(CANONICAL.map((p) => [p.toLowerCase(), p]));

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const target = byLower.get(pathname.toLowerCase().replace(/\/$/, ''));
  if (target && target !== pathname) {
    const url = req.nextUrl.clone();
    url.pathname = target;
    return NextResponse.redirect(url, 308);
  }
  return NextResponse.next();
}

export const config = { matcher: ['/((?!_next|media|api|.*\\..*).*)'] };
