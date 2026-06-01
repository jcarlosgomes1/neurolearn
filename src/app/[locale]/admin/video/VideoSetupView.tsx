'use client';

import { useEffect, useState } from 'react';
import { Link } from '@/i18n/routing';
import { SUPABASE_URL } from '@/lib/supabase/config';
import { createClient } from '@/lib/supabase/client';

interface ReadinessCheck { check_name: string; status: string; detail: string }
interface Upload { id: string; title: string; mux_status: string | null; mux_playback_id: string | null; course_id: string; module_index: number; lesson_index: number; video_duration_seconds: number | null; uploaded_at: string }

export function VideoSetupView() {
  const [checks, setChecks] = useState<ReadinessCheck[]>([]);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [muxConfigured, setMuxConfigured] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const sb = createClient();
      const [rRes, uRes, statusRes] = await Promise.all([
        sb.rpc('nl_mux_readiness'),
        sb.from('nl_lesson_uploads').select('id, title, mux_status, mux_playback_id, course_id, module_index, lesson_index, video_duration_seconds, uploaded_at').order('uploaded_at', { ascending: false }).limit(20),
        fetch(`${SUPABASE_URL}/functions/v1/mux-upload`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${(await sb.auth.getSession()).data.session?.access_token || ''}` },
          body: JSON.stringify({ action: 'status' }),
        }).then(r => r.json()).catch(() => ({ mux_configured: false })),
      ]);
      setChecks((rRes.data as ReadinessCheck[]) || []);
      setUploads((uRes.data as Upload[]) || []);
      setMuxConfigured(statusRes.mux_configured ?? false);
      setLoading(false);
    }
    load();
  }, []);

  const readyVideos = uploads.filter(u => u.mux_status === 'ready').length;
  const processing = uploads.filter(u => u.mux_status === 'preparing' || u.mux_status === 'waiting').length;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <Link href={'/admin' as any} className="text-sm text-brand-600 hover:underline">← Cockpit</Link>
      <div className="mt-3">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">🎥 Vídeo (Mux)</h1>
        <p className="text-sm text-slate-500 mt-1">Configuração de hosting e streaming de vídeo via Mux. Esta página fica pronta para activares quando criares conta Mux.</p>
      </div>

      <div className={`mt-6 rounded-2xl p-5 border-2 ${muxConfigured ? 'bg-emerald-50 border-emerald-200' : 'bg-blue-50 border-blue-200'}`}>
        <h2 className="font-bold text-slate-900 text-lg">
          {muxConfigured ? '✅ Mux activo' : '🔧 Mux preparado — não activado'}
        </h2>
        <p className="text-sm text-slate-700 mt-1">
          {muxConfigured 
            ? `${readyVideos} vídeos prontos · ${processing} a processar` 
            : 'Schema, edge functions e player prontos. Falta criares conta Mux e adicionares chaves.'}
        </p>
      </div>

      {!muxConfigured && (
        <section className="mt-6 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6">
          <h3 className="font-bold text-slate-900 mb-3">🚀 Passos para activar Mux</h3>
          <ol className="space-y-3 text-sm text-slate-700">
            <li className="flex gap-3"><span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center">1</span><div><strong>Cria conta em <a href="https://mux.com" target="_blank" rel="noopener" className="text-brand-600 hover:underline">mux.com</a></strong> (pricing pay-as-you-go: ~$0.001/min stored + $0.0012/min streamed)</div></li>
            <li className="flex gap-3"><span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center">2</span><div><strong>Settings → API Access Tokens</strong> → cria token novo com permissão "Mux Video"</div></li>
            <li className="flex gap-3"><span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center">3</span><div><strong>Adiciona secrets em Supabase</strong>: <code className="text-xs bg-slate-100 px-1 rounded">MUX_TOKEN_ID</code> e <code className="text-xs bg-slate-100 px-1 rounded">MUX_TOKEN_SECRET</code></div></li>
            <li className="flex gap-3"><span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center">4</span><div><strong>Settings → Webhooks</strong> no Mux Dashboard → URL: <code className="text-xs bg-slate-100 px-1 rounded break-all">https://obpezocujzdaznrdgwoo.supabase.co/functions/v1/mux-webhook</code></div></li>
            <li className="flex gap-3"><span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center">5</span><div><strong>Copia o webhook signing secret</strong> e adiciona em Supabase como <code className="text-xs bg-slate-100 px-1 rounded">MUX_WEBHOOK_SECRET</code></div></li>
            <li className="flex gap-3"><span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center">6</span><div><strong>Subscrever eventos</strong>: <code className="text-xs bg-slate-100 px-1 rounded">video.asset.ready</code>, <code className="text-xs bg-slate-100 px-1 rounded">video.asset.errored</code>, <code className="text-xs bg-slate-100 px-1 rounded">video.upload.asset_created</code></div></li>
          </ol>
        </section>
      )}

      <section className="mt-6">
        <h2 className="text-lg font-bold text-slate-900 mb-3">📋 Checklist</h2>
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="p-6 text-center text-slate-400">A carregar...</div>
          ) : checks.map((c, i) => (
            <div key={c.check_name} className={`px-4 py-3 flex items-center gap-3 ${i > 0 ? 'border-t border-slate-100' : ''}`}>
              <span className={`text-lg ${c.status === 'ok' ? 'text-emerald-500' : 'text-amber-500'}`}>
                {c.status === 'ok' ? '✓' : '⏳'}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-slate-900 capitalize">{c.check_name.replace(/_/g, ' ')}</div>
                <div className="text-xs text-slate-500 truncate font-mono">{c.detail}</div>
              </div>
            </div>
          ))}
          <div className="px-4 py-3 border-t border-slate-100 flex items-center gap-3">
            <span className={`text-lg ${muxConfigured ? 'text-emerald-500' : 'text-slate-300'}`}>
              {muxConfigured ? '✓' : '○'}
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-slate-900">Mux API tokens</div>
              <div className="text-xs text-slate-500">{muxConfigured ? 'MUX_TOKEN_ID + MUX_TOKEN_SECRET configurados' : 'Não configurados'}</div>
            </div>
          </div>
        </div>
      </section>

      {uploads.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-bold text-slate-900 mb-3">📼 Vídeos existentes ({uploads.length})</h2>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
            {uploads.map((u) => (
              <div key={u.id} className="p-3 flex items-center gap-3">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${u.mux_status === 'ready' ? 'bg-emerald-50 text-emerald-700' : u.mux_status === 'errored' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'}`}>
                  {u.mux_status || 'sem mux'}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-900 truncate">{u.title}</div>
                  <div className="text-xs text-slate-500">{u.course_id} · módulo {u.module_index + 1}, aula {u.lesson_index + 1}{u.video_duration_seconds ? ` · ${Math.floor(u.video_duration_seconds / 60)}min` : ''}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
