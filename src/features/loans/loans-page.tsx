"use client";

import {
  BadgeCheck,
  CircleDollarSign,
  Clock,
  HandCoins,
  Landmark,
  Plus,
  Send,
  Trash2,
  Wallet,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Can } from "@/components/can";
import { MoneyText } from "@/components/money-text";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { apiErrorMessage } from "@/lib/api";
import { RecordLoanDialog } from "@/features/loans/record-loan-dialog";
import {
  useClearDeduction,
  useDeleteLoan,
  useLoans,
  usePlanDeduction,
  useSubmitLoan,
  type LoanStatus,
  type LoanType,
  type StaffLoan,
} from "@/features/loans/use-loans";

const typeFilters: Array<{ id: "all" | LoanType; label: string }> = [
  { id: "all", label: "All" },
  { id: "loan", label: "Loans" },
  { id: "advance", label: "Advances" },
];

function EmptyState({ icon: Icon, title, description }: { icon: typeof HandCoins; title: string; description: string }) {
  return (
    <div className="rounded-xl border border-dashed px-5 py-12 text-center">
      <span className="mx-auto grid size-10 place-items-center rounded-lg bg-fruition-50 text-fruition-700">
        <Icon className="size-5" />
      </span>
      <p className="mt-3 text-sm font-semibold">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function LoanRow({ loan }: { loan: StaffLoan }) {
  const submit = useSubmitLoan();
  const remove = useDeleteLoan();
  const plan = usePlanDeduction();
  const clear = useClearDeduction();

  const repaid = loan.principal - loan.balance;
  const progress = loan.principal > 0 ? Math.min(100, Math.round((repaid / loan.principal) * 100)) : 0;
  const isActive = loan.status === "active";
  const overrideQueued = loan.next_deduction_override != null;

  return (
    <li className="flex flex-col gap-3 px-4 py-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-semibold">{loan.employee?.name ?? "Employee"}</p>
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium capitalize text-muted-foreground">
              {loan.type === "advance" ? <HandCoins className="size-3" /> : <Landmark className="size-3" />}
              {loan.type === "advance" ? "Advance" : `Loan · ${loan.months}mo`}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground"><MoneyText kobo={loan.principal} /></span> borrowed
            <span className="mx-1.5 text-slate-300">/</span>
            balance <span className="font-semibold text-fruition-700"><MoneyText kobo={loan.balance} /></span>
            {loan.reason && <span className="ml-1.5">/ {loan.reason}</span>}
          </p>
        </div>

        <div className="flex items-center justify-between gap-3 sm:justify-end">
          <StatusBadge status={loan.status} />
          {(loan.status === "draft" || loan.status === "rejected") && (
            <Can permission="loans.manage">
              <Button
                size="sm"
                disabled={submit.isPending}
                onClick={async () => {
                  try {
                    await submit.mutateAsync(loan.id);
                    toast.success("Submitted for approval.");
                  } catch (error) {
                    toast.error(apiErrorMessage(error));
                  }
                }}
              >
                <Send className="size-4" /> Submit
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Delete"
                title="Delete"
                disabled={remove.isPending}
                onClick={async () => {
                  try {
                    await remove.mutateAsync(loan.id);
                    toast.success("Deleted.");
                  } catch (error) {
                    toast.error(apiErrorMessage(error));
                  }
                }}
              >
                <Trash2 className="size-4" />
              </Button>
            </Can>
          )}
        </div>
      </div>

      {isActive && (
        <div className="flex flex-col gap-3 rounded-lg bg-muted/40 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <span className="block h-full rounded-full bg-fruition-500" style={{ width: `${progress}%` }} />
              </div>
              <span className="text-xs font-semibold text-fruition-700">{progress}%</span>
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              {overrideQueued ? (
                <>Coming payroll: <span className="font-semibold text-foreground"><MoneyText kobo={loan.next_deduction_override} /></span> (early settlement queued)</>
              ) : (
                <>Coming payroll: <span className="font-semibold text-foreground"><MoneyText kobo={loan.scheduled_deduction} /></span> installment</>
              )}
            </p>
          </div>

          <Can permission="loans.manage">
            {overrideQueued ? (
              <Button
                variant="outline"
                size="sm"
                disabled={clear.isPending}
                onClick={async () => {
                  try {
                    await clear.mutateAsync(loan.id);
                    toast.success("Reverted to the normal installment.");
                  } catch (error) {
                    toast.error(apiErrorMessage(error));
                  }
                }}
              >
                Undo early settle
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                disabled={plan.isPending}
                onClick={async () => {
                  try {
                    await plan.mutateAsync({ id: loan.id, amount: null });
                    toast.success("Full balance will be deducted in the coming payroll.");
                  } catch (error) {
                    toast.error(apiErrorMessage(error));
                  }
                }}
              >
                <Zap className="size-4" /> Settle in next payroll
              </Button>
            )}
          </Can>
        </div>
      )}
    </li>
  );
}

export function LoansPage() {
  const [recordOpen, setRecordOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState<"all" | LoanType>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | LoanStatus>("all");

  const { data: loans = [], isLoading } = useLoans({
    type: typeFilter === "all" ? undefined : typeFilter,
    status: statusFilter === "all" ? undefined : statusFilter,
  });

  const stats = useMemo(() => {
    const pending = loans.filter((l) => l.status === "pending").length;
    const active = loans.filter((l) => l.status === "active").length;
    const outstanding = loans.filter((l) => l.status === "active").reduce((sum, l) => sum + l.balance, 0);
    return { pending, active, outstanding };
  }, [loans]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Loans & advances"
        description="Grant salary advances and staff loans, then recover them automatically from payroll."
        actions={
          <Can permission="loans.manage">
            <Button onClick={() => setRecordOpen(true)}>
              <Plus className="size-4" /> New loan / advance
            </Button>
          </Can>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Awaiting approval", value: String(stats.pending), icon: Clock, tone: "text-amber-700 bg-amber-50" },
          { label: "Active", value: String(stats.active), icon: BadgeCheck, tone: "text-fruition-700 bg-fruition-50" },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border bg-card p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <span className={`grid size-9 place-items-center rounded-lg ${item.tone}`}><item.icon className="size-4" /></span>
              <span className="text-2xl font-bold tracking-tight">{item.value}</span>
            </div>
            <p className="mt-3 text-sm font-semibold">{item.label}</p>
          </div>
        ))}
        <div className="rounded-xl border bg-card p-4 shadow-sm sm:col-span-2">
          <div className="flex items-start justify-between gap-3">
            <span className="grid size-9 place-items-center rounded-lg bg-violet-50 text-violet-700"><Wallet className="size-4" /></span>
            <span className="text-xl font-bold tracking-tight"><MoneyText kobo={stats.outstanding} /></span>
          </div>
          <p className="mt-3 text-sm font-semibold">Total outstanding</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Across active loans & advances</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="grid grid-cols-3 gap-1 rounded-lg bg-muted p-1 sm:w-72">
          {typeFilters.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTypeFilter(item.id)}
              className={`h-9 rounded-md text-sm font-medium transition-colors ${typeFilter === item.id ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <select
          className="h-10 w-full rounded-lg border border-slate-300 bg-background px-3 text-sm dark:border-slate-600 sm:w-48"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as "all" | LoanStatus)}
          aria-label="Filter by status"
        >
          <option value="all">All statuses</option>
          <option value="draft">Draft</option>
          <option value="pending">Pending approval</option>
          <option value="active">Active</option>
          <option value="closed">Closed</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {isLoading ? (
        <Skeleton className="h-56 w-full" />
      ) : loans.length === 0 ? (
        <EmptyState icon={CircleDollarSign} title="No loans or advances" description="Grant a salary advance or staff loan — it's recovered automatically from payroll after approval." />
      ) : (
        <ul className="divide-y rounded-xl border bg-card shadow-sm">
          {loans.map((loan) => <LoanRow key={loan.id} loan={loan} />)}
        </ul>
      )}

      <RecordLoanDialog open={recordOpen} onOpenChange={setRecordOpen} />
    </div>
  );
}
