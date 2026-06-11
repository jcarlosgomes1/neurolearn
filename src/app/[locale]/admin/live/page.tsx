import { createClient } from '@/lib/supabase/server';
import { Link } from '@/i18n/routing';
import { redirect } from 'next/navigation';
import { ArrowLeft, Radio, Video, Users } from 'lucide-react';

export const dynamic = 'force-dynamic';

function fmt(d: string | null) { return d ? new Date(d).toLocaleString() : '-'; }

type S = {
  id: string; course_id: string | null; title: string | null; description: string | null;
  starts_at: string | null; ends_at: string | null; status: string | null;
  meeting_provider: string | null; meeting_url: string | null; recording_url: string | null;
  attendees_count: number | null; attendees_max: number | null;
};

function Row(s: S) {
  return (
    <div key={s.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-900">{s.title ?? 'Sessao'}</span>
            {s.status ? <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] uppercase text-slate-500">{s.status}</span> : null}
          </div>
          <div className="mt-1 text-xs text-slate-400">{s.course_id} · {fmt(s.starts_at)} -> {fmt(s.ends_at)}</div>
          {s.description ? <p className="mt-1.5 text-sm text-slate-600">{s.description}</p> : null}
        </div>
        <div className="shrink-0 text-right text-xs text-slate-500">
          <div className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {s.attendees_count ?? 0}{s.attendees_max ? '/' + s.attendees_max : ''}</div>
          {s.meeting_url ? <div className="mt-1"><a href={s.meeting_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-violet-600 hover:underline"><Video className="h-3.5 w-3.5" /> Sala</a></div> : null}
          {s.recording_url ? <div className="mt-1"><a href={s.recording_url} target="_blank" rel="noreferrer" className="text-slate-500 hover:underline">Gravacao</a></div> : null}
        </div>
      </div>
    </div>
  );
}

export default async function Page() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect('/auth/login?next=/admin/live');
  const { data: profile } = await sb.from('nl_profiles').select('role').eq('id', user.id).single();
  if (!profile || !['admin', 'super_admin'].includes(profile.role)) redirect('/');

  const { data: enabled } = await sb.rpc('nl_is_feature_enabled', { p_key: 'live_sessions' });
  const res = enabled
    ? await sb.from('nl_live_sessions').select('id, course_id, title, description, starts_at, ends_at, status, meeting_provider, meeting_url, recording_url, attendees_count, attendees_max').order('starts_at', { ascending: false }).limit(200)
    : { data: [] as unknown[] };
  const sessions = (Array.isArray(res.data) ? res.data : []) as S[];

  const now = Date.now();
  const upcoming = sessions.filter((s) => s.starts_at && new Date(s.starts_at).getTime() >= now);
  const past = sessions.filter((s) => !s.starts_at || new Date(s.starts_at).getTime() < now);

  return (
    <div>
      <Link href={'/admin' as any} className="group inline-flex items-center gap-1.5 mb-5 text-sm text-slate-500 hover:text-slate-900 font-medium">
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" /> Cockpit
      </Link>
      <header className="mb-6">
        <div className="flex items-center gap-2 text-slate-600 text-xs font-semibold uppercase tracking-wider mb-1">
          <Radio className="h-3.5 w-3.5" /> Aprendizagem · Sessoes ao vivo
        </div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Sessoes ao Vivo</h1>
        <p className="text-sm text-slate-600 mt-1.5 max-w-2xl leading-relaxed">Aulas sincronas agendadas, salas e presencas.</p>
      </header>
      {!enabled ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Funcionalidade desativada. Ativa em{' '}
          <Link href={'/admin/features' as any} className="font-semibold underline">Funcionalidades</Link>.
        </div>
      ) : (
        <div className="space-y-6">
          <div>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Proximas ({upcoming.length})</h2>
            <div className="space-y-3">{upcoming.map((s) => Row(s))}{upcoming.length === 0 ? <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">Sem sessoes agendadas.</div> : null}</div>
          </div>
          {past.length > 0 ? (
            <div>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Passadas ({past.length})</h2>
              <div className="space-y-3">{past.map((s) => Row(s))}</div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
