import type { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase/server';

const BASE = 'https://neurolearn-rosy.vercel.app';
const LOCALES = ['en', 'pt', 'es', 'fr'];
const STATIC_PATHS = ['', '/cursos', '/blog', '/empresas', '/candidatar', '/precos', '/talento', '/status', '/login', '/registo', '/terms', '/privacy', '/cookies'];

function alternates(path: string) {
  const languages: Record<string, string> = {};
  for (const l of LOCALES) languages[l] = `${BASE}/${l}${path}`;
  return { languages };
}

function priorityFor(path: string): number {
  if (path === '') return 1.0;
  if (path === '/cursos' || path === '/empresas' || path === '/precos') return 0.9;
  if (path === '/blog' || path === '/talento' || path === '/candidatar') return 0.8;
  if (path === '/status') return 0.5;
  return 0.6;
}

function frequencyFor(path: string): 'daily' | 'weekly' | 'monthly' | 'yearly' {
  if (path === '' || path === '/blog' || path === '/cursos') return 'weekly';
  if (path === '/status') return 'daily';
  if (path === '/terms' || path === '/privacy' || path === '/cookies') return 'yearly';
  return 'monthly';
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];
  const now = new Date();

  // Static pages × 4 locales
  for (const path of STATIC_PATHS) {
    for (const l of LOCALES) {
      entries.push({
        url: `${BASE}/${l}${path}`,
        lastModified: now,
        changeFrequency: frequencyFor(path),
        priority: priorityFor(path),
        alternates: alternates(path),
      });
    }
  }

  // Dynamic: courses + blog posts
  try {
    const sb = await createClient();
    const { data: courses } = await sb.from('nl_courses')
      .select('id, updated_at').eq('archived', false).eq('published', true);
    for (const c of (courses || []) as Array<{ id: string; updated_at: string | null }>) {
      for (const l of LOCALES) {
        entries.push({
          url: `${BASE}/${l}/curso/${c.id}`,
          lastModified: c.updated_at ? new Date(c.updated_at) : now,
          changeFrequency: 'monthly',
          priority: 0.8,
          alternates: alternates(`/curso/${c.id}`),
        });
      }
    }
    const { data: posts } = await sb.from('nl_blog_posts')
      .select('slug, source_lang, published_at, updated_at').eq('status', 'published');
    for (const p of (posts || []) as Array<{ slug: string; source_lang: string; published_at: string | null; updated_at: string | null }>) {
      for (const l of LOCALES) {
        entries.push({
          url: `${BASE}/${l}/blog/${p.slug}`,
          lastModified: p.updated_at ? new Date(p.updated_at) : (p.published_at ? new Date(p.published_at) : now),
          changeFrequency: 'monthly',
          priority: 0.6,
          alternates: alternates(`/blog/${p.slug}`),
        });
      }
    }
  } catch (e) { console.error('[sitemap] dynamic fetch failed', e); }

  return entries;
}
