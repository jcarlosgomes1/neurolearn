import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'NeuroLearn',
    short_name: 'NeuroLearn',
    description: 'Plataforma global de cursos com IA. Forma a tua equipa, sem fricção.',
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
