"use client";

import { Plus, Search, Settings2, TriangleAlert, WalletCards } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { Can } from "@/components/can";
import { MoneyText } from "@/components/money-text";
import { PageHeader } from "@/components/page-header";
import { PageLoader } from "@/components/page-loader";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NewRunDialog } from "@/features/payroll/new-run-dialog";
import { usePayrollRuns } from "@/features/payroll/use-payroll";

function periodLabel(period: string) {
  const [y, m] = period.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-NG", { month: "long", year: "numeric" });
}

function SummaryCard({ label, children, detail }: { label: string; children: React.ReactNode; detail: string }) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold tracking-tight">{children}</p>
      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}

export function PayrollPage() {
  const { data: runs = [], isLoading, isError, isFetching, refetch } = usePayrollRuns();
  const [newOpen, setNewOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const router = useRouter();
  const sortedRuns = useMemo(
    () => [...runs].sort((first, second) => second.period.localeCompare(first.period)),
    [runs],
  );
  const latestRun = sortedRuns[0];
  const activeRuns = runs.filter((run) => ["calculating", "review", "submitted", "approved"].includes(run.status)).length;
  const statuses = [...new Set(runs.map((run) => run.status))];
  const filteredRuns = sortedRuns.filter((run) => {
    const matchesQuery = periodLabel(run.period).toLowerCase().includes(query.trim().toLowerCase());
    return matchesQuery && (status === "all" || run.status === status);
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payroll"
        description="Run monthly payroll, route it for approval, and generate payslips."
        actions={
          <div className="flex flex-wrap gap-2">
            <Can permission="employees.view_salary">
              <Button variant="outline" render={<Link href="/payroll/setup" />}>
                <Settings2 className="size-4" /> Salary setup
              </Button>
            </Can>
            <Can permission="payroll.process">
              <Button onClick={() => setNewOpen(true)}>
                <Plus className="size-4" /> New payroll run
              </Button>
            </Can>
          </div>
        }
      />

      {isLoading ? (
        <PageLoader label="Loading payroll workspace…" />
      ) : isError ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <p className="text-sm text-muted-foreground">Payroll runs could not be loaded. Please try again.</p>
          <Button variant="outline" size="sm" onClick={() => void refetch()} disabled={isFetching}>Retry</Button>
        </div>
      ) : !runs.length ? (
        <div className="rounded-xl border border-dashed bg-muted/20 px-6 py-12 text-center">
          <WalletCards className="mx-auto size-8 text-muted-foreground" />
          <h2 className="mt-3 font-semibold">No payroll runs yet</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">Start the first run once attendance and salary details are finalized.</p>
          <Can permission="payroll.process">
            <Button className="mt-4" onClick={() => setNewOpen(true)}><Plus className="size-4" /> New payroll run</Button>
          </Can>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard label="Latest period" detail={latestRun ? `Status: ${latestRun.status.replace("_", " ")}` : "No payroll run"}>{latestRun ? periodLabel(latestRun.period) : "—"}</SummaryCard>
            <SummaryCard label="Employees processed" detail="In the latest payroll run">{latestRun?.employee_count ?? 0}</SummaryCard>
            <SummaryCard label="Latest net pay" detail="Net amount due to employees">{latestRun ? <MoneyText kobo={latestRun.total_net} /> : "—"}</SummaryCard>
            <SummaryCard label="Active runs" detail="Awaiting calculation, review, or approval">{activeRuns}</SummaryCard>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search a payroll period" className="pl-9" aria-label="Search payroll periods" />
            </div>
            <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-9 rounded-md border bg-background px-3 text-sm" aria-label="Filter payroll runs by status">
              <option value="all">All statuses</option>
              {statuses.map((item) => <option key={item} value={item}>{item.replaceAll("_", " ")}</option>)}
            </select>
          </div>

          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <caption className="sr-only">Payroll runs</caption>
              <thead>
                <tr className="border-b bg-muted/50 text-left">
                  <th className="px-4 py-3 font-medium">Period</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Employees</th>
                  <th className="px-4 py-3 text-right font-medium">Gross</th>
                  <th className="px-4 py-3 text-right font-medium">Net</th>
                  <th className="px-4 py-3"><span className="sr-only">Open payroll run</span></th>
                </tr>
              </thead>
              <tbody>
                {filteredRuns.map((run) => (
                  <tr key={run.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{periodLabel(run.period)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col items-start gap-1">
                        <StatusBadge status={run.status} />
                        {run.calculation_failure && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-destructive">
                            <TriangleAlert className="size-3.5" /> Calculation failed
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">{run.employee_count}</td>
                    <td className="px-4 py-3 text-right"><MoneyText kobo={run.total_gross} /></td>
                    <td className="px-4 py-3 text-right font-semibold text-fruition-700"><MoneyText kobo={run.total_net} /></td>
                    <td className="px-4 py-3 text-right"><Button variant="ghost" size="sm" render={<Link href={`/payroll/${run.id}`} />}>View</Button></td>
                  </tr>
                ))}
                {filteredRuns.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">No payroll runs match the current filters.</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}

      <NewRunDialog
        open={newOpen}
        onOpenChange={setNewOpen}
        onCreated={(id) => router.push(`/payroll/${id}`)}
      />
    </div>
  );
}
