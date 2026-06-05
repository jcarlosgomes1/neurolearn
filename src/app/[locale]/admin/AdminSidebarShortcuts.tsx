'use client';

import { Link } from '@/i18n/routing';
import { Package, Tag, DollarSign, GraduationCap, Shield, Key, BarChart3, Receipt, RotateCcw, Mail } from 'lucide-react';

// Shortcuts para áreas admin recentes — usado no AppShell
export function AdminSidebarShortcuts() {
  return (
    <div className="space-y-0.5">
      <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 px-3 pt-3 pb-1">Receita</div>
      <Link href={'/admin/revenue' as any}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-700 text-sm">
        <BarChart3 className="h-4 w-4" /> Revenue
      </Link>
      <Link href={'/admin/monetizacao' as any}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-700 text-sm">
        <DollarSign className="h-4 w-4" /> Monetização
      </Link>
      <Link href={'/admin/invoices' as any}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-700 text-sm">
        <Receipt className="h-4 w-4" /> Invoices
      </Link>
      <Link href={'/admin/refunds' as any}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-700 text-sm">
        <RotateCcw className="h-4 w-4" /> Refunds
      </Link>
      <Link href={'/admin/upsells' as any}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-700 text-sm">
        <Mail className="h-4 w-4" /> Upsell signals
      </Link>

      <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 px-3 pt-3 pb-1">Catálogo</div>
      <Link href={'/admin/bundles' as any}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-700 text-sm">
        <Package className="h-4 w-4" /> Bundles
      </Link>
      <Link href={'/admin/learning-paths' as any}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-700 text-sm">
        <GraduationCap className="h-4 w-4" /> Percursos
      </Link>
      <Link href={'/admin/addons' as any}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-700 text-sm">
        <Package className="h-4 w-4" /> Add-ons
      </Link>
      <Link href={'/admin/cupoes' as any}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-700 text-sm">
        <Tag className="h-4 w-4" /> Cupões
      </Link>

      <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 px-3 pt-3 pb-1">Operações</div>
      <Link href={'/admin/audit-logs' as any}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-700 text-sm">
        <Shield className="h-4 w-4" /> Audit logs
      </Link>
      <Link href={'/admin/api-keys' as any}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-700 text-sm">
        <Key className="h-4 w-4" /> API Keys
      </Link>
    </div>
  );
}
