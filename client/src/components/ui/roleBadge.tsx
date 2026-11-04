import { cn } from '@/lib/utils';
import type { NodeRole } from '@/types/agent';

const ROLE_STYLES: Record<Exclude<NodeRole, 'player'>, { label: string; className: string }> = {
  admin_agent: { label: 'ADMIN AGENT', className: 'bg-warning text-[#1a1205]' },
  agent: { label: 'AGENT', className: 'bg-success text-[#06210f]' },
  sub_agent: { label: 'SUB-AGENT', className: 'bg-lime text-lime-ink' },
};

type Props = {
  role: NodeRole;
  className?: string;
};

/** ADMIN AGENT (amber) / AGENT (green) / SUB-AGENT (lime). Renders nothing for `player`. */
const RoleBadge = ({ role, className }: Props) => {
  if (role === 'player') return null;
  const style = ROLE_STYLES[role];
  return (
    <span
      className={cn(
        'inline-block rounded-xs px-1 py-px text-[9px] font-extrabold leading-[11px] tracking-[0.06em]',
        style.className,
        className,
      )}
    >
      {style.label}
    </span>
  );
};

export { RoleBadge };
