import type { UserRow } from '@/types/agent';

export type UsersView = 'list' | 'tree';

/** A users-list row with its loaded children (list view) or descendants (tree view) as sub-rows. */
export type UserTreeRow = UserRow & { subRows?: UserTreeRow[] };

/** Children of one expanded agent (list view), loaded by `AgentChildrenQuery`. */
export type ChildrenState = {
  rows?: UserRow[];
  isLoading: boolean;
  isError: boolean;
};
