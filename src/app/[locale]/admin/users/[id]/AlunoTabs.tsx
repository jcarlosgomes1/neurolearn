'use client';

import { useTranslations } from 'next-intl';
import { LayoutDashboard, BookOpen } from 'lucide-react';
import { TabsNav } from '@/components/ui/Tabs';

export function AlunoTabs({ userId }: { userId: string }) {
  const t = useTranslations();
  const base = `/admin/users/${userId}`;
  return (
    <TabsNav
      seated
      items={[
        { href: base, label: t('alun_ws.tab.overview'), icon: LayoutDashboard, exact: true },
        { href: `${base}/inscricoes`, label: t('alun_ws.tab.enroll'), icon: BookOpen },
      ]}
    />
  );
}
