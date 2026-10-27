import type { Page } from '@/lib/schemas';
import { getPages } from '@/lib/content';
import { Hero } from './Hero';
import { Blocks } from './blocks/BlockRenderer';
import Link from 'next/link';

/**
 * Generic page template. All page templates (home, about, faq, contact, donation,
 * legal, listings) share this renderer; behaviour differences come from the
 * blocks a page contains, so editors can restructure pages without code changes.
 */
export function PageTemplate({ page }: { page: Page }) {
  const parent = page.parentId ? getPages().find((p) => p.id === page.parentId) : undefined;
  const crumbs = parent ? (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <ol>
        <li><Link href="/">Home</Link></li>
        <li><Link href={parent.path}>{parent.navigationTitle || parent.title}</Link></li>
        <li aria-current="page">{page.navigationTitle || page.title}</li>
      </ol>
    </nav>
  ) : null;
  return (
    <div className={`template-${page.template}${page.template === 'legal' ? ' legal-content' : ''}`}>
      {page.hero ? <Hero hero={page.hero}>{crumbs}</Hero> : null}
      <Blocks blocks={page.contentBlocks} />
    </div>
  );
}
