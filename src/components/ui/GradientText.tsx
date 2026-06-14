import { cn } from '@/lib/utils/cn';

/** Texto com o gradiente de marca canónico. Substitui os bg-clip-text inline dispersos. */
export function GradientText({
  children, className, tone = 'brand',
}: { children: React.ReactNode; className?: string; tone?: 'brand' | 'accent' }) {
  return (
    <span className={cn('bg-clip-text text-transparent', tone === 'brand' ? 'bg-brand-grad' : 'bg-accent-grad', className)}>
      {children}
    </span>
  );
}
