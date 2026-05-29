'use client';

import { useEffect, useState, useCallback } from 'react';
import { Link, useRouter } from '@/i18n/routing';
import { callAgentOps } from '@/lib/api/client';
import { DashboardSkeleton } from '@/components/shared/DashboardSkeleton';
import { fmtCents } from '@/lib/utils/cn';
import { toast } from 'sonner';
import { ModulesEditor, type Module } from './ModulesEditor';

interface Course {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  emoji: string | null;
  level: string | null;
  category: string | null;
  price_cents: number;
  currency: string | null;
  published: boolean;
  approval_status: string | null;
  course_type?: string | null;
  modules: Module[] | null;
  topics: string[] | null;
}

interface Props {
  courseId: string;
  backHref: string;
  mode?: 'instructor' | 'admin';
}

export function CourseEditor({ courseId, backHref, mode = 'instructor' }: Props) {
  const isAdmin = mode === 'admin';
  const DETAIL_ACTION = isAdmin ? 'admin_course_detail' : 'teach_course_detail';
  const UPDATE_ACTION = isAdmin ? 'admin_update_course' : 'teach_update_course';

  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [tab, setTab] = useState<'info' | 'modules' | 'publish'>('info');

  useEffect(() => {
    callAgentOps<{ course: Course }>(DETAIL_ACTION, { course_id: courseId })
      .then((r) => setCourse({ ...r.course, modules: Array.isArray(r.course.modules) ? r.course.modules : [], topics: Array.isArray(r.course.topics) ? r.course.topics : [] }))
      .catch((e) => setErr(e.message));
  }, [courseId, DETAIL_ACTION]);

  const update = useCallback((patch: Partial<Course>) => {
    setCourse((c) => (c ? { ...c, ...patch } : c));
    setDirty(true);
  }, []);

  async function save() {
    if (!course) return;
    setSaving(true);
    try {
      await callAgentOps(UPDATE_ACTION, {
        course_id: course.id, title: course.title, subtitle: course.subtitle, description: course.description,
        emoji: course.emoji, level: course.level, category: course.category, price_cents: course.price_cents,
        modules: course.modules, topics: course.topics,
      });
      toast.success('Guardado');
      setDirty(false);
    } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  }

  async function submitForReview() {
    if (!course) return;
    if (dirty) { toast.error('Guarda primeiro as alterações'); return; }
    if (!confirm('Submeter este curso para aprovação?')) return;
    try {
      await callAgentOps('teach_submit_course_for_review', { course_id: course.id });
      toast.success('Submetido para aprovação');
      router.push(backHref as any);
    } catch (e: any) { toast.error(e.message); }
  }

  async function togglePublished() {
    if (!course) return;
    if (!confirm(course.published ? 'Despublicar este curso?' : 'Publicar este curso agora?')) return;
    try {
      await callAgentOps('admin_update_course', { course_id: course.id, published: !course.published });
      toast.success(course.published ? 'Despublicado' : 'Publicado');
      setCourse((c) => c ? { ...c, published: !c.published } : c);
      setDirty(false);
    } catch (e: any) { toast.error(e.message); }
  }

  if (err) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-slate-700 font-medium">{err === 'not_owner_or_not_found' ? 'Curso não encontrado ou sem permissão.' : err === 'admin_required' ? 'Acesso restrito a administradores.' : err}</p>
        <Link href={backHref as any} className="btn-primary mt-6 inline-flex">← Voltar</Link>
      </div>
    );
  }
  if (!course) return <DashboardSkeleton stats={3} />;

  const lessonCount = (course.modules || []).reduce((s, m) => s + (m.lessons?.length || 0), 0);
  const generatedCount = (course.modules || []).reduce((s, m) => s + (m.lessons?.filter((l) => l.content?.p?.length).length || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="min-w-0">
          <Link href={backHref as any} className="text-sm text-brand-600 hover:underline">← Voltar</Link>
          <h1 className="text-2xl font-bold text-slate-900 mt-1 truncate">{course.emoji || '📘'} {course.title || 'Sem título'}</h1>
          <div className="text-sm text-slate-500 mt-1 flex flex-wrap items-center gap-2">
            <span className={`px-2 py-0.5 rounded-full text-xs ${course.published ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{course.published ? 'Publicado' : (course.approval_status || 'Rascunho')}</span>
            {course.course_type && <><span>·</span><span className="text-xs">{course.course_type}</span></>}
            <span>·</span><span>{(course.modules || []).length} módulos</span>
            <span>·</span><span>{lessonCount} aulas</span>
            {lessonCount > 0 && <><span>·</span><span>{generatedCount}/{lessonCount} com conteúdo</span></>}
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0 items-center">
          {dirty && <span className="text-xs text-amber-600">Alterações por guardar</span>}
          {isAdmin && (
            <button onClick={togglePublished} className={course.published ? 'btn-secondary' : 'bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-5 py-2.5 rounded-lg text-sm'}>
              {course.published ? 'Despublicar' : '✓ Publicar agora'}
            </button>
          )}
          <button onClick={save} disabled={saving || !dirty} className="btn-primary disabled:opacity-50">{saving ? 'A guardar...' : 'Guardar'}</button>
        </div>
      </div>

      <div className="border-b border-slate-200">
        <nav className="flex gap-1 -mb-px overflow-x-auto">
          {(['info','modules','publish'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${tab === t ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
              {t === 'info' ? 'Informação' : t === 'modules' ? `Módulos e aulas (${lessonCount})` : 'Publicar'}
            </button>
          ))}
        </nav>
      </div>

      {tab === 'info' && (
        <div className="space-y-4 max-w-3xl">
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <div className="grid sm:grid-cols-[80px_1fr] gap-4 items-start">
              <div>
                <label className="label">Emoji</label>
                <input className="input text-2xl text-center" value={course.emoji || ''} onChange={(e) => update({ emoji: e.target.value })} maxLength={2} />
              </div>
              <div>
                <label className="label">Título *</label>
                <input className="input" value={course.title} onChange={(e) => update({ title: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="label">Subtítulo</label>
              <input className="input" value={course.subtitle || ''} onChange={(e) => update({ subtitle: e.target.value })} placeholder="Uma frase que resume o valor do curso" />
            </div>
            <div>
              <label className="label">Descrição</label>
              <textarea className="input min-h-[120px]" value={course.description || ''} onChange={(e) => update({ description: e.target.value })} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="label">Nível</label>
                <select className="input" value={course.level || 'beginner'} onChange={(e) => update({ level: e.target.value })}>
                  <option value="beginner">Iniciante</option>
                  <option value="intermediate">Intermédio</option>
                  <option value="advanced">Avançado</option>
                </select>
              </div>
              <div>
                <label className="label">Categoria</label>
                <input className="input" value={course.category || ''} onChange={(e) => update({ category: e.target.value })} placeholder="ai" />
              </div>
              <div>
                <label className="label">Preço (€){isAdmin && course.course_type === 'essential' ? ' (essentials = grátis)' : ''}</label>
                <input type="number" min="0" step="1" className="input" value={(course.price_cents / 100).toFixed(0)} onChange={(e) => update({ price_cents: Math.round(parseFloat(e.target.value || '0') * 100) })} disabled={isAdmin && course.course_type === 'essential'} />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <label className="label">Tópicos (o que o aluno vai aprender)</label>
            <p className="text-xs text-slate-500 mb-3">Uma linha por tópico</p>
            <textarea className="input min-h-[140px]" value={(course.topics || []).join('\n')} onChange={(e) => update({ topics: e.target.value.split('\n').filter(Boolean) })} placeholder="Como usar prompts eficazes&#10;Integrar com APIs&#10;Avaliar resultados" />
          </div>
        </div>
      )}

      {tab === 'modules' && (
        <ModulesEditor course={{ id: course.id, title: course.title, level: course.level || 'beginner' }} modules={course.modules || []} onChange={(modules) => update({ modules })} />
      )}

      {tab === 'publish' && (
        <div className="max-w-2xl space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="font-semibold text-slate-900 mb-3">Estado actual</h2>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center justify-between"><span>Publicado</span>{course.published ? <span className="text-emerald-600">✓ Sim</span> : <span className="text-slate-400">Não</span>}</li>
              <li className="flex items-center justify-between"><span>Estado de aprovação</span><span className="font-mono text-xs">{course.approval_status || 'draft'}</span></li>
              <li className="flex items-center justify-between"><span>Módulos</span><span className="font-semibold">{(course.modules || []).length}</span></li>
              <li className="flex items-center justify-between"><span>Aulas</span><span className="font-semibold">{lessonCount}</span></li>
              <li className="flex items-center justify-between"><span>Aulas com conteúdo</span><span className="font-semibold">{generatedCount}/{lessonCount}</span></li>
              <li className="flex items-center justify-between"><span>Preço</span><span className="font-semibold">{fmtCents(course.price_cents, course.currency || 'EUR')}</span></li>
            </ul>
          </div>
          {!isAdmin && (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="font-semibold text-slate-900 mb-3">Submeter para aprovação</h2>
              <p className="text-sm text-slate-600 mb-4">Depois de submetido, um admin vai rever e publicar o curso. Recomendado: ter pelo menos 3 módulos e todas as aulas com conteúdo gerado.</p>
              <button onClick={submitForReview} disabled={dirty || course.approval_status === 'pending_review' || course.published} className="btn-primary disabled:opacity-50">
                {course.published ? 'Já publicado' : course.approval_status === 'pending_review' ? 'A aguardar revisão...' : 'Submeter para revisão'}
              </button>
            </div>
          )}
          {isAdmin && (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="font-semibold text-slate-900 mb-3">Publicação directa (admin)</h2>
              <p className="text-sm text-slate-600 mb-4">Como administrador podes publicar ou despublicar este curso sem passar pelo fluxo de aprovação.</p>
              <button onClick={togglePublished} className={course.published ? 'btn-secondary' : 'bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-5 py-2.5 rounded-lg text-sm'}>
                {course.published ? 'Despublicar curso' : '✓ Publicar agora'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
