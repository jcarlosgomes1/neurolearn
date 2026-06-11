/**
 * Guard client-side para o modo espreitar (peek). Le o cookie nl_peek
 * (definido com httpOnly:false, logo legivel por JS) e bloqueia escritas
 * feitas diretamente pelo browser supabase client enquanto se espreita.
 * Complementa o assertNotPeek() server-side (que so cobre server actions).
 */
export function isPeekingClient(): boolean {
  if (typeof document === 'undefined') return false;
  return /(?:^|;\s*)nl_peek=(?:aluno|instrutor)(?:;|$)/.test(document.cookie);
}

export function assertNotPeekClient(): void {
  if (isPeekingClient()) {
    throw new Error('PEEK_READ_ONLY: acao bloqueada no modo espreitar (so leitura).');
  }
}
