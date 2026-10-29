import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Same helper the back office uses: merge conditional + Tailwind classes safely. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a number as a money amount for display. */
export function money(n: number | null | undefined): string {
  const v = typeof n === 'number' ? n : 0;
  return v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Order a flat agent list into tree (depth-first pre-order) so each node sits directly
 * under its real parent. The materialized path makes this a plain lexicographic sort:
 * a parent's path is a prefix of its children's, so it always sorts just before them.
 */
export function orderAgentTree<T extends { path: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.path.localeCompare(b.path));
}

/** The agent-tree role implied by a node's depth. */
export function roleForLevel(level: number): string {
  switch (level) {
    case 1:
      return 'Manager';
    case 2:
      return 'Super Agent';
    case 3:
      return 'Agent';
    default:
      return 'Sub-agent';
  }
}
