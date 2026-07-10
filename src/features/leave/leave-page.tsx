"use client";

import { CalendarDays, Plus, Settings2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Can } from "@/components/can";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { apiErrorMessage } from "@/lib/api";
import { ApplyLeaveDialog } from "@/features/leave/apply-leave-dialog";
import { LeaveTypesDialog } from "@/features/leave/leave-types-dialog";
import {
  useCancelLeave,
  useLeaveBalances,
  useLeaveRequests,
} from "@/features/leave/use-leave";

const tabs = ["Requests", "Balances", "Calendar"] as const;
type Tab = (typeof tabs)[number];

function formatRange(start: string, end: string): string {
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  const s = new Date(start).toLocaleDateString("en-NG", opts);
  const e = new Date(end).toLocaleDateString("en-NG", opts);
  return start === end ? s : `${s} – ${e}`;
}

function RequestsTab() {
  const { data: requests, isLoading } = useLeaveRequests();
  const cancel = useCancelLeave();

  if (isLoading) return <Skeleton className="h-40 w-full" />;
  if (!requests?.length) {
    return <p className="text-sm text-muted-foreground">No leave requests yet.</p>;
  }

  return (
    <ul className="divide-y rounded-lg border">
      {requests.map((req) => (
        <li key={req.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
          <div>
            <p className="text-sm font-medium">
              {req.employee?.name} · {req.leave_type?.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatRange(req.start_date, req.end_date)} · {req.days} day(s)
              {req.reason ? ` · ${req.reason}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={req.status} />
            {req.status === "pending" && (
              <Can permission="leave.manage">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Cancel request"
                  disabled={cancel.isPending}
                  onClick={async () => {
                    try {
                      await cancel.mutateAsync(req.id);
                      toast.success("Request cancelled.");
                    } catch (error) {
                      toast.error(apiErrorMessage(error));
                    }
                  }}
                >
                  <X className="size-4" />
                </Button>
              </Can>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

function BalancesTab({ year }: { year: number }) {
  const { data: balances, isLoading } = useLeaveBalances(year);

  if (isLoading) return <Skeleton className="h-40 w-full" />;
  if (!balances?.length) {
    return (
      <p className="text-sm text-muted-foreground">
        No balances yet. Balances are created when employees apply for leave.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50 text-left">
            <th className="px-4 py-2 font-medium">Employee</th>
            <th className="px-4 py-2 font-medium">Leave type</th>
            <th className="px-4 py-2 text-right font-medium">Allocated</th>
            <th className="px-4 py-2 text-right font-medium">Taken</th>
            <th className="px-4 py-2 text-right font-medium">Remaining</th>
          </tr>
        </thead>
        <tbody>
          {balances.map((b) => (
            <tr key={b.id} className="border-b last:border-0">
              <td className="px-4 py-2">{b.employee.name}</td>
              <td className="px-4 py-2">{b.leave_type.name}</td>
              <td className="px-4 py-2 text-right">{b.allocated}</td>
              <td className="px-4 py-2 text-right">{b.taken}</td>
              <td className="px-4 py-2 text-right font-semibold text-fruition-700">{b.remaining}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CalendarTab() {
  const { data: requests, isLoading } = useLeaveRequests({ status: "approved" });

  if (isLoading) return <Skeleton className="h-40 w-full" />;
  if (!requests?.length) {
    return <p className="text-sm text-muted-foreground">No approved leave to show.</p>;
  }

  return (
    <ul className="space-y-2">
      {requests.map((req) => (
        <li key={req.id} className="flex items-center gap-3 rounded-lg border px-4 py-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-info/10 text-info">
            <CalendarDays className="size-4" />
          </span>
          <div>
            <p className="text-sm font-medium">{req.employee?.name}</p>
            <p className="text-xs text-muted-foreground">
              {req.leave_type?.name} · {formatRange(req.start_date, req.end_date)} · {req.days} day(s)
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function LeavePage() {
  const year = new Date().getFullYear();
  const [tab, setTab] = useState<Tab>("Requests");
  const [applyOpen, setApplyOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leave"
        description="Apply for leave, track balances and approvals."
        actions={
          <div className="flex flex-wrap gap-2">
            <Can permission="company.manage">
              <Button variant="outline" onClick={() => setSettingsOpen(true)}>
                <Settings2 className="size-4" /> Leave types
              </Button>
            </Can>
            <Can permission="leave.manage">
              <Button onClick={() => setApplyOpen(true)}>
                <Plus className="size-4" /> Apply for leave
              </Button>
            </Can>
          </div>
        }
      />

      <div className="flex gap-1 border-b">
        {tabs.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`border-b-2 px-3 py-2 text-sm font-medium ${
              tab === t
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Requests" && <RequestsTab />}
      {tab === "Balances" && <BalancesTab year={year} />}
      {tab === "Calendar" && <CalendarTab />}

      <ApplyLeaveDialog open={applyOpen} onOpenChange={setApplyOpen} year={year} />
      <LeaveTypesDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}
