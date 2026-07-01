'use client';

import { useTranslations } from 'next-intl';
import { FileText, Users, Sparkles, Tag, ScrollText, Globe, Package, CalendarClock, Search, Handshake } from 'lucide-react';
import { TabsNav } from '@/components/ui/Tabs';

/** Barra de abas do workspace do curso. */
export function CourseTabs({ courseId }: { courseId: string }) {
  const t = useTranslations();
  return (
    <TabsNav
      seated
      items={[
        { href: `/admin/curso/${courseId}/editar`, label: t('course_ws.tab.content'), icon: FileText },
        { href: `/admin/curso/${courseId}/alunos`, label: t('course_ws.tab.students'), icon: Users },
        { href: `/admin/curso/${courseId}/estudio`, label: t('course_ws.tab.studio'), icon: Sparkles },
        { href: `/admin/curso/${courseId}/ritmo`, label: t('course_ws.tab.pace'), icon: CalendarClock },
        { href: `/admin/curso/${courseId}/recursos`, label: t('course_ws.tab.resources'), icon: Package },
        { href: `/admin/curso/${courseId}/landing`, label: t('course_ws.tab.landing'), icon: Globe },
        { href: `/admin/curso/${courseId}/seo`, label: t('course_ws.tab.seo'), icon: Search },
        { href: `/admin/curso/${courseId}/preco`, label: t('course_ws.tab.price'), icon: Tag },
        { href: `/admin/curso/${courseId}/peer`, label: t('course_ws.tab.peer'), icon: Handshake },
        { href: `/admin/curso/${courseId}/termos`, label: t('course_ws.tab.terms'), icon: ScrollText },
      ]}
    />
  );
}
