'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

type Props = {
  checked: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  /** Shows the switch dimmed and blocks clicks while a request is running. */
  isLoading?: boolean;
  className?: string;
  'aria-label'?: string;
};

/** The "User status" toggle: olive track + lime knob when on, grey when off. */
const Switch = ({
  checked,
  onCheckedChange,
  disabled,
  isLoading,
  className,
  'aria-label': ariaLabel,
}: Props) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={ariaLabel}
    disabled={disabled || isLoading}
    onClick={() => onCheckedChange?.(!checked)}
    className={cn(
      'relative inline-flex h-[18px] w-8 shrink-0 items-center rounded-full border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime disabled:cursor-not-allowed',
      checked ? 'border-lime/40 bg-lime-track' : 'border-border-strong bg-grey-dark',
      (disabled || isLoading) && 'opacity-60',
      className,
    )}
  >
    <span
      className={cn(
        'absolute h-3 w-3 rounded-full transition-all',
        checked ? 'left-[16px] bg-lime' : 'left-[2px] bg-faint',
      )}
    />
  </button>
);

export { Switch };
