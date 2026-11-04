'use client';

import { Icon } from '@iconify/react';
import LiveClock from '@/components/common/LiveClock';
import { MODAL_TYPES } from '@/components/modals/types';
import { useAuth } from '@/hooks/useAuth';
import { useLogout } from '@/hooks/useLogout';
import { useModal } from '@/hooks/useModal';
import { EXTERNAL_LINKS } from '@/lib/constants';
import { formatAmount } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useGetBalanceQuery } from '@/services/agentApi';
import LanguageMenu from './LanguageMenu';
import OddsFormatMenu from './OddsFormatMenu';

type ContactIconProps = { href: string; label: string; icon: string; className: string };

const ContactIcon = ({ href, label, icon, className }: ContactIconProps) => (
  <a
    href={href || undefined}
    target={href ? '_blank' : undefined}
    rel="noreferrer"
    aria-label={label}
    aria-disabled={!href || undefined}
    className={cn(
      'flex h-[26px] w-[26px] items-center justify-center rounded-full text-white transition-opacity hover:opacity-85',
      className,
    )}
  >
    <Icon icon={icon} className="h-3.5 w-3.5" />
  </a>
);

/** Design 01 top bar: user · wallet (opens Balance) · odds format · language · contacts · clock · Logout. */
const TopBar = () => {
  const { agent } = useAuth();
  const { open } = useModal();
  const { logout, isLoggingOut } = useLogout();
  const {
    data: balance,
    isLoading,
    isError,
  } = useGetBalanceQuery(undefined, {
    pollingInterval: 60_000,
  });

  return (
    <header className="flex h-[60px] items-stretch border-b border-border bg-topbar">
      <div className="flex items-center gap-3 bg-topbar-user px-7 text-[15px] font-semibold">
        <span className="max-w-[160px] truncate">{agent?.username ?? '—'}</span>
        <Icon icon="lucide:user-round" className="h-4 w-4" />
      </div>

      <button
        type="button"
        onClick={() => open(MODAL_TYPES.BALANCE)}
        aria-label="Show balance"
        className="flex items-center gap-2.5 px-[22px] text-[15px] font-bold text-lime hover:bg-white/5"
      >
        <Icon icon="lucide:credit-card" className="h-4 w-4 text-foreground" />
        {isLoading ? (
          <span className="inline-block h-3 w-10 animate-pulse rounded-xs bg-white/10" />
        ) : isError ? (
          <span className="text-muted">—</span>
        ) : (
          formatAmount(balance?.creditLeft)
        )}
      </button>

      <OddsFormatMenu />
      <LanguageMenu />

      <div className="flex items-center gap-3 px-[14px]">
        <ContactIcon
          href={EXTERNAL_LINKS.telegram}
          label="Telegram"
          icon="lucide:send"
          className="bg-telegram"
        />
        <ContactIcon
          href={EXTERNAL_LINKS.whatsapp}
          label="WhatsApp"
          icon="lucide:message-circle"
          className="bg-whatsapp"
        />
      </div>

      <div className="ml-auto flex items-center px-[22px] text-[15px] text-foreground">
        <LiveClock />
      </div>

      <button
        type="button"
        onClick={logout}
        disabled={isLoggingOut}
        className="flex items-center gap-2 pl-5 pr-[42px] text-[15px] text-foreground hover:text-lime disabled:opacity-60"
      >
        <Icon icon="lucide:power" className="h-4 w-4" />
        Logout
      </button>
    </header>
  );
};

export default TopBar;
