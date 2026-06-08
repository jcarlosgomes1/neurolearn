'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from '@/i18n/routing';
import { toast } from 'sonner';
import { Save, Loader2, Info, Sparkles, AlertTriangle, CheckCircle2, ArrowRight, Eye } from 'lucide-react';

const STYLES = [
  { k: 'info',    label: 'Info',    cls: 'from-blue-600 via-indigo-600 to-violet-600', icon: Info },
  { k: 'promo',   label: 'Promo',   cls: 'from-fuchsia-600 via-pink-600 to-rose-600',  icon: Sparkles },
  { k: 'warning', label: 'Aviso',   cls: 'from-amber-500 via-orange-500 to-rose-500',  icon: AlertTriangle },
  { k: 'success', label: 'Sucesso', cls: 'from-emerald-500 via-teal-500 to-cyan-500',  icon: CheckCircle2 },
];

const LANGS = [
  { k: 'pt', label: 'Português', flag: '🇵🇹' },
  { k: 'en', label: 'English',   flag: '🇬🇧' },
  { k: 'es', label: 'Español',   flag: '🇪🇸' },
  { k: 'fr', label: 'Français',  flag: '🇫🇷' },
];

function parseJson(s: string | undefined, fallback: any): any {
  if (!s) return fallback;
  try { return JSON.parse(s); } catch { return fallback; }
}

