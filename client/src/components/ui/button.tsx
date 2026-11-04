'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { Icon } from '@iconify/react';
import { cn } from '@/lib/utils';

/**
 * Variants from the designs:
 * - `primary`   lime, dark text — Save, Create player, Sign in (with `size="pill"`)
 * - `secondary` grey — Close, Cancel, Previous, inactive product tabs
 * - `danger`    red — the active product tab (SportBook) and destructive actions
 * - `light`     white — the Telegram "Subscribe" button
 * - `ghost`     transparent — top-bar items
 * - `link`      lime underlined text
 */
export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime/60 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        primary:
          'bg-lime text-lime-ink font-semibold hover:bg-lime-hover disabled:bg-lime-dim disabled:text-lime-ink/80',
        secondary:
          'bg-grey text-foreground hover:bg-grey-hover disabled:bg-grey-dark disabled:text-faint',
        danger: 'bg-danger text-white hover:bg-danger-hover disabled:opacity-50',
        light: 'bg-[#ececee] text-[#18181b] font-semibold hover:bg-white disabled:opacity-50',
        ghost: 'bg-transparent text-foreground hover:bg-white/5 disabled:opacity-50',
        link: 'h-auto bg-transparent p-0 text-lime underline-offset-2 hover:underline disabled:opacity-50',
      },
      size: {
        sm: 'h-8 rounded-xs px-4 text-sm',
        md: 'h-10 rounded-xs px-6 text-sm',
        lg: 'h-10 min-w-36 rounded-xs px-8 text-sm',
        pill: 'h-12 w-full rounded-full px-6 text-base font-semibold',
        icon: 'h-8 w-8 rounded-sm p-0',
      },
    },
    compoundVariants: [{ variant: 'link', className: 'h-auto px-0' }],
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export type ButtonVariant = NonNullable<VariantProps<typeof buttonVariants>['variant']>;
export type ButtonSize = NonNullable<VariantProps<typeof buttonVariants>['size']>;

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    /** Render the child element (e.g. a `<Link>`) with button styles. */
    asChild?: boolean;
    /** Shows a spinner and disables the button. */
    isLoading?: boolean;
  };

const Button = React.forwardRef<HTMLButtonElement, Props>(
  (
    { className, variant, size, asChild = false, isLoading = false, disabled, children, ...props },
    ref,
  ) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={asChild ? undefined : disabled || isLoading}
        aria-busy={isLoading || undefined}
        {...props}
      >
        {asChild ? (
          children
        ) : (
          <>
            {isLoading && <Icon icon="lucide:loader-2" className="h-4 w-4 animate-spin" />}
            {children}
          </>
        )}
      </Comp>
    );
  },
);
Button.displayName = 'Button';

export { Button };
