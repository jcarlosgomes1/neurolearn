'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';

interface GenInput {
  course_id: string;
  topic: string;
  language?: string;
  difficulty?: string;
  module_index?: number | null;
  lesson_index?: number | null;
  lang?: string;
}

interface GenResult {
  ok: boolean;
  error?: string;
  id?: string;
  model?: string;
  exercise?: { title: string; prompt: string; starter_code: string; solution: string; tests: string; language: string; max_score: number };
}

export async function generateCodeExerciseAction(input: GenInput): Promise<GenResult> {
  try {
    const sb = await createClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return { ok: false, error: 'Sessão expirada.' };
    const { data: profile } = await sb.from('nl_profiles').select('role').eq('id', user.id).single();
    if (!profile || !['admin', 'super_admin'].includes((profile as { role: string }).role)) {
      return { ok: false, error: 'Permissão negada.' };
    }
    if (!input.course_id?.trim() || !input.topic?.trim()) return { ok: false, error: 'Curso e tópico são obrigatórios.' };

    const admin = createAdminClient();
    const { data, error } = await admin.functions.invoke('generate-code-exercise', {
      body: {
        course_id: input.course_id.trim(),
        topic: input.topic.trim(),
        language: input.language || 'python',
        difficulty: input.difficulty || 'intermédio',
        module_index: input.module_index ?? null,
        lesson_index: input.lesson_index ?? null,
        lang: input.lang || 'pt',
      },
    });
    if (error) return { ok: false, error: error.message };
    const r = data as GenResult;
    if (!r?.ok) return { ok: false, error: r?.error || 'Falha na geração.' };
    return r;
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function generateOpenExerciseAction(input: {
  course_id: string; topic: string; difficulty?: string;
  module_index?: number | null; lesson_index?: number | null; lang?: string;
}): Promise<{ ok: boolean; error?: string; id?: string; model?: string }> {
  try {
    const sb = await createClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return { ok: false, error: 'Sessão expirada.' };
    const { data: profile } = await sb.from('nl_profiles').select('role').eq('id', user.id).single();
    if (!profile || !['admin', 'super_admin'].includes((profile as { role: string }).role)) {
      return { ok: false, error: 'Permissão negada.' };
    }
    if (!input.course_id?.trim() || !input.topic?.trim()) return { ok: false, error: 'Curso e tópico são obrigatórios.' };

    const admin = createAdminClient();
    const { data, error } = await admin.functions.invoke('generate-open-exercise', {
      body: {
        course_id: input.course_id.trim(),
        topic: input.topic.trim(),
        difficulty: input.difficulty || 'intermédio',
        module_index: input.module_index ?? null,
        lesson_index: input.lesson_index ?? null,
        lang: input.lang || 'pt',
      },
    });
    if (error) return { ok: false, error: error.message };
    const r = data as { ok?: boolean; error?: string; id?: string; model?: string };
    if (!r?.ok) return { ok: false, error: r?.error || 'Falha na geração.' };
    return { ok: true, id: r.id, model: r.model };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
