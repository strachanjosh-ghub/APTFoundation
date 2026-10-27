import Link from 'next/link';
import type { Cause } from '@/lib/schemas';
import { excerpt } from '@/lib/content';
import { Img } from './blocks/primitives';

/** Cause card. Reproduces the source listing: logo, name and the first 100 characters of the cause quote. */
export function CauseCard({ cause }: { cause: Cause }) {
  return (
    <Link href={cause.path} className="card">
      <div className="card__media card__media--logo"><Img asset={cause.logo} alt="" /></div>
      <div className="card__body">
        <h3 className="card__title">{cause.name}</h3>
        {cause.region ? <span className="card__meta">{cause.region}</span> : null}
        <p className="card__text">{excerpt(cause.quote, 100)}</p>
      </div>
    </Link>
  );
}
