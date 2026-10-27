import { notFound } from 'next/navigation';
import { getPageByPath } from '@/lib/content';
import { PageTemplate } from '@/components/PageTemplate';
import { buildMetadata } from '@/lib/seo';

export function generateMetadata() {
  const page = getPageByPath('/');
  return page ? buildMetadata({ title: page.seo.title, description: page.seo.description, path: '/', image: page.seo.ogImage || page.hero?.backgroundImage?.src }) : {};
}

export default function HomePage() {
  const page = getPageByPath('/');
  if (!page) notFound();
  return <PageTemplate page={page} />;
}
