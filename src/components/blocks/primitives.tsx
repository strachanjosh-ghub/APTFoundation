import Link from 'next/link';
import type { CTA, MediaAsset } from '@/lib/schemas';
import { safeHtml } from '@/lib/html';

export function Html({ html, className }: { html: string; className?: string }) {
  if (!html) return null;
  return <div className={className} dangerouslySetInnerHTML={{ __html: safeHtml(html) }} />;
}

export const isExternal = (href: string) => /^(https?:)?\/\//.test(href) || href.startsWith('mailto:') || href.startsWith('tel:');

export function SmartLink({ href, children, className, ...rest }: { href: string; children: React.ReactNode; className?: string; 'aria-label'?: string }) {
  if (isExternal(href)) {
    const web = /^https?:/.test(href);
    return <a href={href} className={className} {...(web ? { target: '_blank', rel: 'noopener noreferrer' } : {})} {...rest}>{children}{web ? <span className="visually-hidden"> (opens in a new tab)</span> : null}</a>;
  }
  return <Link href={href} className={className} {...rest}>{children}</Link>;
}

export function Ctas({ ctas, onDark = false, center = false }: { ctas?: CTA[]; onDark?: boolean; center?: boolean }) {
  if (!ctas?.length) return null;
  return (
    <div className={`btn-row${center ? ' btn-row--center' : ''}`}>
      {ctas.map((c, i) => {
        const variant = c.variant ?? (i === 0 ? 'primary' : 'secondary');
        return <SmartLink key={c.href + c.label} href={c.href} className={`btn btn--${variant}${onDark ? ' btn--on-dark' : ''}`}>{c.label}</SmartLink>;
      })}
    </div>
  );
}

export function Img({ asset, className, eager = false, alt }: { asset?: MediaAsset; className?: string; eager?: boolean; alt?: string }) {
  if (!asset) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={asset.src} alt={alt ?? asset.alt ?? ''} className={className} loading={eager ? 'eager' : 'lazy'} decoding="async" />;
}

/** Heuristic: logo/badge style images should be shown contained, not cropped. */
export const looksLikeLogo = (src: string) => /logo|acf-|gdg-|sustainable-development|roc-|eco-certified|conservation-foundation/i.test(src);
