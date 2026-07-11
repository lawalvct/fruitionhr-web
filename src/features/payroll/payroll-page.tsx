"use client";

import { Plus, Settings2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Can } from "@/components/can";
import { MoneyText } from "@/components/money-text";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { NewRunDialog } from "@/features/payroll/new-run-dialog";
import { SalarySetupDialog } from "@/features/payroll/salary-setup-dialog";
import { usePayrollRuns } from "@/features/payroll/use-payroll";

function periodLabel(period: string) {
  const [y, m] = period.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-NG", { month: "long", year: "numeric" });
}

export function PayrollPage() {
  const { data: runs, isLoading } = usePayrollRuns();
  const [newOpen, setNewOpen] = useState(false);
  const [setupOpen, setSetupOpen] = useState(false);
  const router = useRouter();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payroll"
        description="Run monthly payroll, route it for approval, and generate payslips."
        actions={
          <div className="flex flex-wrap gap-2">
            <Can permission="employees.view_salary">
              <Button variant="outline" onClick={() => setSetupOpen(true)}>
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
        <Skeleton className="h-40 w-full" />
      ) : !runs?.length ? (
        <p className="text-sm text-muted-foreground">
          No payroll runs yet. Start your first run when attendance is finalized.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left">
                <th className="px-4 py-2 font-medium">Period</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 text-right font-medium">Employees</th>
                <th className="px-4 py-2 text-right font-medium">Gross</th>
                <th className="px-4 py-2 text-right font-medium">Net</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {runs.map((run) => (
                <tr key={run.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-2 font-medium">{periodLabel(run.period)}</td>
                  <td className="px-4 py-2"><StatusBadge status={run.status} /></td>
                  <td className="px-4 py-2 text-right">{run.employee_count}</td>
                  <td className="px-4 py-2 text-right"><MoneyText kobo={run.total_gross} /></td>
                  <td className="px-4 py-2 text-right font-semibold text-fruition-700">
                    <MoneyText kobo={run.total_net} />
                  </td>
                  <td className="px-4 py-2 text-right">
                    <Button variant="ghost" size="sm" render={<Link href={`/payroll/${run.id}`} />}>
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <NewRunDialog
        open={newOpen}
        onOpenChange={setNewOpen}
        onCreated={(id) => router.push(`/payroll/${id}`)}
      />
      <SalarySetupDialog open={setupOpen} onOpenChange={setSetupOpen} />
    </div>
  );
}
