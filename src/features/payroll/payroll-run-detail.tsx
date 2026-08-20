"use client";

import { ArrowLeft, Download, FileText, Lock, RefreshCw, RotateCcw, Scale, Search, Send, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { Can } from "@/components/can";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { MoneyText } from "@/components/money-text";
import { PageHeader } from "@/components/page-header";
import { PageLoader } from "@/components/page-loader";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { apiErrorMessage } from "@/lib/api";
import {
  payrollDownloadUrl,
  usePayrollAction,
  usePayrollRun,
  useRetryPayrollCalculation,
  useReversePayrollRun,
} from "@/features/payroll/use-payroll";
import { VarianceSheet } from "@/features/payroll/variance-sheet";
import { useMemo, useState } from "react";

function periodLabel(period: string) {
  const [y, m] = period.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-NG", { month: "long", year: "numeric" });
}

const DOWNLOADABLE = ["approved", "locked", "paid"];

function nextStep(status: string) {
  const steps: Record<string, string> = {
    calculating: "Payroll lines are being calculated. This page updates automatically when they are ready.",
    review: "Review employee figures, then submit the run for approval.",
    submitted: "This run is awaiting approval before it can be locked.",
    approved: "Approval is complete. Lock the run to make reports and payslips final.",
    locked: "This payroll is locked. Reports and employee payslips are ready to download.",
    paid: "This payroll has been paid and remains available for audit and reporting.",
    reversed: "This payroll was reversed and no longer contributes to payroll totals.",
  };

  return steps[status] ?? "Review the payroll run and complete the next available action.";
}

export function PayrollRunDetail({ runId }: { runId: number }) {
  const { data: run, isLoading, isError, isFetching, refetch } = usePayrollRun(runId);
  const action = usePayrollAction(runId);
  const retryCalculation = useRetryPayrollCalculation(runId);
  const reverse = useReversePayrollRun(runId);
  const [lockOpen, setLockOpen] = useState(false);
  const [varianceOpen, setVarianceOpen] = useState(false);
  const [reverseOpen, setReverseOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [employeeQuery, setEmployeeQuery] = useState("");
  const filteredEmployees = useMemo(() => {
    const query = employeeQuery.trim().toLowerCase();
    const employees = run?.employees ?? [];
    if (!query) return employees;
    return employees.filter((row) => `${row.employee.name} ${row.employee.number}`.toLowerCase().includes(query));
  }, [employeeQuery, run?.employees]);

  if (isLoading) return <PageLoader label="Loading payroll details…" />;

  if (isError || !run) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
        <h1 className="font-semibold">Payroll run unavailable</h1>
        <p className="mt-1 text-sm text-muted-foreground">The payroll run could not be loaded. It may no longer exist or your access may have changed.</p>
        <div className="mt-4 flex justify-center gap-2">
          <Button variant="outline" render={<Link href="/payroll" />}>All runs</Button>
          <Button onClick={() => void refetch()} disabled={isFetching}>Retry</Button>
        </div>
      </div>
    );
  }

  const canDownload = DOWNLOADABLE.includes(run.status);
  const canReverse = ["locked", "paid"].includes(run.status) && !run.is_reversal;

  const doReverse = async () => {
    if (!reason.trim()) {
      toast.error("A reason is required to reverse payroll.");
      return;
    }
    try {
      await reverse.mutateAsync(reason);
      toast.success("Payroll reversed. A correcting entry has been posted.");
      setReverseOpen(false);
      setReason("");
    } catch (error) {
      toast.error(apiErrorMessage(error));
    }
  };

  const doAction = async (a: "submit" | "lock") => {
    try {
      await action.mutateAsync(a);
      toast.success(a === "submit" ? "Submitted for approval." : "Payroll locked.");
    } catch (error) {
      toast.error(apiErrorMessage(error));
    } finally {
      setLockOpen(false);
    }
  };

  const doRetryCalculation = async () => {
    try {
      await retryCalculation.mutateAsync();
      toast.success("Payroll calculation restarted.");
    } catch (error) {
      toast.error(apiErrorMessage(error));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Payroll — ${periodLabel(run.period)}`}
        description="Review figures, route for approval, then lock and generate outputs."
        actions={
          <Button variant="outline" render={<Link href="/payroll" />}>
            <ArrowLeft className="size-4" /> All runs
          </Button>
        }
      />

      {/* Summary + status/actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <StatusBadge status={run.status} />
          <p className="max-w-xl text-sm text-muted-foreground">{nextStep(run.status)}</p>
          {run.status === "calculating" && (
            <span className="text-sm text-muted-foreground">Calculating…</span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Can permission="payroll.process">
            {run.status === "review" && (
              <Button onClick={() => doAction("submit")} disabled={action.isPending}>
                <Send className="size-4" /> Submit for approval
              </Button>
            )}
          </Can>
          <Can permission="payroll.approve">
            {run.status === "approved" && (
              <Button onClick={() => setLockOpen(true)} disabled={action.isPending}>
                <Lock className="size-4" /> Lock payroll
              </Button>
            )}
          </Can>
          {canDownload && (
            <Button variant="outline" onClick={() => setVarianceOpen(true)}>
              <Scale className="size-4" /> Variance
            </Button>
          )}
          <Can permission="payroll.reverse">
            {canReverse && (
              <Button variant="outline" onClick={() => setReverseOpen(true)}>
                <RotateCcw className="size-4" /> Reverse
              </Button>
            )}
          </Can>
        </div>
      </div>

      {/* Reversal / reversed banners */}
      {run.is_reversal && (
        <div className="rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-warning">
          This is a <strong>reversal entry</strong> (negated figures) correcting an earlier run.
          {run.reversal_reason ? ` Reason: ${run.reversal_reason}` : ""}
        </div>
      )}
      {run.status === "reversed" && (
        <div className="rounded-lg border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
          This run has been <strong>reversed</strong> and no longer contributes to payroll totals.
        </div>
      )}
      {run.calculation_failure && (
        <div
          role="alert"
          className="rounded-xl border border-destructive/35 bg-destructive/5 p-4 text-sm"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-destructive/10 text-destructive">
                <TriangleAlert className="size-5" />
              </span>
              <div className="min-w-0">
                <h2 className="font-semibold text-destructive">Payroll calculation stopped</h2>
                <p className="mt-1 max-w-3xl leading-6 text-foreground">
                  {run.calculation_failure.message
                    || "Review the payroll inputs, correct the problem, and retry the calculation."}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {run.calculation_failure.code && (
                    <><span className="font-mono">{run.calculation_failure.code}</span><span aria-hidden> · </span></>
                  )}
                  Failed {new Intl.DateTimeFormat("en-NG", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(new Date(run.calculation_failure.failed_at))}
                </p>
              </div>
            </div>
            <Can permission="payroll.process">
              {run.calculation_failure.retryable && (
                <Button
                  type="button"
                  onClick={() => void doRetryCalculation()}
                  disabled={retryCalculation.isPending}
                >
                  <RefreshCw className={retryCalculation.isPending ? "size-4 animate-spin" : "size-4"} />
                  {retryCalculation.isPending ? "Restarting…" : "Retry calculation"}
                </Button>
              )}
            </Can>
          </div>
        </div>
      )}

      {/* Stat tiles */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          { label: "Employees", value: run.employee_count, money: false },
          { label: "Gross pay", value: run.total_gross, money: true },
          { label: "Statutory", value: run.total_statutory, money: true },
          { label: "Other deductions", value: run.total_deductions, money: true },
          { label: "Net pay", value: run.total_net, money: true, highlight: true },
        ].map((tile) => (
          <div key={tile.label} className="rounded-xl border bg-card p-4">
            <p className="text-xs text-muted-foreground">{tile.label}</p>
            <p className={`text-lg font-bold ${tile.highlight ? "text-fruition-700" : ""}`}>
              {tile.money ? <MoneyText kobo={tile.value as number} /> : tile.value}
            </p>
          </div>
        ))}
      </div>

      {/* Downloads */}
      {canDownload && (
        <div className="flex flex-wrap gap-2 rounded-lg border bg-muted/40 p-4">
          <span className="self-center text-sm font-medium">Reports:</span>
          <Button variant="outline" size="sm" render={<a href={payrollDownloadUrl(`/payroll-runs/${run.id}/bank-schedule`)} target="_blank" rel="noreferrer" />}>
            <Download className="size-4" /> Bank schedule
          </Button>
          {["paye", "pension", "nhf", "nsitf"].map((type) => (
            <Button
              key={type}
              variant="outline"
              size="sm"
              render={<a href={payrollDownloadUrl(`/payroll-runs/${run.id}/statutory-report?type=${type}`)} target="_blank" rel="noreferrer" />}
            >
              <Download className="size-4" /> {type.toUpperCase()}
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            render={<a href={payrollDownloadUrl(`/payroll-runs/${run.id}/journal.xlsx`)} target="_blank" rel="noreferrer" />}
          >
            <Download className="size-4" /> Journal
          </Button>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-semibold">Employee payroll lines</h2>
          <p className="text-sm text-muted-foreground">{filteredEmployees.length} of {run.employees?.length ?? 0} employees shown</p>
        </div>
        <div className="relative w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={employeeQuery} onChange={(event) => setEmployeeQuery(event.target.value)} placeholder="Search employee or number" className="pl-9" aria-label="Search payroll employees" />
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <caption className="sr-only">Employee payroll lines for {periodLabel(run.period)}</caption>
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="px-4 py-2 font-medium">Employee</th>
              <th className="px-4 py-2 text-right font-medium">Gross</th>
              <th className="px-4 py-2 text-right font-medium">Statutory</th>
              <th className="px-4 py-2 text-right font-medium">Deductions</th>
              <th className="px-4 py-2 text-right font-medium">Net</th>
              {canDownload && <th className="px-4 py-2"></th>}
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.map((row) => (
              <tr key={row.id} className="border-b last:border-0">
                <td className="px-4 py-2">
                  <span className="font-medium">{row.employee.name}</span>
                  <span className="ml-1 text-xs text-muted-foreground">{row.employee.number}</span>
                </td>
                <td className="px-4 py-2 text-right"><MoneyText kobo={row.gross} /></td>
                <td className="px-4 py-2 text-right"><MoneyText kobo={row.total_statutory} /></td>
                <td className="px-4 py-2 text-right"><MoneyText kobo={row.total_deductions} /></td>
                <td className="px-4 py-2 text-right font-semibold text-fruition-700"><MoneyText kobo={row.net} /></td>
                {canDownload && (
                  <td className="px-4 py-2 text-right">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Payslip"
                      render={<a href={payrollDownloadUrl(`/payroll-runs/${run.id}/employees/${row.id}/payslip`)} target="_blank" rel="noreferrer" />}
                    >
                      <FileText className="size-4" />
                    </Button>
                  </td>
                )}
              </tr>
            ))}
            {filteredEmployees.length === 0 && <tr><td colSpan={canDownload ? 6 : 5} className="px-4 py-10 text-center text-sm text-muted-foreground">No employee payroll lines match this search.</td></tr>}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={lockOpen}
        onOpenChange={setLockOpen}
        title="Lock this payroll run?"
        description="Once locked, the run cannot be edited. Corrections must be made via reversal or adjustment. Payslips and reports become available."
        confirmLabel="Lock payroll"
        isPending={action.isPending}
        onConfirm={() => doAction("lock")}
      />

      <VarianceSheet runId={run.id} open={varianceOpen} onOpenChange={setVarianceOpen} />

      <Sheet open={reverseOpen} onOpenChange={setReverseOpen}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Reverse payroll run</SheetTitle>
            <SheetDescription>
              This posts a negated correcting entry and marks this run reversed.
              The original figures are preserved for audit.
            </SheetDescription>
          </SheetHeader>
          <div className="grid gap-3 px-4 pb-6">
            <div className="grid gap-2">
              <Label htmlFor="reverse-reason">Reason</Label>
              <Input
                id="reverse-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Wrong salary used for two employees"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setReverseOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={doReverse} disabled={reverse.isPending}>
                {reverse.isPending ? "Reversing…" : "Reverse payroll"}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
