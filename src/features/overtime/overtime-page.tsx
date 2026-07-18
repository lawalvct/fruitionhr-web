"use client";

import {
  BadgeCheck,
  Banknote,
  CalendarClock,
  Check,
  Clock,
  ListChecks,
  Plus,
  Send,
  Timer,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Can } from "@/components/can";
import { MoneyText } from "@/components/money-text";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { apiErrorMessage } from "@/lib/api";
import { RecordOvertimeDialog } from "@/features/overtime/record-overtime-dialog";
import {
  OVERTIME_MULTIPLIERS,
  useAttendanceOvertimeCandidates,
  useDeleteOvertime,
  useOvertime,
  usePayOvertime,
  useRecordFromAttendance,
  useSubmitOvertime,
  type AttendanceOvertimeCandidate,
  type OvertimeMode,
  type OvertimePayment,
} from "@/features/overtime/use-overtime";

const tabs = [
  { id: "payments", label: "Overtime payments", icon: ListChecks },
  { id: "attendance", label: "From attendance", icon: CalendarClock },
] as const;

type Tab = (typeof tabs)[number]["id"];

function currentPeriod(): string {
  return new Date().toISOString().slice(0, 7);
}

function EmptyState({ icon: Icon, title, description }: { icon: typeof Clock; title: string; description: string }) {
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

function PaymentRow({ item }: { item: OvertimePayment }) {
  const submit = useSubmitOvertime();
  const pay = usePayOvertime();
  const remove = useDeleteOvertime();

  const detail =
    item.pay_type === "hourly"
      ? `${item.hours ?? 0}h × ${item.multiplier} @ hourly`
      : "Fixed amount";

  return (
    <li className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-semibold">{item.employee?.name ?? "Employee"}</p>
          <span className="text-xs text-muted-foreground">{detail}</span>
          <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium capitalize text-muted-foreground">
            {item.disbursement_mode === "in_payroll" ? "In payroll" : "Off-cycle"}
          </span>
        </div>
        <p className="mt-1 text-sm font-semibold text-fruition-700">
          <MoneyText kobo={item.amount} />
          {item.reason && <span className="ml-2 font-normal text-muted-foreground">/ {item.reason}</span>}
        </p>
      </div>

      <div className="flex items-center justify-between gap-3 sm:justify-end">
        {item.status === "approved" && item.disbursement_mode === "in_payroll" && (
          <span className="hidden text-xs text-muted-foreground sm:inline">Rides next payroll</span>
        )}
        <StatusBadge status={item.status} />

        {(item.status === "draft" || item.status === "rejected") && (
          <Can permission="overtime.manage">
            <Button
              size="sm"
              disabled={submit.isPending}
              onClick={async () => {
                try {
                  await submit.mutateAsync(item.id);
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
              aria-label="Delete overtime"
              title="Delete"
              disabled={remove.isPending}
              onClick={async () => {
                try {
                  await remove.mutateAsync(item.id);
                  toast.success("Overtime deleted.");
                } catch (error) {
                  toast.error(apiErrorMessage(error));
                }
              }}
            >
              <Trash2 className="size-4" />
            </Button>
          </Can>
        )}

        {item.status === "approved" && item.disbursement_mode === "off_cycle" && (
          <Can permission="overtime.manage">
            <Button
              size="sm"
              disabled={pay.isPending}
              onClick={async () => {
                try {
                  await pay.mutateAsync(item.id);
                  toast.success("Overtime paid (off-cycle, gross).");
                } catch (error) {
                  toast.error(apiErrorMessage(error));
                }
              }}
            >
              <Banknote className="size-4" /> Pay now
            </Button>
          </Can>
        )}
      </div>
    </li>
  );
}

function CandidateRow({ candidate, period }: { candidate: AttendanceOvertimeCandidate; period: string }) {
  const [multiplier, setMultiplier] = useState<number>(1.5);
  const [mode, setMode] = useState<OvertimeMode>("in_payroll");
  const record = useRecordFromAttendance();

  return (
    <li className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{candidate.employee.name}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {candidate.overtime_hours}h clocked overtime in {period}
        </p>
      </div>

      {candidate.already_recorded ? (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-fruition-700">
          <BadgeCheck className="size-4" /> Recorded
        </span>
      ) : (
        <Can
          permission="overtime.manage"
          fallback={<span className="text-xs text-muted-foreground">{candidate.overtime_hours}h</span>}
        >
          <div className="flex flex-wrap items-center gap-2">
            <select
              className="h-9 rounded-lg border border-slate-300 bg-background px-2 text-sm dark:border-slate-600"
              value={multiplier}
              onChange={(event) => setMultiplier(Number(event.target.value))}
              aria-label="Rate multiplier"
            >
              {OVERTIME_MULTIPLIERS.map((value) => (
                <option key={value} value={value}>×{value}</option>
              ))}
            </select>
            <select
              className="h-9 rounded-lg border border-slate-300 bg-background px-2 text-sm dark:border-slate-600"
              value={mode}
              onChange={(event) => setMode(event.target.value as OvertimeMode)}
              aria-label="Disbursement mode"
            >
              <option value="in_payroll">In payroll</option>
              <option value="off_cycle">Off-cycle</option>
            </select>
            <Button
              size="sm"
              disabled={record.isPending}
              onClick={async () => {
                try {
                  await record.mutateAsync({
                    attendance_summary_id: candidate.attendance_summary_id,
                    multiplier,
                    disbursement_mode: mode,
                  });
                  toast.success("Overtime recorded from attendance.");
                } catch (error) {
                  toast.error(apiErrorMessage(error));
                }
              }}
            >
              <Check className="size-4" /> Accept
            </Button>
          </div>
        </Can>
      )}
    </li>
  );
}

export function OvertimePage() {
  const [period, setPeriod] = useState(currentPeriod());
  const [tab, setTab] = useState<Tab>("payments");
  const [recordOpen, setRecordOpen] = useState(false);

  const { data: payments = [], isLoading } = useOvertime({ period });
  const { data: candidates = [], isLoading: candidatesLoading } = useAttendanceOvertimeCandidates(period);

  const stats = useMemo(() => {
    const pending = payments.filter((p) => p.status === "pending").length;
    const awaiting = payments.filter((p) => p.status === "approved").length;
    const paid = payments.filter((p) => p.status === "paid").length;
    const total = payments
      .filter((p) => p.status !== "rejected")
      .reduce((sum, p) => sum + p.amount, 0);
    return { pending, awaiting, paid, total };
  }, [payments]);

  const pendingCandidates = candidates.filter((c) => !c.already_recorded).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Overtime"
        description="Record overtime, route it through approval, then pay it in payroll or off-cycle."
        actions={
          <Can permission="overtime.manage">
            <Button onClick={() => setRecordOpen(true)}>
              <Plus className="size-4" /> Record overtime
            </Button>
          </Can>
        }
      />

      <section className="rounded-xl border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Payroll period</p>
            <p className="text-sm font-semibold">{period}</p>
          </div>
          <Input
            type="month"
            className="h-10 w-full sm:w-48"
            value={period}
            onChange={(event) => setPeriod(event.target.value || currentPeriod())}
            aria-label="Payroll period"
          />
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Awaiting approval", value: stats.pending, icon: Clock, tone: "text-amber-700 bg-amber-50" },
          { label: "Approved", value: stats.awaiting, icon: BadgeCheck, tone: "text-fruition-700 bg-fruition-50" },
          { label: "Paid", value: stats.paid, icon: Check, tone: "text-blue-700 bg-blue-50" },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border bg-card p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <span className={`grid size-9 place-items-center rounded-lg ${item.tone}`}><item.icon className="size-4" /></span>
              <span className="text-2xl font-bold tracking-tight">{item.value}</span>
            </div>
            <p className="mt-3 text-sm font-semibold">{item.label}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">This period</p>
          </div>
        ))}
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <span className="grid size-9 place-items-center rounded-lg bg-violet-50 text-violet-700"><Timer className="size-4" /></span>
            <span className="text-xl font-bold tracking-tight"><MoneyText kobo={stats.total} /></span>
          </div>
          <p className="mt-3 text-sm font-semibold">Overtime value</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Excludes rejected</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1" role="tablist" aria-label="Overtime views">
        {tabs.map((item) => {
          const Icon = item.icon;
          const count = item.id === "payments" ? payments.length : pendingCandidates;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              onClick={() => setTab(item.id)}
              className={`flex h-10 items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors ${tab === item.id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Icon className="size-4" />
              <span>{item.label}</span>
              <span className="rounded-full bg-muted px-1.5 py-0.5 text-[11px] tabular-nums">{count}</span>
            </button>
          );
        })}
      </div>

      {tab === "payments" &&
        (isLoading ? (
          <Skeleton className="h-56 w-full" />
        ) : payments.length === 0 ? (
          <EmptyState icon={ListChecks} title="No overtime yet" description="Record overtime manually or accept clocked overtime from the attendance tab." />
        ) : (
          <ul className="divide-y rounded-xl border bg-card shadow-sm">
            {payments.map((item) => <PaymentRow key={item.id} item={item} />)}
          </ul>
        ))}

      {tab === "attendance" &&
        (candidatesLoading ? (
          <Skeleton className="h-56 w-full" />
        ) : candidates.length === 0 ? (
          <EmptyState icon={CalendarClock} title="No clocked overtime" description="When finalized attendance shows overtime for this period, accept or overlook it here." />
        ) : (
          <ul className="divide-y rounded-xl border bg-card shadow-sm">
            {candidates.map((candidate) => (
              <CandidateRow key={candidate.attendance_summary_id} candidate={candidate} period={period} />
            ))}
          </ul>
        ))}

      <RecordOvertimeDialog open={recordOpen} onOpenChange={setRecordOpen} defaultPeriod={period} />
    </div>
  );
}
