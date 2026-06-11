import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

export type PeekRole = 'aluno' | 'instrutor';

/**
 * Modo "espreitar": permite a um admin de plataforma ver as paginas reais de
 * aluno/instrutor em modo so-leitura. O estado vem do cookie nl_peek e e SEMPRE
 * re-validado server-side contra nl_is_platform_admin() (fail-closed).
 */
export async function getPeekMode(): Promise<{ active: boolean; as: PeekRole | null }> {
  try {
    const store = await cookies();
    const raw = store.get('nl_peek')?.value;
    const as: PeekRole | null = raw === 'aluno' || raw === 'instrutor' ? raw : null;
    if (!as) return { active: false, as: null };
    const sb = await createClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return { active: false, as: null };
    const { data: isAdmin } = await sb.rpc('nl_is_platform_admin');
    if (!isAdmin) return { active: false, as: null };
    return { active: true, as };
  } catch {
    return { active: false, as: null };
  }
}

/**
 * Guarda para server actions mutaveis: lanca se estivermos em modo espreitar.
 * Chamar no inicio de qualquer action que escreva dados de aluno/instrutor.
 */
export async function assertNotPeek(): Promise<void> {
  const { active } = await getPeekMode();
  if (active) {
    throw new Error('PEEK_READ_ONLY: acao bloqueada no modo espreitar (so leitura).');
  }
}
