import Link from 'next/link';
import { notFound } from 'next/navigation';
import { brand } from '@config/brand';
import { formatDate, getArticle, getArticles, getSite } from '@/lib/content';
import { Html, Img } from '@/components/blocks/primitives';
import { Blocks } from '@/components/blocks/BlockRenderer';
import { buildMetadata } from '@/lib/seo';

type Props = { params: Promise<{ slug: string }> };
export const dynamicParams = false;
export const generateStaticParams = () => getArticles().map((a) => ({ slug: a.slug }));

export async function generateMetadata({ params }: Props) {
  const a = getArticle((await params).slug);
  if (!a) return {};
  const m = buildMetadata({ title: a.seo.title, description: a.seo.description, path: a.path, image: a.heroImage?.src });
  return { ...m, openGraph: { ...m.openGraph, type: 'article', publishedTime: a.publishedDate } };
}

/**
 * News article template (source route /:profile/posts/:post). The original URL
 * structure is preserved so existing links and search results keep working.
 */
export default async function ArticlePage({ params }: Props) {
  const article = getArticle((await params).slug);
  if (!article) notFound();
  const site = getSite();
  const url = new URL(article.path, brand.siteUrl).toString();
  const enc = encodeURIComponent;
  const share = site.social.shareEnabled;
  const related = (article.relatedArticles || []).length ? [{ type: 'relatedContent' as const, heading: 'Related news', refs: article.relatedArticles! }] : [];
  return (
    <article>
      <section className="hero" aria-labelledby="page-title">
        {article.heroImage ? <Img asset={article.heroImage} className="hero__bg" eager alt="" /> : null}
        <div className="hero__overlay" aria-hidden="true" />
        <div className="container">
          <div className="hero__content">
            <nav className="breadcrumbs" aria-label="Breadcrumb">
              <ol><li><Link href="/">Home</Link></li><li><Link href="/news">News</Link></li></ol>
            </nav>
            <h1 id="page-title">{article.title.trim()}</h1>
            <p className="article-meta">
              {article.author ? <>{article.author} · </> : null}
              <time dateTime={article.publishedDate}>{formatDate(article.publishedDate)}</time>
            </p>
          </div>
        </div>
      </section>
      <div className="section">
        <div className="container prose article-body">
          {article.heroImage ? <Img asset={article.heroImage} alt={article.heroImage.alt} /> : null}
          <Html html={article.body} />
          <div className="share">
            <Link href="/news" className="btn btn--secondary">Back to News</Link>
            {share.facebook ? <a className="btn btn--secondary" href={`https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`} target="_blank" rel="noopener noreferrer">Share<span className="visually-hidden"> on Facebook (opens in a new tab)</span></a> : null}
            {share.twitter ? <a className="btn btn--secondary" href={`https://twitter.com/intent/tweet?url=${enc(url)}&text=${enc(article.title.trim())}`} target="_blank" rel="noopener noreferrer">Post<span className="visually-hidden"> on X (opens in a new tab)</span></a> : null}
            {share.email ? <a className="btn btn--secondary" href={`mailto:?subject=${enc(article.title.trim())}&body=${enc(url)}`}>Email</a> : null}
          </div>
        </div>
      </div>
      <Blocks blocks={[...related, { type: 'partnerBrands' }]} />
    </article>
  );
}
