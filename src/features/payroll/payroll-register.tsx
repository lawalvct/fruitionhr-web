"use client";

import { ArrowLeft, FileText, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { ExportMenu } from "@/components/export-menu";
import { PageHeader } from "@/components/page-header";
import { PageLoader } from "@/components/page-loader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/status-badge";
import {
  payrollDownloadUrl,
  usePayrollRegister,
  type RegisterGroup,
} from "@/features/payroll/use-payroll";
import { cn } from "@/lib/utils";

/**
 * A register is scanned across, not read down, so cells carry bare numbers and
 * the currency is stated once. Zero and "not applicable" are visually quiet so
 * the figures that exist stand out.
 */
function amount(kobo: number | undefined) {
  if (kobo === undefined) return null;

  return new Intl.NumberFormat("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(kobo / 100);
}

/**
 * Payslips open a stage earlier than the company-wide outputs so payroll can
 * check a person's figures before routing for approval. One pulled during
 * review is stamped "Provisional" on the PDF itself.
 */
const PAYSLIP_READY = ["review", "pending_approval", "approved", "locked", "paid"];

/** Anything before approval produces a provisional PDF. */
const FINAL_STATUSES = ["approved", "locked", "paid"];

const GROUP_ORDER: RegisterGroup[] = ["earnings", "benefits", "deductions", "employer"];

const GROUP_LABEL: Record<RegisterGroup, string> = {
  earnings: "Earnings",
  benefits: "Benefits in kind",
  deductions: "Deductions",
  employer: "Employer cost",
};

/** Deductions read as money leaving, so they get a different column tint. */
const GROUP_TINT: Record<RegisterGroup, string> = {
  earnings: "bg-fruition-50/50 dark:bg-fruition-950/20",
  benefits: "bg-sky-50/50 dark:bg-sky-950/20",
  deductions: "bg-amber-50/50 dark:bg-amber-950/20",
  employer: "bg-muted/40",
};

function periodLabel(period: string) {
  const [year, month] = period.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("en-NG", { month: "long", year: "numeric" });
}

export function PayrollRegister({ runId }: { runId: number }) {
  const { data, isLoading, isError, refetch, isFetching } = usePayrollRegister(runId);
  const [search, setSearch] = useState("");

  const visibleGroups = useMemo(
    () => (data ? GROUP_ORDER.filter((group) => data.columns[group]?.length) : []),
    [data],
  );

  const rows = useMemo(() => {
    if (!data) return [];
    const term = search.trim().toLowerCase();
    if (!term) return data.rows;

    return data.rows.filter(
      (row) =>
        row.employee.name.toLowerCase().includes(term) ||
        row.employee.number?.toLowerCase().includes(term),
    );
  }, [data, search]);

  if (isLoading) return <PageLoader label="Building the register…" />;

  if (isError || !data) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
        <h1 className="font-semibold">Register unavailable</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          The payroll register could not be loaded. It may no longer exist or your access may have changed.
        </p>
        <div className="mt-4 flex justify-center gap-2">
          <Button variant="outline" render={<Link href={`/payroll/${runId}`} />}>Back to run</Button>
          <Button onClick={() => void refetch()} disabled={isFetching}>Retry</Button>
        </div>
      </div>
    );
  }

  const stickyCell = "sticky left-0 z-20 bg-card";
  // Payslips live in the sticky column: on a table this wide, an action parked
  // at the far right would mean scrolling past every component to reach it.
  const payslipsReady = PAYSLIP_READY.includes(data.run.status);

  return (
    <div className="space-y-5">
      <PageHeader
        title={`Register — ${periodLabel(data.run.period)}`}
        description="Every employee against every salary component. Column totals reconcile to the run."
        actions={
          <>
            <ExportMenu
              label="Download"
              path={`/payroll-runs/${runId}/register/export`}
              basename={`payroll-register-${data.run.period}`}
            />
            <Button variant="outline" render={<Link href={`/payroll/${runId}`} />}>
              <ArrowLeft className="size-4" /> Back to run
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <StatusBadge status={data.run.status} />
          <span>
            {data.totals.employee_count} {data.totals.employee_count === 1 ? "employee" : "employees"}
          </span>
          <span aria-hidden>·</span>
          <span>All amounts in ₦</span>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search employee or number"
            className="pl-8"
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full border-collapse text-sm">
          <thead>
            {/* Group band, so a wide scroll never loses which side of the payslip you are on. */}
            <tr className="text-xs uppercase tracking-wide text-muted-foreground">
              <th className={cn(stickyCell, "border-b px-3 py-2 text-left font-medium")} scope="col">
                Employee
              </th>
              {visibleGroups.map((group) => (
                <th
                  key={group}
                  scope="colgroup"
                  colSpan={data.columns[group].length}
                  className={cn("border-b border-l px-3 py-2 text-left font-semibold", GROUP_TINT[group])}
                >
                  {GROUP_LABEL[group]}
                </th>
              ))}
              <th scope="colgroup" colSpan={3} className="border-b border-l bg-muted/60 px-3 py-2 text-left font-semibold">
                Totals
              </th>
            </tr>
            <tr className="text-xs text-muted-foreground">
              <th className={cn(stickyCell, "border-b px-3 py-2 text-left font-medium")} scope="col">
                <span className="sr-only">Name</span>
              </th>
              {visibleGroups.map((group) =>
                data.columns[group].map((column, index) => (
                  <th
                    key={`${group}-${column.code}`}
                    scope="col"
                    title={column.code}
                    className={cn(
                      "min-w-28 border-b px-3 py-2 text-right font-medium whitespace-nowrap",
                      index === 0 && "border-l",
                      GROUP_TINT[group],
                    )}
                  >
                    {column.name}
                  </th>
                )),
              )}
              <th scope="col" className="min-w-28 border-b border-l bg-muted/60 px-3 py-2 text-right font-medium">Gross</th>
              <th scope="col" className="min-w-28 border-b bg-muted/60 px-3 py-2 text-right font-medium">Deductions</th>
              <th scope="col" className="min-w-28 border-b bg-muted/60 px-3 py-2 text-right font-medium">Net</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t">
                <th scope="row" className={cn(stickyCell, "px-3 py-2.5 text-left font-medium")}>
                  <span className="flex items-center gap-2">
                    <span className="min-w-0">
                      <span className="block whitespace-nowrap">{row.employee.name}</span>
                      <span className="block text-xs font-normal text-muted-foreground">{row.employee.number}</span>
                    </span>
                    {payslipsReady && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Download payslip for ${row.employee.name}`}
                        title="Download payslip"
                        render={
                          <a
                            href={payrollDownloadUrl(`/payroll-runs/${runId}/employees/${row.id}/payslip`)}
                            target="_blank"
                            rel="noopener"
                          />
                        }
                      >
                        <FileText className="size-4" />
                      </Button>
                    )}
                  </span>
                </th>
                {visibleGroups.map((group) =>
                  data.columns[group].map((column, index) => {
                    const value = amount(row.amounts[group]?.[column.code]);

                    return (
                      <td
                        key={`${group}-${column.code}`}
                        className={cn(
                          "px-3 py-2.5 text-right tabular-nums whitespace-nowrap",
                          index === 0 && "border-l",
                          value === null && "text-muted-foreground/50",
                        )}
                      >
                        {value ?? "–"}
                      </td>
                    );
                  }),
                )}
                <td className="border-l px-3 py-2.5 text-right tabular-nums whitespace-nowrap">{amount(row.gross)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums whitespace-nowrap">{amount(row.total_deductions)}</td>
                <td className="px-3 py-2.5 text-right font-medium tabular-nums whitespace-nowrap">{amount(row.net)}</td>
              </tr>
            ))}

            {rows.length === 0 && (
              <tr className="border-t">
                <td
                  colSpan={visibleGroups.reduce((count, group) => count + data.columns[group].length, 4)}
                  className="px-3 py-12 text-center text-muted-foreground"
                >
                  No employee matches “{search}”.
                </td>
              </tr>
            )}
          </tbody>

          <tfoot>
            <tr className="border-t-2 font-medium">
              <th scope="row" className={cn(stickyCell, "px-3 py-3 text-left")}>
                Total
                {rows.length !== data.rows.length && (
                  <span className="ml-1 text-xs font-normal text-muted-foreground">(whole run)</span>
                )}
              </th>
              {visibleGroups.map((group) =>
                data.columns[group].map((column, index) => (
                  <td
                    key={`${group}-${column.code}`}
                    className={cn(
                      "px-3 py-3 text-right tabular-nums whitespace-nowrap",
                      index === 0 && "border-l",
                      GROUP_TINT[group],
                    )}
                  >
                    {amount(data.totals.amounts[group]?.[column.code] ?? 0)}
                  </td>
                )),
              )}
              <td className="border-l bg-muted/60 px-3 py-3 text-right tabular-nums whitespace-nowrap">{amount(data.totals.gross)}</td>
              <td className="bg-muted/60 px-3 py-3 text-right tabular-nums whitespace-nowrap">{amount(data.totals.total_deductions)}</td>
              <td className="bg-muted/60 px-3 py-3 text-right tabular-nums whitespace-nowrap">{amount(data.totals.net)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <p className="text-xs text-muted-foreground">
        A dash means the component does not apply to that employee. Totals always cover the whole
        run, not the filtered rows, so they stay reconcilable against the payroll summary.
        {payslipsReady && !FINAL_STATUSES.includes(data.run.status)
          && " Payslips downloaded now are marked provisional until the run is approved."}
      </p>
    </div>
  );
}
