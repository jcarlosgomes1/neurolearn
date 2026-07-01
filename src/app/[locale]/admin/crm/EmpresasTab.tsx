'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { listOrgsAction } from '@/app/[locale]/admin/empresas/actions';
import { EmpresasClient } from '@/app/[locale]/admin/empresas/EmpresasClient';

// Wrapper para embeber a gestão de empresas no hub Pessoas: carrega os tenants
// do lado do cliente e monta o EmpresasClient em modo embedded (sem cabeçalho próprio).
export function EmpresasTab() {
  const locale = useLocale();
  const [initial, setInitial] = useState<{ total: number; orgs: any[] } | null>(null);
  useEffect(() => {
    listOrgsAction({})
      .then((r: any) => setInitial(r?.ok ? r.data : { total: 0, orgs: [] }))
      .catch(() => setInitial({ total: 0, orgs: [] }));
  }, []);
  if (!initial) return <div className="py-16 text-center text-sm text-slate-400">A carregar…</div>;
  return <EmpresasClient locale={locale} initial={initial} embedded />;
}
