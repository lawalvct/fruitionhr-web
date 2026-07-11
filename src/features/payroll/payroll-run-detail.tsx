"use client";

import { ArrowLeft, Download, FileText, Lock, Send } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { Can } from "@/components/can";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { MoneyText } from "@/components/money-text";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { apiErrorMessage } from "@/lib/api";
import {
  payrollDownloadUrl,
  usePayrollAction,
  usePayrollRun,
} from "@/features/payroll/use-payroll";
import { useState } from "react";

function periodLabel(period: string) {
  const [y, m] = period.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-NG", { month: "long", year: "numeric" });
}

const DOWNLOADABLE = ["approved", "locked", "paid"];

export function PayrollRunDetail({ runId }: { runId: number }) {
  const { data: run, isLoading } = usePayrollRun(runId);
  const action = usePayrollAction(runId);
  const [lockOpen, setLockOpen] = useState(false);

  if (isLoading || !run) return <Skeleton className="h-64 w-full" />;

  const canDownload = DOWNLOADABLE.includes(run.status);

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
        </div>
      </div>

      {/* Stat tiles */}
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: "Employees", value: run.employee_count, money: false },
          { label: "Gross", value: run.total_gross, money: true },
          { label: "Deductions", value: run.total_deductions, money: true },
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
        </div>
      )}

      {/* Employee lines */}
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
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
            {run.employees?.map((row) => (
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
    </div>
  );
}
