import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

function pad(n: number) { return String(n).padStart(2, '0'); }
function toICS(d: Date) {
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
}
function esc(s: string) {
  return String(s || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}
function fold(line: string) {
  if (line.length <= 73) return line;
  const out: string[] = [line.slice(0, 73)];
  let s = line.slice(73);
  while (s.length > 72) { out.push(' ' + s.slice(0, 72)); s = s.slice(72); }
  out.push(' ' + s);
  return out.join('\r\n');
}

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const sb = await createClient();
  const { data } = await sb.rpc('nl_event_public_get', { p_slug: slug });
  const ev = data as any;
  if (!ev?.ok || !ev.event_at) return new Response('Not found', { status: 404 });

  const start = new Date(ev.event_at);
  const durMin = Number(ev.duration_min) || 60;
  const end = new Date(start.getTime() + durMin * 60000);
  const base = process.env.NEXT_PUBLIC_BASE_URL || process.env.PUBLIC_BASE_URL || 'https://neurolearn-rosy.vercel.app';
  const pageUrl = `${base}/${ev.idioma || 'pt'}/evento/${slug}`;
  const loc = ev.room_url || (ev.modalidade === 'presencial' ? '' : 'Online');
  const sub = ev.pagina?.subtitulo || ev.pagina?.hero_titulo || '';
  const desc = [sub, pageUrl].filter(Boolean).join('\n\n');

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//NeuroLearn//Eventos//PT',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:event-${slug}@neurolearn`,
    `DTSTAMP:${toICS(new Date())}`,
    `DTSTART:${toICS(start)}`,
    `DTEND:${toICS(end)}`,
    `SUMMARY:${esc(ev.title || 'Evento')}`,
    `DESCRIPTION:${esc(desc)}`,
    loc ? `LOCATION:${esc(loc)}` : '',
    `URL:${esc(pageUrl)}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean).map(fold);

  return new Response(lines.join('\r\n'), {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="${slug}.ics"`,
      'Cache-Control': 'public, max-age=300',
    },
  });
}
