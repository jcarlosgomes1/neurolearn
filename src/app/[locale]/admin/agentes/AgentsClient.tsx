'use client';

import { useTranslations } from 'next-intl';
import { Sparkles } from 'lucide-react';
import { AdminList } from '../AdminList';

export function AgentsClient() {
  const t = useTranslations();
  function safeT(key: string, fb: string): string {
    try { const v = t(key as any); if (v && typeof v === 'string' && v !== key) return v; } catch {}
    return fb;
  }
  return (
    <AdminList
      title={safeT('agts.title', 'Agentes')}
      eyebrow={safeT('agts.eyebrow', 'Admin · Agentes')}
      description={safeT('agts.description', 'Estado de cada agente automatizado da plataforma.')}
      icon={Sparkles}
      accentGradient="from-fuchsia-600 to-pink-600"
      action="list_agents"
      dataKey="agents"
      columns={[
        { key: 'name', label: safeT('agts.col_name', 'Nome'), primary: true },
        { key: 'status', label: safeT('agts.col_status', 'Estado'), kind: 'badge' },
        { key: 'last_active_at', label: safeT('agts.col_last', 'Última actividade'), kind: 'reltime' },
      ]}
    />
  );
}
