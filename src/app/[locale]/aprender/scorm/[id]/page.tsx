import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { ScormPlayer } from './ScormPlayer';
import { XapiPlayer } from './XapiPlayer';

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ id: string; locale: string }> }) {
  const { id, locale } = await params;
  const sb = await createClient();
  const { data } = await sb.rpc('nl_scorm_open', { p_package_id: id });
  const d = data as { ok?: boolean; kind?: string; launch_href?: string; sco_id?: string; cmi?: Record<string, string> } | null;
  if (!d?.ok || !d.launch_href) notFound();

  const { data: { user } } = await sb.auth.getUser();
  const { data: pkg } = await sb.from('nl_scorm_packages').select('title, course_id').eq('id', id).maybeSingle();
  const meta = (user?.user_metadata || {}) as { full_name?: string; name?: string };
  const studentName = meta.full_name || meta.name || user?.email || 'Aluno';
  const exitHref = pkg?.course_id ? `/${locale}/learn/curso/${pkg.course_id}/mapa` : `/${locale}/admin/scorm`;

  // xAPI / cmi5 → motor LRS
  if (d.kind === 'xapi' || d.kind === 'cmi5') {
    const { data: x } = await sb.rpc('nl_xapi_open', { p_package_id: id });
    const xd = x as { ok?: boolean; token?: string; registration?: string; actor_key?: string; launch_href?: string } | null;
    if (!xd?.ok || !xd.token || !xd.launch_href) notFound();
    return (
      <XapiPlayer
        id={id}
        kind={d.kind}
        launchHref={xd.launch_href}
        token={xd.token}
        registration={xd.registration || ''}
        actorKey={xd.actor_key || ''}
        studentName={studentName}
        title={pkg?.title || 'xAPI'}
        exitHref={exitHref}
      />
    );
  }

  return (
    <ScormPlayer
      id={id}
      kind={d.kind || 'scorm12'}
      launchHref={d.launch_href}
      scoId={d.sco_id || 'default'}
      initialCmi={d.cmi || {}}
      studentId={user?.id || ''}
      studentName={studentName}
      title={pkg?.title || 'SCORM'}
      exitHref={exitHref}
    />
  );
}
