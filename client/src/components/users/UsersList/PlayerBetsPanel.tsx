'use client';

import { useState } from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import Pagination from '@/components/common/Pagination';
import ShortId from '@/components/common/ShortId';
import CommonTable from '@/components/tables';
import { AmountCell } from '@/components/tables/cellRenderers';
import { BET_STATUS_PILL, StatusPill } from '@/components/ui/statusPill';
import { formatShortDateTime } from '@/lib/format';
import { useGetPlayerBetsQuery } from '@/services/agentApi';
import type { BetRow, WeekStart } from '@/types/agent';

const PAGE_SIZE = 10;

const col = createColumnHelper<BetRow>();

const columns = [
  col.accessor('roundId', {
    header: 'Bet #',
    cell: (info) => <ShortId value={info.getValue()} />,
    meta: { info: 'The round ID (last four characters). Use the copy icon to copy the full ID.' },
  }),
  col.accessor('placedAt', {
    header: 'Date',
    cell: (info) => (
      <span className="whitespace-nowrap">{formatShortDateTime(info.getValue())}</span>
    ),
    meta: { info: 'When the round was played, in your time zone.' },
  }),
  col.display({
    id: 'event',
    header: 'Event · Pick',
    cell: ({ row }) => `${row.original.game} · ${row.original.provider}`,
    meta: { cellClassName: 'px-4', info: 'The game and its provider.' },
  }),
  col.accessor('stake', {
    header: 'Stake',
    cell: (info) => <AmountCell value={info.getValue()} />,
    meta: { info: 'Total amount bet in the round.' },
  }),
  // Casino rounds have no odds.
  col.display({
    id: 'odds',
    header: 'Odds',
    cell: () => '—',
    meta: { info: 'Odds of a sports pick. Casino rounds have none.' },
  }),
  col.accessor('status', {
    header: 'Status',
    cell: (info) => {
      const pill = BET_STATUS_PILL[info.getValue()] ?? { label: info.getValue(), tone: 'neutral' };
      return <StatusPill tone={pill.tone}>{pill.label}</StatusPill>;
    },
    meta: { info: 'Won if the round paid anything back, otherwise lost.' },
  }),
  col.accessor('net', {
    header: 'P/L',
    cell: ({ row }) =>
      row.original.status === 'open' ? '—' : <AmountCell value={row.original.net} signed />,
    meta: { info: 'The player’s profit or loss on the round: win minus stake.' },
  }),
];

type Props = {
  playerId: string;
  username: string;
  weekStart?: WeekStart;
};

/** Player row expand: "Bets this week · dani77 · settled 3 → Calc -5 · 1 open" + the week's rounds, 10 per page. */
const PlayerBetsPanel = ({ playerId, username, weekStart }: Props) => {
  const [page, setPage] = useState(1);
  const [prevWeek, setPrevWeek] = useState(weekStart);
  if (prevWeek !== weekStart) {
    setPrevWeek(weekStart);
    setPage(1);
  }
  const { data, isLoading, isFetching, isError, refetch } = useGetPlayerBetsQuery({
    playerId,
    weekStart,
    page,
    limit: PAGE_SIZE,
  });

  return (
    <div className="px-9 pb-2.5 pt-1.5 text-left">
      <p className="pb-2.5 text-xs font-bold text-foreground">
        Bets this week · {username}
        {data && (
          <>
            {' '}
            · settled {data.settled} → Calc{' '}
            <span className={data.calc < 0 ? 'text-negative' : undefined}>
              <AmountCell value={data.calc} />
            </span>{' '}
            · {data.open} open
          </>
        )}
      </p>
      <CommonTable
        data={data?.items ?? []}
        columns={columns}
        size="sm"
        skeletonRows={2}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        getRowId={(r) => r.id}
        emptyState="No bets this week"
        className="w-auto max-w-full"
        tableClassName="w-auto min-w-[640px]"
      />
      {data && data.meta.totalPages > 1 && (
        <div className="flex min-w-[640px] items-center justify-between pt-2 text-xs text-muted">
          <span>
            {(data.meta.currentPage - 1) * PAGE_SIZE + 1}–
            {Math.min(data.meta.currentPage * PAGE_SIZE, data.meta.totalItems)} of{' '}
            {data.meta.totalItems} bets
          </span>
          <Pagination meta={data.meta} onChange={setPage} disabled={isFetching} />
        </div>
      )}
    </div>
  );
};

export default PlayerBetsPanel;
