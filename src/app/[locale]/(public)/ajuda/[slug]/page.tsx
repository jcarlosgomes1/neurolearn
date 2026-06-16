import { notFound } from 'next/navigation';
import { Link } from '@/i18n/routing';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { Markdown } from '@/components/shared/Markdown';
import { seoMetadata } from '@/lib/seo';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export const revalidate = 600;

type Article = { slug: string; lang: string; category: string; title: string; body_md: string; updated_at: string };
type Row = { category: string; slug: string; title: string; sort: number };

async function getArticle(slug: string, locale: string): Promise<Article | null> {
  const sb = await createClient();
  const { data } = await sb.rpc('nl_help_article_get', { p_slug: slug, p_lang: locale });
  const rows = (data as Article[]) || [];
  return rows[0] || null;
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const a = await getArticle(slug, locale);
  const title = a ? `${a.title} · NeuroLearn` : 'Centro de ajuda · NeuroLearn';
  return seoMetadata('marketing', 'ajuda', locale, { title });
}

export default async function Page({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const t = await getTranslations();
  const a = await getArticle(slug, locale);
  if (!a) notFound();

  const sb = await createClient();
  const { data: catData } = await sb.rpc('nl_help_articles_by_cat', { p_lang: locale });
  const related = ((catData as Row[]) || []).filter((r) => r.category === a.category && r.slug !== a.slug).slice(0, 4);

  const updated = new Date(a.updated_at).toLocaleDateString(locale);

  return (
    <main className="bg-white min-h-screen">
      <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <Link href={'/ajuda' as any} className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
          <ArrowLeft className="h-4 w-4" /> {t('help.back')}
        </Link>

        <header className="mt-6">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">{a.title}</h1>
          <p className="mt-2 text-xs text-slate-400">{t('help.updated')} · {updated}</p>
        </header>

        <div className="mt-8">
          <Markdown source={a.body_md} className="prose prose-slate max-w-none" />
        </div>

        {related.length > 0 && (
          <section className="mt-14 border-t border-slate-200 pt-8">
            <h2 className="text-lg font-bold text-slate-900 mb-4">{t('help.related')}</h2>
            <ul className="space-y-2">
              {related.map((r) => (
                <li key={r.slug}>
                  <Link href={`/ajuda/${r.slug}` as any} className="text-sm text-slate-600 hover:text-slate-900 inline-flex items-center gap-1.5 hover:gap-2 transition-all">
                    <ArrowRight className="h-3.5 w-3.5 text-slate-400" /> {r.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </article>
    </main>
  );
}
