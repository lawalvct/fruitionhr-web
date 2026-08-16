"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Banknote,
  CalendarCheck2,
  CalendarDays,
  ChevronRight,
  CircleCheck,
  ClipboardCheck,
  Clock3,
  Plane,
  Plus,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useEffect, type CSSProperties, type ReactNode } from "react";

import { MoneyText } from "@/components/money-text";
import { PageLoader } from "@/components/page-loader";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useApprovals } from "@/features/approvals/use-approvals";
import { tenantHomeDestination } from "@/features/auth/access-destinations";
import { useMe } from "@/features/auth/use-auth";
import { DashboardWelcome } from "@/features/dashboard/dashboard-welcome";
import {
  EmptyHint,
  PanelCard,
  PayrollSnapshot,
  PerformanceOverview,
  StatCard,
  WorkforceOverview,
} from "@/features/dashboard/dashboard-visuals";
import {
  useAttendanceToday,
  useHeadcount,
  useLatestPayrollRun,
} from "@/features/dashboard/use-dashboard";
import { useLeaveRequests } from "@/features/leave/use-leave";
import { usePerformanceSummary } from "@/features/performance/use-performance";
import { cn } from "@/lib/utils";

function Rise({
  index,
  children,
  className,
}: {
  index: number;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn("rise-in", className)}
      style={{ "--rise-index": index } as CSSProperties}
    >
      {children}
    </div>
  );
}

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function periodLabel(period: string): string {
  const [year, month] = period.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("en-NG", {
    month: "long",
    year: "numeric",
  });
}

function shortDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-NG", { day: "numeric", month: "short" });
}

