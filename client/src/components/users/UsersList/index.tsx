'use client';

import PageCard from '@/components/common/PageCard';
import ProductTabs from '@/components/common/ProductTabs';
import SearchBox from '@/components/common/SearchBox';
import WeekSwitcher from '@/components/common/WeekSwitcher';
import { Checkbox } from '@/components/ui/checkbox';
import { useGetUsersQuery, useGetUsersTreeQuery } from '@/services/agentApi';
import { cn } from '@/lib/utils';
import type { UsersListQuery } from '@/types/agent';
import UsersSummary from './UsersSummary';
import UsersTable from './UsersTable';
import WeekClosedBanner from './WeekClosedBanner';
import { DEFAULT_PRODUCT, useUsersListParams } from './useUsersListParams';

/**
 * Users List (designs 01, 18–20, 24, 35) and its Tree view (21–23, `?view=tree`).
 * `GET /agent/users` or `GET /agent/users/tree`; week, product, search, show-inactive and view live in the URL.
 */
const UsersList = () => {
  const { product, weekStart, search, showInactive, view, update } = useUsersListParams();

  const query: UsersListQuery = {
    weekStart,
    product,
    showInactive: showInactive || undefined,
    search: search || undefined,
  };
  const listResult = useGetUsersQuery(query, { skip: view !== 'list' });
  const treeResult = useGetUsersTreeQuery(query, { skip: view !== 'tree' });
  const { data, isLoading, isFetching, isError, refetch } =
    view === 'tree' ? treeResult : listResult;

  const week = data?.week;
  // Children of an expanded agent follow the same week / product / inactive filters (not the search).
  const childQuery: UsersListQuery = {
    weekStart: week?.weekStart ?? weekStart,
    product,
    showInactive: showInactive || undefined,
  };

  return (
    <div className="flex flex-col gap-5">
      <PageCard title="Users List" icon="lucide:wallet">
        <div className="mb-5 flex flex-wrap items-center gap-x-3.5 gap-y-3">
          <Checkbox
            label="Show not active"
            checked={showInactive}
            onChange={(e) => update({ inactive: e.target.checked ? '1' : undefined })}
          />
          <Checkbox
            label="Tree"
            checked={view === 'tree'}
            onChange={(e) => update({ view: e.target.checked ? 'tree' : undefined })}
          />
          <WeekSwitcher
            week={week}
            disabled={isFetching && !data}
            onChange={(next) => update({ week: next })}
          />
          <ProductTabs value={product} onChange={() => undefined} products={[DEFAULT_PRODUCT]} />
          <SearchBox
            key={search}
            label="User Search"
            fields={[{ name: 'search', placeholder: 'Username' }]}
            initialValues={{ search }}
            onSearch={(values) => update({ search: values.search || undefined })}
            className="ml-auto"
          />
        </div>

        {week && !week.isCurrent && <WeekClosedBanner week={week} summary={data?.summary} />}

        <div className={cn('transition-opacity', isFetching && !isLoading && 'opacity-70')}>
          <UsersTable
            key={view}
            view={view}
            rows={data?.rows ?? []}
            totals={data?.totals}
            week={week}
            childQuery={childQuery}
            isLoading={isLoading}
            isError={isError && !data}
            onRetry={refetch}
          />
        </div>
      </PageCard>

      <UsersSummary summary={data?.summary} isLoading={isLoading} />
    </div>
  );
};

export default UsersList;
