'use client';

import { Icon } from '@iconify/react';
import type { ColumnDef } from '@tanstack/react-table';
import { AmountCell, UserCell } from '@/components/tables/cellRenderers';
import { formatAmount } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { Totals } from '@/types/agent';
import UserStatusSwitch from './UserStatusSwitch';
import type { UserTreeRow, UsersView } from './type';

type Handlers = {
  onUser: (row: UserTreeRow) => void;
  onCredit: (row: UserTreeRow) => void;
  onCalc: (row: UserTreeRow) => void;
  onBackupCredit: (row: UserTreeRow) => void;
};

type Options = Handlers & {
  view: UsersView;
  totals?: Totals;
  /** The signed-in agent: its own (tree) row has no actions. */
  meId?: string;
  /** An admin agent moves credit for anyone in its tree; other agents only for their direct users. */
  isAdminAgent?: boolean;
};

/** A figure that opens a dialog (CREDIT BALANCE, CALC, agents' BACKUP CREDIT). */
const ClickableAmount = ({
  value,
  onClick,
  label,
}: {
  value: number;
  onClick: () => void;
  label: string;
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={label}
    className="rounded-xs px-1.5 py-0.5 hover:bg-white/10 hover:text-lime focus-visible:outline-2 focus-visible:outline-lime"
  >
    <AmountCell value={value} />
  </button>
);

type FigureKey = Exclude<keyof Totals, 'creditBalance' | 'calc' | 'backupCredit'>;

const figure = (key: FigureKey, header: string, totals?: Totals): ColumnDef<UserTreeRow> => ({
  id: key,
  accessorKey: key,
  header,
  cell: ({ row }) => <AmountCell value={row.original[key]} />,
  footer: () => <AmountCell value={totals?.[key]} bold />,
});

export const buildUserColumns = ({
  view,
  totals,
  meId,
  isAdminAgent,
  onUser,
  onCredit,
  onCalc,
  onBackupCredit,
}: Options): ColumnDef<UserTreeRow>[] => [
  {
    id: 'publicId',
    header: 'User ID',
    cell: ({ row }) => <span className="tabular-nums">{row.original.publicId}</span>,
    footer: 'TOTAL',
    meta: { footerColSpan: 3 },
  },
  {
    id: 'user',
    header: 'User',
    cell: ({ row }) => (
      <UserCell
        role={row.original.role}
        username={row.original.username}
        name={row.original.name}
        onClick={row.original.id === meId ? undefined : () => onUser(row.original)}
        inline={view === 'tree'}
        indent={row.depth}
      />
    ),
    meta: { footerColSpan: 0, cellClassName: 'min-w-[96px]' },
  },
  {
    id: 'status',
    header: () => (
      <>
        User
        <br />
        Status
      </>
    ),
    cell: ({ row }) => (
      <UserStatusSwitch row={row.original} disabled={row.original.id === meId} />
    ),
    meta: { footerColSpan: 0 },
  },
  {
    id: 'creditBalance',
    header: 'Credit Balance',
    cell: ({ row }) =>
      row.original.id !== meId && (isAdminAgent || row.original.parentId === meId) ? (
        <ClickableAmount
          value={row.original.creditBalance}
          onClick={() => onCredit(row.original)}
          label={`Credit amount of ${row.original.username}`}
        />
      ) : (
        <AmountCell value={row.original.creditBalance} />
      ),
    footer: () => <AmountCell value={totals?.creditBalance} bold />,
  },
  {
    id: 'calc',
    header: 'Calc',
    cell: ({ row }) =>
      row.original.id === meId ? (
        <AmountCell value={row.original.calc} />
      ) : (
        <ClickableAmount
          value={row.original.calc}
          onClick={() => onCalc(row.original)}
          label={`Calculation of ${row.original.username}`}
        />
      ),
    footer: () => <AmountCell value={totals?.calc} bold />,
  },
  {
    id: 'backupCredit',
    header: 'Backup Credit',
    cell: ({ row }) =>
      row.original.kind === 'agent' && row.original.parentId === meId ? (
        <ClickableAmount
          value={row.original.backupCredit}
          onClick={() => onBackupCredit(row.original)}
          label={`Backup credit of ${row.original.username}`}
        />
      ) : (
        <AmountCell value={row.original.backupCredit} />
      ),
    footer: () => <AmountCell value={totals?.backupCredit} bold />,
  },
  figure('riskMoney', 'Risk Money', totals),
  figure('openBets', 'Open Bets', totals),
  figure('closedBets', 'Closed Bets', totals),
  figure('turnover', 'Overturn', totals),
  figure('total', 'Total 100%', totals),
  figure('bonus', 'Bonus', totals),
  figure('nette', 'Nette', totals),
  {
    id: 'sharePct',
    header: '%',
    cell: ({ row }) => <span className="tabular-nums">{formatAmount(row.original.sharePct)}</span>,
  },
  figure('companyShare', 'Company Share', totals),
  figure('agentShare', 'Agent Share', totals),
  {
    id: 'login',
    header: 'Login',
    // Login-as-user is not in the backend yet.
    cell: ({ row }) => (
      <span title="Coming soon" className="inline-flex">
        <button
          type="button"
          disabled
          aria-label={`Log in as ${row.original.username} (coming soon)`}
          className={cn('cursor-not-allowed text-faint')}
        >
          <Icon icon="lucide:log-in" className="h-4 w-4" />
        </button>
      </span>
    ),
  },
];
