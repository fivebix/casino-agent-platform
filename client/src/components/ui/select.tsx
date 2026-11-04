'use client';

import * as React from 'react';
import { Icon } from '@iconify/react';
import { cn } from '@/lib/utils';

export type SelectOption = { value: string; label: string; disabled?: boolean };

type Props = Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'children'> & {
  options: SelectOption[];
  /** Adds a first, empty option (e.g. "All Service"). */
  placeholder?: string;
  error?: string;
  wrapperClassName?: string;
};

/**
 * Native `<select>` styled like the dropdown boxes in the designs (Type / Language on Create, the Casino List
 * filters). Native keeps it react-hook-form friendly: `<Select {...register('type')} options={...} />`.
 */
const Select = React.forwardRef<HTMLSelectElement, Props>(
  ({ options, placeholder, error, className, wrapperClassName, ...props }, ref) => (
    <div className={cn('relative w-[150px]', wrapperClassName)}>
      <select
        ref={ref}
        aria-invalid={error ? true : undefined}
        className={cn(
          'h-[38px] w-full appearance-none rounded-xs border border-border-strong bg-field pl-3 pr-9 text-sm text-foreground outline-none transition-colors focus:border-lime/60 disabled:cursor-not-allowed disabled:opacity-60 aria-[invalid=true]:border-negative',
          className,
        )}
        {...props}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value} disabled={o.disabled} className="bg-panel">
            {o.label}
          </option>
        ))}
      </select>
      <Icon
        icon="lucide:chevron-down"
        className="pointer-events-none absolute right-3 top-[19px] h-4 w-4 -translate-y-1/2 text-muted"
      />
      {error && <p className="mt-1 text-xs text-negative">{error}</p>}
    </div>
  ),
);
Select.displayName = 'Select';

export { Select };
