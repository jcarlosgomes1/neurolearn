import { createClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, Users } from 'lucide-react';
import { MembersClient } from './MembersClient';

export const dynamic = 'force-dynamic';

export default async function MembersPage({ params }: { params: Promise<{ slug: string; locale: string }> }) {
  const { slug } = await params;
  const sb = await createClient();
  const t = await getTranslations();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect(`/auth/login?next=/empresa/${slug}/membros`);

  const { data: org } = await sb.from('nl_organizations').select('id, slug, name, plan, seats_purchased, seats_used').eq('slug', slug).maybeSingle();
  if (!org) notFound();

  // Verifica se user é admin org (ou platform admin)
  const { data: isOrgAdmin } = await sb.rpc('nl_is_org_admin', { p_org_id: org.id });
  const { data: isPlatformAdmin } = await sb.rpc('nl_is_platform_admin');
  if (!isOrgAdmin && !isPlatformAdmin) redirect(`/empresa/${slug}`);

  const [{ data: members }, { data: invitations }] = await Promise.all([
    sb.rpc('nl_my_org_members_list', { p_org_id: org.id }),
    sb.rpc('nl_my_org_invitations_list', { p_org_id: org.id }),
  ]);

  function safeT(key: string, fb: string): string {
    try { const v = t(key as any); if (v && typeof v === 'string' && v !== key) return v; } catch {}
    return fb;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link href={`/empresa/${slug}`}
        className="group inline-flex items-center gap-1.5 mb-5 text-sm text-slate-500 hover:text-slate-900 font-medium">
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" /> {org.name}
      </Link>
      <header className="mb-8">
        <div className="flex items-center gap-2 text-violet-600 text-xs font-semibold uppercase tracking-wider mb-1">
          <Users className="h-3.5 w-3.5" /> {safeT('empresa.members.eyebrow', 'Empresa · Membros')}
        </div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{safeT('empresa.members.title', 'Gerir membros e convites')}</h1>
        <p className="text-sm text-slate-600 mt-1.5 max-w-2xl leading-relaxed">
          {safeT('empresa.members.description', 'Convida colaboradores, gere roles e revoga acessos.')}
        </p>
      </header>
      <MembersClient
        orgId={org.id}
        orgSlug={org.slug}
        seatsTotal={org.seats_purchased || 0}
        seatsUsed={org.seats_used || 0}
        plan={org.plan || 'trial'}
        currentUserId={user.id}
        members={Array.isArray(members) ? members : []}
        invitations={Array.isArray(invitations) ? invitations : []}
      />
    </div>
  );
}
