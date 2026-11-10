'use client';

import { useMemo, useState } from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import PageCard from '@/components/common/PageCard';
import Pagination from '@/components/common/Pagination';
import SearchBox from '@/components/common/SearchBox';
import WeekSwitcher from '@/components/common/WeekSwitcher';
import { Select } from '@/components/ui/select';
import CommonTable from '@/components/tables';
import {
  BET_STATUS_OPTIONS,
  BetIdLink,
  BetStatusText,
  PAGE_SIZES,
  TimeDayCell,
} from '@/components/bets/cells';
import { useModal } from '@/hooks/useModal';
import { MODAL_TYPES } from '@/components/modals/types';
import { useGetChanceBetsQuery } from '@/services/agentApi';
import { formatAmount } from '@/lib/format';
import { buildLocalWeek } from '@/lib/week';
import { cn } from '@/lib/utils';
import type { ChanceBet, WeekStart } from '@/types/agent';

const SIZE_OPTIONS = PAGE_SIZES.map((n) => ({ value: String(n), label: String(n) }));
const col = createColumnHelper<ChanceBet>();

const buildColumns = (openDetails: (bet: ChanceBet) => void) => [
  col.accessor('id', {
    header: 'ID',
    cell: (c) => <BetIdLink id={c.getValue()} onClick={() => openDetails(c.row.original)} />,
    meta: { info: 'The bet’s ID.' },
  }),
  col.accessor('username', {
    header: 'Username',
    meta: { info: 'The player who placed the bet.' },
  }),
  col.accessor('placedAt', {
    header: 'Bet Date',
    cell: (c) => <TimeDayCell value={c.getValue()} />,
    meta: { info: 'When the bet was placed, in your time zone.' },
  }),
  col.accessor('ticketId', { header: 'Ticket ID', meta: { info: 'The lottery ticket ID.' } }),
  col.accessor('lotteryNumber', {
    header: 'Lottery Number',
    meta: { info: 'The numbers played.' },
  }),
  col.accessor('gameDate', {
    header: 'Game Date',
    cell: (c) => <TimeDayCell value={c.getValue()} />,
    meta: { info: 'When the draw takes place, in your time zone.' },
  }),
  col.accessor('type', { header: 'Type', meta: { info: 'The kind of lottery bet.' } }),
  col.accessor('stake', {
    header: 'Amount',
    cell: (c) => <span className="tabular-nums">{formatAmount(c.getValue())}</span>,
    meta: { info: 'Amount staked.' },
  }),
  col.accessor('win', {
    header: 'Win',
    cell: (c) => <span className="tabular-nums">{formatAmount(c.getValue())}</span>,
    meta: { info: 'Amount won.' },
  }),
  col.accessor('status', {
    header: 'Status',
    cell: (c) => <BetStatusText status={c.getValue()} />,
    meta: { info: 'Open, won or lost.' },
  }),
  col.accessor('form', {
    header: 'Form',
    cell: (c) => c.getValue() ?? '-',
    meta: { info: 'How the numbers were played.' },
  }),
];

/** Design 05. `GET /agent/bets?product=chance` — always empty for now. */
const ChanceList = () => {
  const { open } = useModal();
  const [weekStart, setWeekStart] = useState<WeekStart | undefined>();
  const [status, setStatus] = useState('');
  const [limit, setLimit] = useState(50);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const week = useMemo(() => buildLocalWeek(weekStart), [weekStart]);
  const { data, isLoading, isFetching, isError, refetch } = useGetChanceBetsQuery({
    weekStart,
    status: status || undefined,
    search: search || undefined,
    page,
    limit,
  });

  const columns = useMemo(
    () => buildColumns((bet) => open(MODAL_TYPES.BET_DETAILS, { bet })),
    [open],
  );

  return (
    <PageCard title="Chance" icon="lucide:binary">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <WeekSwitcher
            week={week}
            disabled={isFetching}
            onChange={(w) => {
              setWeekStart(w === buildLocalWeek().weekStart ? undefined : w);
              setPage(1);
            }}
          />
          <Select
            aria-label="Status"
            placeholder="All statuses"
            options={BET_STATUS_OPTIONS}
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="h-[30px]"
          />
          <Select
            aria-label="Bets per page"
            options={SIZE_OPTIONS}
            value={String(limit)}
            onChange={(e) => {
              setLimit(Number(e.target.value));
              setPage(1);
            }}
            className="h-[30px]"
          />
        </div>
        <SearchBox
          label="Search Bet"
          fields={[
            { name: 'betId', placeholder: 'Bet Id' },
            { name: 'username', placeholder: 'Username' },
          ]}
          onSearch={(v) => {
            setSearch(v.betId || v.username);
            setPage(1);
          }}
        />
      </div>

      <CommonTable
        data={data?.items ?? []}
        columns={columns}
        getRowId={(b) => b.id}
        isLoading={isLoading}
        isError={isError}
        errorMessage="Could not load bets"
        onRetry={refetch}
        emptyState="No bets for this filters"
        className={cn(isFetching && !isLoading && 'opacity-70')}
      />

      <Pagination
        meta={data?.meta}
        onChange={setPage}
        disabled={isFetching}
        className="mt-3 pr-2"
      />
    </PageCard>
  );
};

export default ChanceList;
