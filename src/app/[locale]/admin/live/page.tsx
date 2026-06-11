import { createClient } from '@/lib/supabase/server';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { Link } from '@/i18n/routing';
import { redirect } from 'next/navigation';
import { Video, Users } from 'lucide-react';

export const dynamic = 'force-dynamic';

type S = {
  id: string; course_id: string | null; title: string | null; description: string | null;
  starts_at: string | null; ends_at: string | null; status: string | null;
  meeting_url: string | null; recording_url: string | null;
  attendees_count: number | null; attendees_max: number | null;
};

function fmt(d: string | null) { return d ? new Date(d).toLocaleString() : '-'; }

export default async function Page() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect('/auth/login?next=/admin/live');
  const { data: profile } = await sb.from('nl_profiles').select('role').eq('id', user.id).single();
  if (!profile || !['admin', 'super_admin'].includes(profile.role)) redirect('/');

  const { data: enabled } = await sb.rpc('nl_is_feature_enabled', { p_key: 'live_sessions' });
  const res = enabled
    ? await sb.from('nl_live_sessions').select('id, course_id, title, description, starts_at, ends_at, status, meeting_url, recording_url, attendees_count, attendees_max').order('starts_at', { ascending: false }).limit(200)
    : { data: [] };
  const sessions = (Array.isArray(res.data) ? res.data : []) as unknown as S[];

  const now = Date.now();
  const upcoming = sessions.filter((s) => s.starts_at && new Date(s.starts_at).getTime() >= now);
  const past = sessions.filter((s) => !s.starts_at || new Date(s.starts_at).getTime() < now);

  const render = (list: S[]) =>
    list.map((s) => (
      <div key={s.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-slate-900">{s.title ?? 'Sessao'}</span>
              {s.status ? <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] uppercase text-slate-500">{s.status}</span> : null}
            </div>
            <div className="mt-1 text-xs text-slate-400">{s.course_id} · {fmt(s.starts_at)}</div>
            {s.description ? <p className="mt-1.5 text-sm text-slate-600">{s.description}</p> : null}
          </div>
          <div className="shrink-0 text-right text-xs text-slate-500">
            <div className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {s.attendees_count ?? 0}</div>
            {s.meeting_url ? <div className="mt-1"><a href={s.meeting_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-violet-600 hover:underline"><Video className="h-3.5 w-3.5" /> Sala</a></div> : null}
            {s.recording_url ? <div className="mt-1"><a href={s.recording_url} target="_blank" rel="noreferrer" className="text-slate-500 hover:underline">Gravacao</a></div> : null}
          </div>
        </div>
      </div>
    ));

  return (
    <div>
      <AdminPageHeader
        backHref="/admin"
        emoji="🔴"
        eyebrow="Aprendizagem · Sessões ao vivo"
        title="Sessões ao Vivo"
        description="Aulas síncronas agendadas, salas e presenças."
      />
      {!enabled ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Funcionalidade desativada. Ativa em{' '}
          <Link href={'/admin/features' as any} className="font-semibold underline">Funcionalidades</Link>.
        </div>
      ) : (
        <div className="space-y-6">
          <div>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Proximas ({upcoming.length})</h2>
            <div className="space-y-3">{upcoming.length ? render(upcoming) : <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">Sem sessoes agendadas.</div>}</div>
          </div>
          {past.length > 0 ? (
            <div>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Passadas ({past.length})</h2>
              <div className="space-y-3">{render(past)}</div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
