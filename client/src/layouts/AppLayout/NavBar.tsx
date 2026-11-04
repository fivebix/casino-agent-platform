'use client';

import { Fragment } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from '@iconify/react';
import { EXTERNAL_LINKS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { NAV_ITEMS } from './navigation';

const Dot = () => <span aria-hidden className="block h-1 w-1 rounded-full bg-[#4a4a50]" />;

const NavBar = () => {
  const pathname = usePathname();

  return (
    <nav aria-label="Main" className="overflow-x-auto px-10 py-[26px]">
      <ul className="flex min-w-max items-center gap-x-[22px] text-[15px] text-foreground">
        <li>
          <a
            href={EXTERNAL_LINKS.odryn || '/'}
            className="flex items-center gap-2.5 transition-colors hover:text-lime"
          >
            <Icon icon="lucide:arrow-left" className="h-4 w-4" />
            Back to odryn
          </a>
        </li>
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Fragment key={item.href}>
              <li aria-hidden>
                <Dot />
              </li>
              <li>
                <Link
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn('transition-colors hover:text-lime', active && 'text-lime')}
                >
                  {item.label}
                </Link>
              </li>
            </Fragment>
          );
        })}
      </ul>
    </nav>
  );
};

export default NavBar;
