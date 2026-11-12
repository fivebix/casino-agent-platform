'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '@iconify/react';
import { cn } from '@/lib/utils';

type Props = {
  /** Tooltip text shown on hover / keyboard focus. */
  text: string;
  /** Preferred side; the tooltip flips to the other side when there is no room. */
  placement?: 'top' | 'bottom';
  className?: string;
};

const GAP = 8;
const EDGE = 8;

/**
 * The round "i" icon from User Edit → Settings. The tooltip is drawn on the page body and kept inside the window,
 * so a table's scroll area or the screen edge never cuts it off (first and last columns included).
 */
const InfoTip = ({ text, placement = 'top', className }: Props) => {
  const anchorRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);

  const show = () => setOpen(true);
  const hide = () => {
    setOpen(false);
    setPos(null);
  };

  /** Measured once the tooltip is on the page, then moved to the side and spot that fit in the window. */
  const placeTip = useCallback(
    (tip: HTMLSpanElement | null) => {
      const anchor = anchorRef.current?.getBoundingClientRect();
      if (!anchor || !tip) return;
      const { width, height } = tip.getBoundingClientRect();
      const maxLeft = window.innerWidth - width - EDGE;
      const left = Math.max(EDGE, Math.min(anchor.left + anchor.width / 2 - width / 2, maxLeft));
      const below = anchor.bottom + GAP;
      const above = anchor.top - GAP - height;
      const fitsBelow = below + height <= window.innerHeight - EDGE;
      const fitsAbove = above >= EDGE;
      const top =
        placement === 'bottom'
          ? fitsBelow || !fitsAbove
            ? below
            : above
          : fitsAbove || !fitsBelow
            ? above
            : below;
      setPos({ left, top });
    },
    [placement],
  );

  useEffect(() => {
    if (!open) return;
    const close = () => {
      setOpen(false);
      setPos(null);
    };
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [open]);

  return (
    <span className={cn('relative inline-flex', className)} onMouseEnter={show} onMouseLeave={hide}>
      <button
        ref={anchorRef}
        type="button"
        aria-label={text}
        onFocus={show}
        onBlur={hide}
        className="flex h-5 w-5 items-center justify-center rounded-full text-muted outline-none hover:text-foreground focus-visible:text-lime"
      >
        <Icon icon="lucide:info" className="h-[18px] w-[18px]" />
      </button>
      {open &&
        typeof document !== 'undefined' &&
        createPortal(
          <span
            ref={placeTip}
            role="tooltip"
            style={{
              left: pos?.left ?? 0,
              top: pos?.top ?? 0,
              visibility: pos ? 'visible' : 'hidden',
            }}
            className="pointer-events-none fixed z-[1000] w-60 max-w-[calc(100vw-16px)] rounded-xs border border-border-strong bg-popover px-3 py-2 text-left text-xs font-normal normal-case leading-4 tracking-normal text-foreground shadow-xl"
          >
            {text}
          </span>,
          document.body,
        )}
    </span>
  );
};

export default InfoTip;
