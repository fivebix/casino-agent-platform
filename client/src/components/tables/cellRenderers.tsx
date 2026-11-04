'use client';

import { RoleBadge } from '@/components/ui/roleBadge';
import { formatAmount, formatSigned } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { NodeRole } from '@/types/agent';

type AmountCellProps = {
  value: number | null | undefined;
  /** `+25` style for P/L columns. */
  signed?: boolean;
  /** Bold (TOTAL row). */
  bold?: boolean;
};

/** Number cell: negatives in red (CALC -5, P/L -20); `signed` adds `+` and greens positives. */
export const AmountCell = ({ value, signed, bold }: AmountCellProps) => (
  <span
    className={cn(
      'tabular-nums',
      bold && 'font-bold',
      typeof value === 'number' && value < 0 && 'text-negative',
      signed && typeof value === 'number' && value > 0 && 'text-success',
    )}
  >
    {signed ? formatSigned(value) : formatAmount(value)}
  </span>
);

type UserCellProps = {
  role: NodeRole;
  username: string;
  name?: string;
  onClick?: () => void;
  /** Tree screens (designs 21–23): badge left of the username instead of above it. */
  inline?: boolean;
  /** Left indentation in levels (tree depth), 16px each. */
  indent?: number;
};

/** The USER column: role badge, lime underlined username (clickable), grey `(name)` under it. */
export const UserCell = ({ role, username, name, onClick, inline, indent = 0 }: UserCellProps) => {
  const link = (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className="text-sm text-lime underline underline-offset-2 hover:text-lime-hover disabled:no-underline disabled:cursor-default"
    >
      {username}
    </button>
  );
  return (
    <div
      className="flex flex-col items-start px-1 text-left leading-tight"
      style={indent ? { paddingLeft: 4 + indent * 16 } : undefined}
    >
      {inline ? (
        <span className="flex items-center gap-1.5">
          <RoleBadge role={role} />
          {link}
        </span>
      ) : (
        <>
          <RoleBadge role={role} />
          {link}
        </>
      )}
      {name && <span className="text-[11px] text-muted">({name})</span>}
    </div>
  );
};
