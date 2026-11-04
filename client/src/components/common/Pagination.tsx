'use client';

import { cn } from '@/lib/utils';
import type { PaginationMeta } from '@/types/common';

type Props = {
  /** `meta` from a paginated response. Undefined while loading → shows page 1. */
  meta?: PaginationMeta;
  onChange: (page: number) => void;
  disabled?: boolean;
  className?: string;
};

/** Page numbers around the current one, with `…` gaps: 1 … 4 5 [6] 7 8 … 20. */
const pageWindow = (current: number, total: number): (number | 'gap')[] => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, total, current - 1, current, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  return sorted.flatMap((p, i) => (i > 0 && p - sorted[i - 1] > 1 ? ['gap' as const, p] : [p]));
};

/** `‹ (1) ›` under the bet / casino tables (designs 02, 04, 05): the current page in a purple circle. */
const Pagination = ({ meta, onChange, disabled, className }: Props) => {
  const current = meta?.currentPage ?? 1;
  const total = Math.max(1, meta?.totalPages ?? 1);
  const arrow =
    'flex h-[26px] w-[26px] items-center justify-center rounded-full text-sm text-muted transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-40';

  return (
    <nav aria-label="Pagination" className={cn('flex items-center justify-end gap-1', className)}>
      <button
        type="button"
        aria-label="Previous page"
        className={arrow}
        disabled={disabled || current <= 1}
        onClick={() => onChange(current - 1)}
      >
        ‹
      </button>
      {pageWindow(current, total).map((p, i) =>
        p === 'gap' ? (
          <span key={`gap-${i}`} className="px-1 text-xs text-faint">
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            aria-current={p === current ? 'page' : undefined}
            disabled={disabled}
            onClick={() => p !== current && onChange(p)}
            className={cn(
              'flex h-[26px] min-w-[26px] items-center justify-center rounded-full px-1 text-xs tabular-nums transition-colors',
              p === current
                ? 'bg-[#5b4fd8] text-white'
                : 'text-muted hover:bg-white/5 hover:text-foreground',
            )}
          >
            {p}
          </button>
        ),
      )}
      <button
        type="button"
        aria-label="Next page"
        className={arrow}
        disabled={disabled || current >= total}
        onClick={() => onChange(current + 1)}
      >
        ›
      </button>
    </nav>
  );
};

export default Pagination;
