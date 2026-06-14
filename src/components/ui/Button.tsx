import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

const button = cva(
  'inline-flex items-center justify-center gap-2 font-semibold rounded-control transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none select-none',
  {
    variants: {
      variant: {
        primary: 'bg-brand-grad text-white shadow-e1 hover:shadow-e2 hover:brightness-[1.05] active:brightness-95',
        secondary: 'border border-slate-300 bg-white text-slate-700 shadow-e1 hover:bg-slate-50 hover:border-slate-400',
        ghost: 'text-slate-700 hover:bg-slate-100',
        danger: 'bg-rose-600 text-white shadow-e1 hover:bg-rose-700',
        accent: 'bg-accent-grad text-white shadow-e1 hover:shadow-e2 hover:brightness-[1.05]',
      },
      size: {
        sm: 'h-9 px-3.5 text-sm',
        md: 'h-11 px-5 text-sm',
        lg: 'h-12 px-7 text-base',
        icon: 'h-10 w-10',
      },
      block: { true: 'w-full' },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof button> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, block, ...props }, ref) => (
    <button ref={ref} className={cn(button({ variant, size, block }), className)} {...props} />
  )
);
Button.displayName = 'Button';

export { button as buttonVariants };
