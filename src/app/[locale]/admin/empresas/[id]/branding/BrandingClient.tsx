'use client';

import { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from '@/i18n/routing';
import { toast } from 'sonner';
import { Save, Upload, Trash2, Image as ImageIcon, Palette as PaletteIcon, Type, Globe, Mail, MessageCircle, Loader2, ExternalLink, Check, AlertCircle } from 'lucide-react';

interface Branding {
  logo_url?: string; logo_dark_url?: string; favicon_url?: string;
  primary_color?: string; accent_color?: string;
  background_color?: string; text_color?: string;
  font_family?: string; custom_css?: string;
  subdomain?: string; custom_domain?: string;
  custom_domain_verified?: boolean;
  email_sender_name?: string; email_sender_domain?: string;
  email_sender_verified?: boolean;
  welcome_message?: string; footer_message?: string;
  social_links?: Record<string, string>;
}

export function BrandingClient({ orgId, orgName, initial, savedLabel }: { orgId: string; orgName: string; initial: Branding; savedLabel: string }) {
  const router = useRouter();
  const [form, setForm] = useState<Branding>(initial || {});
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);

  function set<K extends keyof Branding>(k: K, v: Branding[K]) { setForm((p) => ({ ...p, [k]: v })); setDirty(true); }

  async function uploadImage(field: 'logo_url' | 'logo_dark_url' | 'favicon_url', file: File) {
    if (file.size > 5 * 1024 * 1024) { toast.error('Máximo 5 MB'); return; }
    setUploading(field);
    try {
      const sb = createClient();
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = `${orgId}/${field}_${Date.now()}_${safeName}`;
      const { error: upErr } = await sb.storage.from('org-branding').upload(path, file, {
        contentType: file.type, upsert: false,
      });
      if (upErr) throw upErr;
      const { data } = sb.storage.from('org-branding').getPublicUrl(path);
      set(field, data.publicUrl);
      toast.success('Imagem carregada');
    } catch (e: any) {
      toast.error(e?.message || 'Erro no upload');
    } finally { setUploading(null); }
  }

  async function save() {
    setBusy(true);
    try {
      const sb = createClient();
      const { error } = await sb.rpc('nl_admin_org_branding_set', { p_org_id: orgId, p_data: form });
      if (error) throw error;
      toast.success(savedLabel);
      setDirty(false);
      router.refresh();
    } catch (e: any) {
      toast.error(e?.message || 'Erro');
    } finally { setBusy(false); }
  }

  return (
    <div className="space-y-6">
      {/* Logos */}
      <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <header className="px-5 py-3 border-b border-slate-100 flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 text-white flex items-center justify-center shadow-sm">
            <ImageIcon className="h-4 w-4" />
          </div>
          <h2 className="font-semibold text-sm text-slate-900">Logo & favicon</h2>
        </header>
        <div className="p-5 grid sm:grid-cols-3 gap-4">
          <ImageUpload label="Logo principal" field="logo_url" url={form.logo_url} uploading={uploading === 'logo_url'} onUpload={(f) => uploadImage('logo_url', f)} onClear={() => set('logo_url', undefined)} bg="bg-white" />
          <ImageUpload label="Logo (fundo escuro)" field="logo_dark_url" url={form.logo_dark_url} uploading={uploading === 'logo_dark_url'} onUpload={(f) => uploadImage('logo_dark_url', f)} onClear={() => set('logo_dark_url', undefined)} bg="bg-slate-900" />
          <ImageUpload label="Favicon" field="favicon_url" url={form.favicon_url} uploading={uploading === 'favicon_url'} onUpload={(f) => uploadImage('favicon_url', f)} onClear={() => set('favicon_url', undefined)} small />
        </div>
      </section>

      {/* Colors */}
      <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <header className="px-5 py-3 border-b border-slate-100 flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-fuchsia-500 to-pink-600 text-white flex items-center justify-center shadow-sm">
            <PaletteIcon className="h-4 w-4" />
          </div>
          <h2 className="font-semibold text-sm text-slate-900">Cores</h2>
        </header>
        <div className="p-5 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <ColorField label="Principal" value={form.primary_color} onChange={(v) => set('primary_color', v)} placeholder="#7c3aed" />
          <ColorField label="Accent" value={form.accent_color} onChange={(v) => set('accent_color', v)} placeholder="#ec4899" />
          <ColorField label="Fundo" value={form.background_color} onChange={(v) => set('background_color', v)} placeholder="#ffffff" />
          <ColorField label="Texto" value={form.text_color} onChange={(v) => set('text_color', v)} placeholder="#0f172a" />
        </div>
      </section>

      {/* Typography & CSS */}
      <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <header className="px-5 py-3 border-b border-slate-100 flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-sm">
            <Type className="h-4 w-4" />
          </div>
          <h2 className="font-semibold text-sm text-slate-900">Tipografia & CSS</h2>
        </header>
        <div className="p-5 space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-700 mb-1 block">Família de fonte</label>
            <input value={form.font_family || ''} onChange={(e) => set('font_family', e.target.value)} placeholder="Inter, sans-serif"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-amber-500 outline-none" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 mb-1 block">CSS customizado (avançado)</label>
            <textarea value={form.custom_css || ''} onChange={(e) => set('custom_css', e.target.value)} rows={5}
              placeholder=".btn-primary { letter-spacing: 0.02em; }"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:border-amber-500 outline-none resize-y" />
          </div>
        </div>
      </section>

      {/* Domain */}
      <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <header className="px-5 py-3 border-b border-slate-100 flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 text-white flex items-center justify-center shadow-sm">
            <Globe className="h-4 w-4" />
          </div>
          <h2 className="font-semibold text-sm text-slate-900">Domínio</h2>
        </header>
        <div className="p-5 space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-700 mb-1 block">Subdomínio</label>
            <div className="flex items-center">
              <input value={form.subdomain || ''} onChange={(e) => set('subdomain', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} placeholder={orgName.toLowerCase().replace(/[^a-z0-9]/g, '')}
                className="flex-1 px-3 py-2 border border-slate-200 rounded-l-lg text-sm font-mono focus:border-blue-500 outline-none" />
              <span className="px-3 py-2 bg-slate-100 border border-l-0 border-slate-200 rounded-r-lg text-sm text-slate-500 font-mono">.neurolearn.pt</span>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 mb-1 flex items-center gap-2">
              Domínio próprio
              {form.custom_domain_verified ? (
                <span className="inline-flex items-center gap-1 text-[9px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider">
                  <Check className="h-2.5 w-2.5" /> Verificado
                </span>
              ) : form.custom_domain ? (
                <span className="inline-flex items-center gap-1 text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider">
                  <AlertCircle className="h-2.5 w-2.5" /> Por verificar
                </span>
              ) : null}
            </label>
            <input value={form.custom_domain || ''} onChange={(e) => set('custom_domain', e.target.value.toLowerCase())} placeholder="aprende.empresa.com"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:border-blue-500 outline-none" />
            <p className="text-[11px] text-slate-500 mt-1.5">Aponta um CNAME para <code className="bg-slate-100 px-1 rounded">cname.neurolearn.pt</code>.</p>
          </div>
        </div>
      </section>

      {/* Email sender */}
      <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <header className="px-5 py-3 border-b border-slate-100 flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-sm">
            <Mail className="h-4 w-4" />
          </div>
          <h2 className="font-semibold text-sm text-slate-900">Email enviado em nome da empresa</h2>
        </header>
        <div className="p-5 grid sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-700 mb-1 block">Nome remetente</label>
            <input value={form.email_sender_name || ''} onChange={(e) => set('email_sender_name', e.target.value)} placeholder={`${orgName} Academy`}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-emerald-500 outline-none" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 mb-1 flex items-center gap-2">
              Domínio email
              {form.email_sender_verified ? (
                <span className="inline-flex items-center gap-1 text-[9px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider">
                  <Check className="h-2.5 w-2.5" /> Verificado
                </span>
              ) : null}
            </label>
            <input value={form.email_sender_domain || ''} onChange={(e) => set('email_sender_domain', e.target.value.toLowerCase())} placeholder="empresa.com"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:border-emerald-500 outline-none" />
          </div>
        </div>
      </section>

      {/* Mensagens */}
      <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <header className="px-5 py-3 border-b border-slate-100 flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 text-white flex items-center justify-center shadow-sm">
            <MessageCircle className="h-4 w-4" />
          </div>
          <h2 className="font-semibold text-sm text-slate-900">Mensagens</h2>
        </header>
        <div className="p-5 space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-700 mb-1 block">Mensagem de boas-vindas</label>
            <textarea value={form.welcome_message || ''} onChange={(e) => set('welcome_message', e.target.value)} rows={2}
              placeholder={`Bem-vindo à academia ${orgName}!`}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-violet-500 outline-none resize-y" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 mb-1 block">Mensagem footer</label>
            <input value={form.footer_message || ''} onChange={(e) => set('footer_message', e.target.value)}
              placeholder={`© ${new Date().getFullYear()} ${orgName}. Todos os direitos reservados.`}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-violet-500 outline-none" />
          </div>
        </div>
      </section>

      {/* Sticky save bar */}
      <div className="sticky bottom-4 bg-white/95 backdrop-blur-sm border border-slate-200 shadow-lg rounded-2xl p-3 flex items-center justify-between">
        <div className="text-xs text-slate-500 px-2">{dirty ? <span className="text-amber-600 font-medium">Alterações por guardar</span> : 'Sem alterações pendentes'}</div>
        <button onClick={save} disabled={busy || !dirty}
          className="inline-flex items-center gap-1.5 px-5 py-2 bg-gradient-to-br from-fuchsia-600 to-pink-600 hover:from-fuchsia-700 hover:to-pink-700 text-white text-sm font-semibold rounded-lg shadow-sm disabled:opacity-50">
          <Save className="h-4 w-4" /> {busy ? 'A guardar…' : 'Guardar branding'}
        </button>
      </div>
    </div>
  );
}

function ImageUpload({ label, field, url, uploading, onUpload, onClear, bg = 'bg-white', small = false }: {
  label: string; field: string; url?: string; uploading: boolean;
  onUpload: (f: File) => void; onClear: () => void; bg?: string; small?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div>
      <label className="text-xs font-semibold text-slate-700 mb-1 block">{label}</label>
      <div className={`relative ${bg} border-2 border-dashed border-slate-200 rounded-xl ${small ? 'h-20' : 'h-28'} flex items-center justify-center group hover:border-violet-300 transition-colors cursor-pointer`}
        onClick={() => ref.current?.click()}>
        {url ? (
          <>
            <img src={url} alt={label} className={`${small ? 'max-h-12' : 'max-h-20'} max-w-full object-contain`} />
            <button onClick={(e) => { e.stopPropagation(); onClear(); }} className="absolute top-1 right-1 p-1 bg-white/90 hover:bg-rose-100 hover:text-rose-600 rounded-md opacity-0 group-hover:opacity-100">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </>
        ) : uploading ? (
          <Loader2 className="h-5 w-5 animate-spin text-violet-500" />
        ) : (
          <div className="text-center">
            <Upload className="h-5 w-5 mx-auto text-slate-300 group-hover:text-violet-400" />
            <div className="text-[11px] text-slate-400 mt-1">Carregar</div>
          </div>
        )}
        <input ref={ref} type="file" className="hidden" accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml,image/x-icon"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f); e.target.value = ''; }} />
      </div>
    </div>
  );
}

function ColorField({ label, value, onChange, placeholder }: { label: string; value?: string; onChange: (v: string) => void; placeholder: string }) {
  const v = value || '';
  const isValid = /^#[0-9a-f]{6}$/i.test(v);
  return (
    <div>
      <label className="text-xs font-semibold text-slate-700 mb-1 block">{label}</label>
      <div className="flex items-center gap-2">
        <input type="color" value={isValid ? v : '#000000'} onChange={(e) => onChange(e.target.value)}
          className="h-9 w-12 border border-slate-200 rounded-lg cursor-pointer" />
        <input value={v} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
          className="flex-1 px-2 py-2 border border-slate-200 rounded-lg text-xs font-mono outline-none focus:border-fuchsia-500" />
      </div>
    </div>
  );
}
