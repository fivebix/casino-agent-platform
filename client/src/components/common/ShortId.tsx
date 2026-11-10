'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

type Props = {
  /** The full id; the cell shows `#` + its last four characters. */
  value: string;
  className?: string;
};

/** `#36d2` and a copy icon that copies the full id (long round ids do not fit a table cell). */
const ShortId = ({ value, className }: Props) => {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success('ID copied');
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('Could not copy the ID');
    }
  };

  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <span className="tabular-nums" title={value}>
        #{value.slice(-4)}
      </span>
      <button
        type="button"
        onClick={copy}
        aria-label={`Copy ID ${value}`}
        title="Copy full ID"
        className="flex h-5 w-5 items-center justify-center rounded-xs text-muted outline-none hover:text-lime focus-visible:text-lime"
      >
        <Icon icon={copied ? 'lucide:check' : 'lucide:copy'} className="h-3.5 w-3.5" />
      </button>
    </span>
  );
};

export default ShortId;
