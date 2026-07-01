'use client';

import { useTranslations } from 'next-intl';
import { LayoutDashboard, Settings2, Palette, ShoppingBag, Edit3, Radar } from 'lucide-react';
import { TabsNav } from '@/components/ui/Tabs';

export function EmpresaTabs({ orgId }: { orgId: string }) {
  const t = useTranslations();
  const base = `/admin/empresas/${orgId}`;
  return (
    <TabsNav
      seated
      items={[
        { href: base, label: t('emp_ws.tab.overview'), icon: LayoutDashboard, exact: true },
        { href: `${base}/inteligencia`, label: t('emp_ws.tab.intelligence'), icon: Radar },
        { href: `${base}/features`, label: t('emp_ws.tab.features'), icon: Settings2 },
        { href: `${base}/branding`, label: t('emp_ws.tab.branding'), icon: Palette },
        { href: `${base}/marketplace`, label: t('emp_ws.tab.marketplace'), icon: ShoppingBag },
        { href: `${base}/editar`, label: t('emp_ws.tab.edit'), icon: Edit3 },
      ]}
    />
  );
}
