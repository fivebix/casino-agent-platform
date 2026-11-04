'use client';

import { Fragment } from 'react';
import ModalShell from '@/components/modals/ModalShell';
import { Button } from '@/components/ui/button';
import { SPORT_BET_STATUS, useOddsFormatter } from '@/components/bets/cells';
import { formatAmount, formatTimeSecondsDayMonth } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { ChanceBet, SportBet, SportBetLeg } from '@/types/agent';
import type { BetDetailsModalProps, DetailRow } from './type';

const isChance = (bet: SportBet | ChanceBet): bet is ChanceBet => 'ticketId' in bet;

const statusRow = (status: SportBet['status']): DetailRow => {
  const s = SPORT_BET_STATUS[status];
  return { label: 'Bet Status', value: s?.label ?? status, valueClassName: s?.className };
};

const Rows = ({ rows }: { rows: DetailRow[] }) => (
  <>
    {rows.map((row) => (
      <div
        key={row.label}
        className="flex min-h-[42px] items-center justify-between gap-4 border-b border-border py-1.5 text-[15px]"
      >
        <dt className="text-foreground">{row.label}</dt>
        <dd className={cn('text-right text-foreground', row.valueClassName)}>{row.value}</dd>
      </div>
    ))}
  </>
);

const legRows = (leg: SportBetLeg): DetailRow[] => [
  { label: 'Sport', value: leg.sport },
  { label: 'League', value: leg.league },
  { label: 'Game', value: leg.game },
  { label: 'Event', value: leg.event, valueClassName: 'text-lime' },
  {
    label: 'Score',
    value: (
      <span className="inline-flex items-center gap-3">
        <span>{leg.score ?? '-'}</span>
        {/* Reporting a wrong score has no backend route yet. */}
        <Button variant="secondary" size="sm" disabled title="Not available yet">
          WRONG SCORE
        </Button>
      </span>
    ),
  },
  { label: 'Game Date', value: formatTimeSecondsDayMonth(leg.gameDate) },
];

/**
 * Design 17: "Details of bet # 1724377". Opened from the bet-id links on Bet List, Bets online and Chance.
 * Read-only; for a parlay every leg gets its own Sport … Game Date block.
 */
const BetDetailsModal = ({ isOpen, onClose, bet }: BetDetailsModalProps) => {
  const odds = useOddsFormatter();

  const renderSport = (b: SportBet) => {
    const head: DetailRow[] = [
      { label: 'Login', value: b.username },
      {
        label: 'Wager Type',
        value: b.wagerType === 'parlay' ? `Parlay ${b.legs.length}` : 'Single',
      },
      statusRow(b.status),
      { label: 'Money', value: formatAmount(b.stake) },
      { label: 'Total', value: b.net.toFixed(2) },
      { label: 'To Win', value: formatAmount(b.toWin) },
      { label: 'Benefit', value: formatAmount(b.toWin - b.stake) },
      { label: 'Odds', value: odds(b.odds) },
      { label: 'IP', value: b.ip ?? '-' },
      { label: 'Bet Date', value: formatTimeSecondsDayMonth(b.placedAt) },
    ];
    return (
      <>
        <Rows rows={head} />
        {b.legs.map((leg, i) => (
          <Fragment key={leg.id}>
            {b.legs.length > 1 && (
              <div className="pb-1 pt-4 text-xs font-bold uppercase tracking-wide text-muted">
                Selection {i + 1} · {odds(leg.odds)}
              </div>
            )}
            <Rows rows={legRows(leg)} />
          </Fragment>
        ))}
        <Rows
          rows={[
            {
              label: '100%',
              value: (
                <input
                  type="checkbox"
                  checked={!!b.fullShare}
                  readOnly
                  disabled
                  aria-label="Agent takes 100%"
                  className="h-4 w-4 accent-[#2f7cf6]"
                />
              ),
            },
          ]}
        />
      </>
    );
  };

  const renderChance = (b: ChanceBet) => (
    <Rows
      rows={[
        { label: 'Login', value: b.username },
        { label: 'Ticket ID', value: b.ticketId },
        { label: 'Lottery Number', value: b.lotteryNumber },
        { label: 'Type', value: b.type },
        statusRow(b.status),
        { label: 'Money', value: formatAmount(b.stake) },
        { label: 'Win', value: formatAmount(b.win) },
        { label: 'Total', value: (b.win - b.stake).toFixed(2) },
        { label: 'Form', value: b.form ?? '-' },
        { label: 'IP', value: b.ip ?? '-' },
        { label: 'Bet Date', value: formatTimeSecondsDayMonth(b.placedAt) },
        { label: 'Game Date', value: formatTimeSecondsDayMonth(b.gameDate) },
      ]}
    />
  );

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title={`Details of bet # ${bet.id}`}
      icon="lucide:ticket"
      size="sm"
      hideFooter
      bodyClassName="px-7 pb-5 pt-3"
    >
      <dl>{isChance(bet) ? renderChance(bet) : renderSport(bet)}</dl>
    </ModalShell>
  );
};

export default BetDetailsModal;
