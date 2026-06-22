import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { PageGlyphProvider } from './PageGlyph';

async function readPathname(): Promise<string> {
  try {
    const h = await headers();
    return h.get('x-invoke-path') || h.get('next-url') || h.get('x-pathname') || '';
  } catch {
    return '';
  }
}

/**
 * Resolve o glifo da rota atual (nl_page_glyphs via RPC nl_page_glyph) e injeta-o
 * por contexto, para as areas in-app que NAO usam o AppShell (conta, teach, empresa).
 * Basta envolver {children} no layout dessas areas para o cabecalho ter glifo central.
 */
export async function RouteGlyphProvider({ children }: { children: React.ReactNode }) {
  let glyph = '';
  try {
    const path = await readPathname();
    const sb = await createClient();
    const { data } = await sb.rpc('nl_page_glyph', { p_path: path });
    if (typeof data === 'string' && data) glyph = data;
  } catch {}
  return <PageGlyphProvider value={glyph}>{children}</PageGlyphProvider>;
}
