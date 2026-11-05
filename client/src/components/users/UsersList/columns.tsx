'use client';

import type { ReactNode } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import InfoTip from '@/components/common/InfoTip';
import { AmountCell, UserCell } from '@/components/tables/cellRenderers';
import { formatAmount } from '@/lib/format';
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

/** Header label with an "i" whose tooltip explains the column. */
const HeaderInfo = ({ label, info }: { label: ReactNode; info: string }) => (
  <span className="inline-flex items-center justify-center gap-1">
    <span>{label}</span>
    <InfoTip text={info} placement="bottom" />
  </span>
);

const INFO = {
  publicId: 'The user’s short ID number.',
  user: 'Username and name. Click a user to open their profile, settings, limits and shares.',
  status:
    'Active or inactive. Switching an agent off blocks it and everyone below it; switching a player off stops them logging in to the casino.',
  creditBalance:
    'Player: the wallet balance right now. Agent: the credit left in its pool to give out. Click to set, add or take back credit.',
  calc: 'This week’s result plus corrections. Negative means the user owes; positive means they are owed. Click to see or add corrections.',
  backupCredit:
    'Extra credit set aside for an agent from your own pool, used once its own pool runs out.',
  riskMoney: 'Money in bets that are still open this week.',
  openBets: 'Number of bets this week that are not settled yet.',
  closedBets: 'Number of bets settled this week.',
  turnover: 'Total amount staked this week.',
  total: 'The full settled result of the week, before any discount or share split.',
  bonus: 'Loss discount given this week.',
  nette: 'Total minus the loss discount: the amount that is split by shares.',
  sharePct: 'This user’s share percentage.',
  companyShare:
    'The part of Nette that goes above this user: to the agents above and the operator.',
  agentShare: 'The part of Nette this user keeps, by its share %.',
} as const;

type FigureKey = Exclude<keyof Totals, 'creditBalance' | 'calc' | 'backupCredit'>;

const figure = (key: FigureKey, header: string, totals?: Totals): ColumnDef<UserTreeRow> => ({
  id: key,
  accessorKey: key,
  header: () => <HeaderInfo label={header} info={INFO[key]} />,
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
    header: () => <HeaderInfo label="User ID" info={INFO.publicId} />,
    cell: ({ row }) => <span className="tabular-nums">{row.original.publicId}</span>,
    footer: 'TOTAL',
    meta: { footerColSpan: 3 },
  },
  {
    id: 'user',
    header: () => <HeaderInfo label="User" info={INFO.user} />,
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
      <HeaderInfo
        label={
          <>
            User
            <br />
            Status
          </>
        }
        info={INFO.status}
      />
    ),
    cell: ({ row }) => <UserStatusSwitch row={row.original} disabled={row.original.id === meId} />,
    meta: { footerColSpan: 0 },
  },
  {
    id: 'creditBalance',
    header: () => <HeaderInfo label="Credit Balance" info={INFO.creditBalance} />,
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
    header: () => <HeaderInfo label="Calc" info={INFO.calc} />,
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
    header: () => <HeaderInfo label="Backup Credit" info={INFO.backupCredit} />,
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
    header: () => <HeaderInfo label="%" info={INFO.sharePct} />,
    cell: ({ row }) => <span className="tabular-nums">{formatAmount(row.original.sharePct)}</span>,
  },
  figure('companyShare', 'Company Share', totals),
  figure('agentShare', 'Agent Share', totals),
];
