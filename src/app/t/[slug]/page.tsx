import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCause, getCauses, getDonationCauses, getSite } from '@/lib/content';
import { Html, Img } from '@/components/blocks/primitives';
import { Blocks } from '@/components/blocks/BlockRenderer';
import { DonationForm } from '@/components/DonationForm';
import { CauseCard } from '@/components/CauseCard';
import { buildMetadata } from '@/lib/seo';

type Props = { params: Promise<{ slug: string }> };
export const dynamicParams = false;
export const generateStaticParams = () => getCauses().map((c) => ({ slug: c.slug }));

export async function generateMetadata({ params }: Props) {
  const c = getCause((await params).slug);
  return c ? buildMetadata({ title: c.seo.title, description: c.seo.description, path: c.path, image: c.heroImage?.src || c.logo?.src }) : {};
}

/** Individual cause template (source route /t/:id). */
export default async function CausePage({ params }: Props) {
  const cause = getCause((await params).slug);
  if (!cause) notFound();
  const site = getSite();
  const others = getCauses().filter((c) => !c.isGeneralFund && c.slug !== cause.slug);
  const start = others.length ? (cause.order * 3) % others.length : 0;
  const related = [...others.slice(start), ...others.slice(0, start)].slice(0, 3);
  return (
    <article>
      <section className="hero hero--cause" aria-labelledby="page-title">
        {cause.heroImage ? <Img asset={cause.heroImage} className="hero__bg" eager alt="" /> : null}
        <div className="hero__overlay" aria-hidden="true" />
        <div className="container">
          <div className="hero__content">
            <nav className="breadcrumbs" aria-label="Breadcrumb">
              <ol><li><Link href="/">Home</Link></li><li><Link href="/causes">Causes</Link></li></ol>
            </nav>
            {cause.region ? <p className="hero__eyebrow">{cause.region}</p> : null}
            <h1 id="page-title">{cause.name}</h1>
            {cause.quote ? <p className="hero__quote">{cause.quote.trim()}</p> : null}
            <div className="btn-row"><a href="#donate" className="btn btn--primary btn--on-dark">Donate now</a></div>
          </div>
        </div>
      </section>

      <div className="section">
        <div className="container cause-layout">
          <div className="cause-body">
            <Html html={cause.description} />
          </div>
          <aside className="cause-aside" id="donate" aria-label={`Donate to ${cause.name}`}>
            {cause.logo ? <div className="cause-aside__logo"><Img asset={cause.logo} alt={`${cause.name} logo`} /></div> : null}
            <DonationForm causes={getDonationCauses()} initialCause={cause.slug} heading={cause.donationHeading} config={site.donation} />
            <Html html={site.donation.matchingStatementHtml} className="donate-panel__note donate-panel__fineprint" />
          </aside>
        </div>
      </div>

      <Blocks blocks={cause.contentBlocks} />
      {cause.footerImage ? (
        <div className="container"><Img asset={cause.footerImage} className="cause-photo" alt="" /></div>
      ) : null}

      {related.length ? (
        <section className="section section--alt" aria-labelledby="more-causes">
          <div className="container">
            <h2 id="more-causes" className="center">More causes to support</h2>
            <ul className="cause-grid">{related.map((c) => <li key={c.id}><CauseCard cause={c} /></li>)}</ul>
          </div>
        </section>
      ) : null}
      <Blocks blocks={[{ type: 'partnerBrands' }]} />

      <div className="mobile-donate" aria-hidden="false">
        <a href="#donate" className="btn btn--primary btn--block">Donate to {cause.name}</a>
      </div>
    </article>
  );
}
