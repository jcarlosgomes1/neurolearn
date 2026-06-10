'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from '@/i18n/routing';
import { toast } from 'sonner';
import { Users, Clock, GraduationCap, ArrowRight, Loader2, Check } from 'lucide-react';

interface OrgMarketplaceCourse {
  org_course_id: string; course_id: string; title: string; subtitle: string;
  cover_url: string; emoji: string; level: string; duration_hours: number;
  seats_available: number; enrolled: boolean;
}

export function EmpresaCursosClient({ items }: { items: OrgMarketplaceCourse[] }) {
  const t = useTranslations();
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function enroll(item: OrgMarketplaceCourse) {
    setBusy(item.org_course_id);
    try {
      const sb = createClient();
      const { error } = await sb.rpc('nl_my_org_marketplace_enroll', { p_org_course_id: item.org_course_id });
      if (error) throw error;
      toast.success(t('org.ec.enrolled', { title: item.title }));
      router.push({ pathname: '/curso/[id]', params: { id: item.course_id } } as any);
    } catch (e: any) {
      const msg = e?.message || t('tea.error');
      if (msg.includes('seats_full')) toast.error(t('org.ec.no_seats'));
      else toast.error(msg);
    } finally { setBusy(null); }
  }

  if (items.length === 0) {
    return (
      <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 border-2 border-dashed border-emerald-200 rounded-2xl p-10 text-center">
        <div className="inline-flex h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white items-center justify-center shadow-lg mb-3">
          <GraduationCap className="h-7 w-7" />
        </div>
        <h2 className="font-bold text-slate-900 text-lg">{t('org.ec.empty_h')}</h2>
        <p className="text-sm text-slate-600 mt-1.5 max-w-md mx-auto leading-relaxed">
          {t('org.ec.empty_p')}
        </p>
      </div>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((it) => (
        <article key={it.org_course_id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all">
          {it.cover_url ? (
            <img src={it.cover_url} alt="" className="h-32 w-full object-cover" />
          ) : (
            <div className="h-32 bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-4xl text-white">{it.emoji}</div>
          )}
          <div className="p-4">
            <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              {it.level && <span>{it.level}</span>}
              {it.duration_hours > 0 && <><span>·</span><span className="inline-flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{it.duration_hours}h</span></>}
            </div>
            <h3 className="font-bold text-slate-900 text-base leading-snug">{it.title}</h3>
            {it.subtitle && <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{it.subtitle}</p>}
            <div className="mt-3 flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                <Users className="h-3 w-3" /> {it.seats_available > 0 ? t('org.ec.seats', { count: it.seats_available }) : t('org.ec.no_seats_badge')}
              </span>
              {it.enrolled ? (
                <Link href={{ pathname: '/curso/[id]', params: { id: it.course_id } } as any}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-lg hover:bg-emerald-200">
                  <Check className="h-3 w-3" /> {t('org.ec.enrolled_continue')} <ArrowRight className="h-3 w-3" />
                </Link>
              ) : (
                <button onClick={() => enroll(it)} disabled={busy === it.org_course_id || it.seats_available === 0}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-br from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-semibold rounded-lg shadow-sm disabled:opacity-40">
                  {busy === it.org_course_id ? <Loader2 className="h-3 w-3 animate-spin" /> : null} {t('org.ec.enroll_btn')}
                </button>
              )}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
