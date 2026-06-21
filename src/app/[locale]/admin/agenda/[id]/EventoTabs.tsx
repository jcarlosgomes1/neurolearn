'use client';

import { Link, usePathname } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { LayoutDashboard, Users, Megaphone } from 'lucide-react';

export function EventoTabs({ eventId }: { eventId: string }) {
  const t = useTranslations();
  const pathname = usePathname();
  const base = `/admin/agenda/${eventId}`;
  const tabs = [
    { key: 'overview', href: base, label: t('evt_ws.tab.overview'), icon: LayoutDashboard, exact: true },
    { key: 'guests', href: `${base}/convidados`, label: t('evt_ws.tab.guests'), icon: Users, exact: false },
    { key: 'promos', href: `${base}/promocoes`, label: t('evt_ws.tab.promos'), icon: Megaphone, exact: false },
  ];
  return (
    <nav className="flex gap-1 overflow-x-auto -mb-px">
      {tabs.map((tab) => {
        const active = tab.exact ? pathname === tab.href : (pathname === tab.href || pathname.startsWith(tab.href + '/'));
        const Icon = tab.icon;
        return (
          <Link key={tab.key} href={tab.href as any}
            className={`inline-flex items-center gap-1.5 whitespace-nowrap px-3 py-2 text-sm font-medium border-b-2 transition-colors ${active ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-200'}`}>
            <Icon className="w-4 h-4" />{tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
