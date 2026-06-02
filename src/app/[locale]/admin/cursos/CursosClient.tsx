'use client';

import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { AdminList } from '../AdminList';

export function CursosClient() {
  const t = useTranslations();
  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 flex items-center justify-between gap-2 flex-wrap">
        <p className="text-sm text-slate-500">{t('admin_courses.hint')}</p>
        <div className="flex gap-2 flex-wrap">
          <Link href={'/admin/essential/novo' as any} className="text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-4 py-2 rounded-lg">{t('admin_courses.btn_manual')}</Link>
          <Link href={'/admin/curso-ia/novo' as any} className="text-sm bg-gradient-to-r from-brand-600 to-purple-600 text-white font-medium px-4 py-2 rounded-lg shadow hover:shadow-md">{t('admin_courses.btn_ai')}</Link>
        </div>
      </div>
      <AdminList
        title={t('admin_courses.title')}
        action="list_courses"
        dataKey="rows"
        backHref="/admin"
        columns={[
          { key: 'title', label: t('admin_courses.col_title'), primary: true },
          { key: 'course_type', label: t('admin_courses.col_type'), kind: 'badge' },
          { key: 'category', label: t('admin_courses.col_category') },
          { key: 'price_cents', label: t('admin_courses.col_price'), kind: 'cents' },
          { key: 'published', label: t('admin_courses.col_status'), kind: 'badge' },
        ]}
        linkPrefix="/admin/curso/"
        linkSuffix="/editar"
        linkKey="id"
        linkLabel={t('admin_courses.col_edit')}
      />
    </>
  );
}
