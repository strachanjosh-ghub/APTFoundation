import type { ContentBlock } from '@/lib/schemas';
import { getArticles, getCause, getCauses, getSite, excerpt, formatDate } from '@/lib/content';
import { Ctas, Html, Img, SmartLink, looksLikeLogo } from './primitives';
import { NewsFeed } from '../NewsFeed';
import { ContactForm } from '../ContactForm';
import { DonationForm } from '../DonationForm';
import { CauseCard } from '../CauseCard';

function videoEmbed(url: string): string | null {
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}?dnt=1`;
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/);
  if (yt) return `https://www.youtube-nocookie.com/embed/${yt[1]}`;
  return null;
}

export function Block({ block }: { block: ContentBlock }) {
  const id = block.anchor;
  switch (block.type) {
    case 'hero':
      return null; // page-level hero is rendered by the template
    case 'richText':
      return (
        <section className="section" id={id}>
          <div className="container prose">
            <Html html={block.html} />
            <Ctas ctas={block.ctas} />
          </div>
        </section>
      );
    case 'mediaText':
      return (
        <section className="section" id={id}>
          <div className={`container media-text media-text--${block.imagePosition}`}>
            <div>
              <Html html={block.html} />
              <Ctas ctas={block.ctas} />
            </div>
            <div className="media-text__media">
              {block.images.map((img) => {
                const el = <Img key={img.src} asset={img} className={looksLikeLogo(img.src) ? 'is-logo' : undefined} />;
                return img.href ? <SmartLink key={img.src} href={img.href} aria-label={img.alt || 'Visit website'}>{el}</SmartLink> : el;
              })}
            </div>
          </div>
        </section>
      );
    case 'imageBand':
      return <div className="image-band-wrap" id={id}><Img asset={block.image} className="image-band" alt="" /></div>;
    case 'logoGrid':
      return (
        <section className="section" id={id}>
          <div className="container">
            {block.heading ? <h2 className="center">{block.heading}</h2> : null}
            <ul className="logo-grid">
              {block.items.map((it) => (
                <li key={it.label} className="logo-grid__item">
                  {it.href ? (
                    <SmartLink href={it.href} aria-label={it.label}><Img asset={it.image} alt={it.image.alt || it.label} /></SmartLink>
                  ) : (
                    <span><Img asset={it.image} alt={it.label} /></span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </section>
      );
    case 'cardGrid':
      return (
        <section className="section" id={id}>
          <div className="container">
            {block.heading ? <h2>{block.heading}</h2> : null}
            <ul className="card-grid">
              {block.items.map((c) => (
                <li key={c.title}>
                  <div className="card">
                    {c.image ? <div className="card__media"><Img asset={c.image} /></div> : null}
                    <div className="card__body">
                      <h3 className="card__title">{c.href ? <SmartLink href={c.href}>{c.title}</SmartLink> : c.title}</h3>
                      {c.html ? <Html html={c.html} className="card__text" /> : null}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      );
    case 'steps':
      return (
        <section className="section section--alt" id={id}>
          <div className="container">
            <ol className="steps">
              {block.items.map((s) => (
                <li key={s.title}>
                  <Img asset={s.image} alt="" />
                  <h3>{s.title}</h3>
                  <Html html={s.html} />
                </li>
              ))}
            </ol>
          </div>
        </section>
      );
    case 'cta':
      return (
        <section className="section center" id={id}>
          <div className="container prose">
            {block.html ? <Html html={block.html} /> : null}
            <Ctas ctas={block.ctas} center />
          </div>
        </section>
      );
    case 'gallery':
      return (
        <section className="section" id={id}>
          <div className="container card-grid">{block.images.map((img) => <Img key={img.src} asset={img} />)}</div>
        </section>
      );
    case 'video': {
      const src = videoEmbed(block.url);
      return (
        <section className="section" id={id}>
          <div className="container">
            {src ? (
              <div className="video"><iframe src={src} title={block.title} loading="lazy" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen /></div>
            ) : (
              <p className="center"><a href={block.url}>{block.title}</a></p>
            )}
          </div>
        </section>
      );
    }
    case 'accordion':
    case 'faq': {
      const items = block.type === 'faq' ? block.items.map((i) => ({ title: i.question, html: i.html })) : block.items;
      return (
        <section className="section" id={id}>
          <div className="container prose faq">
            {items.map((it) => (
              <details key={it.title}>
                <summary>{it.title}</summary>
                <Html html={it.html} className="faq__answer" />
              </details>
            ))}
          </div>
        </section>
      );
    }
    case 'statistics':
      return (
        <section className="section" id={id}>
          <ul className="container stats">{block.items.map((s) => <li key={s.label}><strong>{s.value}</strong>{s.label}</li>)}</ul>
        </section>
      );
    case 'quote':
      return (
        <section className="section" id={id}>
          <figure className="container prose">
            <blockquote className="quote"><Html html={block.html} /></blockquote>
            {block.cite ? <figcaption>— {block.cite}</figcaption> : null}
          </figure>
        </section>
      );
    case 'relatedContent': {
      const arts = getArticles().filter((a) => block.refs.includes(a.id));
      if (!arts.length) return null;
      return (
        <section className="section" id={id}>
          <div className="container">
            {block.heading ? <h2>{block.heading}</h2> : null}
            <ul className="card-grid">{arts.map((a) => <li key={a.id}><SmartLink href={a.path} className="card"><div className="card__body"><h3 className="card__title">{a.title}</h3><span className="card__meta">{formatDate(a.publishedDate)}</span></div></SmartLink></li>)}</ul>
          </div>
        </section>
      );
    }
    case 'donationCta': {
      const site = getSite();
      const cause = block.causeId ? getCause(block.causeId) : undefined;
      return (
        <section className="section center" id={id}>
          <Ctas ctas={[{ label: block.label || site.globalCtas.donate.label, href: cause?.path || site.globalCtas.donate.href }]} center />
        </section>
      );
    }
    case 'donationForm': {
      const site = getSite();
      const cause = getCause(block.causeId);
      return (
        <section className="section" id={id || 'donate'}>
          <div className="container" style={{ maxWidth: '34rem' }}>
            <DonationForm causeSlug={block.causeId} causeName={cause?.name || ''} heading={block.heading || cause?.donationHeading} config={site.donation} />
          </div>
        </section>
      );
    }
    case 'embed':
      return <section className="section" id={id}><div className="container"><Html html={block.html} /></div></section>;
    case 'partnerBrands': {
      const site = getSite();
      return (
        <section className="brands" id={id} aria-label="APT Travel Group brands">
          <div className="container">
            <ul>
              {site.partnerBrands.map((b) => (
                <li key={b.href}><SmartLink href={b.href} aria-label={b.name}><Img asset={b.image} alt={b.name} /></SmartLink></li>
              ))}
            </ul>
          </div>
        </section>
      );
    }
    case 'causeGrid': {
      const causes = getCauses();
      return (
        <section className="section" id={id}>
          <div className="container">
            {block.heading ? <h2 className="center">{block.heading}</h2> : null}
            <ul className="card-grid">{causes.map((c) => <li key={c.id}><CauseCard cause={c} /></li>)}</ul>
          </div>
        </section>
      );
    }
    case 'newsFeed': {
      const items = getArticles().map((a) => ({
        id: a.id, title: a.title, path: a.path, image: a.heroImage?.src, author: a.author, date: formatDate(a.publishedDate),
        excerpt: excerpt(a.body, 200),
      }));
      return (
        <section className="section" id={id}>
          <div className="container"><NewsFeed items={items} pageSize={block.pageSize} showPagination={block.showPagination} /></div>
        </section>
      );
    }
    case 'contactForm': {
      const site = getSite();
      return (
        <section className="section" id={id}>
          <div className="container prose"><ContactForm form={site.contact.form} /></div>
        </section>
      );
    }
    default: {
      const _exhaustive: never = block;
      return _exhaustive;
    }
  }
}

export function Blocks({ blocks }: { blocks: ContentBlock[] }) {
  return <>{blocks.map((b, i) => <Block key={i} block={b} />)}</>;
}
