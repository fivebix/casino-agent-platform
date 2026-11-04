'use client';

import React, { useState } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  useReactTable,
  type ColumnDef,
  type ExpandedState,
  type OnChangeFn,
  type Row,
} from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/** Optional per-column classes: `meta: { headerClassName, cellClassName, footerClassName }`. */
export type CommonColumnMeta = {
  headerClassName?: string;
  cellClassName?: string;
  footerClassName?: string;
  /**
   * Footer cell span (the TOTAL row). `3` spans this column and the next two; `0` skips the cell (it is
   * covered by an earlier span). Default 1.
   */
  footerColSpan?: number;
};

export type CommonTableProps<TData> = {
  data: TData[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: ColumnDef<TData, any>[];
  isLoading?: boolean;
  /** Shows an error row with a Retry button (pass `refetch`). */
  isError?: boolean;
  errorMessage?: React.ReactNode;
  onRetry?: () => void;
  emptyState?: React.ReactNode;
  /** Content of the expanded row (spans every column). Enables the leading +/− column. */
  renderSubComponent?: (props: { row: Row<TData> }) => React.ReactNode;
  /**
   * Child rows rendered with the same columns under an expanded row (parlay legs). Enables the +/− column;
   * a row can expand when it has children. Cells can check `row.depth > 0`.
   */
  getSubRows?: (row: TData, index: number) => TData[] | undefined;
  /**
   * Also call `renderSubComponent` for expanded sub-rows (`row.depth > 0`), e.g. a player nested under an
   * agent in the Users List. Default false: only top-level rows get a sub-component. A `null` result renders
   * no extra row.
   */
  subComponentAtAnyDepth?: boolean;
  /** Controlled expansion (pass with `onExpandedChange`). Default: internal state, all collapsed. */
  expanded?: ExpandedState;
  onExpandedChange?: OnChangeFn<ExpandedState>;
  /** Extra classes for a body row (e.g. dim inactive users). */
  getRowClassName?: (row: Row<TData>) => string | undefined;
  /** Which rows may expand. Default: every row when `renderSubComponent` is set. */
  getRowCanExpand?: (row: Row<TData>) => boolean;
  /** Stable row ids (keeps expansion across refetches). Default: index. */
  getRowId?: (row: TData, index: number) => string;
  onRowClick?: (row: Row<TData>) => void;
  /** Renders a `<tfoot>` from each column's `footer` (the TOTAL row). */
  showFooter?: boolean;
  /** Dense variant for nested tables (bet rows inside an expanded user row). */
  size?: 'md' | 'sm';
  /** Number of skeleton rows while loading. */
  skeletonRows?: number;
  className?: string;
  tableClassName?: string;
};

/**
 * The bordered grid table from the Users List / Bet List designs (TanStack Table v8).
 *
 * - Column header text is uppercase, bold, 11px, centred; cell text centred.
 * - `renderSubComponent` adds a leading `+` / `−` column; clicking a row (not a button/link/input) toggles it.
 * - Loading → skeleton rows, `isError` → error row, no rows → `emptyState`.
 */
export const CommonTable = <TData,>({
  data,
  columns,
  isLoading = false,
  isError = false,
  errorMessage,
  onRetry,
  emptyState,
  renderSubComponent,
  getSubRows,
  subComponentAtAnyDepth = false,
  expanded: controlledExpanded,
  onExpandedChange,
  getRowClassName,
  getRowCanExpand,
  getRowId,
  onRowClick,
  showFooter = false,
  size = 'md',
  skeletonRows = 5,
  className,
  tableClassName,
}: CommonTableProps<TData>) => {
  const [internalExpanded, setInternalExpanded] = useState<ExpandedState>({});
  const expanded = controlledExpanded ?? internalExpanded;
  const expandable = !!renderSubComponent || !!getSubRows;

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    state: { expanded },
    onExpandedChange: onExpandedChange ?? setInternalExpanded,
    getRowId,
    getSubRows,
    getRowCanExpand:
      getRowCanExpand ??
      (getSubRows && !renderSubComponent ? (row) => row.subRows.length > 0 : () => expandable),
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
  });

  const colSpan = columns.length + (expandable ? 1 : 0);
  const rows = table.getRowModel().rows;
  const th = cn(
    'border border-[#36363c] bg-panel-2 px-1.5 text-center align-middle font-bold uppercase tracking-wide text-foreground',
    size === 'md' ? 'h-[40px] text-[11px] leading-[15px]' : 'h-[38px] text-[10px]',
  );
  const td = cn(
    'border border-[#36363c] px-1.5 text-center align-middle',
    size === 'md' ? 'h-[46px] text-sm' : 'h-[38px] text-[11px]',
  );

  const renderBody = () => {
    if (isLoading) {
      return Array.from({ length: skeletonRows }).map((_, i) => (
        <tr key={`sk-${i}`} className="bg-row">
          {Array.from({ length: colSpan }).map((__, j) => (
            <td key={j} className={td}>
              <span className="mx-auto block h-3 w-2/3 animate-pulse rounded-xs bg-white/10" />
            </td>
          ))}
        </tr>
      ));
    }
    if (isError) {
      return (
        <tr className="bg-row">
          <td colSpan={colSpan} className={cn(td, 'h-14 text-left')}>
            <span className="inline-flex items-center gap-3 px-2 font-semibold text-negative">
              {errorMessage ?? 'Could not load data'}
              {onRetry && (
                <Button variant="secondary" size="sm" onClick={onRetry}>
                  Retry
                </Button>
              )}
            </span>
          </td>
        </tr>
      );
    }
    if (rows.length === 0) {
      return (
        <tr className="bg-row">
          <td colSpan={colSpan} className={cn(td, 'h-14 px-3 text-left font-semibold')}>
            {emptyState ?? 'No data'}
          </td>
        </tr>
      );
    }
    return rows.map((row) => {
      const canExpand = expandable && row.getCanExpand();
      const clickable = canExpand || !!onRowClick;
      const subComponent =
        row.getIsExpanded() && renderSubComponent && (row.depth === 0 || subComponentAtAnyDepth)
          ? renderSubComponent({ row })
          : null;
      return (
        <React.Fragment key={row.id}>
          <tr
            className={cn(
              'bg-row transition-colors',
              clickable && 'cursor-pointer hover:bg-row-hover',
              getRowClassName?.(row),
            )}
            onClick={(e) => {
              if ((e.target as HTMLElement).closest('button, a, input, select, textarea, label'))
                return;
              if (canExpand) row.toggleExpanded();
              else onRowClick?.(row);
            }}
          >
            {expandable && (
              <td className={cn(td, 'w-[30px] px-0')}>
                {canExpand ? (
                  <button
                    type="button"
                    aria-label={row.getIsExpanded() ? 'Collapse row' : 'Expand row'}
                    aria-expanded={row.getIsExpanded()}
                    onClick={() => row.toggleExpanded()}
                    className="h-full w-full text-base font-bold text-foreground"
                  >
                    {row.getIsExpanded() ? '−' : '+'}
                  </button>
                ) : (
                  <span className="text-faint">-</span>
                )}
              </td>
            )}
            {row.getVisibleCells().map((cell) => {
              const meta = cell.column.columnDef.meta as CommonColumnMeta | undefined;
              return (
                <td key={cell.id} className={cn(td, meta?.cellClassName)}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              );
            })}
          </tr>
          {subComponent != null && (
            <tr className="bg-row">
              <td colSpan={colSpan} className="border border-[#36363c] p-0">
                {subComponent}
              </td>
            </tr>
          )}
        </React.Fragment>
      );
    });
  };

  return (
    <div className={cn('w-full overflow-x-auto', className)}>
      <table className={cn('w-full border-collapse', tableClassName)}>
        <thead>
          {table.getHeaderGroups().map((group) => (
            <tr key={group.id}>
              {expandable && (
                <th scope="col" className={cn(th, 'w-[30px]')}>
                  +
                </th>
              )}
              {group.headers.map((header) => {
                const meta = header.column.columnDef.meta as CommonColumnMeta | undefined;
                return (
                  <th key={header.id} scope="col" className={cn(th, meta?.headerClassName)}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody>{renderBody()}</tbody>
        {showFooter && !isLoading && !isError && rows.length > 0 && (
          <tfoot>
            {table.getFooterGroups().map((group) => (
              <tr key={group.id} className="bg-row">
                {expandable && <td className={td} />}
                {group.headers.map((header) => {
                  const meta = header.column.columnDef.meta as CommonColumnMeta | undefined;
                  if (meta?.footerColSpan === 0) return null;
                  return (
                    <td
                      key={header.id}
                      colSpan={meta?.footerColSpan ?? header.colSpan}
                      className={cn(td, 'h-[38px] font-bold', meta?.footerClassName)}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.footer, header.getContext())}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tfoot>
        )}
      </table>
    </div>
  );
};

export default CommonTable;
