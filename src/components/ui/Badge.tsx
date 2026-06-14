import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

const badge = cva(
  'inline-flex items-center gap-1.5 rounded-control font-medium whitespace-nowrap',
  {
    variants: {
      variant: {
        neutral: 'bg-slate-100 text-slate-700',
        brand: 'bg-brand-50 text-brand-700 border border-brand-200',
        accent: 'bg-accent-50 text-accent-700 border border-accent-200',
        success: 'bg-accent-50 text-accent-700',
        warning: 'bg-amber-50 text-amber-700 border border-amber-200',
        danger: 'bg-rose-50 text-rose-700 border border-rose-200',
      },
      size: { sm: 'px-2 py-0.5 text-xs', md: 'px-3 py-1 text-sm' },
    },
    defaultVariants: { variant: 'neutral', size: 'sm' },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badge> {}

export function Badge({ className, variant, size, ...props }: BadgeProps) {
  return <span className={cn(badge({ variant, size }), className)} {...props} />;
}
