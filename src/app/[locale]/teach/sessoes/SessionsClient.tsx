'use client';

import { useEffect, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import { assertNotPeekClient } from '@/lib/peek-client';
import { useTranslations, useLocale } from 'next-intl';
import { toast } from 'sonner';
import { Loader2, Plus, Pencil, Video, Radio, Calendar, Users, Link2, ExternalLink, Save, X, Copy, Eye, EyeOff } from 'lucide-react';

type Sess = {
  id: string; title: string; description: string | null; session_kind: string; visibility: string; status: string;
  starts_at: string | null; ends_at: string | null; timezone: string | null; meeting_provider: string | null; meeting_url: string | null;
  meeting_id: string | null; meeting_password: string | null;
  attendees_count: number | null; attendees_max: number | null; is_recorded: boolean; course_id: string | null; course_title: string | null;
};
type CourseMin = { id: string; title: string; emoji?: string | null };
type Editor = {
  id: string | null; title: string; description: string; session_kind: string; visibility: string;
  course_id: string; starts_at: string; ends_at: string; attendees_max: string; is_recorded: boolean;
};

const KINDS = ['class', 'webinar', 'event', 'one_on_one'];
const VIS = ['enrolled', 'public', 'org'];
const MUX_INGEST = 'rtmps://global-live.mux.com:443/app';

function toLocalInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso); const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
}

