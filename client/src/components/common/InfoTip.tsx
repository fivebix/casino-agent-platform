import { Icon } from '@iconify/react';
import { cn } from '@/lib/utils';

type Props = {
  /** Tooltip text shown on hover / keyboard focus. */
  text: string;
  /** `bottom` opens the tooltip below and centred, for table headers at the top of a scroll area. */
  placement?: 'top' | 'bottom';
  className?: string;
};

/** The round "i" icon from User Edit → Settings, with a CSS-only tooltip above (or below) it. */
const InfoTip = ({ text, placement = 'top', className }: Props) => (
  <span className={cn('group relative inline-flex', className)}>
    <button
      type="button"
      aria-label={text}
      className="flex h-5 w-5 items-center justify-center rounded-full text-muted outline-none hover:text-foreground focus-visible:text-lime"
    >
      <Icon icon="lucide:info" className="h-[18px] w-[18px]" />
    </button>
    <span
      role="tooltip"
      className={cn(
        'pointer-events-none absolute z-20 w-60 rounded-xs border border-border-strong bg-popover px-3 py-2 text-left text-xs font-normal normal-case leading-4 tracking-normal text-foreground opacity-0 shadow-xl transition-opacity group-focus-within:opacity-100 group-hover:opacity-100',
        placement === 'top'
          ? 'bottom-full right-0 mb-2'
          : 'left-1/2 top-full mt-2 -translate-x-1/2',
      )}
    >
      {text}
    </span>
  </span>
);

export default InfoTip;
