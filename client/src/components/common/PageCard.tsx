'use client';

import { Icon } from '@iconify/react';
import { cn } from '@/lib/utils';

type Props = {
  /** Heading next to the lime-outlined icon box. Omit for a plain panel (e.g. the summary panels). */
  title?: React.ReactNode;
  /** Iconify name, e.g. `lucide:wallet`, `lucide:user`, `lucide:binary`. */
  icon?: string;
  /** Right side of the heading row. */
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
};

/** The dark rounded panel every screen sits in (Users List, Create New Player, Casino List…). */
const PageCard = ({ title, icon, actions, children, className, bodyClassName }: Props) => (
  <section
    className={cn('rounded-md border border-border bg-panel/95 px-[26px] py-[22px]', className)}
  >
    {(title || actions) && (
      <header className="mb-[22px] flex items-center justify-between gap-4">
        {title && (
          <div className="flex items-center gap-3">
            {icon && (
              <span className="flex h-[34px] w-[34px] items-center justify-center rounded-sm border-[1.5px] border-lime text-lime">
                <Icon icon={icon} className="h-[18px] w-[18px]" />
              </span>
            )}
            <h1 className="text-xl font-semibold text-foreground">{title}</h1>
          </div>
        )}
        {actions}
      </header>
    )}
    <div className={bodyClassName}>{children}</div>
  </section>
);

export default PageCard;
