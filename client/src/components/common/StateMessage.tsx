'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Spinner from '@/components/common/Spinner';

type Props = {
  variant: 'loading' | 'empty' | 'error';
  /** Defaults: "Loading…" / "No data" / "Something went wrong". */
  message?: React.ReactNode;
  /** Shows a Retry button on `error`. */
  onRetry?: () => void;
  className?: string;
};

/**
 * Inline loading / empty / error text, styled like "No bets for this filters" (design 04b): bold, small, left.
 */
const StateMessage = ({ variant, message, onRetry, className }: Props) => (
  <div
    role={variant === 'error' ? 'alert' : 'status'}
    className={cn('flex items-center gap-3 px-1 py-3 text-sm font-semibold', className)}
  >
    {variant === 'loading' && <Spinner className="h-4 w-4" />}
    <span className={variant === 'error' ? 'text-negative' : 'text-foreground'}>
      {message ??
        (variant === 'loading'
          ? 'Loading…'
          : variant === 'empty'
            ? 'No data'
            : 'Something went wrong')}
    </span>
    {variant === 'error' && onRetry && (
      <Button variant="secondary" size="sm" onClick={onRetry}>
        Retry
      </Button>
    )}
  </div>
);

export default StateMessage;
