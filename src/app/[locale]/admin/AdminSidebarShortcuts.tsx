'use client';

import { Link } from '@/i18n/routing';
import { Package, Tag, DollarSign } from 'lucide-react';

// Componente apenas para shortcuts adicionais — usado no AppShell admin
export function AdminSidebarShortcuts() {
  return (
    <>
      <Link href={'/admin/monetizacao' as any}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-700 text-sm">
        <DollarSign className="h-4 w-4" /> Monetização
      </Link>
      <Link href={'/admin/addons' as any}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-700 text-sm">
        <Package className="h-4 w-4" /> Add-ons
      </Link>
      <Link href={'/admin/cupoes' as any}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-700 text-sm">
        <Tag className="h-4 w-4" /> Cupões
      </Link>
    </>
  );
}
