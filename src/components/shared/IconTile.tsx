import type { LucideIcon } from 'lucide-react';

// Tile de icone multicor para superficies persuasivas (home "Porque", features Empresas, propostas de valor).
// Gradiente via style inline para ser dinamico a partir da paleta em config (sem depender do safelist do Tailwind).
// Superficies funcionais (cartoes de categoria, tools, menus) usam o cinzento/brand monocromatico e NAO usam este componente.
export function IconTile({ Icon, from, to, size = 'md', className = '' }: {
  Icon: LucideIcon;
  from?: string;
  to?: string;
  size?: 'md' | 'lg';
  className?: string;
}) {
  const box = size === 'lg' ? 'h-14 w-14 rounded-2xl' : 'h-12 w-12 rounded-xl';
  const ic = size === 'lg' ? 'h-7 w-7' : 'h-6 w-6';
  const style = from && to ? { backgroundImage: `linear-gradient(135deg, ${from}, ${to})` } : undefined;
  return (
    <div className={`inline-flex ${box} items-center justify-center text-white shadow-md ${className}`} style={style}>
      <Icon className={ic} strokeWidth={1.75} />
    </div>
  );
}
