import type { Metadata } from 'next';
import { brand } from '@config/brand';

export function buildMetadata({ title, description, path, image, noindex }: { title: string; description?: string; path: string; image?: string; noindex?: boolean }): Metadata {
  return {
    title: path === '/' ? { absolute: brand.name } : title,
    description,
    alternates: { canonical: path },
    openGraph: { title, description, url: path, images: image ? [image] : undefined },
    robots: noindex ? { index: false, follow: true } : undefined,
  };
}
