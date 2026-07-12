"use client";

import {
  CalendarCheck2,
  CalendarDays,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Filter,
  Plus,
  Search,
  Settings2,
  Users,
  WalletCards,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Can } from "@/components/can";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { apiErrorMessage } from "@/lib/api";
import { ApplyLeaveDialog } from "@/features/leave/apply-leave-dialog";
import { LeaveTypesDialog } from "@/features/leave/leave-types-dialog";
import {
  useCancelLeave,
  useLeaveBalances,
  useLeaveRequests,
  type LeaveBalanceItem,
  type LeaveRequestItem,
} from "@/features/leave/use-leave";

const tabs = [
  { id: "Requests", label: "Requests", icon: ClipboardList },
  { id: "Balances", label: "Balances", icon: WalletCards },
  { id: "Calendar", label: "Calendar", icon: CalendarRange },
] as const;

type Tab = (typeof tabs)[number]["id"];
type RequestStatus = "all" | LeaveRequestItem["status"];

function parseDate(value: string): Date {
  return new Date(`${value}T00:00:00`);
}

function formatDate(value: string, options?: Intl.DateTimeFormatOptions): string {
  return parseDate(value).toLocaleDateString("en-NG", options ?? { day: "numeric", month: "short", year: "numeric" });
}

function formatRange(start: string, end: string): string {
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  const startLabel = formatDate(start, opts);
  const endLabel = formatDate(end, opts);
  return start === end ? startLabel : `${startLabel} - ${endLabel}`;
}

function daysLabel(days: number): string {
  return `${days} day${days === 1 ? "" : "s"}`;
}

function isTodayWithinRange(start: string, end: string, today: string): boolean {
  return start <= today && end >= today;
}

