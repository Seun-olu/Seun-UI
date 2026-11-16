import {
  flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable,
  type ColumnDef, type RowSelectionState, type SortingState,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useId, useMemo, useRef, useState, type ReactNode } from "react";
import { cx, focusRing } from "../lib/utils";
import { Button } from "./button";

export type { ColumnDef } from "@tanstack/react-table";

export interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T, unknown>[];
  /** Accessible name for the table, rendered as its <caption>. */
  caption: string;
  getRowId?: (row: T, index: number) => string;
  /** Text box that filters across all columns. */
  enableFilter?: boolean;
  enableSorting?: boolean;
  /** Checkbox column; selection is reported through onSelectionChange. */
  enableSelection?: boolean;
  onSelectionChange?: (rows: T[]) => void;
  /** Rows per page; 0 disables pagination. Ignored when `virtualize` is set. */
  pageSize?: number;
  /** Render only visible rows in a scroll box of this height (px). For large data sets. */
  virtualize?: { height: number; rowHeight?: number };
  emptyMessage?: ReactNode;
}

const cell = "su:px-3 su:py-2 su:text-left su:align-middle";

/**
 * Data table on TanStack Table: a real <table> with caption, sortable column
 * headers exposed with aria-sort, a global filter, pagination with a live row
 * count, row selection with a tri-state "select page" box, and optional
 * windowed rendering via TanStack Virtual.
 */
