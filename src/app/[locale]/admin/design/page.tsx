import { createClient } from '@/lib/supabase/server';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { redirect } from 'next/navigation';
import { getLocale } from 'next-intl/server';
import { DesignClient } from './DesignClient';
import { CategoryStyleControl } from './CategoryStyleControl';

export const dynamic = 'force-dynamic';

interface Surface { depth: number; emboss: boolean; }
interface Accent { base: string; soft: string; deep: string; }
interface Direction { id: string; name: string; tagline: string; accent: string; sort_order: number; motion: boolean; surface: Surface; accents?: Record<string, Accent> | null; }

export default async function Page() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect('/auth/login?next=/admin/design');
  const { data: profile } = await sb.from('nl_profiles').select('role').eq('id', user.id).single();
  if (!profile || !['admin', 'super_admin'].includes(profile.role)) redirect('/');

  const locale = await getLocale();
  const { data } = await sb.rpc('nl_design_directions_list');
  const active: string = data?.active ?? 'dir4';
  const directions: Direction[] = Array.isArray(data?.directions) ? data.directions : [];
  const { data: ccsRaw } = await sb.rpc('nl_platform_config_get', { p_key: 'category_card_style' });
  let ccsVariant = 'icon-tl-brand'; let ccsArrow = true;
  try { const cfg = ccsRaw ? JSON.parse(ccsRaw as string) : null; if (cfg) { ccsVariant = cfg.variant || ccsVariant; ccsArrow = cfg.arrow_on_clickable !== false; } } catch {}

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <AdminPageHeader
        emoji="🎨"
        eyebrow="Sistema · Aparência"
        title="Direção de design"
        description="Pré-visualiza qualquer direção e define a ativa — a escolha re-tematiza o site inteiro (público incluído): cor de acento, tipografia e superfície mudam em todas as páginas. Movimento e relevo dos cartões configuram-se por direção."
      />
      <DesignClient initialActive={active} directions={directions} locale={locale} />
      <CategoryStyleControl initialVariant={ccsVariant} initialArrow={ccsArrow} />
    </div>
  );
}
