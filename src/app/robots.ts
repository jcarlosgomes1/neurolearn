import type { MetadataRoute } from 'next';

const BASE = 'https://neurolearn-rosy.vercel.app';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/'],
        disallow: ['/admin', '/admin/*', '/teach', '/teach/*', '/conta', '/conta/*', '/api/*'],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  };
}
