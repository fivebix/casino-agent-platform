import { cn } from '@/lib/utils';

type Props = {
  className?: string;
};

/** Rounded app icon + "odryn / AGENT PANEL" lockup from the login cards. */
const OdrynLogo = ({ className }: Props) => (
  <div className={cn('flex items-center gap-3', className)}>
    <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 bg-gradient-to-b from-[#3a3a3f] to-[#141416] shadow-inner">
      <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
        <circle cx="12" cy="12" r="8.5" fill="none" stroke="#fff" strokeWidth="2.6" />
        <path d="M5.5 18.5 3.5 21" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
        <path d="M12 8.6v6.8M8.6 12h6.8" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </span>
    <span className="flex flex-col leading-tight">
      <span className="text-base font-semibold text-foreground">odryn</span>
      <span className="text-[11px] tracking-[0.22em] text-muted">AGENT PANEL</span>
    </span>
  </div>
);

export default OdrynLogo;
