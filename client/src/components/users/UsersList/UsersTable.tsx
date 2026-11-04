'use client';

import { useCallback, useMemo, useState } from 'react';
import type { ExpandedState, OnChangeFn, Row } from '@tanstack/react-table';
import CommonTable from '@/components/tables';
import StateMessage from '@/components/common/StateMessage';
import { MODAL_TYPES } from '@/components/modals/types';
import { useAuth } from '@/hooks/useAuth';
import { useModal } from '@/hooks/useModal';
import { useAppDispatch } from '@/hooks/useReduxHooks';
import { agentApi } from '@/services/agentApi';
import type { Totals, UserRow, UsersListQuery, Week } from '@/types/agent';
import AgentChildrenQuery from './AgentChildrenQuery';
import PlayerBetsPanel from './PlayerBetsPanel';
import { buildUserColumns } from './columns';
import type { ChildrenState, UserTreeRow, UsersView } from './type';
import { attachChildren, flattenRows, nestRows, toKindPath } from './utils';

type Props = {
  view: UsersView;
  rows: UserRow[];
  totals?: Totals;
  week?: Week;
  /** Filters for the children requests (week, product, show-inactive). */
  childQuery: UsersListQuery;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
};

/**
 * The users grid. List view: an expanded agent loads `GET /agent/users/agents/:id/children` and shows them as
 * nested rows; tree view: the whole subtree from `GET /agent/users/tree`, agents expanded by default. In both,
 * an expanded player shows its bets for the week.
 */
const UsersTable = ({
  view,
  rows,
  totals,
  week,
  childQuery,
  isLoading,
  isError,
  onRetry,
}: Props) => {
  const { open } = useModal();
  const { agent } = useAuth();
  const dispatch = useAppDispatch();
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});
  const [children, setChildren] = useState<Record<string, ChildrenState>>({});

  const data = useMemo<UserTreeRow[]>(
    () => (view === 'tree' ? nestRows(rows) : attachChildren(rows, (id) => children[id]?.rows)),
    [view, rows, children],
  );
  const flat = useMemo(() => flattenRows(data), [data]);

  // Tree view opens every agent that has rows under it; the user's toggles override that.
  const expanded = useMemo<Record<string, boolean>>(() => {
    const defaults: Record<string, boolean> = {};
    if (view === 'tree') {
      flat.forEach((r) => {
        if (r.subRows?.length) defaults[r.id] = true;
      });
    }
    return { ...defaults, ...overrides };
  }, [view, flat, overrides]);

  const onExpandedChange: OnChangeFn<ExpandedState> = (updater) => {
    const next = typeof updater === 'function' ? updater(expanded) : updater;
    if (next !== true) setOverrides(next);
  };

  const expandedAgentIds = useMemo(
    () =>
      view === 'list'
        ? flat.filter((r) => r.kind === 'agent' && expanded[r.id]).map((r) => r.id)
        : [],
    [view, flat, expanded],
  );

  const onChildren = useCallback((agentId: string, state: ChildrenState) => {
    setChildren((prev) => ({ ...prev, [agentId]: state }));
  }, []);

  const retryChildren = (agentId: string) => {
    dispatch(
      agentApi.endpoints.getAgentChildren.initiate(
        { agentId, ...childQuery },
        { subscribe: false, forceRefetch: true },
      ),
    );
  };

  const columns = useMemo(
    () =>
      buildUserColumns({
        view,
        totals,
        meId: agent?.id,
        isAdminAgent: agent?.role === 'admin_agent',
        onUser: (r) =>
          open(MODAL_TYPES.USER_EDIT, { kind: toKindPath(r.kind), id: r.id, username: r.username }),
        onCredit: (r) =>
          open(MODAL_TYPES.CREDIT_AMOUNT, {
            kind: toKindPath(r.kind),
            id: r.id,
            username: r.username,
          }),
        onCalc: (r) =>
          open(MODAL_TYPES.CALCULATION, {
            kind: toKindPath(r.kind),
            id: r.id,
            username: r.username,
            weekStart: week?.weekStart,
            isCurrentWeek: week?.isCurrent ?? true,
          }),
        onBackupCredit: (r) =>
          open(MODAL_TYPES.BACKUP_CREDIT, {
            id: r.id,
            username: r.username,
            amount: r.backupCredit,
          }),
      }),
    [view, totals, open, agent?.id, agent?.role, week?.weekStart, week?.isCurrent],
  );

  const renderSubComponent = ({ row }: { row: Row<UserTreeRow> }) => {
    const r = row.original;
    if (r.kind === 'player') {
      return <PlayerBetsPanel playerId={r.id} username={r.username} weekStart={week?.weekStart} />;
    }
    if (view === 'tree') return null;
    const state = children[r.id];
    if (!state || state.isLoading) {
      return <StateMessage variant="loading" message="Loading users…" className="px-9" />;
    }
    if (state.isError) {
      return (
        <StateMessage
          variant="error"
          message="Could not load the users"
          onRetry={() => retryChildren(r.id)}
          className="px-9"
        />
      );
    }
    if (!state.rows?.length) {
      return <StateMessage variant="empty" message="No users" className="px-9" />;
    }
    return null;
  };

  return (
    <>
      {expandedAgentIds.map((agentId) => (
        <AgentChildrenQuery
          key={agentId}
          agentId={agentId}
          query={childQuery}
          onChange={onChildren}
        />
      ))}
      <CommonTable
        data={data}
        columns={columns}
        isLoading={isLoading}
        isError={isError}
        onRetry={onRetry}
        errorMessage="Could not load the users"
        emptyState="No users"
        getRowId={(r) => r.id}
        getSubRows={(r) => r.subRows}
        getRowCanExpand={(row) =>
          row.original.kind === 'player' ||
          (view === 'tree' ? !!row.subRows.length : row.original.hasChildren)
        }
        expanded={expanded}
        onExpandedChange={onExpandedChange}
        renderSubComponent={renderSubComponent}
        subComponentAtAnyDepth
        getRowClassName={(row) => (row.original.isActive ? undefined : 'opacity-45')}
        showFooter
        skeletonRows={8}
      />
    </>
  );
};

export default UsersTable;
