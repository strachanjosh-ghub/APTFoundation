import Link from 'next/link';
import { brand } from '@config/brand';
import { Wordmark } from './Wordmark';

export function SiteFooter({ links }: { links: { title: string; href: string }[] }) {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="site-footer__grid">
          <nav aria-label="Footer">
            <ul className="site-footer__links">
              {links.map((l) => (
                <li key={l.href}><Link href={l.href}>{l.title}</Link></li>
              ))}
            </ul>
          </nav>
          <div className="site-footer__brand"><Wordmark reversed /></div>
        </div>
        <div className="site-footer__legal">
          <span>© {brand.copyrightHolder} {new Date().getFullYear()}</span>
        </div>
      </div>
    </footer>
  );
}
