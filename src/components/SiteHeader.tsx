'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Wordmark } from './Wordmark';

type NavItem = { title: string; href: string; children: { title: string; href: string }[] };

const samePath = (a: string, b: string) => a.split('#')[0].toLowerCase() === b.split('#')[0].toLowerCase();

export function SiteHeader({ navigation, donate }: { navigation: NavItem[]; donate: { label: string; href: string } }) {
  const pathname = usePathname() || '/';
  const [menuOpen, setMenuOpen] = useState(false);
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => { setMenuOpen(false); setOpenIdx(null); }, [pathname]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setOpenIdx(null); setMenuOpen(false); } };
    const onClick = (e: MouseEvent) => { if (navRef.current && !navRef.current.contains(e.target as Node)) setOpenIdx(null); };
    document.addEventListener('keydown', onKey);
    document.addEventListener('click', onClick);
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('click', onClick); };
  }, []);

  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <Wordmark />
        <button className="nav-toggle" aria-expanded={menuOpen} aria-controls="primary-nav" onClick={() => setMenuOpen((v) => !v)}>
          <span className="visually-hidden">{menuOpen ? 'Close menu' : 'Open menu'}</span>
          <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {menuOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M3 6h18M3 12h18M3 18h18" />}
          </svg>
        </button>
        <nav id="primary-nav" ref={navRef} className="nav" aria-label="Primary" data-open={menuOpen}>
          <ul className="nav__list">
            {navigation.map((item, i) => {
              const active = samePath(pathname, item.href) || item.children.some((c) => samePath(pathname, c.href));
              if (!item.children.length) {
                return (
                  <li key={item.href} className={`nav__item${active ? ' nav__item--active' : ''}`}>
                    <Link className="nav__link" href={item.href} aria-current={samePath(pathname, item.href) ? 'page' : undefined}>{item.title}</Link>
                  </li>
                );
              }
              const subId = `subnav-${i}`;
              return (
                <li key={item.href} className={`nav__item${active ? ' nav__item--active' : ''}`}>
                  <button className="nav__link" aria-expanded={openIdx === i} aria-controls={subId} onClick={(e) => { e.stopPropagation(); setOpenIdx(openIdx === i ? null : i); }}>
                    {item.title}
                    <svg className="nav__chevron" aria-hidden="true" viewBox="0 0 12 12"><path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.6" fill="none" /></svg>
                  </button>
                  <ul id={subId} className="nav__sub" data-open={openIdx === i}>
                    <li><Link href={item.href} aria-current={samePath(pathname, item.href) ? 'page' : undefined}>{item.title}</Link></li>
                    {item.children.map((c) => (
                      <li key={c.href}><Link href={c.href} aria-current={samePath(pathname, c.href) && !c.href.includes('#') ? 'page' : undefined}>{c.title}</Link></li>
                    ))}
                  </ul>
                </li>
              );
            })}
          </ul>
          <Link href={donate.href} className="btn btn--primary nav__donate">{donate.label}</Link>
        </nav>
      </div>
    </header>
  );
}
