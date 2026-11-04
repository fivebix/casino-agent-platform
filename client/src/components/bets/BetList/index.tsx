'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createColumnHelper } from '@tanstack/react-table';
import PageCard from '@/components/common/PageCard';
import Pagination from '@/components/common/Pagination';
import SearchBox from '@/components/common/SearchBox';
import WeekSwitcher from '@/components/common/WeekSwitcher';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import CommonTable, { type CommonColumnMeta } from '@/components/tables';
import {
  BET_STATUS_OPTIONS,
  BetIdLink,
  BetStatusText,
  LegInfo,
  MovedOdds,
  PAGE_SIZES,
  TicketButton,
  TimeDayCell,
  useOddsFormatter,
} from '@/components/bets/cells';
import { useModal } from '@/hooks/useModal';
import { MODAL_TYPES } from '@/components/modals/types';
import { useGetBetsQuery } from '@/services/agentApi';
import { formatAmount } from '@/lib/format';
import { buildLocalWeek } from '@/lib/week';
import { cn } from '@/lib/utils';
import type { SportBet, WeekStart } from '@/types/agent';

const SIZE_OPTIONS = PAGE_SIZES.map((n) => ({ value: String(n), label: `${n} bets per page` }));
const col = createColumnHelper<SportBet>();
const meta = (m: CommonColumnMeta) => m;

/** WIN column: settled P/L, or the potential profit while the bet is open. */
const betWin = (b: SportBet) => (b.status === 'open' ? b.toWin - b.stake : b.net);

type Deps = {
  odds: (v: number | null) => string;
  openDetails: (bet: SportBet) => void;
  totals: { count: number; stake: number; win: number };
};

const buildColumns = ({ odds, openDetails, totals }: Deps) => [
  col.accessor('id', {
    header: 'Bet ID',
    cell: (c) => <BetIdLink id={c.getValue()} onClick={() => openDetails(c.row.original)} />,
    footer: () => 'TOTAL',
    meta: meta({ footerColSpan: 3 }),
  }),
  col.accessor('playerPublicId', {
    header: 'User ID',
    cell: (c) => <span className="tabular-nums">{c.getValue()}</span>,
    meta: meta({ footerColSpan: 0 }),
  }),
  col.accessor('username', { header: 'Username', meta: meta({ footerColSpan: 0 }) }),
  col.accessor('placedAt', {
    header: 'Time',
    cell: (c) => <TimeDayCell value={c.getValue()} />,
    footer: () => `COUNT BETS:${totals.count}`,
    meta: meta({ footerColSpan: 8 }),
  }),
  col.display({
    id: 'sport',
    header: 'Sport',
    cell: ({ row: { original: b } }) =>
      b.wagerType === 'parlay' ? `Parlay ${b.legs.length}` : (b.legs[0]?.sport ?? '-'),
    meta: meta({ footerColSpan: 0 }),
  }),
  col.display({
    id: 'description',
    header: 'Description',
    cell: ({ row: { original: b } }) =>
      b.wagerType === 'single' && b.legs[0] ? <LegInfo leg={b.legs[0]} /> : null,
    meta: meta({ footerColSpan: 0, cellClassName: 'min-w-[260px] py-1' }),
  }),
  col.display({
    id: 'ticket',
    header: 'Ticket',
    cell: (c) => <TicketButton onClick={() => openDetails(c.row.original)} />,
    meta: meta({ footerColSpan: 0 }),
  }),
  col.accessor('odds', {
    header: 'Odds',
    cell: (c) => <span className="tabular-nums">{odds(c.getValue())}</span>,
    meta: meta({ footerColSpan: 0 }),
  }),
  col.accessor('odds5m', {
    header: '5 M',
    cell: (c) => <MovedOdds base={c.row.original.odds} value={c.getValue()} format={odds} />,
    meta: meta({ footerColSpan: 0 }),
  }),
  col.accessor('odds10m', {
    header: '10 M',
    cell: (c) => <MovedOdds base={c.row.original.odds} value={c.getValue()} format={odds} />,
    meta: meta({ footerColSpan: 0 }),
  }),
  col.accessor('oddsNow', {
    header: 'Now',
    cell: (c) => <MovedOdds base={c.row.original.odds} value={c.getValue()} format={odds} />,
    meta: meta({ footerColSpan: 0 }),
  }),
  col.accessor('stake', {
    header: 'Amount',
    cell: (c) => <span className="tabular-nums">{formatAmount(c.getValue())}</span>,
    footer: () => formatAmount(totals.stake),
  }),
  col.display({
    id: 'win',
    header: 'Win',
    cell: (c) => <span className="tabular-nums">{formatAmount(betWin(c.row.original))}</span>,
    footer: () => formatAmount(totals.win),
  }),
  col.display({
    id: 'result',
    header: 'Result',
    cell: ({ row: { original: b } }) => (b.wagerType === 'single' ? (b.legs[0]?.score ?? '') : ''),
    meta: meta({ footerColSpan: 2 }),
  }),
  col.accessor('status', {
    header: 'Status',
    cell: (c) => <BetStatusText status={c.getValue()} />,
    meta: meta({ footerColSpan: 0 }),
  }),
];

