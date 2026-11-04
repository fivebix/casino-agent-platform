import { cn } from '@/lib/utils';

export type KeyValueRow = {
  label: React.ReactNode;
  value: React.ReactNode;
  /** Colour the value red (e.g. a negative Platform Debt). */
  negative?: boolean;
};

type Props = {
  rows: KeyValueRow[];
  /** Shows skeleton rows instead of values. */
  isLoading?: boolean;
  className?: string;
};

/**
 * The summary panel under the Users List (Total Balance … Used Backup Credit): grey rows, label left,
 * bold value right. Wrap it in a `PageCard` (or any panel) for the outer frame.
 */
const KeyValuePanel = ({ rows, isLoading, className }: Props) => (
  <dl className={cn('flex flex-col', className)}>
    {rows.map((row, i) => (
      <div
        key={i}
        className="flex h-[35px] items-center justify-between border-b border-[#34343a] bg-row px-3 text-[15px]"
      >
        <dt className="text-foreground">{row.label}</dt>
        <dd className={cn('font-bold', row.negative ? 'text-negative' : 'text-foreground')}>
          {isLoading ? (
            <span className="inline-block h-3 w-12 animate-pulse rounded-xs bg-white/10" />
          ) : (
            row.value
          )}
        </dd>
      </div>
    ))}
  </dl>
);

export { KeyValuePanel };
