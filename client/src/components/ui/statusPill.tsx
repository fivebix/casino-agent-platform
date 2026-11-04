import { cn } from '@/lib/utils';

export type StatusTone = 'negative' | 'positive' | 'pending' | 'neutral';

const TONES: Record<StatusTone, string> = {
  negative: 'bg-negative/20 text-negative',
  positive: 'bg-success/20 text-success',
  pending: 'bg-lime/20 text-lime',
  neutral: 'bg-white/10 text-muted',
};

type Props = {
  tone: StatusTone;
  children: React.ReactNode;
  className?: string;
};

/** Bet status chip: Losed (red) / Won (green) / Pending (lime) / Returned, Reject (grey). */
const StatusPill = ({ tone, children, className }: Props) => (
  <span
    className={cn(
      'inline-block rounded-sm px-2 py-0.5 text-[10px] font-semibold leading-tight',
      TONES[tone],
      className,
    )}
  >
    {children}
  </span>
);

/** Maps the contract's `BetStatus` to the design's label + tone. */
export const BET_STATUS_PILL: Record<string, { label: string; tone: StatusTone }> = {
  lost: { label: 'Losed', tone: 'negative' },
  won: { label: 'Won', tone: 'positive' },
  open: { label: 'Pending', tone: 'pending' },
  refunded: { label: 'Returned', tone: 'neutral' },
  rejected: { label: 'Reject', tone: 'neutral' },
};

export { StatusPill };
