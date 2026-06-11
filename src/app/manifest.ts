import type { MetadataRoute } from 'next';
import { getPlatformBrand } from '@/lib/platform-brand';

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const brand = await getPlatformBrand();
  return {
    name: brand.name,
    short_name: brand.name,
    description: brand.description || undefined,
    start_url: '/',
    display: 'standalone',
    background_color: '#0f172a',
    theme_color: '#6366f1',
    orientation: 'portrait',
    icons: [
      { src: '/icon', sizes: '32x32', type: 'image/png', purpose: 'any' },
      { src: '/apple-icon', sizes: '180x180', type: 'image/png', purpose: 'any' },
    ],
    categories: ['education', 'productivity', 'business'],
    lang: 'pt',
  };
}