export function DataTable<T>({
  data, columns, caption, getRowId, enableFilter = false, enableSorting = true, enableSelection = false, onSelectionChange,
  pageSize = 10, virtualize, emptyMessage = "No results",
}: DataTableProps<T>) {
  const id = useId();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const paginate = !virtualize && pageSize > 0;

  const allColumns = useMemo<ColumnDef<T, unknown>[]>(() => {
    if (!enableSelection) return columns;
    return [{
      id: "__select",
      enableSorting: false,
      header: ({ table }) => (
        <SelectBox label="Select all rows on this page" checked={table.getIsAllPageRowsSelected()}
          indeterminate={table.getIsSomePageRowsSelected()} onChange={(v) => table.toggleAllPageRowsSelected(v)} />
      ),
      cell: ({ row }) => (
        <SelectBox label={`Select row ${row.index + 1}`} checked={row.getIsSelected()} onChange={(v) => row.toggleSelected(v)} />
      ),
    }, ...columns];
  }, [columns, enableSelection]);

  const table = useReactTable({
    data,
    columns: allColumns,
    getRowId,
    state: { sorting, globalFilter, rowSelection },
    enableSorting,
    sortDescFirst: false,
    enableRowSelection: enableSelection,
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: (updater) => {
      const next = typeof updater === "function" ? updater(rowSelection) : updater;
      setRowSelection(next);
      if (onSelectionChange) {
        const byId = new Map(table.getCoreRowModel().flatRows.map((r) => [r.id, r.original]));
        onSelectionChange(Object.keys(next).filter((k) => next[k]).map((k) => byId.get(k)!).filter(Boolean));
      }
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    ...(paginate ? { getPaginationRowModel: getPaginationRowModel(), initialState: { pagination: { pageIndex: 0, pageSize } } } : {}),
    autoResetPageIndex: true,
  });

  const rows = table.getRowModel().rows;
  const filteredCount = table.getFilteredRowModel().rows.length;
  const scrollRef = useRef<HTMLDivElement>(null);
  const rowHeight = virtualize?.rowHeight ?? 40;
  const virtualizer = useVirtualizer({
    count: virtualize ? rows.length : 0,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => rowHeight,
    overscan: 8,
    initialRect: virtualize ? { width: 0, height: virtualize.height } : undefined,
  });
  const vItems = virtualize ? virtualizer.getVirtualItems() : [];
  const padTop = vItems[0]?.start ?? 0;
  const padBottom = virtualize ? virtualizer.getTotalSize() - (vItems.at(-1)?.end ?? 0) : 0;
  const visibleRows = virtualize ? vItems.map((v) => rows[v.index]!) : rows;
  const colCount = table.getVisibleLeafColumns().length;

  return (
    <div className="su:flex su:flex-col su:gap-3 su:text-fg">
      {enableFilter && (
        <div className="su:flex su:items-center su:gap-2">
          <label htmlFor={`${id}-filter`} className="su:text-sm su:font-medium">Filter</label>
          <input id={`${id}-filter`} type="search" value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)}
            aria-controls={`${id}-table`}
            className={cx("su:h-9 su:w-64 su:max-w-full su:rounded-control su:border su:border-border su:bg-surface su:px-3 su:text-sm", focusRing)} />
        </div>
      )}
      <div ref={scrollRef} className="su:overflow-auto su:rounded-control su:border su:border-border"
        style={virtualize ? { height: virtualize.height } : undefined} tabIndex={virtualize ? 0 : undefined}
        role={virtualize ? "region" : undefined} aria-label={virtualize ? caption : undefined}>
        <table id={`${id}-table`} className="su:w-full su:border-collapse su:text-sm" aria-rowcount={virtualize ? rows.length + 1 : undefined}>
          <caption className="su:sr-only">{caption}</caption>
          <thead className={cx("su:bg-surface-muted", virtualize && "su:sticky su:top-0 su:z-10")}>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} aria-rowindex={virtualize ? 1 : undefined}>
                {hg.headers.map((h) => {
                  const sort = h.column.getIsSorted();
                  const content = h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext());
                  return (
                    <th key={h.id} scope="col" className={cx(cell, "su:font-semibold")}
                      aria-sort={h.column.getCanSort() ? (sort === "asc" ? "ascending" : sort === "desc" ? "descending" : "none") : undefined}>
                      {h.column.getCanSort() ? (
                        <button type="button" onClick={h.column.getToggleSortingHandler()}
                          className={cx("su:inline-flex su:items-center su:gap-1 su:rounded su:border-0 su:bg-transparent su:p-0 su:font-semibold su:text-inherit", focusRing)}>
                          {content}
                          <span aria-hidden className="su:text-fg-muted">{sort === "asc" ? "▲" : sort === "desc" ? "▼" : "↕"}</span>
                        </button>
                      ) : content}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {padTop > 0 && <tr aria-hidden style={{ height: padTop }}><td colSpan={colCount} /></tr>}
            {visibleRows.map((row) => (
              <tr key={row.id} aria-rowindex={virtualize ? row.index + 2 : undefined} aria-selected={enableSelection ? row.getIsSelected() : undefined}
                style={virtualize ? { height: rowHeight } : undefined}
                className={cx("su:border-t su:border-border", row.getIsSelected() && "su:bg-accent/5")}>
                {row.getVisibleCells().map((c) => <td key={c.id} className={cell}>{flexRender(c.column.columnDef.cell, c.getContext())}</td>)}
              </tr>
            ))}
            {padBottom > 0 && <tr aria-hidden style={{ height: padBottom }}><td colSpan={colCount} /></tr>}
            {rows.length === 0 && (
              <tr><td colSpan={colCount} className={cx(cell, "su:py-8 su:text-center su:text-fg-muted")}>{emptyMessage}</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="su:flex su:flex-wrap su:items-center su:justify-between su:gap-3 su:text-sm">
        <p className="su:m-0 su:text-fg-muted" role="status">
          {filteredCount} {filteredCount === 1 ? "row" : "rows"}
          {enableSelection && `, ${Object.values(rowSelection).filter(Boolean).length} selected`}
        </p>
        {paginate && table.getPageCount() > 1 && (
          <nav aria-label={`${caption} pagination`} className="su:flex su:items-center su:gap-2">
            <Button size="sm" variant="secondary" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>Previous</Button>
            <span>Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}</span>
            <Button size="sm" variant="secondary" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>Next</Button>
          </nav>
        )}
      </div>
    </div>
  );
}

function SelectBox({ label, checked, indeterminate = false, onChange }: { label: string; checked: boolean; indeterminate?: boolean; onChange: (v: boolean) => void }) {
  return (
    <input type="checkbox" aria-label={label} checked={checked} onChange={(e) => onChange(e.target.checked)}
      ref={(el) => { if (el) el.indeterminate = indeterminate && !checked; }}
      className={cx("su:size-4 su:accent-accent", focusRing)} />
  );
}
