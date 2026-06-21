'use client';

import { Link, usePathname } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { FileText, Users, Sparkles, Tag, ScrollText, Globe, Package } from 'lucide-react';

/** Barra de abas do workspace do curso. Cada aba migrada acrescenta-se aqui. */
export function CourseTabs({ courseId }: { courseId: string }) {
  const t = useTranslations();
  const pathname = usePathname();
  const tabs = [
    { key: 'content', seg: 'editar', label: t('course_ws.tab.content'), icon: FileText },
    { key: 'students', seg: 'alunos', label: t('course_ws.tab.students'), icon: Users },
    { key: 'studio', seg: 'estudio', label: t('course_ws.tab.studio'), icon: Sparkles },
    { key: 'price', seg: 'preco', label: t('course_ws.tab.price'), icon: Tag },
    { key: 'terms', seg: 'termos', label: t('course_ws.tab.terms'), icon: ScrollText },
    { key: 'landing', seg: 'landing', label: t('course_ws.tab.landing'), icon: Globe },
    { key: 'resources', seg: 'recursos', label: t('course_ws.tab.resources'), icon: Package },
  ];
  return (
    <nav className="flex gap-1 overflow-x-auto -mb-px">
      {tabs.map((tab) => {
        const href = `/admin/curso/${courseId}/${tab.seg}`;
        const active = pathname === href || pathname.startsWith(href + '/');
        const Icon = tab.icon;
        return (
          <Link key={tab.key} href={href as any}
            className={`inline-flex items-center gap-1.5 whitespace-nowrap px-3 py-2 text-sm font-medium border-b-2 transition-colors ${active ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-200'}`}>
            <Icon className="w-4 h-4" />{tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
