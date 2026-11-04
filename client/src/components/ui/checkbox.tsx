'use client';

import * as React from 'react';
import { Icon } from '@iconify/react';
import { cn } from '@/lib/utils';

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> & {
  /** Text right of the box. */
  label?: React.ReactNode;
  /** `light` = white box (Show not active, Settings rows); `lime` = lime when checked (every Tuesday 11:00). */
  tone?: 'light' | 'lime';
  labelClassName?: string;
};

/**
 * Native checkbox under a styled box, so it works with `register()` and `checked`/`onChange` alike.
 */
const Checkbox = React.forwardRef<HTMLInputElement, Props>(
  ({ label, tone = 'light', className, labelClassName, disabled, ...props }, ref) => (
    <label
      className={cn(
        'inline-flex select-none items-center gap-2 text-sm text-foreground',
        disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
        className,
      )}
    >
      <span className="relative inline-flex h-4 w-4 shrink-0">
        <input
          ref={ref}
          type="checkbox"
          disabled={disabled}
          className={cn(
            'peer h-4 w-4 cursor-[inherit] appearance-none rounded-xs border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime',
            tone === 'light'
              ? 'border-[#d4d4d8] bg-white checked:bg-white'
              : 'border-border-strong bg-field checked:border-lime checked:bg-lime',
          )}
          {...props}
        />
        <Icon
          icon="lucide:check"
          className={cn(
            'pointer-events-none absolute inset-0 m-auto h-3 w-3 opacity-0 peer-checked:opacity-100',
            tone === 'light' ? 'text-[#18181b]' : 'text-lime-ink',
          )}
        />
      </span>
      {label && <span className={labelClassName}>{label}</span>}
    </label>
  ),
);
Checkbox.displayName = 'Checkbox';

export { Checkbox };
