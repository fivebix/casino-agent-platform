import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium font-mono',
  {
    variants: {
      tone: {
        neutral: 'border-border text-muted-foreground bg-secondary',
        success: 'border-success/40 text-success bg-success/10',
        warning: 'border-warning/40 text-warning bg-warning/10',
        danger: 'border-danger/40 text-danger bg-danger/10',
        brand: 'border-primary/40 text-primary bg-primary/10',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
