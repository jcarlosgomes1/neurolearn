'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/routing';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabase/config';

interface Result {
  id: string;
  content_type: 'course' | 'lesson' | 'blog_post' | 'topic' | 'social_post';
  content_id: string;
  parent_id: string | null;
  chunk_index: number;
  lang: string;
  text: string;
  metadata: Record<string, any>;
  similarity: number;
}

export function SemanticSearch({ initialQuery, locale }: { initialQuery: string; locale: string }) {
  const t = useTranslations('search');
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const TYPE_META: Record<string, { emoji: string; label: string; color: string }> = {
    course: { emoji: '🎓', label: t('type.course'), color: 'bg-purple-50 text-purple-700' },
    lesson: { emoji: '📖', label: t('type.lesson'), color: 'bg-blue-50 text-blue-700' },
    blog_post: { emoji: '📝', label: t('type.blog'), color: 'bg-emerald-50 text-emerald-700' },
  };

  async function doSearch(q: string) {
    if (!q.trim()) { setResults([]); setSearched(false); return; }
    setLoading(true);
    setSearched(true);
    try {
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/search-v1`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 'apikey': SUPABASE_ANON_KEY },
        body: JSON.stringify({
          query: q.trim(),
          content_types: ['course', 'lesson', 'blog_post'],
          limit: 20,
          min_similarity: 0.35,
        }),
      });
      const data = await resp.json();
      setResults(data?.results || []);
    } catch (e) {
      console.error('search error:', e);
      setResults([]);
    } finally { setLoading(false); }
  }

  useEffect(() => {
    if (initialQuery) doSearch(initialQuery);
  }, [initialQuery]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/search?q=${encodeURIComponent(query.trim())}` as any);
    doSearch(query);
  }

  const grouped = results.reduce<Record<string, Result[]>>((acc, r) => {
    (acc[r.content_type] ||= []).push(r);
    return acc;
  }, {});
  const order = ['course', 'lesson', 'blog_post'];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-16 pb-16">
      <div className="text-center mb-8">
        <span className="inline-block text-xs font-semibold uppercase tracking-widest text-brand-700 bg-brand-50 px-3 py-1 rounded-full mb-4">{t('badge')}</span>
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">{t('heading')}</h1>
        <p className="mt-3 text-slate-600 max-w-xl mx-auto">{t('subheading')}</p>
      </div>

      <form onSubmit={submit} className="relative">
        <input
          type="search" value={query} onChange={(e) => setQuery(e.target.value)}
          placeholder={t('placeholder')}
          className="w-full px-5 py-4 pr-32 text-lg bg-white border-2 border-slate-200 focus:border-brand-500 rounded-2xl shadow-sm outline-none transition-colors"
          autoFocus
        />
        <button type="submit" disabled={loading} className="absolute right-2 top-1/2 -translate-y-1/2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 rounded-xl">
          {loading ? '...' : t('button')}
        </button>
      </form>

      {searched && !loading && results.length === 0 && (
        <div className="text-center py-16">
          <div className="text-5xl mb-3">🤔</div>
          <p className="text-slate-700 font-medium">{t('empty_title', { q: query })}</p>
          <p className="text-sm text-slate-500 mt-1">{t('empty_desc')}</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="mt-10 space-y-8">
          {order.filter((tp) => grouped[tp]?.length).map((type) => {
            const meta = TYPE_META[type] || TYPE_META.course;
            const items = grouped[type] || [];
            return (
              <section key={type}>
                <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-2">
                  <span>{meta.emoji} {meta.label}</span>
                  <span className="text-slate-300">·</span>
                  <span className="text-slate-400 normal-case font-medium">{t('results', { n: items.length })}</span>
                </h2>
                <div className="space-y-3">
                  {items.map((r) => <ResultCard key={r.id} r={r} locale={locale} typeMeta={TYPE_META} />)}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ResultCard({ r, locale, typeMeta }: { r: Result; locale: string; typeMeta: Record<string, { emoji: string; label: string; color: string }> }) {
  const t = useTranslations('search');
  const meta = typeMeta[r.content_type] || typeMeta.course;
  const title = r.metadata?.title || r.metadata?.lesson_title || r.metadata?.course_title || r.content_id;
  const subtitle = r.metadata?.course_title && r.metadata?.module_title
    ? `${r.metadata.course_title} › ${r.metadata.module_title}`
    : r.metadata?.category || '';
  const excerpt = r.text.slice(0, 220).trim() + (r.text.length > 220 ? '…' : '');
  const simPct = Math.round(r.similarity * 100);

  let href = '#';
  if (r.content_type === 'course') href = `/cursos/${r.content_id}`;
  else if (r.content_type === 'blog_post') href = `/blog/${r.metadata?.slug || r.content_id}`;
  else if (r.content_type === 'lesson' && r.parent_id) {
    const mod = Math.floor((r.chunk_index || 0) / 100);
    const les = (r.chunk_index || 0) % 100;
    href = `/learn/curso/${r.parent_id}/aula/${mod}/${les}`;
  }

  const simColor = simPct >= 70 ? 'bg-emerald-100 text-emerald-700' : simPct >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600';

  return (
    <Link href={href as any} className="group block bg-white border border-slate-200 hover:border-brand-300 hover:shadow-md rounded-xl p-4 sm:p-5 transition-all">
      <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
        <div className="min-w-0 flex-1">
          <span className={`inline-block text-[10px] font-bold uppercase tracking-wider ${meta.color} px-2 py-0.5 rounded-full mb-1.5`}>{meta.emoji} {meta.label}</span>
          <h3 className="font-bold text-slate-900 text-base sm:text-lg leading-snug group-hover:text-brand-700 line-clamp-2">{title}</h3>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        <span className={`flex-shrink-0 text-[11px] font-bold tabular-nums px-2 py-1 rounded-full ${simColor}`}>{t('match', { pct: simPct })}</span>
      </div>
      <p className="text-sm text-slate-600 leading-relaxed line-clamp-2">{excerpt}</p>
    </Link>
  );
}
