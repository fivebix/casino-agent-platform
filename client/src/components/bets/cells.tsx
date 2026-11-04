'use client';

import { useCallback } from 'react';
import { Icon } from '@iconify/react';
import { useAppSelector } from '@/hooks/useReduxHooks';
import { formatOdds, splitTimeDay } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { SportBet, SportBetLeg, SportBetStatus } from '@/types/agent';

/** Status text as the Bet List shows it (design 02): coloured words, not pills. */
export const SPORT_BET_STATUS: Record<SportBetStatus, { label: string; className: string }> = {
  open: { label: 'Pending', className: 'text-foreground' },
  won: { label: 'Won', className: 'text-success' },
  lost: { label: 'Losed', className: 'text-negative' },
  refunded: { label: 'Returned', className: 'text-foreground' },
  rejected: { label: 'Reject', className: 'text-faint' },
  deleted: { label: 'Deleted', className: 'text-faint' },
};

/** "All statuses" filter (sent as `status`). */
export const BET_STATUS_OPTIONS = (Object.keys(SPORT_BET_STATUS) as SportBetStatus[]).map(
  (value) => ({ value, label: SPORT_BET_STATUS[value].label }),
);

export const PAGE_SIZES = [25, 50, 100, 200];

type StatusProps = { status: SportBetStatus; className?: string };

export const BetStatusText = ({ status, className }: StatusProps) => {
  const s = SPORT_BET_STATUS[status] ?? { label: status, className: 'text-foreground' };
  return <span className={cn(s.className, className)}>{s.label}</span>;
};

type BetIdLinkProps = { id: string; onClick: () => void };

/** Bet id that opens the Bet details dialog. */
export const BetIdLink = ({ id, onClick }: BetIdLinkProps) => (
  <button
    type="button"
    onClick={onClick}
    className="tabular-nums text-lime underline underline-offset-2 hover:text-lime-hover"
  >
    {id}
  </button>
);

type TicketButtonProps = { onClick: () => void };

/** The (i) icon in the TICKET column. */
export const TicketButton = ({ onClick }: TicketButtonProps) => (
  <button
    type="button"
    aria-label="Bet details"
    onClick={onClick}
    className="inline-flex h-7 w-7 items-center justify-center rounded-full text-foreground hover:text-lime"
  >
    <Icon icon="lucide:info" className="h-[18px] w-[18px]" />
  </button>
);

type TimeDayProps = { value: string | null | undefined };

/** `19:00` over a small grey `22.09`. */
export const TimeDayCell = ({ value }: TimeDayProps) => {
  const parts = splitTimeDay(value);
  if (!parts) return <span>—</span>;
  return (
    <span className="flex flex-col leading-tight tabular-nums">
      <span>{parts.time}</span>
      <span className="text-[11px] text-muted">{parts.day}</span>
    </span>
  );
};

type LegInfoProps = { leg: SportBetLeg };

/** `Soccer Spain La Liga` / `Bilbao - Valencia` / lime `Full Time Bilbao`. */
export const LegInfo = ({ leg }: LegInfoProps) => (
  <span className="flex flex-col leading-tight">
    <span>
      {leg.sport} {leg.league}
    </span>
    <span>{leg.game}</span>
    <span className="text-[12px] text-success">{leg.event}</span>
  </span>
);

type ParlayInfoProps = { bet: SportBet };

/** Parent row of a parlay: `Parlay 2` / games joined by `·` / lime `Live · picks`. */
export const ParlayInfo = ({ bet }: ParlayInfoProps) => (
  <span className="flex flex-col leading-tight">
    <span>Parlay {bet.legs.length}</span>
    <span>{bet.legs.map((l) => l.game).join(' · ')}</span>
    <span className="text-[12px] text-success">
      {bet.isLive ? 'Live · ' : ''}
      {bet.legs.map((l) => l.pick).join(' + ')}
    </span>
  </span>
);

/** Formats decimal odds with the agent's odds format from the top bar (design 30). */
export const useOddsFormatter = () => {
  const oddsFormat = useAppSelector((s) => s.app.oddsFormat);
  return useCallback(
    (decimal: number | null | undefined) => formatOdds(decimal, oddsFormat),
    [oddsFormat],
  );
};

type MovedOddsProps = { base: number; value: number | null; format: (v: number | null) => string };

/** 5 M / 10 M / NOW odds: bold when they moved from the placed odds. */
export const MovedOdds = ({ base, value, format }: MovedOddsProps) => (
  <span className={cn('tabular-nums', value !== null && value !== base && 'font-bold')}>
    {format(value)}
  </span>
);
