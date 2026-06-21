'use client';

import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { Eye, BookOpen, GraduationCap, Building2, type LucideIcon } from 'lucide-react';

export type PreviewPov = 'public' | 'enrolled' | 'instructor' | 'tenant';

/** Fonte unica de verdade das rotas por ponto de vista de um curso. */
export function coursePovHref(pov: PreviewPov, courseId: string, opts?: { tenantSlug?: string }): string {
  switch (pov) {
    case 'public': return `/curso/${courseId}`;
    case 'enrolled': return `/learn/curso/${courseId}/continuar`;
    case 'instructor': return `/teach/curso/${courseId}/editar`;
    case 'tenant': return opts?.tenantSlug ? `/empresa/${opts.tenantSlug}/curso/${courseId}` : `/curso/${courseId}`;
  }
}

const POV_META: Record<PreviewPov, { labelKey: string; icon: LucideIcon; cls: string }> = {
  public:     { labelKey: 'preview.pov.public',     icon: Eye,           cls: 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700' },
  enrolled:   { labelKey: 'preview.pov.enrolled',   icon: BookOpen,      cls: 'bg-brand-50 hover:bg-brand-100 text-brand-700' },
  instructor: { labelKey: 'preview.pov.instructor', icon: GraduationCap, cls: 'bg-amber-50 hover:bg-amber-100 text-amber-700' },
  tenant:     { labelKey: 'preview.pov.tenant',     icon: Building2,     cls: 'bg-violet-50 hover:bg-violet-100 text-violet-700' },
};

/**
 * Primitivo PreviewAs — abre um curso no ponto de vista escolhido.
 * Rotas centralizadas em coursePovHref: elimina a classe de bugs "preview cai na home".
 */
export function PreviewAs({ courseId, povs = ['public', 'enrolled', 'instructor'], tenantSlug }: {
  courseId: string;
  povs?: PreviewPov[];
  tenantSlug?: string;
}) {
  const t = useTranslations();
  return (
    <div className="flex gap-2 flex-wrap">
      {povs.map((pov) => {
        const meta = POV_META[pov];
        const Icon = meta.icon;
        return (
          <Link key={pov} href={coursePovHref(pov, courseId, { tenantSlug }) as any} target="_blank" rel="noopener"
            className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-md whitespace-nowrap ${meta.cls}`}>
            <Icon className="h-3.5 w-3.5 flex-shrink-0" /> {t(meta.labelKey as any)}
          </Link>
        );
      })}
    </div>
  );
}
