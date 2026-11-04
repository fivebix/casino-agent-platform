import type { UserKind, UserKindPath, UserRow } from '@/types/agent';
import type { UserTreeRow } from './type';

export const toKindPath = (kind: UserKind): UserKindPath =>
  kind === 'agent' ? 'agents' : 'players';

/** Tree view: the flat depth-first list → nested rows by `parentId` (rows whose parent is absent are roots). */
export const nestRows = (rows: UserRow[]): UserTreeRow[] => {
  const byId = new Map<string, UserTreeRow>(rows.map((r) => [r.id, { ...r }]));
  const roots: UserTreeRow[] = [];
  rows.forEach((r) => {
    const node = byId.get(r.id)!;
    const parent = r.parentId ? byId.get(r.parentId) : undefined;
    if (parent && parent !== node) (parent.subRows ??= []).push(node);
    else roots.push(node);
  });
  return roots;
};

/** List view: hang each expanded agent's loaded children under it (recursively). */
export const attachChildren = (
  rows: UserRow[],
  childrenOf: (agentId: string) => UserRow[] | undefined,
): UserTreeRow[] =>
  rows.map((r) => {
    const children = r.kind === 'agent' ? childrenOf(r.id) : undefined;
    return children ? { ...r, subRows: attachChildren(children, childrenOf) } : r;
  });

export const flattenRows = (rows: UserTreeRow[], out: UserTreeRow[] = []): UserTreeRow[] => {
  rows.forEach((r) => {
    out.push(r);
    if (r.subRows) flattenRows(r.subRows, out);
  });
  return out;
};
