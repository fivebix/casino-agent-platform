'use client';

import { useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { Product, WeekStart } from '@/types/agent';
import type { UsersView } from './type';

/** The Users List shows casino only: it is the one product with play until a sportsbook is integrated. */
export const DEFAULT_PRODUCT: Product = 'casino';

type Patch = Partial<
  Record<'week' | 'product' | 'search' | 'inactive' | 'view', string | undefined>
>;

/**
 * Users List filters kept in the URL: `?week=YYYY-MM-DD&search=dani&inactive=1&view=tree`.
 * Missing = current week / no search / active only / list. The product is always casino.
 */
export const useUsersListParams = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const product: Product = DEFAULT_PRODUCT;
  const weekStart: WeekStart | undefined = searchParams.get('week') || undefined;
  const search = searchParams.get('search') ?? '';
  const showInactive = searchParams.get('inactive') === '1';
  const view: UsersView = searchParams.get('view') === 'tree' ? 'tree' : 'list';

  const update = useCallback(
    (patch: Patch) => {
      const next = new URLSearchParams(searchParams.toString());
      Object.entries(patch).forEach(([key, value]) => {
        if (value) next.set(key, value);
        else next.delete(key);
      });
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  return { product, weekStart, search, showInactive, view, update };
};
