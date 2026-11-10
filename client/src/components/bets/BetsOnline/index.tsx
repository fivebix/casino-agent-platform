'use client';

import { useMemo, useState } from 'react';
import { Icon } from '@iconify/react';
import { createColumnHelper } from '@tanstack/react-table';
import PageCard from '@/components/common/PageCard';
import Pagination from '@/components/common/Pagination';
import SearchBox from '@/components/common/SearchBox';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import CommonTable, { type CommonColumnMeta } from '@/components/tables';
import {
  BetIdLink,
  LegInfo,
  MovedOdds,
  ParlayInfo,
  useOddsFormatter,
} from '@/components/bets/cells';
import { useModal } from '@/hooks/useModal';
import { MODAL_TYPES } from '@/components/modals/types';
import { useGetBetsQuery } from '@/services/agentApi';
import { formatAmount, formatTimeWithSeconds } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { BetsOnlineRow, LiveFilter } from './type';
import type { SportBet } from '@/types/agent';

const LIVE_FILTERS: { value: LiveFilter; label: string }[] = [
  { value: 'all', label: 'Show All' },
  { value: 'prematch', label: 'Show Prematch' },
  { value: 'live', label: 'Show Live' },
];

const col = createColumnHelper<BetsOnlineRow>();
const meta = (m: CommonColumnMeta) => m;

/** Bet-level cell: blank on a leg row. */
const betCell =
  (render: (bet: SportBet) => React.ReactNode) =>
  ({ row }: { row: { original: BetsOnlineRow } }) =>
    row.original.kind === 'bet' ? render(row.original.bet) : null;

/** A parlay's legs become child rows with the same columns (only INFORMATION and odds filled). */
const getSubRows = (r: BetsOnlineRow): BetsOnlineRow[] | undefined =>
  r.kind === 'bet' && r.bet.wagerType === 'parlay'
    ? r.bet.legs.map((leg) => ({ kind: 'leg', bet: r.bet, leg }))
    : undefined;

type Deps = {
  odds: (v: number | null) => string;
  openDetails: (bet: SportBet) => void;
};

const buildColumns = ({ odds, openDetails }: Deps) => [
  col.display({
    id: 'id',
    header: 'Bet ID',
    cell: betCell((b) => <BetIdLink id={b.id} onClick={() => openDetails(b)} />),
    meta: { info: 'The bet’s ID. Click it to open the ticket.' },
  }),
  col.display({
    id: 'fullShare',
    header: '',
    cell: betCell((b) =>
      b.fullShare === null ? null : b.fullShare ? (
        <Icon icon="lucide:check" aria-label="100%" className="mx-auto h-5 w-5 text-lime" />
      ) : (
        <Icon icon="lucide:x" aria-label="Not 100%" className="mx-auto h-5 w-5 text-negative" />
      ),
    ),
    meta: meta({ headerClassName: 'w-[36px]' }),
  }),
  col.display({
    id: 'sharePct',
    header: '',
    cell: betCell((b) => (b.sharePct === null ? null : formatAmount(b.sharePct))),
    meta: meta({ headerClassName: 'w-[34px]' }),
  }),
  col.display({
    id: 'username',
    header: 'Username',
    cell: betCell((b) => b.username),
    meta: { info: 'The player who placed the bet.' },
  }),
  col.display({
    id: 'name',
    header: 'Name',
    cell: betCell((b) => b.name),
    meta: { info: 'The player’s name.' },
  }),
  col.display({
    id: 'placedAt',
    header: 'Bet Date',
    cell: betCell((b) => <span className="tabular-nums">{formatTimeWithSeconds(b.placedAt)}</span>),
    meta: { info: 'When the bet was placed, in your time zone.' },
  }),
  col.display({
    id: 'information',
    header: 'Information',
    cell: ({ row: { original: r } }) =>
      r.kind === 'leg' ? (
        <LegInfo leg={r.leg} />
      ) : r.bet.wagerType === 'parlay' ? (
        <ParlayInfo bet={r.bet} />
      ) : r.bet.legs[0] ? (
        <LegInfo leg={r.bet.legs[0]} />
      ) : null,
    meta: meta({ info: 'The event, the pick and its odds.', cellClassName: 'min-w-[300px] py-1' }),
  }),
  col.display({
    id: 'odds',
    header: 'Agent Percent',
    cell: ({ row: { original: r } }) => (
      <span className="tabular-nums">{odds(r.kind === 'leg' ? r.leg.odds : r.bet.odds)}</span>
    ),
    meta: { info: 'Your share percentage on this bet.' },
  }),
  col.display({
    id: 'odds5m',
    header: '5 M',
    cell: betCell((b) => <MovedOdds base={b.odds} value={b.odds5m} format={odds} />),
    meta: { info: 'Odds of the same pick 5 minutes after the bet.' },
  }),
  col.display({
    id: 'odds10m',
    header: '10 M',
    cell: betCell((b) => <MovedOdds base={b.odds} value={b.odds10m} format={odds} />),
    meta: { info: 'Odds of the same pick 10 minutes after the bet.' },
  }),
  col.display({
    id: 'oddsNow',
    header: 'Now',
    cell: betCell((b) => <MovedOdds base={b.odds} value={b.oddsNow} format={odds} />),
    meta: { info: 'Odds of the same pick right now.' },
  }),
  col.display({
    id: 'stake',
    header: 'Amount',
    cell: betCell((b) => <span className="tabular-nums">{formatAmount(b.stake)}</span>),
    meta: { info: 'Amount staked.' },
  }),
  col.display({
    id: 'toWin',
    header: 'Wining',
    cell: betCell((b) => <span className="tabular-nums">{formatAmount(b.toWin)}</span>),
    meta: { info: 'What the bet pays if it wins.' },
  }),
];