function initials(name?: string): string {
  return (name ?? "?")
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

interface ActivityItem {
  id: string;
  title: string;
  description: ReactNode;
  meta: string;
  href: string;
  icon: LucideIcon;
  iconClassName: string;
}

export default function TenantDashboardPage() {
  const router = useRouter();
  const { data: me } = useMe();
  const permissions = me?.permissions ?? [];
  const can = (permission: string) =>
    Boolean(me?.is_super_admin || permissions.includes(permission));

  const firstName = me?.name?.split(" ")[0];
  const setupSkipped = me?.tenant?.onboarding_status === "skipped";

  const headcount = useHeadcount(can("employees.view"));
  const attendance = useAttendanceToday(can("attendance.view"));
  const payroll = useLatestPayrollRun(can("payroll.view"));
  const performance = usePerformanceSummary(null, can("performance.view"));
  const canViewApprovals = can("mss.approvals.view");
  const approvals = useApprovals(canViewApprovals);
  const approvedLeave = useLeaveRequests(
    { status: "approved" },
    can("leave.view"),
  );

  const homeDestination = me ? tenantHomeDestination(me) : "/dashboard";
  const shouldRedirect = Boolean(me && homeDestination !== "/dashboard");

  useEffect(() => {
    if (shouldRedirect) router.replace(homeDestination);
  }, [homeDestination, router, shouldRedirect]);

  if (shouldRedirect) {
    return <PageLoader label="Opening your workspace..." />;
  }

  const today = new Date().toISOString().slice(0, 10);
  const outToday = can("leave.view")
    ? (approvedLeave.data ?? []).filter(
        (request) => request.start_date <= today && request.end_date >= today,
      )
    : [];
  const pendingApprovals = approvals.data?.pending_for_me ?? [];

  const attendanceTotal =
    (attendance.data?.present ?? 0) +
    (attendance.data?.onLeave ?? 0) +
    (attendance.data?.absent ?? 0);
  const attendanceRate = attendanceTotal
    ? Math.round(((attendance.data?.present ?? 0) / attendanceTotal) * 100)
    : 0;
  const performanceScore =
    performance.data?.average_score_basis_points === null ||
    performance.data?.average_score_basis_points === undefined
      ? null
      : performance.data.average_score_basis_points / 100;

  const todayLabel = new Date().toLocaleDateString("en-NG", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const recentActivity: ActivityItem[] = [];

  if (payroll.data) {
    recentActivity.push({
      id: `payroll-${payroll.data.id}`,
      title: `${periodLabel(payroll.data.period)} payroll`,
      description: (
        <>
          {payroll.data.employee_count} employees ·{" "}
          <MoneyText kobo={payroll.data.total_net} /> net pay
        </>
      ),
      meta: payroll.data.status.replace(/_/g, " "),
      href: "/payroll",
      icon: Banknote,
      iconClassName: "bg-fruition-50 text-fruition-700",
    });
  }

  pendingApprovals.slice(0, 2).forEach((request) => {
    recentActivity.push({
      id: `approval-${request.id}`,
      title: request.record_summary,
      description: (
        <>
          {request.module.replace(/_/g, " ")} request by {request.requested_by.name}
        </>
      ),
      meta: shortDate(request.submitted_at),
      href: "/approvals",
      icon: ClipboardCheck,
      iconClassName: "bg-amber-50 text-amber-700",
    });
  });

  outToday.slice(0, 1).forEach((request) => {
    recentActivity.push({
      id: `leave-${request.id}`,
      title: `${request.employee?.name ?? "Employee"} is out today`,
      description: request.leave_type?.name ?? "Approved leave",
      meta: `Back ${shortDate(request.end_date)}`,
      href: "/leave",
      icon: Plane,
      iconClassName: "bg-blue-50 text-blue-700",
    });
  });

  return (
    <div className="grid gap-5 xl:gap-6">
      <DashboardWelcome firstName={firstName} companyName={me?.tenant?.name} />

      <Rise index={0}>
        <section className="rounded-2xl border border-slate-200/80 bg-white px-5 py-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-5">
            <div className="flex min-w-0 items-center gap-4">
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-fruition-50 text-2xl ring-1 ring-fruition-100">
                👋
              </span>
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground">{todayLabel}</p>
                <h1 className="mt-1 text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">
                  {greeting()}, {firstName ?? "there"}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Here&apos;s what&apos;s happening at {me?.tenant?.name ?? "your company"} today.
                </p>
              </div>
            </div>

            <div className="flex w-full flex-wrap gap-2 sm:w-auto">
              {can("employees.create") && (
                <Button
                  variant="outline"
                  className="flex-1 border-slate-200 bg-white text-slate-700 hover:border-fruition-200 hover:bg-fruition-50 sm:flex-none"
                  render={<Link href="/employees/new" />}
                >
                  <Plus className="size-4" /> Add employee
                </Button>
              )}
              {can("payroll.process") && (
                <Button className="flex-1 sm:flex-none" render={<Link href="/payroll" />}>
                  <Banknote className="size-4" /> Run payroll
                </Button>
              )}
              {!can("payroll.process") && can("ess.leave.apply") && (
                <Button className="flex-1 sm:flex-none" render={<Link href="/self-service" />}>
                  <CalendarDays className="size-4" /> My self-service
                </Button>
              )}
            </div>
          </div>
        </section>
      </Rise>

      {setupSkipped && me?.roles?.includes("owner") && (
        <Rise index={1}>
          <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50/80 px-5 py-4">
            <div>
              <p className="text-sm font-semibold text-amber-900">Finish setting up your workspace</p>
              <p className="mt-1 text-xs leading-5 text-amber-800/75">
                Complete your company preferences so your team can use every workflow.
              </p>
            </div>
            <Button size="sm" render={<Link href="/onboarding" />}>
              Continue setup <ArrowRight className="size-4" />
            </Button>
          </section>
        </Rise>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {can("employees.view") && (
          <Rise index={1} className="h-full">
            <StatCard
              label="Total employees"
              value={headcount.data ?? 0}
              caption="Active people in your workspace"
              icon={Users}
              href="/employees"
              loading={headcount.isLoading}
              tone="green"
            />
          </Rise>
        )}

        {can("attendance.view") && (
          <Rise index={2} className="h-full">
            <StatCard
              label="Present today"
              value={attendance.data?.present ?? 0}
              caption={`${attendance.data?.onLeave ?? 0} on leave · ${attendance.data?.absent ?? 0} absent`}
              icon={CalendarCheck2}
              href="/attendance"
              loading={attendance.isLoading}
              progress={attendanceRate}
              tone="blue"
            />
          </Rise>
        )}

        {canViewApprovals && (
          <Rise index={3} className="h-full">
            <StatCard
              label="Pending approvals"
              value={pendingApprovals.length}
              caption={
                pendingApprovals.length
                  ? "Items waiting for your decision"
                  : "You are all caught up"
              }
              icon={ClipboardCheck}
              href="/approvals"
              loading={approvals.isLoading}
              tone="amber"
            />
          </Rise>
        )}

        {can("payroll.view") && (
          <Rise index={4} className="h-full">
            <StatCard
              label="Last payroll"
              value={
                payroll.data ? <MoneyText kobo={payroll.data.total_net} /> : "—"
              }
              caption={
                payroll.data
                  ? `${periodLabel(payroll.data.period)} · net pay`
                  : "No payroll runs yet"
              }
              icon={Banknote}
              href="/payroll"
              loading={payroll.isLoading}
              tone="violet"
            />
          </Rise>
        )}
      </div>

      <div className="grid items-stretch gap-4 lg:grid-cols-2 xl:grid-cols-4">
        {can("attendance.view") && (
          <Rise index={5} className="h-full xl:col-span-2">
            <WorkforceOverview
              attendance={attendance.data}
              loading={attendance.isLoading}
            />
          </Rise>
        )}

        {can("payroll.view") && (
          <Rise index={6} className="h-full">
            <PayrollSnapshot payroll={payroll.data} loading={payroll.isLoading} />
          </Rise>
        )}

        {can("performance.view") && (
          <Rise index={7} className="h-full">
            <PerformanceOverview
              score={performanceScore}
              results={performance.data?.results_count ?? 0}
              loading={performance.isLoading}
            />
          </Rise>
        )}
      </div>

      <div className="grid items-stretch gap-4 lg:grid-cols-2 xl:grid-cols-12">
        <Rise index={8} className="h-full xl:col-span-5">
          <PanelCard
            title="Recent activity"
            description="A live summary from your HR workspace"
            action={<Activity className="size-4 text-slate-400" />}
            className="h-full"
          >
            {approvals.isLoading || payroll.isLoading ? (
              <div className="grid gap-3">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </div>
            ) : recentActivity.length === 0 ? (
              <EmptyHint icon={Activity} text="Workspace activity will appear here." />
            ) : (
              <ul className="divide-y divide-slate-100">
                {recentActivity.slice(0, 4).map((item) => (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      className="group flex items-center gap-3 py-3 first:pt-1 last:pb-0"
                    >
                      <span
                        className={cn(
                          "grid size-9 shrink-0 place-items-center rounded-xl",
                          item.iconClassName,
                        )}
                      >
                        <item.icon className="size-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-slate-800">
                          {item.title}
                        </span>
                        <span className="mt-0.5 block truncate text-xs capitalize text-muted-foreground">
                          {item.description}
                        </span>
                      </span>
                      <span className="shrink-0 text-[11px] capitalize text-slate-400">
                        {item.meta}
                      </span>
                      <ChevronRight className="size-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-fruition-600" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </PanelCard>
        </Rise>

        {canViewApprovals && (
        <Rise index={9} className="h-full xl:col-span-4">
          <PanelCard
            title="Needs your approval"
            description={
              pendingApprovals.length
                ? `${pendingApprovals.length} item${pendingApprovals.length === 1 ? "" : "s"} waiting`
                : "Nothing requires your attention"
            }
            action={
              pendingApprovals.length ? (
                <Link
                  href="/approvals"
                  className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-fruition-700 hover:underline"
                >
                  View all <ArrowUpRight className="size-3.5" />
                </Link>
              ) : (
                <CircleCheck className="size-4 text-fruition-600" />
              )
            }
            className="h-full"
          >
            {approvals.isLoading ? (
              <Skeleton className="h-44 w-full" />
            ) : pendingApprovals.length === 0 ? (
              <EmptyHint icon={CircleCheck} text="All caught up — nothing waiting on you." />
            ) : (
              <ul className="grid gap-2">
                {pendingApprovals.slice(0, 4).map((request) => (
                  <li key={request.id}>
                    <Link
                      href="/approvals"
                      className="group flex items-center gap-3 rounded-xl border border-slate-100 p-3 transition hover:border-fruition-200 hover:bg-fruition-50/40"
                    >
                      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-amber-50 text-xs font-semibold text-amber-800">
                        {initials(request.requested_by.name)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-slate-800">
                          {request.record_summary}
                        </span>
                        <span className="mt-0.5 flex items-center gap-1 text-[11px] capitalize text-muted-foreground">
                          <Clock3 className="size-3" />
                          {request.module.replace(/_/g, " ")} · {shortDate(request.submitted_at)}
                        </span>
                      </span>
                      <ChevronRight className="size-4 shrink-0 text-slate-300 transition group-hover:text-fruition-600" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </PanelCard>
        </Rise>
        )}

        {can("leave.view") && (
          <Rise index={10} className="h-full lg:col-span-2 xl:col-span-3">
            <PanelCard
              title="Out today"
              description={
                outToday.length
                  ? `${outToday.length} employee${outToday.length === 1 ? "" : "s"} away`
                  : "Your full team is available"
              }
              action={
                <Link
                  href="/leave"
                  className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-fruition-700 hover:underline"
                >
                  Leave <ArrowUpRight className="size-3.5" />
                </Link>
              }
              className="h-full"
            >
              {approvedLeave.isLoading ? (
                <Skeleton className="h-44 w-full" />
              ) : outToday.length === 0 ? (
                <EmptyHint icon={Plane} text="Everyone is in today." />
              ) : (
                <ul className="grid gap-3">
                  {outToday.slice(0, 4).map((request) => (
                    <li key={request.id} className="flex items-center gap-3">
                      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-blue-50 text-xs font-semibold text-blue-800">
                        {initials(request.employee?.name)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-800">
                          {request.employee?.name ?? "Employee"}
                        </p>
                        <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                          {request.leave_type?.name ?? "Approved leave"} · back {shortDate(request.end_date)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </PanelCard>
          </Rise>
        )}
      </div>

      {!recentActivity.length && !approvals.isLoading && (
        <Rise index={11}>
          <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-dashed border-fruition-200 bg-fruition-50/40 px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-white text-fruition-700 ring-1 ring-fruition-100">
                <TrendingUp className="size-4.5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-900">Your workspace is ready to grow</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {can("employees.create")
                    ? "Add employees and begin using HR workflows to populate your dashboard."
                    : "Activity from the modules you can access will appear here."}
                </p>
              </div>
            </div>
            {can("employees.create") && (
              <Button size="sm" variant="outline" render={<Link href="/employees/new" />}>
                Add employee <ArrowRight className="size-4" />
              </Button>
            )}
          </section>
        </Rise>
      )}
    </div>
  );
}
