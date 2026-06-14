import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

const card = cva('rounded-card bg-white transition-all', {
  variants: {
    variant: {
      flat: 'border border-slate-200',
      raised: 'border border-slate-200 shadow-e2',
      interactive: 'border border-slate-200 shadow-e1 hover:shadow-e3 hover:-translate-y-0.5',
      ghost: '',
    },
    pad: { none: '', sm: 'p-4', md: 'p-6', lg: 'p-8' },
  },
  defaultVariants: { variant: 'flat', pad: 'md' },
});

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof card> {}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, pad, ...props }, ref) => (
    <div ref={ref} className={cn(card({ variant, pad }), className)} {...props} />
  )
);
Card.displayName = 'Card';