function localDateValue(): string {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof CalendarDays;
  title: string;
  description: string;
}) {
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

function RequestsTab({
  requests,
  isLoading,
  search,
  status,
  onSearchChange,
  onStatusChange,
}: {
  requests: LeaveRequestItem[];
  isLoading: boolean;
  search: string;
  status: RequestStatus;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: RequestStatus) => void;
}) {
  const cancel = useCancelLeave();
  const filteredRequests = useMemo(() => {
    const term = search.trim().toLowerCase();
    return requests.filter((request) => {
      const matchesStatus = status === "all" || request.status === status;
      const searchable = [request.employee?.name, request.leave_type?.name, request.reason]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return matchesStatus && (!term || searchable.includes(term));
    });
  }, [requests, search, status]);

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold">Leave requests</h2>
          <p className="mt-1 text-xs text-muted-foreground">Review submitted time away and track approval progress.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative min-w-0 sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="h-10 pl-9" value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Search requests" aria-label="Search leave requests" />
          </div>
          <div className="relative sm:w-40">
            <Filter className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <select className="h-10 w-full rounded-lg border border-slate-300 bg-background pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 dark:border-slate-600" value={status} onChange={(event) => onStatusChange(event.target.value as RequestStatus)} aria-label="Filter requests by status">
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-56 w-full" />
      ) : filteredRequests.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No matching requests" description={search || status !== "all" ? "Clear the filters to see more requests." : "Submitted leave requests will appear here."} />
      ) : (
        <ul className="divide-y rounded-xl border bg-card shadow-sm">
          {filteredRequests.map((request) => (
            <li key={request.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-semibold">{request.employee?.name ?? "Employee"}</p>
                  <span className="text-xs text-muted-foreground">{request.leave_type?.name ?? "Leave"}</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatRange(request.start_date, request.end_date)}
                  <span className="mx-1.5 text-slate-300">/</span>
                  {daysLabel(request.days)}
                </p>
                {request.reason && <p className="mt-1 truncate text-xs text-muted-foreground">{request.reason}</p>}
              </div>
              <div className="flex items-center justify-between gap-3 sm:justify-end">
                <StatusBadge status={request.status} />
                {request.status === "pending" && (
                  <Can permission="leave.manage">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Cancel leave request for ${request.employee?.name ?? "employee"}`}
                      title="Cancel request"
                      disabled={cancel.isPending}
                      onClick={async () => {
                        try {
                          await cancel.mutateAsync(request.id);
                          toast.success("Leave request cancelled.");
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
      )}
    </section>
  );
}

function BalancesTab({
  balances,
  isLoading,
  year,
  search,
  onSearchChange,
}: {
  balances: LeaveBalanceItem[];
  isLoading: boolean;
  year: number;
  search: string;
  onSearchChange: (value: string) => void;
}) {
  const filteredBalances = useMemo(() => {
    const term = search.trim().toLowerCase();
    return balances.filter((balance) => {
      const searchable = `${balance.employee.name} ${balance.leave_type.name}`.toLowerCase();
      return !term || searchable.includes(term);
    });
  }, [balances, search]);

  const totals = useMemo(() => balances.reduce((summary, balance) => ({
    allocated: summary.allocated + balance.allocated,
    taken: summary.taken + balance.taken,
    remaining: summary.remaining + balance.remaining,
  }), { allocated: 0, taken: 0, remaining: 0 }), [balances]);

  return (
    <section className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Allocated", value: totals.allocated, detail: `${year} entitlement`, tone: "text-fruition-700 bg-fruition-50", icon: WalletCards },
          { label: "Taken", value: totals.taken, detail: "Approved days", tone: "text-amber-700 bg-amber-50", icon: CalendarCheck2 },
          { label: "Remaining", value: totals.remaining, detail: "Available days", tone: "text-blue-700 bg-blue-50", icon: CalendarDays },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border bg-card p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <span className={`grid size-9 place-items-center rounded-lg ${item.tone}`}><item.icon className="size-4" /></span>
              <span className="text-2xl font-bold tracking-tight">{item.value}</span>
            </div>
            <p className="mt-3 text-sm font-semibold">{item.label}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{item.detail}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold">Leave balances</h2>
          <p className="mt-1 text-xs text-muted-foreground">Track entitlement usage by employee and leave type.</p>
        </div>
        <div className="relative sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="h-10 pl-9" value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Search balances" aria-label="Search leave balances" />
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-56 w-full" />
      ) : filteredBalances.length === 0 ? (
        <EmptyState icon={WalletCards} title="No balances found" description="Balances will appear here once leave policies are applied to employees." />
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
          <table className="w-full min-w-[680px] text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left">
                <th className="px-4 py-3 font-medium">Employee</th>
                <th className="px-4 py-3 font-medium">Leave type</th>
                <th className="px-4 py-3 text-right font-medium">Allocated</th>
                <th className="px-4 py-3 text-right font-medium">Taken</th>
                <th className="px-4 py-3 font-medium">Remaining</th>
              </tr>
            </thead>
            <tbody>
              {filteredBalances.map((balance) => {
                const progress = balance.allocated > 0 ? Math.min(100, Math.round((balance.taken / balance.allocated) * 100)) : 0;
                return (
                  <tr key={balance.id} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-3 font-medium">{balance.employee.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{balance.leave_type.name}</td>
                    <td className="px-4 py-3 text-right">{balance.allocated}</td>
                    <td className="px-4 py-3 text-right">{balance.taken}</td>
                    <td className="px-4 py-3">
                      <div className="flex min-w-32 items-center gap-3">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"><span className="block h-full rounded-full bg-fruition-500" style={{ width: `${progress}%` }} /></div>
                        <span className="w-8 text-right font-semibold text-fruition-700">{balance.remaining}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function CalendarTab({ requests, isLoading }: { requests: LeaveRequestItem[]; isLoading: boolean }) {
  const groups = useMemo(() => {
    const sorted = [...requests].sort((a, b) => a.start_date.localeCompare(b.start_date));
    return sorted.reduce<Record<string, LeaveRequestItem[]>>((result, request) => {
      const key = formatDate(request.start_date, { month: "long", year: "numeric" });
      result[key] ??= [];
      result[key].push(request);
      return result;
    }, {});
  }, [requests]);

  if (isLoading) return <Skeleton className="h-56 w-full" />;
  if (requests.length === 0) return <EmptyState icon={CalendarRange} title="No approved leave" description="Approved leave will appear here as a simple team timeline." />;

  return (
    <section className="space-y-4">
      <div className="rounded-xl border bg-card p-4 shadow-sm">
        <h2 className="text-sm font-semibold">Approved leave calendar</h2>
        <p className="mt-1 text-xs text-muted-foreground">A timeline of approved time away across the organisation.</p>
      </div>
      <div className="space-y-6">
        {Object.entries(groups).map(([month, monthRequests]) => (
          <section key={month} className="space-y-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold"><CalendarDays className="size-4 text-fruition-700" />{month}</h3>
            <ul className="relative space-y-3 border-l border-fruition-200 pl-5">
              {monthRequests.map((request) => (
                <li key={request.id} className="relative rounded-xl border bg-card p-4 shadow-sm">
                  <span className="absolute -left-[1.4rem] top-5 size-2.5 rounded-full bg-fruition-500 ring-4 ring-background" />
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold">{request.employee?.name ?? "Employee"}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{request.leave_type?.name ?? "Leave"} / {formatRange(request.start_date, request.end_date)}</p>
                    </div>
                    <span className="text-sm font-semibold text-fruition-700">{daysLabel(request.days)}</span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </section>
  );
}

export function LeavePage() {
  const currentYear = new Date().getFullYear();
  const today = localDateValue();
  const [year, setYear] = useState(currentYear);
  const [tab, setTab] = useState<Tab>("Requests");
  const [applyOpen, setApplyOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [requestSearch, setRequestSearch] = useState("");
  const [requestStatus, setRequestStatus] = useState<RequestStatus>("all");
  const [balanceSearch, setBalanceSearch] = useState("");

  const { data: requests = [], isLoading: requestsLoading } = useLeaveRequests();
  const { data: balances = [], isLoading: balancesLoading } = useLeaveBalances(year);

  const pendingCount = requests.filter((request) => request.status === "pending").length;
  const approvedDays = requests.filter((request) => request.status === "approved").reduce((total, request) => total + request.days, 0);
  const peopleAway = requests.filter((request) => request.status === "approved" && isTodayWithinRange(request.start_date, request.end_date, today)).length;
  const totalRemaining = balances.reduce((total, balance) => total + balance.remaining, 0);
  const approvedRequests = requests.filter((request) => request.status === "approved");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leave"
        description="Plan time away, monitor balances, and keep approvals moving."
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

      <section className="rounded-xl border bg-card p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon-sm" onClick={() => setYear((value) => value - 1)} aria-label="Previous year">
              <ChevronLeft className="size-4" />
            </Button>
            <div className="min-w-28 text-center">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Leave year</p>
              <p className="text-sm font-semibold">{year}</p>
            </div>
            <Button variant="outline" size="icon-sm" onClick={() => setYear((value) => value + 1)} aria-label="Next year">
              <ChevronRight className="size-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setYear(currentYear)} disabled={year === currentYear}>Today</Button>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Users className="size-4" /> {balances.length} balance record{balances.length === 1 ? "" : "s"} in {year}
          </div>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Pending requests", value: pendingCount, detail: "Awaiting workflow action", icon: ClipboardList, tone: "text-amber-700 bg-amber-50" },
          { label: "Approved days", value: approvedDays, detail: "Across approved requests", icon: CalendarCheck2, tone: "text-fruition-700 bg-fruition-50" },
          { label: "Away today", value: peopleAway, detail: "Approved leave in progress", icon: CalendarDays, tone: "text-blue-700 bg-blue-50" },
          { label: "Days remaining", value: totalRemaining, detail: `Across balances in ${year}`, icon: WalletCards, tone: "text-violet-700 bg-violet-50" },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border bg-card p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <span className={`grid size-9 place-items-center rounded-lg ${item.tone}`}><item.icon className="size-4" /></span>
              <span className="text-2xl font-bold tracking-tight">{item.value}</span>
            </div>
            <p className="mt-3 text-sm font-semibold">{item.label}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{item.detail}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-1 rounded-lg bg-muted p-1" role="tablist" aria-label="Leave views">
        {tabs.map((item) => {
          const Icon = item.icon;
          const count = item.id === "Requests" ? requests.length : item.id === "Balances" ? balances.length : approvedRequests.length;
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

      {tab === "Requests" && <RequestsTab requests={requests} isLoading={requestsLoading} search={requestSearch} status={requestStatus} onSearchChange={setRequestSearch} onStatusChange={setRequestStatus} />}
      {tab === "Balances" && <BalancesTab balances={balances} isLoading={balancesLoading} year={year} search={balanceSearch} onSearchChange={setBalanceSearch} />}
      {tab === "Calendar" && <CalendarTab requests={approvedRequests} isLoading={requestsLoading} />}

      <ApplyLeaveDialog open={applyOpen} onOpenChange={setApplyOpen} year={year} />
      <LeaveTypesDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}
