import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

/**
 * Primitivo EmptyState — estado-vazio canonico.
 * agentHint mostra a afordancia "agente-primeiro" quando aplicavel.
 */
export function EmptyState({ icon: Icon, emoji, title, hint, action, agentHint }: {
  icon?: LucideIcon;
  emoji?: string;
  title: string;
  hint?: string;
  action?: ReactNode;
  agentHint?: string;
}) {
  return (
    <div className="p-10 sm:p-12 text-center">
      <div className="inline-flex h-14 w-14 rounded-2xl bg-slate-100 text-slate-400 items-center justify-center mb-3">
        {emoji ? <span className="text-2xl leading-none">{emoji}</span> : Icon ? <Icon className="h-7 w-7" strokeWidth={1.75} /> : null}
      </div>
      <h3 className="font-semibold text-slate-900 text-sm mb-1">{title}</h3>
      {hint && <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">{hint}</p>}
      {agentHint && <p className="text-xs text-brand-600 mt-2 font-medium">{agentHint}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}
