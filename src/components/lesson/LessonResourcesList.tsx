'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Github, FileCode, ExternalLink, Download, Box, BookOpen, Loader2 } from 'lucide-react';

interface Resource {
  id: string; resource_type: string; url: string; label: string; description: string | null;
  sort_order: number; required: boolean;
}

const TYPE_META: Record<string, { icon: any; cls: string; cta: string }> = {
  github_repo:      { icon: Github,   cls: 'from-slate-700 to-slate-900',   cta: 'Abrir no GitHub' },
  notebook_python:  { icon: FileCode, cls: 'from-amber-500 to-orange-600',  cta: 'Abrir notebook' },
  notebook_jupyter: { icon: FileCode, cls: 'from-orange-500 to-red-600',    cta: 'Abrir Jupyter' },
  external_link:    { icon: ExternalLink, cls: 'from-sky-500 to-blue-600',  cta: 'Visitar' },
  file_download:    { icon: Download, cls: 'from-emerald-500 to-teal-600',  cta: 'Descarregar' },
  sandbox_code:     { icon: Box,      cls: 'from-violet-500 to-fuchsia-600', cta: 'Abrir sandbox' },
};

export function LessonResourcesList({ courseId, moduleIndex, lessonIndex, titleLabel, emptyLabel }: {
  courseId: string; moduleIndex: number; lessonIndex: number; titleLabel: string; emptyLabel: string;
}) {
  const [items, setItems] = useState<Resource[] | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const sb = createClient();
        const { data } = await sb.rpc('nl_lesson_resources_list', {
          p_course_id: courseId, p_module_index: moduleIndex, p_lesson_index: lessonIndex,
        });
        setItems(Array.isArray(data) ? data : []);
      } catch { setItems([]); }
    })();
  }, [courseId, moduleIndex, lessonIndex]);

  if (items === null) {
    return <div className="flex items-center gap-2 text-xs text-slate-400"><Loader2 className="h-3 w-3 animate-spin" /> A carregar recursos…</div>;
  }
  if (items.length === 0) return null; // Não mostra nada se vazio

  return (
    <section className="mt-6 bg-gradient-to-br from-slate-50 to-white border border-slate-200 rounded-2xl p-4 sm:p-5">
      <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-3">
        <BookOpen className="h-4 w-4 text-slate-600" /> {titleLabel}
      </h3>
      <div className="grid sm:grid-cols-2 gap-2.5">
        {items.map((r) => {
          const m = TYPE_META[r.resource_type] || TYPE_META.external_link;
          const Icon = m.icon;
          return (
            <a key={r.id} href={r.url} target="_blank" rel="noopener noreferrer"
              className="group flex items-start gap-3 bg-white border border-slate-200 rounded-xl p-3 hover:border-violet-300 hover:shadow-md transition-all">
              <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${m.cls} text-white flex items-center justify-center shadow-sm flex-shrink-0 group-hover:scale-105 transition-transform`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-semibold text-sm text-slate-900 truncate">{r.label}</span>
                  {r.required && <span className="text-[9px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Obrigatório</span>}
                </div>
                {r.description && <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{r.description}</p>}
                <span className="text-[10px] text-violet-600 group-hover:text-violet-800 font-semibold mt-1 inline-flex items-center gap-0.5">
                  {m.cta} <ExternalLink className="h-2.5 w-2.5" />
                </span>
              </div>
            </a>
          );
        })}
      </div>
    </section>
  );
}
