import Link from 'next/link';
import { brand } from '@config/brand';

/** Brand mark. Renders the supplied logo when configured, otherwise a text wordmark. */
export function Wordmark({ reversed = false }: { reversed?: boolean }) {
  const logo = reversed ? brand.logoReversed ?? brand.logo : brand.logo;
  return (
    <Link href="/" className="wordmark" aria-label={`${brand.name} home`}>
      {logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logo.src} alt={logo.alt} width={logo.width} height={logo.height} />
      ) : (
        <>
          {brand.name}
          {brand.tagline ? <small>{brand.tagline}</small> : null}
        </>
      )}
    </Link>
  );
}
