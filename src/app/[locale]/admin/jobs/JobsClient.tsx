'use client';

import { useTranslations } from 'next-intl';
import { Activity } from 'lucide-react';
import { AdminList } from '../AdminList';

export function JobsClient() {
  const t = useTranslations();
  function safeT(key: string, fb: string): string {
    try { const v = t(key as any); if (v && typeof v === 'string' && v !== key) return v; } catch {}
    return fb;
  }
  return (
    <AdminList
      title={safeT('jobs.title', 'Jobs')}
      eyebrow={safeT('jobs.eyebrow', 'Admin · Jobs')}
      description={safeT('jobs.description', 'Histórico de jobs assíncronos executados pelos agentes.')}
      icon={Activity}
      accentGradient="from-blue-600 to-cyan-600"
      action="list_jobs"
      dataKey="jobs"
      backHref="/admin"
      columns={[
        { key: 'kind', label: safeT('jobs.col_kind', 'Tipo'), primary: true },
        { key: 'status', label: safeT('jobs.col_status', 'Estado'), kind: 'badge' },
        { key: 'created_at', label: safeT('jobs.col_created', 'Criado'), kind: 'reltime' },
        { key: 'finished_at', label: safeT('jobs.col_finished', 'Concluído'), kind: 'reltime' },
      ]}
    />
  );
}
