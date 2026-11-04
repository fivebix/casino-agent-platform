'use client';

import { useMemo, useState } from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import PageCard from '@/components/common/PageCard';
import Pagination from '@/components/common/Pagination';
import SearchBox from '@/components/common/SearchBox';
import StateMessage from '@/components/common/StateMessage';
import { Select } from '@/components/ui/select';
import CommonTable, { type CommonColumnMeta } from '@/components/tables';
import { AmountCell } from '@/components/tables/cellRenderers';
import { PAGE_SIZES, TimeDayCell } from '@/components/bets/cells';
import { useGetCasinoProvidersQuery, useGetCasinoRoundsQuery } from '@/services/agentApi';
import { formatAmount, formatSigned } from '@/lib/format';
import { weekStartWithOffset } from '@/lib/week';
import { cn } from '@/lib/utils';
import type { CasinoRound } from '@/types/agent';

/** Week filter (design 29): Current, then -1 … -8 weeks back. */
const WEEK_OPTIONS = [
  { value: '0', label: 'Current' },
  ...Array.from({ length: 8 }, (_, i) => ({ value: String(i + 1), label: `-${i + 1}` })),
];
const SIZE_OPTIONS = PAGE_SIZES.map((n) => ({ value: String(n), label: String(n) }));

const col = createColumnHelper<CasinoRound>();
const meta = (m: CommonColumnMeta) => m;

type Totals = { stake: number; win: number; net: number; count: number };

const buildColumns = (totals: Totals) => [
  col.accessor('roundId', {
    header: 'Round ID',
    cell: (c) => <span className="tabular-nums">{c.getValue()}</span>,
    footer: () => `TOTAL · ${totals.count} ${totals.count === 1 ? 'round' : 'rounds'}`,
    meta: meta({ footerColSpan: 6 }),
  }),
  col.accessor('username', { header: 'Username', meta: meta({ footerColSpan: 0 }) }),
  col.accessor('agentUsername', {
    header: 'Agent',
    cell: (c) => c.getValue() ?? '—',
    meta: meta({ footerColSpan: 0 }),
  }),
  col.accessor('playedAt', {
    header: 'Date',
    cell: (c) => <TimeDayCell value={c.getValue()} />,
    meta: meta({ footerColSpan: 0 }),
  }),
  col.accessor('provider', { header: 'Service', meta: meta({ footerColSpan: 0 }) }),
  col.accessor('game', { header: 'Game', meta: meta({ footerColSpan: 0 }) }),
  col.accessor('stake', {
    header: 'Bet',
    cell: (c) => <AmountCell value={c.getValue()} />,
    footer: () => formatAmount(totals.stake),
    meta: meta({ headerClassName: 'w-[60px]' }),
  }),
  col.accessor('win', {
    header: 'Win',
    cell: (c) => <AmountCell value={c.getValue()} />,
    footer: () => formatAmount(totals.win),
    meta: meta({ headerClassName: 'w-[60px]' }),
  }),
  col.accessor('net', {
    header: 'Result',
    cell: (c) => <span className="tabular-nums">{formatSigned(c.getValue())}</span>,
    footer: () => formatSigned(totals.net),
    meta: meta({ headerClassName: 'w-[94px]' }),
  }),
];

/**
 * Designs 04 / 04b / 28 / 29. `GET /agent/casino-rounds` (+ `GET /agent/casino-providers` for the
 * "All Service" filter). The TOTAL row sums the current page.
 */
const CasinoList = () => {
  const [providerId, setProviderId] = useState('');
  const [limit, setLimit] = useState(50);
  const [weekOffset, setWeekOffset] = useState(0);
  const [page, setPage] = useState(1);
  const [username, setUsername] = useState('');
  const [game, setGame] = useState('');

  const providers = useGetCasinoProvidersQuery();
  const { data, isLoading, isFetching, isError, refetch } = useGetCasinoRoundsQuery({
    weekStart: weekOffset === 0 ? undefined : weekStartWithOffset(weekOffset),
    providerId: providerId || undefined,
    search: username || undefined,
    page,
    limit,
  });

  // The backend searches username / name only, so the Game box filters the loaded page.
  const rows = useMemo(() => {
    const items = data?.items ?? [];
    const q = game.toLowerCase();
    return q ? items.filter((r) => r.game.toLowerCase().includes(q)) : items;
  }, [data, game]);

  const columns = useMemo(() => {
    const totals = rows.reduce<Totals>(
      (t, r) => ({
        stake: t.stake + r.stake,
        win: t.win + r.win,
        net: t.net + r.net,
        count: t.count + 1,
      }),
      { stake: 0, win: 0, net: 0, count: 0 },
    );
    return buildColumns(totals);
  }, [rows]);

  const providerOptions = (providers.data ?? []).map((p) => ({ value: p.id, label: p.name }));
  const resetPage =
    <T,>(set: (v: T) => void) =>
    (v: T) => {
      set(v);
      setPage(1);
    };

  return (
    <PageCard title="Casino List" icon="lucide:binary">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <Select
            aria-label="Service"
            placeholder="All Service"
            options={providerOptions}
            value={providerId}
            disabled={providers.isLoading}
            onChange={(e) => resetPage(setProviderId)(e.target.value)}
            wrapperClassName="w-[200px]"
            className="h-[30px]"
          />
          <Select
            aria-label="Rounds per page"
            options={SIZE_OPTIONS}
            value={String(limit)}
            onChange={(e) => resetPage(setLimit)(Number(e.target.value))}
            className="h-[30px]"
          />
          <Select
            aria-label="Week"
            options={WEEK_OPTIONS}
            value={String(weekOffset)}
            onChange={(e) => resetPage(setWeekOffset)(Number(e.target.value))}
            className="h-[30px]"
          />
        </div>
        <SearchBox
          label="Search Bet"
          fields={[
            { name: 'game', placeholder: 'Game' },
            { name: 'username', placeholder: 'Username' },
          ]}
          onSearch={(v) => {
            setGame(v.game);
            resetPage(setUsername)(v.username);
          }}
        />
      </div>

      {/* Design 04b: an empty result shows only the message, no table. */}
      {!isLoading && !isError && rows.length === 0 ? (
        <StateMessage variant="empty" message="No bets for this filters" className="py-4" />
      ) : (
        <CommonTable
          data={rows}
          columns={columns}
          getRowId={(r) => r.id}
          isLoading={isLoading}
          isError={isError}
          errorMessage="Could not load casino rounds"
          onRetry={refetch}
          showFooter
          className={cn(isFetching && !isLoading && 'opacity-70')}
        />
      )}

      <Pagination
        meta={data?.meta}
        onChange={setPage}
        disabled={isFetching}
        className="mt-3 pr-2"
      />
    </PageCard>
  );
};

export default CasinoList;
