'use client';

import { createColumnHelper } from '@tanstack/react-table';
import CommonTable from '@/components/tables';
import { AmountCell } from '@/components/tables/cellRenderers';
import { BET_STATUS_PILL, StatusPill } from '@/components/ui/statusPill';
import { formatShortDateTime } from '@/lib/format';
import { useGetPlayerBetsQuery } from '@/services/agentApi';
import type { BetRow, WeekStart } from '@/types/agent';

const col = createColumnHelper<BetRow>();

const columns = [
  col.accessor('roundId', {
    header: 'Bet #',
    cell: (info) => (
      <span className="text-lime underline underline-offset-2">{info.getValue()}</span>
    ),
  }),
  col.accessor('placedAt', {
    header: 'Date',
    cell: (info) => (
      <span className="whitespace-nowrap">{formatShortDateTime(info.getValue())}</span>
    ),
  }),
  col.display({
    id: 'event',
    header: 'Event · Pick',
    cell: ({ row }) => `${row.original.game} · ${row.original.provider}`,
    meta: { cellClassName: 'px-4' },
  }),
  col.accessor('stake', {
    header: 'Stake',
    cell: (info) => <AmountCell value={info.getValue()} />,
  }),
  // Casino rounds have no odds.
  col.display({ id: 'odds', header: 'Odds', cell: () => '—' }),
  col.accessor('status', {
    header: 'Status',
    cell: (info) => {
      const pill = BET_STATUS_PILL[info.getValue()] ?? { label: info.getValue(), tone: 'neutral' };
      return <StatusPill tone={pill.tone}>{pill.label}</StatusPill>;
    },
  }),
  col.accessor('net', {
    header: 'P/L',
    cell: ({ row }) =>
      row.original.status === 'open' ? '—' : <AmountCell value={row.original.net} signed />,
  }),
];

type Props = {
  playerId: string;
  username: string;
  weekStart?: WeekStart;
};

/** Player row expand: "Bets this week · dani77 · settled 3 → Calc -5 · 1 open" + the week's rounds. */
const PlayerBetsPanel = ({ playerId, username, weekStart }: Props) => {
  const { data, isLoading, isError, refetch } = useGetPlayerBetsQuery({ playerId, weekStart });

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
    </div>
  );
};

export default PlayerBetsPanel;
