'use client';

import { useState, useTransition } from 'react';
import { upsertServiceAction } from '../corporate-actions';
import { Plus, Edit3, Loader2, X, Briefcase, CheckCircle, AlertCircle } from 'lucide-react';
import { AppPageHeader } from '@/components/layout/AppPageHeader';

const KINDS = [
  { id: 'custom_course', label: 'Curso à medida' },
  { id: 'workshop_sync', label: 'Workshop online' },
  { id: 'in_person_training', label: 'Formação presencial' },
  { id: 'mentoring', label: 'Mentoria' },
  { id: 'consulting', label: 'Consultoria' },
  { id: 'keynote', label: 'Keynote / Talk' },
];

const FORMATS = [
  { id: 'online', label: 'Online' },
  { id: 'in_person', label: 'Presencial' },
  { id: 'hybrid', label: 'Híbrido' },
];

const PRICE_MODELS = [
  { id: 'flat', label: 'Preço fixo' },
  { id: 'per_hour', label: 'Por hora' },
  { id: 'per_day', label: 'Por dia' },
  { id: 'per_participant', label: 'Por participante' },
];

function fmtCents(cents: number, currency: string) {
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency }).format(cents / 100);
}

export function ServicosClient({ locale, services: initialServices }: { locale: string; services: any[] }) {
  const [services, setServices] = useState(initialServices);
  const [editing, setEditing] = useState<any | null>(null);
  const [showForm, setShowForm] = useState(false);
  
  function openNew() {
    setEditing({
      kind: 'custom_course', title: '', description: '', target_audience: '',
      languages: ['pt'], base_price_cents: 100000, currency: 'EUR', price_model: 'flat',
      format: 'online', duration_hours_min: 4, duration_hours_max: 8,
      max_participants: 20, travel_ok: false, travel_regions: [],
      delivery_lead_days: 30, recording_included: true, followup_qa_included: false,
      materials_included: true, status: 'active', tags: [], outcomes: [],
    });
    setShowForm(true);
  }
  
  function openEdit(s: any) {
    setEditing(s);
    setShowForm(true);
  }
  
  return (
    <div>
      <AppPageHeader title="Serviços Corporate" description="Formações custom para empresas — typically 5–50x o valor de cursos pré-gravados. Plataforma fica com 25% de fee, tu ficas com 75% do valor cotado." actions={
        <button onClick={openNew}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-medium text-sm shadow-sm">
          <Plus className="h-4 w-4" /> Novo serviço
        </button>
      } />
      
      {services.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Briefcase className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-semibold text-slate-900 mb-1">Sem serviços ainda</h3>
          <p className="text-sm text-slate-500 mb-6 max-w-md mx-auto">
            Cria o teu primeiro serviço. Empresas vão poder pedir-te orçamentos para formações custom, workshops, consultoria ou mentoria.
          </p>
          <button onClick={openNew} className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg">
            <Plus className="h-4 w-4" /> Criar primeiro serviço
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {services.map((s) => (
            <div key={s.id} className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-2 gap-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-brand-600">
                      {KINDS.find(k => k.id === s.kind)?.label || s.kind}
                    </span>
                    {s.status === 'active' ? (
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                    )}
                  </div>
                  <h3 className="font-semibold text-slate-900">{s.title}</h3>
                </div>
                <button onClick={() => openEdit(s)} className="p-1.5 hover:bg-slate-100 rounded-lg">
                  <Edit3 className="h-4 w-4 text-slate-500" />
                </button>
              </div>
              {s.description && <p className="text-sm text-slate-600 mb-3 line-clamp-2">{s.description}</p>}
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-full">
                  {FORMATS.find(f => f.id === s.format)?.label || s.format}
                </span>
                {s.duration_hours_min && (
                  <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-full">
                    {s.duration_hours_min}{s.duration_hours_max && s.duration_hours_max !== s.duration_hours_min ? `-${s.duration_hours_max}` : ''}h
                  </span>
                )}
                <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded-full font-semibold">
                  {fmtCents(s.base_price_cents, s.currency)}
                  {s.price_model !== 'flat' && ` / ${s.price_model.replace('per_', '')}`}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {showForm && editing && (
        <ServiceFormModal initial={editing} onClose={() => { setShowForm(false); setEditing(null); }} onSaved={(updated) => {
          setServices((prev) => {
            const idx = prev.findIndex(s => s.id === updated.id);
            if (idx >= 0) { const copy = [...prev]; copy[idx] = updated; return copy; }
            return [updated, ...prev];
          });
          setShowForm(false); setEditing(null);
        }} />
      )}
    </div>
  );
}

function ServiceFormModal({ initial, onClose, onSaved }: { initial: any; onClose: () => void; onSaved: (s: any) => void }) {
  const [form, setForm] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  
  function save() {
    setError(null);
    if (!form.title || form.title.length < 3) return setError('Título obrigatório (min 3 chars)');
    if (!form.base_price_cents || form.base_price_cents <= 0) return setError('Preço base inválido');
    
    startTransition(async () => {
      const r = await upsertServiceAction(form.id || null, form);
      if (r.ok) {
        onSaved({ ...form, id: r.service_id });
      } else {
        setError(r.error || 'erro');
      }
    });
  }
  
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl">
        <div className="sticky top-0 bg-white border-b border-slate-100 p-4 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">{form.id ? 'Editar serviço' : 'Novo serviço'}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg"><X className="h-4 w-4" /></button>
        </div>
        
        <div className="p-4 sm:p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
            <select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white">
              {KINDS.map(k => <option key={k.id} value={k.id}>{k.label}</option>)}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Título</label>
            <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg" 
              placeholder="Ex: Liderança Técnica para Engineering Managers" />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
            <textarea value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg" rows={3} 
              placeholder="O que vai ser tratado, formato, audiência…" />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Audiência alvo</label>
            <input type="text" value={form.target_audience || ''} onChange={(e) => setForm({ ...form, target_audience: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg" 
              placeholder="Engineering Managers, Senior Devs, etc." />
          </div>
          
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Formato</label>
              <select value={form.format} onChange={(e) => setForm({ ...form, format: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white">
                {FORMATS.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Modelo de preço</label>
              <select value={form.price_model} onChange={(e) => setForm({ ...form, price_model: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white">
                {PRICE_MODELS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            </div>
          </div>
          
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Preço base (€)</label>
              <input type="number" value={(form.base_price_cents / 100) || 0} 
                onChange={(e) => setForm({ ...form, base_price_cents: Math.round(parseFloat(e.target.value) * 100) || 0 })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg" min="0" step="0.01" />
              <p className="text-xs text-slate-500 mt-1">Plataforma deduz 25% (€{((form.base_price_cents || 0) * 0.25 / 100).toFixed(2)} fee)</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Currency</label>
              <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white">
                <option value="EUR">EUR</option><option value="USD">USD</option><option value="GBP">GBP</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Horas min</label>
              <input type="number" value={form.duration_hours_min || ''} 
                onChange={(e) => setForm({ ...form, duration_hours_min: parseInt(e.target.value) || null })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" min="1" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Horas max</label>
              <input type="number" value={form.duration_hours_max || ''} 
                onChange={(e) => setForm({ ...form, duration_hours_max: parseInt(e.target.value) || null })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" min="1" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Max participants</label>
              <input type="number" value={form.max_participants || ''} 
                onChange={(e) => setForm({ ...form, max_participants: parseInt(e.target.value) || null })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" min="1" />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={form.travel_ok} onChange={(e) => setForm({ ...form, travel_ok: e.target.checked })} />
              Disponível para viajar (formação presencial)
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={form.recording_included} onChange={(e) => setForm({ ...form, recording_included: e.target.checked })} />
              Gravação incluída
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={form.followup_qa_included} onChange={(e) => setForm({ ...form, followup_qa_included: e.target.checked })} />
              Q&A follow-up incluída
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={form.materials_included} onChange={(e) => setForm({ ...form, materials_included: e.target.checked })} />
              Materiais (slides, exercícios) incluídos
            </label>
          </div>
          
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Lead time (dias)</label>
              <input type="number" value={form.delivery_lead_days} 
                onChange={(e) => setForm({ ...form, delivery_lead_days: parseInt(e.target.value) || 30 })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg" min="1" />
              <p className="text-xs text-slate-500 mt-1">Tempo mínimo antes da entrega</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white">
                <option value="active">Activo (visível)</option>
                <option value="paused">Pausado</option>
                <option value="draft">Rascunho</option>
                <option value="archived">Arquivado</option>
              </select>
            </div>
          </div>
          
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
          )}
        </div>
        
        <div className="sticky bottom-0 bg-white border-t border-slate-100 p-4 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium">Cancelar</button>
          <button onClick={save} disabled={pending}
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            {pending ? 'A guardar…' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}
