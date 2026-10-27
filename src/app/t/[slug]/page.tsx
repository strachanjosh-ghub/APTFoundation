import { notFound } from 'next/navigation';
import { getCause, getCauses, getSite } from '@/lib/content';
import { Html, Img } from '@/components/blocks/primitives';
import { Blocks } from '@/components/blocks/BlockRenderer';
import { DonationForm } from '@/components/DonationForm';
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
  return (
    <article>
      {cause.heroImage ? <Img asset={cause.heroImage} className="image-band" eager alt="" /> : null}
      <div className="section">
        <div className="container cause-layout">
          <div>
            <h1>{cause.name}</h1>
            <Html html={cause.description} />
          </div>
          <aside className="cause-aside" aria-label={`Donate to ${cause.name}`}>
            {cause.logo ? <div className="cause-aside__logo"><Img asset={cause.logo} alt={`${cause.name} logo`} /></div> : null}
            <DonationForm causeSlug={cause.slug} causeName={cause.name} heading={cause.donationHeading} config={site.donation} />
            <Html html={site.donation.matchingStatementHtml} className="donate-panel__note" />
            {cause.quote ? <blockquote className="quote">{cause.quote.trim()}</blockquote> : null}
          </aside>
        </div>
      </div>
      <Blocks blocks={cause.contentBlocks} />
      {cause.footerImage ? <Img asset={cause.footerImage} className="image-band" alt="" /> : null}
      <Blocks blocks={[{ type: 'partnerBrands' }]} />
    </article>
  );
}