export function TopBarConfigClient({ initial }: { initial: Record<string, string> }) {
  const router = useRouter();
  const initialMsg = parseJson(initial.topbar_message, { pt: '', en: '', es: '', fr: '' });
  const initialLabel = parseJson(initial.topbar_link_label, { pt: 'Saber mais', en: 'Learn more', es: 'Saber más', fr: 'En savoir plus' });

  const [enabled, setEnabled] = useState<boolean>(initial.topbar_enabled === 'true');
  const [message, setMessage] = useState<Record<string, string>>(initialMsg);
  const [linkUrl, setLinkUrl] = useState<string>(initial.topbar_link_url || '');
  const [linkLabel, setLinkLabel] = useState<Record<string, string>>(initialLabel);
  const [style, setStyle] = useState<string>(initial.topbar_style || 'info');
  const [dismissible, setDismissible] = useState<boolean>(initial.topbar_dismissible !== 'false');
  const [activeLang, setActiveLang] = useState<string>('pt');
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);

  function markDirty<T>(setter: (v: T) => void, v: T) { setter(v); setDirty(true); }

  async function save() {
    setBusy(true);
    try {
      const sb = createClient();
      const { error } = await sb.rpc('nl_admin_topbar_set', {
        p_data: {
          enabled,
          message,
          link_url: linkUrl,
          link_label: linkLabel,
          style,
          dismissible,
        },
      });
      if (error) throw error;
      toast.success(enabled ? 'Banner activado e gravado' : 'Configuração gravada (banner desactivado)');
      setDirty(false);
      router.refresh();
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao guardar');
    } finally { setBusy(false); }
  }

  const previewStyle = STYLES.find((s) => s.k === style) || STYLES[0];
  const PreviewIcon = previewStyle.icon;
  const previewMsg = message[activeLang] || message.pt || message.en || '';
  const previewLabel = linkLabel[activeLang] || linkLabel.pt || linkLabel.en || '';

  return (
    <div className="space-y-5">
      {/* Status card */}
      <div className={`border rounded-2xl p-4 flex items-center justify-between ${enabled ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
        <div>
          <div className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Estado</div>
          <div className={`font-semibold text-sm mt-0.5 ${enabled ? 'text-emerald-700' : 'text-slate-600'}`}>
            {enabled ? '● Banner activo nas páginas públicas' : '○ Banner desactivado'}
          </div>
        </div>
        <button onClick={() => markDirty(setEnabled, !enabled)}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${enabled ? 'bg-rose-600 hover:bg-rose-700 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}`}>
          {enabled ? 'Desactivar' : 'Activar agora'}
        </button>
      </div>

      {/* Preview ao vivo */}
      {previewMsg && (
        <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <header className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
            <Eye className="h-4 w-4 text-slate-400" />
            <h2 className="font-semibold text-sm text-slate-900">Pré-visualização ({LANGS.find((l) => l.k === activeLang)?.label})</h2>
          </header>
          <div className={`bg-gradient-to-r ${previewStyle.cls}`}>
            <div className="flex items-center justify-center gap-2 text-sm font-medium text-white py-2 px-4">
              <PreviewIcon className="h-4 w-4 flex-shrink-0" />
              <span className="line-clamp-1">{previewMsg}</span>
              {linkUrl && previewLabel && (
                <span className="inline-flex items-center gap-1 underline underline-offset-2 font-semibold">
                  {previewLabel}
                  <ArrowRight className="h-3 w-3" />
                </span>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Estilo visual */}
      <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <header className="px-5 py-3 border-b border-slate-100">
          <h2 className="font-semibold text-sm text-slate-900">Estilo visual</h2>
        </header>
        <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
          {STYLES.map(({ k, label, cls, icon: Icon }) => {
            const active = style === k;
            return (
              <button key={k} onClick={() => markDirty(setStyle, k)}
                className={`relative rounded-lg p-3 border-2 transition-all ${active ? 'border-slate-900' : 'border-slate-200 hover:border-slate-300'}`}>
                <div className={`h-8 rounded bg-gradient-to-r ${cls} flex items-center justify-center text-white mb-1.5`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="text-xs font-semibold text-slate-700">{label}</div>
                {active && <div className="absolute top-1 right-1 h-2 w-2 bg-slate-900 rounded-full" />}
              </button>
            );
          })}
        </div>
      </section>

      {/* Mensagem por idioma */}
      <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <header className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-sm text-slate-900">Mensagem por idioma</h2>
          <div className="flex gap-1">
            {LANGS.map((l) => (
              <button key={l.k} onClick={() => setActiveLang(l.k)}
                className={`px-2 py-1 rounded text-xs font-medium ${activeLang === l.k ? 'bg-violet-100 text-violet-700' : 'text-slate-500 hover:bg-slate-100'}`}>
                {l.flag} {l.k.toUpperCase()}
              </button>
            ))}
          </div>
        </header>
        <div className="p-4 space-y-3">
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">
              Texto principal ({LANGS.find((l) => l.k === activeLang)?.label})
            </label>
            <input type="text" value={message[activeLang] || ''}
              onChange={(e) => markDirty(setMessage, { ...message, [activeLang]: e.target.value })}
              placeholder="Ex: Novo curso de Prompt Engineering — 20% off até dia 30."
              maxLength={140}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-violet-500 outline-none" />
            <p className="text-[10px] text-slate-400 mt-1">Máx 140 caracteres · {(message[activeLang] || '').length}/140</p>
          </div>
        </div>
      </section>

      {/* CTA opcional */}
      <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <header className="px-5 py-3 border-b border-slate-100">
          <h2 className="font-semibold text-sm text-slate-900">CTA opcional</h2>
        </header>
        <div className="p-4 space-y-3">
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">URL do link (vazio = só texto)</label>
            <input type="text" value={linkUrl}
              onChange={(e) => markDirty(setLinkUrl, e.target.value)}
              placeholder="/cursos/prompt-engineering ou https://..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:border-violet-500 outline-none" />
          </div>
          {linkUrl && (
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">
                Label CTA ({LANGS.find((l) => l.k === activeLang)?.label})
              </label>
              <input type="text" value={linkLabel[activeLang] || ''}
                onChange={(e) => markDirty(setLinkLabel, { ...linkLabel, [activeLang]: e.target.value })}
                placeholder="Saber mais"
                maxLength={30}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-violet-500 outline-none" />
            </div>
          )}
        </div>
      </section>

      {/* Comportamento */}
      <section className="bg-white rounded-2xl border border-slate-200 p-4">
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={dismissible}
            onChange={(e) => markDirty(setDismissible, e.target.checked)}
            className="h-4 w-4 rounded text-violet-600" />
          <div>
            <div className="text-sm font-semibold text-slate-900">Permitir fechar (X)</div>
            <p className="text-[11px] text-slate-500">Quando fechado, fica oculto 7 dias para esse visitante (cookie).</p>
          </div>
        </label>
      </section>

      {/* Sticky save */}
      <div className="sticky bottom-4 bg-white/95 backdrop-blur-sm border border-slate-200 shadow-lg rounded-2xl p-3 flex items-center justify-between">
        <div className="text-xs text-slate-500 px-2">
          {dirty ? <span className="text-amber-600 font-medium">Alterações por guardar</span> : 'Sem alterações'}
        </div>
        <button onClick={save} disabled={busy || !dirty}
          className="inline-flex items-center gap-1.5 px-5 py-2 bg-gradient-to-br from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm disabled:opacity-50">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Guardar
        </button>
      </div>
    </div>
  );
}
