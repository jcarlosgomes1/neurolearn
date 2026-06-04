import { Link } from '@/i18n/routing';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Package, Plus, Sliders, FileText, TrendingUp } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect(`/${locale}/login`);
  const { data: profile } = await sb.from('nl_profiles').select('role').eq('id', user.id).single();
  if (!profile || !['admin','super_admin'].includes(profile.role)) redirect(`/${locale}/conta`);

  const [{ data: plans }, { data: addons }, { data: settings }] = await Promise.all([
    sb.rpc('nl_admin_billing_plans_list'),
    sb.rpc('nl_admin_billing_addons_list'),
    sb.rpc('nl_admin_marketplace_settings_list'),
  ]);
  const settingsUnset = (settings as any[] || []).filter((s) => s.value === null).length;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Billing & Planos</h1>
        <p className="text-sm text-slate-500 mt-1">
          Tudo configurável: preços, features, quotas, addons, marketplace. Nada hardcoded.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat icon={<Package className="h-4 w-4" />} label="Planos" value={(plans as any[] || []).length} color="text-brand-700" />
        <Stat icon={<Plus className="h-4 w-4" />} label="Add-ons" value={(addons as any[] || []).length} color="text-emerald-700" />
        <Stat icon={<Sliders className="h-4 w-4" />} label="Settings" value={(settings as any[] || []).length} color="text-indigo-700" sub={settingsUnset > 0 ? `${settingsUnset} sem valor` : 'todos configurados'} subColor={settingsUnset > 0 ? 'text-amber-600' : 'text-emerald-600'} />
        <Stat icon={<TrendingUp className="h-4 w-4" />} label="Subscrições activas" value={0} color="text-slate-700" sub="sem orgs ainda" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <SectionCard 
          href={`/admin/billing/planos`} 
          locale={locale}
          icon={<Package className="h-5 w-5 text-brand-600" />}
          title="Planos"
          description="Cria tiers, define preços (flat + per-seat), quotas (IA, storage, seats), trial e features incluídas."
        />
        <SectionCard 
          href={`/admin/billing/addons`} 
          locale={locale}
          icon={<Plus className="h-5 w-5 text-emerald-600" />}
          title="Add-ons"
          description="Funcionalidades extra: catálogo B2C, talent search, SSO, API, custom domain — todos configuráveis."
        />
        <SectionCard 
          href={`/admin/billing/marketplace`} 
          locale={locale}
          icon={<Sliders className="h-5 w-5 text-indigo-600" />}
          title="Marketplace"
          description="Talent placement fee, catalog revenue share, inter-org take rate. Tudo em settings dinâmicas."
        />
        <SectionCard 
          href={`/admin/billing/assinaturas`} 
          locale={locale}
          icon={<FileText className="h-5 w-5 text-slate-600" />}
          title="Subscrições"
          description="Todas as empresas com sub activa, status, próxima factura, manual override."
          disabled
        />
      </div>

      {settingsUnset > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="text-sm font-semibold text-amber-900">⚠️ {settingsUnset} setting(s) sem valor</div>
          <p className="text-xs text-amber-800 mt-1">
            Marketplace settings críticos (placement fee, take rates) precisam de ser definidos antes de activar marketplace.
            <Link href={`/admin/billing/marketplace` as any} className="underline ml-1">Configurar →</Link>
          </p>
        </div>
      )}
    </div>
  );
}

function Stat({ icon, label, value, color, sub, subColor }: { icon: React.ReactNode; label: string; value: number | string; color: string; sub?: string; subColor?: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className={`flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold ${color}`}>{icon}{label}</div>
      <div className={`mt-1 text-2xl font-bold ${color}`}>{value}</div>
      {sub && <div className={`text-[10px] ${subColor || 'text-slate-500'} mt-1`}>{sub}</div>}
    </div>
  );
}

function SectionCard({ href, locale, icon, title, description, disabled }: { href: string; locale: string; icon: React.ReactNode; title: string; description: string; disabled?: boolean }) {
  if (disabled) {
    return (
      <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 opacity-50">
        <div className="flex items-center gap-2 mb-1">{icon}<h3 className="font-semibold text-slate-700">{title}</h3>
          <span className="text-[10px] uppercase font-bold tracking-wider bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded">em breve</span>
        </div>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
    );
  }
  return (
    <Link href={href as any} className="bg-white rounded-xl border border-slate-200 hover:border-brand-300 hover:shadow-sm transition-all p-4 group">
      <div className="flex items-center gap-2 mb-1">{icon}<h3 className="font-semibold text-slate-900 group-hover:text-brand-700">{title}</h3></div>
      <p className="text-sm text-slate-600">{description}</p>
    </Link>
  );
}
