'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from '@/i18n/routing';
import { toast } from 'sonner';
import { Save, Loader2, Plus, Trash2, GripVertical, Eye, EyeOff, Video, Image as ImageIcon, MessageSquare, HelpCircle, Code, Sparkles } from 'lucide-react';

interface Landing {
  hero_title?: string | null; hero_subtitle?: string | null;
  hero_video_url?: string | null; hero_image_url?: string | null;
  bullet_points?: string[] | null;
  testimonials?: any[] | null; faq?: any[] | null;
  cta_label?: string | null; custom_html?: string | null;
  enabled?: boolean; ab_variant?: string | null;
}

interface Testimonial { name: string; role?: string; quote: string; avatar?: string; }
interface FAQ { question: string; answer: string; }

export function LandingEditorClient({ courseId, courseTitle, initial }: { courseId: string; courseTitle: string; initial: Landing }) {
  const router = useRouter();
  const [form, setForm] = useState<Landing>({
    hero_title: initial.hero_title ?? '',
    hero_subtitle: initial.hero_subtitle ?? '',
    hero_video_url: initial.hero_video_url ?? '',
    hero_image_url: initial.hero_image_url ?? '',
    bullet_points: initial.bullet_points ?? [],
    testimonials: Array.isArray(initial.testimonials) ? initial.testimonials : [],
    faq: Array.isArray(initial.faq) ? initial.faq : [],
    cta_label: initial.cta_label ?? '',
    custom_html: initial.custom_html ?? '',
    enabled: initial.enabled ?? false,
    ab_variant: initial.ab_variant ?? 'A',
  });
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);

  function set<K extends keyof Landing>(k: K, v: Landing[K]) {
    setForm((p) => ({ ...p, [k]: v }));
    setDirty(true);
  }

  async function save() {
    setBusy(true);
    try {
      const sb = createClient();
      const { error } = await sb.rpc('nl_admin_course_landing_upsert', { p_course_id: courseId, p_data: form });
      if (error) throw error;
      toast.success(form.enabled ? 'Landing activa · visível ao público' : 'Landing guardada (inactiva)');
      setDirty(false);
      router.refresh();
    } catch (e: any) { toast.error(e?.message || 'Erro'); }
    finally { setBusy(false); }
  }

  // Bullets helpers
  function addBullet() { set('bullet_points', [...(form.bullet_points || []), '']); }
  function updateBullet(i: number, v: string) { const a = [...(form.bullet_points || [])]; a[i] = v; set('bullet_points', a); }
  function removeBullet(i: number) { set('bullet_points', (form.bullet_points || []).filter((_, idx) => idx !== i)); }

  // Testimonials helpers
  function addTest() { set('testimonials', [...(form.testimonials || []), { name: '', role: '', quote: '' }] as any); }
  function updateTest(i: number, key: keyof Testimonial, v: string) {
    const a = [...((form.testimonials as Testimonial[]) || [])]; a[i] = { ...a[i], [key]: v }; set('testimonials', a as any);
  }
  function removeTest(i: number) { set('testimonials', ((form.testimonials as Testimonial[]) || []).filter((_, idx) => idx !== i) as any); }

  // FAQ helpers
  function addFaq() { set('faq', [...(form.faq || []), { question: '', answer: '' }] as any); }
  function updateFaq(i: number, key: keyof FAQ, v: string) {
    const a = [...((form.faq as FAQ[]) || [])]; a[i] = { ...a[i], [key]: v }; set('faq', a as any);
  }
  function removeFaq(i: number) { set('faq', ((form.faq as FAQ[]) || []).filter((_, idx) => idx !== i) as any); }

  return (
    <div className="space-y-5">
      {/* Status toggle */}
      <div className={`border rounded-2xl p-4 flex items-center justify-between ${form.enabled ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
        <div>
          <div className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Landing page</div>
          <div className={`font-semibold text-sm mt-0.5 ${form.enabled ? 'text-emerald-700' : 'text-slate-600'}`}>
            {form.enabled ? '● Activa · visível aos alunos no /curso/' + courseId : '○ Inactiva · usa página padrão'}
          </div>
        </div>
        <button onClick={() => set('enabled', !form.enabled)}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold ${form.enabled ? 'bg-rose-600 hover:bg-rose-700 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}`}>
          {form.enabled ? <><EyeOff className="h-4 w-4" /> Desactivar</> : <><Eye className="h-4 w-4" /> Activar</>}
        </button>
      </div>

      {/* Hero */}
      <Section title="Hero" icon={Sparkles}>
        <Field label="Título principal">
          <input type="text" value={form.hero_title ?? ''} onChange={(e) => set('hero_title', e.target.value)}
            placeholder={`Domina ${courseTitle} em 30 dias`} maxLength={120}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-fuchsia-500 outline-none" />
        </Field>
        <Field label="Subtítulo">
          <textarea value={form.hero_subtitle ?? ''} onChange={(e) => set('hero_subtitle', e.target.value)}
            rows={2} maxLength={300}
            placeholder="Resumo curto do que vais aprender..."
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-fuchsia-500 outline-none resize-y" />
        </Field>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Hero video URL">
            <div className="relative">
              <Video className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
              <input type="text" value={form.hero_video_url ?? ''} onChange={(e) => set('hero_video_url', e.target.value)}
                placeholder="https://mux.com/..."
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:border-fuchsia-500 outline-none" />
            </div>
          </Field>
          <Field label="Hero image URL">
            <div className="relative">
              <ImageIcon className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
              <input type="text" value={form.hero_image_url ?? ''} onChange={(e) => set('hero_image_url', e.target.value)}
                placeholder="https://..."
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:border-fuchsia-500 outline-none" />
            </div>
          </Field>
        </div>
        <Field label="Label CTA principal">
          <input type="text" value={form.cta_label ?? ''} onChange={(e) => set('cta_label', e.target.value)}
            placeholder="Inscrever agora" maxLength={50}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-fuchsia-500 outline-none" />
        </Field>
      </Section>

      {/* Bullets */}
      <Section title={`Bullets (${(form.bullet_points || []).length})`} icon={Sparkles}>
        <div className="space-y-2">
          {(form.bullet_points || []).map((b, i) => (
            <div key={i} className="flex items-center gap-2">
              <GripVertical className="h-4 w-4 text-slate-300 flex-shrink-0" />
              <input type="text" value={b} onChange={(e) => updateBullet(i, e.target.value)}
                placeholder={`Benefício ${i + 1}...`} maxLength={120}
                className="flex-1 px-3 py-1.5 border border-slate-200 rounded text-sm outline-none focus:border-fuchsia-500" />
              <button onClick={() => removeBullet(i)} className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          <button onClick={addBullet} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-fuchsia-700 hover:bg-fuchsia-50 rounded">
            <Plus className="h-3 w-3" /> Adicionar bullet
          </button>
        </div>
      </Section>

      {/* Testimonials */}
      <Section title={`Testemunhos (${(form.testimonials || []).length})`} icon={MessageSquare}>
        <div className="space-y-3">
          {((form.testimonials as Testimonial[]) || []).map((tt, i) => (
            <div key={i} className="border border-slate-200 rounded-lg p-3 space-y-2">
              <div className="grid sm:grid-cols-2 gap-2">
                <input type="text" value={tt.name || ''} onChange={(e) => updateTest(i, 'name', e.target.value)}
                  placeholder="Nome" className="px-2 py-1 border border-slate-200 rounded text-xs outline-none focus:border-fuchsia-500" />
                <input type="text" value={tt.role || ''} onChange={(e) => updateTest(i, 'role', e.target.value)}
                  placeholder="Cargo / empresa" className="px-2 py-1 border border-slate-200 rounded text-xs outline-none focus:border-fuchsia-500" />
              </div>
              <textarea value={tt.quote || ''} onChange={(e) => updateTest(i, 'quote', e.target.value)}
                placeholder="Citação..." rows={2} maxLength={400}
                className="w-full px-2 py-1 border border-slate-200 rounded text-xs outline-none focus:border-fuchsia-500 resize-y" />
              <button onClick={() => removeTest(i)} className="inline-flex items-center gap-1 text-[11px] text-rose-600 hover:text-rose-800">
                <Trash2 className="h-3 w-3" /> Remover
              </button>
            </div>
          ))}
          <button onClick={addTest} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-fuchsia-700 hover:bg-fuchsia-50 rounded">
            <Plus className="h-3 w-3" /> Adicionar testemunho
          </button>
        </div>
      </Section>

      {/* FAQ */}
      <Section title={`FAQ (${(form.faq || []).length})`} icon={HelpCircle}>
        <div className="space-y-3">
          {((form.faq as FAQ[]) || []).map((f, i) => (
            <div key={i} className="border border-slate-200 rounded-lg p-3 space-y-2">
              <input type="text" value={f.question || ''} onChange={(e) => updateFaq(i, 'question', e.target.value)}
                placeholder="Pergunta" className="w-full px-2 py-1 border border-slate-200 rounded text-xs font-semibold outline-none focus:border-fuchsia-500" />
              <textarea value={f.answer || ''} onChange={(e) => updateFaq(i, 'answer', e.target.value)}
                placeholder="Resposta..." rows={2}
                className="w-full px-2 py-1 border border-slate-200 rounded text-xs outline-none focus:border-fuchsia-500 resize-y" />
              <button onClick={() => removeFaq(i)} className="inline-flex items-center gap-1 text-[11px] text-rose-600 hover:text-rose-800">
                <Trash2 className="h-3 w-3" /> Remover
              </button>
            </div>
          ))}
          <button onClick={addFaq} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-fuchsia-700 hover:bg-fuchsia-50 rounded">
            <Plus className="h-3 w-3" /> Adicionar FAQ
          </button>
        </div>
      </Section>

      {/* Custom HTML + A/B */}
      <Section title="Avançado" icon={Code}>
        <Field label="HTML custom (avançado)">
          <textarea value={form.custom_html ?? ''} onChange={(e) => set('custom_html', e.target.value)}
            rows={4} placeholder="<div>...</div>"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono focus:border-fuchsia-500 outline-none resize-y" />
          <p className="text-[10px] text-slate-400 mt-1">Renderizado no fim da página. Cuidado: HTML cru sem sanitize.</p>
        </Field>
        <Field label="Variante A/B">
          <select value={form.ab_variant ?? 'A'} onChange={(e) => set('ab_variant', e.target.value)}
            className="w-32 px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:border-fuchsia-500 outline-none">
            <option value="A">Variante A</option>
            <option value="B">Variante B</option>
          </select>
        </Field>
      </Section>

      {/* Sticky save */}
      <div className="sticky bottom-4 bg-white/95 backdrop-blur-sm border border-slate-200 shadow-lg rounded-2xl p-3 flex items-center justify-between">
        <div className="text-xs text-slate-500 px-2">
          {dirty ? <span className="text-amber-600 font-medium">Alterações por guardar</span> : 'Sem alterações'}
        </div>
        <button onClick={save} disabled={busy || !dirty}
          className="inline-flex items-center gap-1.5 px-5 py-2 bg-gradient-to-br from-fuchsia-600 to-pink-600 hover:from-fuchsia-700 hover:to-pink-700 text-white text-sm font-semibold rounded-lg shadow-sm disabled:opacity-50">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Guardar
        </button>
      </div>
    </div>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <header className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
        <Icon className="h-4 w-4 text-fuchsia-600" />
        <h2 className="font-semibold text-sm text-slate-900">{title}</h2>
      </header>
      <div className="p-4 space-y-3">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">{label}</label>
      {children}
    </div>
  );
}