/**
 * Design 03: open bets right now. `GET /agent/bets?product=sport&live=` (true = live, false = prematch,
 * omitted = all) — empty until a sportsbook is integrated. A parlay row expands (+) into its legs.
 */
const BetsOnline = () => {
  const { open } = useModal();
  const odds = useOddsFormatter();

  const [liveFilter, setLiveFilter] = useState<LiveFilter>('all');
  const [fullShareOnly, setFullShareOnly] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, isFetching, isError, refetch } = useGetBetsQuery({
    status: 'open',
    live: liveFilter === 'all' ? undefined : liveFilter === 'live',
    search: search || undefined,
    page,
    limit: 100,
  });

  // The "100%" box has no backend filter; it narrows the loaded page to bets the agent takes in full.
  const rows = useMemo<BetsOnlineRow[]>(
    () =>
      (data?.items ?? [])
        .filter((b) => !fullShareOnly || b.fullShare === true)
        .map((bet) => ({ kind: 'bet', bet })),
    [data, fullShareOnly],
  );

  const columns = useMemo(
    () => buildColumns({ odds, openDetails: (bet) => open(MODAL_TYPES.BET_DETAILS, { bet }) }),
    [odds, open],
  );

  return (
    <PageCard title="Bets online" icon="lucide:binary">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Checkbox
            label="100%"
            checked={fullShareOnly}
            onChange={(e) => setFullShareOnly(e.target.checked)}
            className="mr-1"
          />
          {LIVE_FILTERS.map((f) => (
            <Button
              key={f.value}
              size="sm"
              variant={f.value === liveFilter ? 'danger' : 'secondary'}
              aria-pressed={f.value === liveFilter}
              onClick={() => {
                setLiveFilter(f.value);
                setPage(1);
              }}
            >
              {f.label}
            </Button>
          ))}
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
        data={rows}
        columns={columns}
        getSubRows={getSubRows}
        getRowId={(r, i) => (r.kind === 'bet' ? r.bet.id : `${r.bet.id}:${r.leg.id}:${i}`)}
        isLoading={isLoading}
        isError={isError}
        errorMessage="Could not load bets"
        onRetry={refetch}
        emptyState="No bets for this filters"
        className={cn(isFetching && !isLoading && 'opacity-70')}
      />

      {(data?.meta.totalPages ?? 1) > 1 && (
        <Pagination
          meta={data?.meta}
          onChange={setPage}
          disabled={isFetching}
          className="mt-3 pr-2"
        />
      )}
    </PageCard>
  );
};

export default BetsOnline;