/**
 * Design 02. `GET /agent/bets?product=sport` — always empty until a sportsbook is integrated, so the table
 * shows its empty state; the columns are built for the `SportBet` shape in `types/agent.ts`.
 */
const BetList = () => {
  const router = useRouter();
  const { open } = useModal();
  const odds = useOddsFormatter();

  const [weekStart, setWeekStart] = useState<WeekStart | undefined>();
  const [status, setStatus] = useState('');
  const [limit, setLimit] = useState(100);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [moreThan, setMoreThan] = useState<number | null>(null);

  const week = useMemo(() => buildLocalWeek(weekStart), [weekStart]);
  const { data, isLoading, isFetching, isError, refetch } = useGetBetsQuery({
    weekStart,
    status: status || undefined,
    search: search || undefined,
    page,
    limit,
  });

  // "More then" (stake above) has no backend filter; it narrows the loaded page.
  const rows = useMemo(() => {
    const items = data?.items ?? [];
    return moreThan === null ? items : items.filter((b) => b.stake > moreThan);
  }, [data, moreThan]);

  const columns = useMemo(() => {
    const totals = rows.reduce(
      (t, b) => ({ count: t.count + 1, stake: t.stake + b.stake, win: t.win + betWin(b) }),
      { count: 0, stake: 0, win: 0 },
    );
    return buildColumns({
      odds,
      totals,
      openDetails: (bet) => open(MODAL_TYPES.BET_DETAILS, { bet }),
    });
  }, [rows, odds, open]);

  const onSearch = (v: Record<string, string>) => {
    const amount = Number(v.moreThan);
    setMoreThan(v.moreThan && Number.isFinite(amount) ? amount : null);
    // The backend takes one `search` string; a bet id wins over a username.
    setSearch(v.betId || v.username);
    setPage(1);
  };

  return (
    <PageCard
      title="Bet List"
      icon="lucide:binary"
      actions={
        <Button variant="link" className="font-semibold no-underline" onClick={() => router.back()}>
          Back
        </Button>
      }
    >
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
            wrapperClassName="w-[160px]"
            className="h-[30px]"
          />
        </div>
        <SearchBox
          label="Search Bet"
          fields={[
            { name: 'betId', placeholder: 'Bet Id' },
            { name: 'moreThan', placeholder: 'More then' },
            { name: 'username', placeholder: 'Username' },
          ]}
          onSearch={onSearch}
        />
      </div>

      <CommonTable
        data={rows}
        columns={columns}
        getRowId={(b) => b.id}
        isLoading={isLoading}
        isError={isError}
        errorMessage="Could not load bets"
        onRetry={refetch}
        emptyState="No bets for this filters"
        showFooter
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

export default BetList;
