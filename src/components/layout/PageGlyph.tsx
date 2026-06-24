'use client';

import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';

export const PageGlyphContext = createContext<string>('');

export function PageGlyphProvider({ value, children }: { value: string; children: ReactNode }) {
  return <PageGlyphContext.Provider value={value}>{children}</PageGlyphContext.Provider>;
}

/**
 * Glifo (emoji) do cabecalho da pagina, resolvido centralmente por rota
 * (tabela nl_page_glyphs + RPC nl_page_glyph) e injetado via AppShell -> contexto.
 * Renderiza SEMPRE um emoji a cores (nunca um icone de linha), garantindo
 * consistencia em todas as paginas sem excecao. `fallback` cobre casos sem contexto.
 */
export function PageGlyph({ fallback, className }: { fallback?: string; className?: string }) {
  const ctx = useContext(PageGlyphContext);
  const emoji = (ctx && ctx.trim()) || (fallback && fallback.trim()) || '📄';
  return <span className={className || 'text-2xl sm:text-3xl leading-none'}>{emoji}</span>;
}
