"use client";

import {
  flexRender,
  getCoreRowModel,
  type ColumnDef,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronDown, ChevronUp, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

interface PaginatedResponse<TData> {
  data: TData[];
  meta?: {
    current_page?: number;
    last_page?: number;
    per_page?: number;
    total?: number;
    from?: number | null;
    to?: number | null;
  };
}

export function DataTable<TData>({
  columns,
  queryKey,
  endpoint,
  filters = {},
  emptyText = "No records found.",
}: {
  columns: ColumnDef<TData>[];
  queryKey: readonly unknown[];
  endpoint: string;
  filters?: Record<string, string | number | null | undefined>;
  emptyText?: string;
}) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const sort = sorting[0];

  const tableQuery = useQuery({
    queryKey: [...queryKey, { page, search, sort, filters }],
    queryFn: async () => {
      const filterParams = Object.fromEntries(
        Object.entries(filters)
          .filter(([, value]) => value !== undefined && value !== null && value !== "")
          .map(([key, value]) => [`filter[${key}]`, value]),
      );

      const { data } = await api.get<PaginatedResponse<TData>>(endpoint, {
        params: {
          page,
          "filter[search]": search || undefined,
          ...filterParams,
          sort: sort ? `${sort.desc ? "-" : ""}${sort.id}` : undefined,
        },
      });

      return data;
    },
    placeholderData: keepPreviousData,
  });

  const rows = tableQuery.data?.data ?? [];
  const meta = tableQuery.data?.meta;
  const lastPage = meta?.last_page ?? 1;

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting },
    manualSorting: true,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
  });

  const skeletonRows = useMemo(() => Array.from({ length: 5 }), []);

  return (
    <div className="space-y-3">
      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          placeholder="Search"
          className="pl-8"
        />
      </div>

      <div className="overflow-hidden rounded-md border">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-muted/60 text-left text-xs uppercase text-muted-foreground">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="px-3 py-2 font-medium">
                    {header.isPlaceholder ? null : (
                      <button
                        type="button"
                        disabled={!header.column.getCanSort()}
                        onClick={header.column.getToggleSortingHandler()}
                        className={cn(
                          "inline-flex items-center gap-1",
                          header.column.getCanSort() && "hover:text-foreground",
                        )}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getIsSorted() === "asc" && <ChevronUp className="size-3" />}
                        {header.column.getIsSorted() === "desc" && <ChevronDown className="size-3" />}
                      </button>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {tableQuery.isLoading
              ? skeletonRows.map((_, rowIndex) => (
                  <tr key={rowIndex} className="border-t">
                    {columns.map((_, columnIndex) => (
                      <td key={columnIndex} className="px-3 py-3">
                        <Skeleton className="h-4 w-full max-w-40" />
                      </td>
                    ))}
                  </tr>
                ))
              : table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="border-t">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-3 py-3 align-middle">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
            {!tableQuery.isLoading && rows.length === 0 && (
              <tr className="border-t">
                <td colSpan={columns.length} className="px-3 py-10 text-center text-muted-foreground">
                  {emptyText}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
        <span>
          {meta?.total ? `${meta.from ?? 0}-${meta.to ?? 0} of ${meta.total}` : "0 records"}
        </span>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page <= 1 || tableQuery.isFetching}
            onClick={() => setPage((value) => Math.max(1, value - 1))}
          >
            Previous
          </Button>
          <span>
            Page {page} of {lastPage}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page >= lastPage || tableQuery.isFetching}
            onClick={() => setPage((value) => value + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