export function SessionsClient() {
  const t = useTranslations();
  const locale = useLocale();
  const [sessions, setSessions] = useState<Sess[]>([]);
  const [courses, setCourses] = useState<CourseMin[]>([]);
  const [loading, setLoading] = useState(true);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [broadcast, setBroadcast] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const sb = createClient();
      const [{ data: ls }, { data: cs }] = await Promise.all([
        sb.rpc('nl_live_session_list', { p_scope: 'mine' }),
        sb.rpc('nl_instructor_courses_min'),
      ]);
      const res = ls as { ok: boolean; sessions?: Sess[] };
      setSessions(res?.sessions || []);
      setCourses((cs as CourseMin[]) || []);
    } catch { setSessions([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  function openNew() {
    setEditor({ id: null, title: '', description: '', session_kind: 'class', visibility: 'enrolled', course_id: '', starts_at: '', ends_at: '', attendees_max: '', is_recorded: false });
  }
  function openEdit(s: Sess) {
    setEditor({ id: s.id, title: s.title, description: s.description || '', session_kind: s.session_kind, visibility: s.visibility, course_id: s.course_id || '', starts_at: toLocalInput(s.starts_at), ends_at: toLocalInput(s.ends_at), attendees_max: s.attendees_max ? String(s.attendees_max) : '', is_recorded: s.is_recorded });
  }

  async function save() {
    if (!editor || !editor.title.trim()) return;
    setSaving(true);
    try {
      assertNotPeekClient();
      const sb = createClient();
      const p: Record<string, unknown> = {
        id: editor.id, title: editor.title.trim(), description: editor.description.trim() || null,
        session_kind: editor.session_kind, visibility: editor.visibility,
        course_id: editor.course_id || null,
        starts_at: editor.starts_at ? new Date(editor.starts_at).toISOString() : null,
        ends_at: editor.ends_at ? new Date(editor.ends_at).toISOString() : null,
        attendees_max: editor.attendees_max || null, is_recorded: editor.is_recorded,
      };
      const { data, error } = await sb.rpc('nl_live_session_upsert', { p });
      if (error) throw error;
      if (!(data as { ok: boolean })?.ok) throw new Error('rpc');
      toast.success(t('teach.live.saved'));
      setEditor(null);
      await load();
    } catch { toast.error(t('teach.live.error')); }
    finally { setSaving(false); }
  }

  async function provision(id: string) {
    setBusyId(id);
    try {
      assertNotPeekClient();
      const sb = createClient();
      const { data, error } = await sb.rpc('nl_live_session_provision', { p_session_id: id });
      if (error) throw error;
      if (!(data as { ok: boolean })?.ok) { toast.error(t('teach.live.error')); }
      await load();
    } catch { toast.error(t('teach.live.error')); }
    finally { setBusyId(null); }
  }

  function copyText(value: string) {
    navigator.clipboard.writeText(value).then(() => toast.success(t('teach.live.copied')));
  }
  function copyLink(s: Sess) {
    const path = s.session_kind === 'webinar' ? `/${locale}/webinar/${s.id}` : `/${locale}/learn/sessao/${s.id}`;
    copyText(`${window.location.origin}${path}`);
  }

  const kindIcon = (k: string) => k === 'webinar' ? <Radio className="w-4 h-4" /> : k === 'event' ? <Calendar className="w-4 h-4" /> : <Video className="w-4 h-4" />;
  const fmt = (iso: string | null) => iso ? new Date(iso).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' }) : '—';

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-display font-semibold text-neutral-900">{t('teach.live.title')}</h1>
          <p className="text-sm text-neutral-500 mt-1">{t('teach.live.subtitle')}</p>
        </div>
        <button onClick={openNew} className="inline-flex items-center gap-2 rounded-xl bg-neutral-900 text-white px-4 py-2 text-sm font-medium hover:bg-neutral-800 shrink-0">
          <Plus className="w-4 h-4" /> {t('teach.live.new')}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-neutral-400" /></div>
      ) : sessions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-200 p-12 text-center text-neutral-500">{t('teach.live.empty')}</div>
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => (
            <div key={s.id} className="rounded-2xl border border-neutral-200 bg-white p-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-700">{kindIcon(s.session_kind)} {t(`teach.live.kind.${s.session_kind}`)}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">{t(`teach.live.visibility.${s.visibility}`)}</span>
                    <StatusBadge status={s.status} t={t} />
                  </div>
                  <h3 className="font-medium text-neutral-900 mt-1.5 truncate">{s.title}</h3>
                  <div className="flex items-center gap-3 text-xs text-neutral-500 mt-1 flex-wrap">
                    <span className="inline-flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {fmt(s.starts_at)}</span>
                    <span className="inline-flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {s.attendees_count || 0}{s.attendees_max ? `/${s.attendees_max}` : ''} {t('teach.live.attendees')}</span>
                    <span className="text-neutral-400">{s.course_title || t('teach.live.no_course')}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  <button onClick={() => openEdit(s)} className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-1.5 text-sm hover:border-neutral-300"><Pencil className="w-3.5 h-3.5" /> {t('teach.live.edit')}</button>
                  {s.meeting_url ? (
                    <>
                      <button onClick={() => copyLink(s)} className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-1.5 text-sm hover:border-neutral-300"><Link2 className="w-3.5 h-3.5" /> {t('teach.live.copy_link')}</button>
                      <a href={`/${locale}/learn/sessao/${s.id}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-900 text-white px-3 py-1.5 text-sm hover:bg-neutral-800"><ExternalLink className="w-3.5 h-3.5" /> {t('teach.live.open_room')}</a>
                    </>
                  ) : (
                    <button onClick={() => provision(s.id)} disabled={busyId === s.id} className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-900 text-white px-3 py-1.5 text-sm hover:bg-neutral-800 disabled:opacity-50">
                      {busyId === s.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Video className="w-3.5 h-3.5" />} {t('teach.live.provision')}
                    </button>
                  )}
                </div>
              </div>

              {s.meeting_provider === 'mux_live' && s.meeting_url && (
                <div className="mt-3 pt-3 border-t border-neutral-100">
                  <button onClick={() => setBroadcast(broadcast === s.id ? null : s.id)} className="text-xs font-medium text-violet-700 inline-flex items-center gap-1.5"><Radio className="w-3.5 h-3.5" /> {t('teach.live.broadcast')}</button>
                  {broadcast === s.id && (
                    <div className="mt-2 rounded-lg bg-neutral-50 border border-neutral-200 p-3 space-y-2">
                      <p className="text-[11px] text-neutral-500">{t('teach.live.broadcast_hint')}</p>
                      <Copyable label={t('teach.live.ingest')} value={MUX_INGEST} copyLabel={t('teach.live.copy')} onCopy={() => copyText(MUX_INGEST)} />
                      <Copyable label={t('teach.live.stream_key')} value={s.meeting_password || ''} secret copyLabel={t('teach.live.copy')} onCopy={() => copyText(s.meeting_password || '')} />
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {editor && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => !saving && setEditor(null)}>
          <div className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl p-5 max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-neutral-900">{editor.id ? t('teach.live.edit') : t('teach.live.new')}</h2>
              <button onClick={() => setEditor(null)} className="text-neutral-400 hover:text-neutral-700"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <Field label={t('teach.live.field.title')}>
                <input value={editor.title} onChange={(e) => setEditor({ ...editor, title: e.target.value })} className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm" />
              </Field>
              <Field label={t('teach.live.field.description')}>
                <textarea value={editor.description} onChange={(e) => setEditor({ ...editor, description: e.target.value })} rows={2} className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label={t('teach.live.field.kind')}>
                  <select value={editor.session_kind} onChange={(e) => setEditor({ ...editor, session_kind: e.target.value })} className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm bg-white">
                    {KINDS.map((k) => <option key={k} value={k}>{t(`teach.live.kind.${k}`)}</option>)}
                  </select>
                </Field>
                <Field label={t('teach.live.field.visibility')}>
                  <select value={editor.visibility} onChange={(e) => setEditor({ ...editor, visibility: e.target.value })} className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm bg-white">
                    {VIS.map((v) => <option key={v} value={v}>{t(`teach.live.visibility.${v}`)}</option>)}
                  </select>
                </Field>
              </div>
              <Field label={t('teach.live.field.course')}>
                <select value={editor.course_id} onChange={(e) => setEditor({ ...editor, course_id: e.target.value })} className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm bg-white">
                  <option value="">{t('teach.live.no_course')}</option>
                  {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label={t('teach.live.field.starts')}>
                  <input type="datetime-local" value={editor.starts_at} onChange={(e) => setEditor({ ...editor, starts_at: e.target.value })} className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm" />
                </Field>
                <Field label={t('teach.live.field.ends')}>
                  <input type="datetime-local" value={editor.ends_at} onChange={(e) => setEditor({ ...editor, ends_at: e.target.value })} className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm" />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3 items-end">
                <Field label={t('teach.live.field.capacity')}>
                  <input type="number" min={0} value={editor.attendees_max} onChange={(e) => setEditor({ ...editor, attendees_max: e.target.value })} className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm" />
                </Field>
                <label className="flex items-center gap-2 text-sm text-neutral-700 pb-2">
                  <input type="checkbox" checked={editor.is_recorded} onChange={(e) => setEditor({ ...editor, is_recorded: e.target.checked })} className="rounded border-neutral-300" />
                  {t('teach.live.field.record')}
                </label>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 mt-5">
              <button onClick={() => setEditor(null)} className="rounded-lg border border-neutral-200 px-4 py-2 text-sm hover:border-neutral-300">{t('teach.live.cancel')}</button>
              <button onClick={save} disabled={saving || !editor.title.trim()} className="inline-flex items-center gap-2 rounded-lg bg-neutral-900 text-white px-4 py-2 text-sm font-medium hover:bg-neutral-800 disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} {t('teach.live.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (<label className="block"><span className="block text-xs font-medium text-neutral-600 mb-1">{label}</span>{children}</label>);
}
function Copyable({ label, value, secret, copyLabel, onCopy }: { label: string; value: string; secret?: boolean; copyLabel: string; onCopy: () => void }) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <div className="text-[11px] text-neutral-400 mb-0.5">{label}</div>
      <div className="flex items-center gap-2">
        <code className="flex-1 truncate bg-white border border-neutral-200 rounded px-2 py-1 text-xs text-neutral-700">{secret && !show ? '••••••••••••••••' : value}</code>
        {secret && <button onClick={() => setShow(!show)} className="text-neutral-400 hover:text-neutral-700">{show ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}</button>}
        <button onClick={onCopy} title={copyLabel} className="text-violet-600 hover:text-violet-800"><Copy className="w-3.5 h-3.5" /></button>
      </div>
    </div>
  );
}
function StatusBadge({ status, t }: { status: string; t: (k: string) => string }) {
  const map: Record<string, string> = { scheduled: 'bg-amber-50 text-amber-700', live: 'bg-green-50 text-green-700', ended: 'bg-neutral-100 text-neutral-500' };
  const key = ['scheduled', 'live', 'ended'].includes(status) ? status : 'scheduled';
  return <span className={`text-xs px-2 py-0.5 rounded-full ${map[key]}`}>{t(`teach.live.status.${key}`)}</span>;
}
