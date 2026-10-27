import type { Hero as HeroT } from '@/lib/schemas';
import { Ctas, Html, Img } from './blocks/primitives';

export function Hero({ hero, children }: { hero: HeroT; children?: React.ReactNode }) {
  return (
    <section className="hero" aria-labelledby="page-title">
      {hero.backgroundImage ? <Img asset={hero.backgroundImage} className="hero__bg" eager alt="" /> : null}
      <div className="hero__overlay" aria-hidden="true" />
      <div className="container">
        <div className="hero__content">
          {children}
          {hero.eyebrow ? <p className="hero__eyebrow">{hero.eyebrow}</p> : null}
          <h1 id="page-title">{hero.heading}</h1>
          {hero.html ? <Html html={hero.html} className="hero__body" /> : null}
          <Ctas ctas={hero.ctas} onDark />
        </div>
      </div>
    </section>
  );
}
