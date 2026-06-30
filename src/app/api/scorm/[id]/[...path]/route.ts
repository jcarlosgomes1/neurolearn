import { NextRequest } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const CT: Record<string, string> = {
  html: 'text/html; charset=utf-8', htm: 'text/html; charset=utf-8', js: 'text/javascript; charset=utf-8',
  mjs: 'text/javascript; charset=utf-8', css: 'text/css; charset=utf-8', json: 'application/json; charset=utf-8',
  xml: 'application/xml; charset=utf-8', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif',
  svg: 'image/svg+xml', webp: 'image/webp', ico: 'image/x-icon', mp4: 'video/mp4', webm: 'video/webm', mp3: 'audio/mpeg',
  wav: 'audio/wav', ogg: 'audio/ogg', woff: 'font/woff', woff2: 'font/woff2', ttf: 'font/ttf', eot: 'application/vnd.ms-fontobject',
  pdf: 'application/pdf', txt: 'text/plain; charset=utf-8', map: 'application/json',
};
function ctype(p: string): string { return CT[(p.toLowerCase().split('.').pop() || '')] || 'application/octet-stream'; }

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string; path: string[] }> }) {
  const { id, path } = await ctx.params;
  const rel = (path || []).join('/');
  if (!id || !rel || rel.includes('..')) return new Response('Bad request', { status: 400 });

  // Acesso por sessão (cookie) — mesma origem que o player
  const sb = await createClient();
  const { data: allowed } = await sb.rpc('nl_scorm_can_access', { p_package_id: id });
  if (allowed !== true) return new Response('Forbidden', { status: 403 });

  // Stream do bucket privado via service role
  const admin = createAdminClient();
  const { data, error } = await admin.storage.from('scorm-content').download(`${id}/files/${rel}`);
  if (error || !data) return new Response('Not found', { status: 404 });
  const buf = await data.arrayBuffer();
  return new Response(buf, {
    status: 200,
    headers: {
      'Content-Type': ctype(rel),
      'Cache-Control': 'private, max-age=300',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
