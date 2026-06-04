/* Util classes para usar branding da org em componentes:
 * style={{ background: 'var(--org-primary, #6366f1)' }}
 * style={{ color: 'var(--org-accent, #8b5cf6)' }}
 * 
 * O layout /empresa/[slug]/layout.tsx injecta estas vars automaticamente.
 * Fallbacks são as cores brand padrão do NeuroLearn.
 */
export const orgBrandStyle = (variant: 'primary' | 'accent' | 'gradient' = 'primary') => {
  if (variant === 'primary') return { background: 'var(--org-primary, #6366f1)' };
  if (variant === 'accent') return { background: 'var(--org-accent, #8b5cf6)' };
  return { background: 'linear-gradient(135deg, var(--org-primary, #6366f1), var(--org-accent, #8b5cf6))' };
};
