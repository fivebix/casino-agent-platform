import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * - `field`  grey filled box used in panels and dialogs (Create player, Credit amount, User edit)
 * - `auth`   tall rounded box on the login / first-login cards
 * - `compact` small centred number box (Settings → notify thresholds)
 */
export const inputVariants = cva(
  'w-full bg-field text-foreground placeholder:text-faint outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-60 focus:border-lime/60 aria-[invalid=true]:border-negative',
  {
    variants: {
      variant: {
        field: 'h-[38px] rounded-xs border border-transparent px-3 text-sm',
        auth: 'h-12 rounded-lg border border-border bg-[#111113] px-4 text-base focus:border-lime/50',
        compact: 'h-[30px] w-24 rounded-xs border border-transparent px-2 text-center text-sm',
      },
    },
    defaultVariants: { variant: 'field' },
  },
);

type Props = React.InputHTMLAttributes<HTMLInputElement> &
  VariantProps<typeof inputVariants> & {
    /** Error text under the input; also marks it `aria-invalid`. */
    error?: string;
    wrapperClassName?: string;
  };

const Input = React.forwardRef<HTMLInputElement, Props>(
  ({ className, wrapperClassName, variant, error, ...props }, ref) => (
    <div className={cn('w-full', variant === 'compact' && 'w-auto', wrapperClassName)}>
      <input
        ref={ref}
        aria-invalid={error ? true : undefined}
        className={cn(inputVariants({ variant }), className)}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-negative">{error}</p>}
    </div>
  ),
);
Input.displayName = 'Input';

export { Input };
