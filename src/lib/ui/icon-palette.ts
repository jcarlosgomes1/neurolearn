import { createClient } from '@/lib/supabase/server';

export type IconGrad = { from: string; to: string };

// Fallback seguro (a fonte de verdade é nl_platform_config.icon_palette, editavel no backoffice)
const FALLBACK: IconGrad[] = [
  { from: '#8b5cf6', to: '#4f46e5' },
  { from: '#d946ef', to: '#db2777' },
  { from: '#10b981', to: '#0d9488' },
  { from: '#f59e0b', to: '#ea580c' },
  { from: '#f43f5e', to: '#dc2626' },
  { from: '#3b82f6', to: '#06b6d4' },
];

// Paleta de icones multicor para superficies persuasivas (governada por config).
export async function getIconPalette(): Promise<IconGrad[]> {
  try {
    const sb = await createClient();
    const { data } = await sb.from('nl_platform_config').select('value').eq('key', 'icon_palette').maybeSingle();
    if (data?.value) {
      const parsed = JSON.parse(data.value);
      if (Array.isArray(parsed)) {
        const clean = parsed.filter((g: any) => g && typeof g.from === 'string' && typeof g.to === 'string');
        if (clean.length > 0) return clean as IconGrad[];
      }
    }
  } catch {
    // fallback abaixo
  }
  return FALLBACK;
}
