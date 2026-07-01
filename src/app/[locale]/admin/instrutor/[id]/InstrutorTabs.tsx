'use client';

import { useTranslations } from 'next-intl';
import { LayoutDashboard, BookOpen, SlidersHorizontal } from 'lucide-react';
import { TabsNav } from '@/components/ui/Tabs';

export function InstrutorTabs({ instructorId }: { instructorId: string }) {
  const t = useTranslations();
  const base = `/admin/instrutor/${instructorId}`;
  return (
    <TabsNav
      seated
      items={[
        { href: base, label: t('instr_ws.tab.overview'), icon: LayoutDashboard, exact: true },
        { href: `${base}/cursos`, label: t('instr_ws.tab.courses'), icon: BookOpen },
        { href: `${base}/definicoes`, label: t('instr_ws.tab.settings'), icon: SlidersHorizontal },
      ]}
    />
  );
}
