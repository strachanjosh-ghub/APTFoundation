import { notFound } from 'next/navigation';
import { getPageByPath, getPages } from '@/lib/content';
import { PageTemplate } from '@/components/PageTemplate';
import { buildMetadata } from '@/lib/seo';

type Props = { params: Promise<{ slug: string[] }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return getPages().filter((p) => p.path !== '/').map((p) => ({ slug: p.path.slice(1).split('/') }));
}

const pathOf = async (params: Props['params']) => '/' + (await params).slug.map(decodeURIComponent).join('/');

export async function generateMetadata({ params }: Props) {
  const path = await pathOf(params);
  const page = getPageByPath(path);
  if (!page) return {};
  return buildMetadata({ title: page.seo.title, description: page.seo.description, path: page.path, image: page.seo.ogImage || page.hero?.backgroundImage?.src, noindex: page.seo.noindex });
}

export default async function ContentPage({ params }: Props) {
  const page = getPageByPath(await pathOf(params));
  if (!page) notFound();
  return <PageTemplate page={page} />;
}
