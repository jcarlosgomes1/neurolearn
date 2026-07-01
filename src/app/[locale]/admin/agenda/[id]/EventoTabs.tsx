'use client';

import { useTranslations } from 'next-intl';
import { LayoutDashboard, Users, Megaphone, Ticket } from 'lucide-react';
import { TabsNav } from '@/components/ui/Tabs';

export function EventoTabs({ eventId }: { eventId: string }) {
  const t = useTranslations();
  const base = `/admin/agenda/${eventId}`;
  return (
    <TabsNav
      seated
      items={[
        { href: base, label: t('evt_ws.tab.overview'), icon: LayoutDashboard, exact: true },
        { href: `${base}/convidados`, label: t('evt_ws.tab.guests'), icon: Users },
        { href: `${base}/promocoes`, label: t('evt_ws.tab.promos'), icon: Megaphone },
        { href: `${base}/registos`, label: t('evt_ws.tab.registos'), icon: Ticket },
      ]}
    />
  );
}
