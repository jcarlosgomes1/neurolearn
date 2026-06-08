import { redirect, notFound } from 'next/navigation';
import { Link } from '@/i18n/routing';
import { createClient } from '@/lib/supabase/server';
import { getOrgDetailsAction } from '../actions';
import { ArrowLeft, Building2, Edit3, ExternalLink, Users, CreditCard, Activity, Settings2, Palette, ShoppingBag, UsersRound } from 'lucide-react';

export const metadata = { title: 'Detalhes Empresa · Admin' };
export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect(`/${locale}/login`);
  const { data: profile } = await sb.from('nl_profiles').select('role').eq('id', user.id).single();
  if (!profile || !['admin','super_admin'].includes(profile.role)) redirect(`/${locale}`);
  
  const r = await getOrgDetailsAction(id);
  if (!r.ok) notFound();
  const { org, features, subscription, members, current_usage } = r;
  
  const enabledFeatures = Object.entries(features || {})
    .filter(([k, v]) => k.startsWith('enable_') && v === true)
    .map(([k]) => k.replace('enable_', '').replace(/_/g, ' '));
  
  return (
    <div className="px-4 sm:px-6 py-6 max-w-5xl mx-auto">
      <Link href={'/admin/empresas' as any} className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-brand-700 mb-4">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>
      
      <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
        <div className="flex items-center gap-4">
          {org.logo_url ? (
            <img src={org.logo_url} alt={org.name} className="h-16 w-16 rounded-xl object-cover" />
          ) : (
            <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-brand-500 to-violet-600 text-white flex items-center justify-center font-bold text-2xl">
              {org.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{org.name}</h1>
            <div className="text-sm text-slate-500 flex items-center gap-2 mt-0.5">
              <span>/empresa/{org.slug}</span>
              <span>·</span>
              <span>{org.country_code || '—'}</span>
              <span>·</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100">{org.plan}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/empresa/${org.slug}` as any} target="_blank"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg">
            <ExternalLink className="h-4 w-4" /> Workspace
          </Link>
          <Link href={`/admin/empresas/${org.id}/editar` as any}
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg">
            <Edit3 className="h-4 w-4" /> Editar
          </Link>
        </div>
      </div>

      {/* Quick actions — sub-páginas administrativas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-6">
        <Link href={{ pathname: '/admin/empresas/[id]/features', params: { id: org.id } } as any}
          className="group flex items-center gap-3 bg-white border border-slate-200 hover:border-violet-300 hover:shadow-md transition-all rounded-xl p-3">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform">
            <Settings2 className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-sm text-slate-900">Funcionalidades</div>
            <div className="text-[10px] text-slate-500">Toggles & limites</div>
          </div>
        </Link>
        <Link href={{ pathname: '/admin/empresas/[id]/branding', params: { id: org.id } } as any}
          className="group flex items-center gap-3 bg-white border border-slate-200 hover:border-purple-300 hover:shadow-md transition-all rounded-xl p-3">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-fuchsia-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform">
            <Palette className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-sm text-slate-900">Branding</div>
            <div className="text-[10px] text-slate-500">Logo, cores, domínio</div>
          </div>
        </Link>
        <Link href={{ pathname: '/admin/empresas/[id]/marketplace', params: { id: org.id } } as any}
          className="group flex items-center gap-3 bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all rounded-xl p-3">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform">
            <ShoppingBag className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-sm text-slate-900">Marketplace</div>
            <div className="text-[10px] text-slate-500">Cursos para colab.</div>
          </div>
        </Link>
        <Link href={{ pathname: '/empresa/[slug]/membros', params: { slug: org.slug } } as any} target="_blank"
          className="group flex items-center gap-3 bg-white border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all rounded-xl p-3">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform">
            <UsersRound className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-sm text-slate-900">Membros</div>
            <div className="text-[10px] text-slate-500">Convites & gestão</div>
          </div>
        </Link>
      </div>
      
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <Users className="h-5 w-5 text-slate-400 mb-2" />
          <div className="text-2xl font-bold text-slate-900">{members?.length || 0}</div>
          <div className="text-xs text-slate-500">Membros</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <CreditCard className="h-5 w-5 text-slate-400 mb-2" />
          <div className="text-2xl font-bold text-slate-900">{org.seats_used} / {org.seats_purchased || '∞'}</div>
          <div className="text-xs text-slate-500">Seats</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <Activity className="h-5 w-5 text-slate-400 mb-2" />
          <div className="text-2xl font-bold text-slate-900">{enabledFeatures.length}</div>
          <div className="text-xs text-slate-500">Módulos activos</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <Building2 className="h-5 w-5 text-slate-400 mb-2" />
          <div className="text-sm font-bold text-slate-900 capitalize">{subscription?.status || 'inactive'}</div>
          <div className="text-xs text-slate-500">Subscription</div>
        </div>
      </div>

      {/* Módulos */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6">
        <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Activity className="h-5 w-5 text-brand-600" /> Módulos Activos
        </h2>
        {enabledFeatures.length === 0 ? (
          <p className="text-sm text-slate-500">Nenhum módulo activo. <Link href={{ pathname: '/admin/empresas/[id]/features', params: { id: org.id } } as any} className="text-brand-600 hover:underline">Configurar →</Link></p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {enabledFeatures.map((f) => (
              <span key={f} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full capitalize">
                ✓ {f}
              </span>
            ))}
          </div>
        )}
        
        <div className="grid sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-100 text-sm">
          <div>
            <div className="text-slate-500 text-xs">Marketplace seats</div>
            <div className="font-semibold text-slate-900">{features?.max_marketplace_seats ?? 0}</div>
          </div>
          <div>
            <div className="text-slate-500 text-xs">Instructor hires/mês</div>
            <div className="font-semibold text-slate-900">{features?.max_instructor_hires_per_month ?? 0}</div>
          </div>
          <div>
            <div className="text-slate-500 text-xs">Talent hires/ano</div>
            <div className="font-semibold text-slate-900">{features?.max_talent_hires_per_year ?? 0}</div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100">
          <Link href={{ pathname: '/admin/empresas/[id]/features', params: { id: org.id } } as any}
            className="inline-flex items-center gap-1 text-xs text-violet-700 hover:text-violet-900 font-semibold">
            <Settings2 className="h-3 w-3" /> Configurar funcionalidades e limites →
          </Link>
        </div>
      </div>

      {/* Subscription */}
      {subscription && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6">
          <h2 className="font-semibold text-slate-900 mb-4">Subscription</h2>
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            <div><span className="text-slate-500">Plan:</span> <span className="font-medium">{subscription.plan_id}</span></div>
            <div><span className="text-slate-500">Billing:</span> <span className="font-medium">{subscription.billing_cycle}</span></div>
            <div><span className="text-slate-500">Status:</span> <span className="font-medium capitalize">{subscription.status}</span></div>
            <div><span className="text-slate-500">Stripe customer:</span> <code className="text-xs">{subscription.stripe_customer_id || '—'}</code></div>
          </div>
        </div>
      )}
      
      {/* Trial info */}
      {org.trial_ends_at && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm">
          <strong className="text-amber-800">Trial</strong> termina em <strong>{new Date(org.trial_ends_at).toLocaleDateString(locale)}</strong>
        </div>
      )}
    </div>
  );
}
