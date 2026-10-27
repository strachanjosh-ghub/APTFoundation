import Link from 'next/link';
import type { Cause } from '@/lib/schemas';
import { excerpt } from '@/lib/content';
import { Img } from './blocks/primitives';

/** Cause card: photo, logo, name, region and the opening of the cause quote, with a direct donate action. */
export function CauseCard({ cause }: { cause: Cause }) {
  const photo = cause.heroImage || cause.footerImage;
  return (
    <article className="cause-card">
      <Link href={cause.path} className="cause-card__media" tabIndex={-1} aria-hidden="true">
        {photo ? <Img asset={photo} alt="" /> : null}
        {cause.logo ? <span className="cause-card__logo"><Img asset={cause.logo} alt="" /></span> : null}
      </Link>
      <div className="cause-card__body">
        {cause.region ? <p className="cause-card__region">{cause.region}</p> : null}
        <h3 className="cause-card__title"><Link href={cause.path}>{cause.name}</Link></h3>
        <p className="cause-card__text">{excerpt(cause.quote, 110)}</p>
        <div className="cause-card__actions">
          <Link href={`${cause.path}#donate`} className="btn btn--primary btn--sm" aria-label={`Donate to ${cause.name}`}>Donate</Link>
          <Link href={cause.path} className="cause-card__more" aria-label={`Learn more about ${cause.name}`}>Learn more</Link>
        </div>
      </div>
    </article>
  );
}
