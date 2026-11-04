import { Icon } from '@iconify/react';
import { cn } from '@/lib/utils';

type Props = {
  /** Tooltip text shown on hover / keyboard focus. */
  text: string;
  className?: string;
};

/** The round "i" icon from User Edit → Settings, with a CSS-only tooltip above it. */
const InfoTip = ({ text, className }: Props) => (
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
      className="pointer-events-none absolute bottom-full right-0 z-20 mb-2 w-60 rounded-xs border border-border-strong bg-popover px-3 py-2 text-xs leading-4 text-foreground opacity-0 shadow-xl transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
    >
      {text}
    </span>
  </span>
);

export default InfoTip;
