"use client";

import { Dialog } from "@base-ui/react/dialog";
import Link from "next/link";
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Banknote,
  Building2,
  CalendarCheck2,
  CalendarDays,
  Check,
  ClipboardCheck,
  PartyPopper,
  Plane,
  Plus,
  Settings2,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";

import { useMe } from "@/features/auth/use-auth";
import { useApprovals } from "@/features/approvals/use-approvals";
import { useLeaveRequests } from "@/features/leave/use-leave";
import {
  useAttendanceToday,
  useHeadcount,
  useLatestPayrollRun,
} from "@/features/dashboard/use-dashboard";
import { MoneyText } from "@/components/money-text";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/* ── Onboarding welcome (behavior unchanged) ─────────────────────────────── */

type WelcomeKind = "completed" | "skipped";

const confetti = [
  { x: -190, y: -150, r: -160, color: "#22c55e", delay: 0 },
  { x: -145, y: -205, r: 130, color: "#f59e0b", delay: 40 },
  { x: -95, y: -170, r: -90, color: "#2563eb", delay: 90 },
  { x: -45, y: -220, r: 180, color: "#86efac", delay: 20 },
  { x: 10, y: -185, r: -130, color: "#ef4444", delay: 120 },
  { x: 65, y: -225, r: 150, color: "#fbbf24", delay: 55 },
  { x: 115, y: -175, r: -180, color: "#3b82f6", delay: 100 },
  { x: 175, y: -205, r: 110, color: "#16a34a", delay: 10 },
  { x: -175, y: -85, r: 140, color: "#60a5fa", delay: 135 },
  { x: -120, y: -120, r: -120, color: "#f97316", delay: 75 },
  { x: -65, y: -100, r: 170, color: "#4ade80", delay: 150 },
  { x: 45, y: -115, r: -150, color: "#facc15", delay: 115 },
  { x: 105, y: -90, r: 120, color: "#ec4899", delay: 160 },
  { x: 165, y: -125, r: -170, color: "#22c55e", delay: 65 },
];

function OnboardingWelcome({ firstName, companyName }: { firstName?: string; companyName?: string }) {
  const [kind, setKind] = useState<WelcomeKind | null>(null);

  useEffect(() => {
    const url = new URL(window.location.href);
    const welcome = url.searchParams.get("welcome");

    if (welcome !== "completed" && welcome !== "skipped") return;

    url.searchParams.delete("welcome");
    window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
    queueMicrotask(() => setKind(welcome));
  }, []);

  const completed = kind === "completed";

  return (
    <Dialog.Root open={kind !== null} onOpenChange={(open) => !open && setKind(null)}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-fruition-950/45 backdrop-blur-[2px] data-open:animate-in data-open:fade-in-0" />
        <Dialog.Popup className="welcome-dialog fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-lg border border-fruition-100 bg-white shadow-2xl outline-none">
          <Dialog.Close aria-label="Close welcome message" className="absolute right-3 top-3 z-20 grid size-8 place-items-center rounded-md text-white/70 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
            <X className="size-4" />
          </Dialog.Close>

          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-20 z-10 flex justify-center">
            {confetti.map((piece, index) => (
              <span
                key={index}
                className="welcome-confetti absolute h-3 w-1.5 rounded-[1px]"
                style={{
                  "--confetti-x": piece.x + "px",
                  "--confetti-y": piece.y + "px",
                  "--confetti-r": piece.r + "deg",
                  "--confetti-color": piece.color,
                  "--confetti-delay": piece.delay + "ms",
                } as CSSProperties}
              />
            ))}
          </div>

          <div className="relative bg-fruition-950 px-6 pb-16 pt-12 text-center text-white sm:px-10">
            <div className="welcome-celebration-icon relative mx-auto grid size-20 place-items-center rounded-full border-4 border-white/20 bg-fruition-500 shadow-lg shadow-fruition-950/30">
              {completed ? <PartyPopper className="size-9" /> : <Check className="size-10" strokeWidth={3} />}
            </div>
          </div>

          <div className="relative -mt-8 px-6 pb-7 text-center sm:px-10 sm:pb-9">
            <div className="mx-auto max-w-sm rounded-md bg-white px-2 pt-6">
              <p className="text-xs font-semibold uppercase text-fruition-700">
                {completed ? "Setup complete" : "Workspace ready"}
              </p>
              <Dialog.Title className="mt-2 text-2xl font-bold text-slate-950 sm:text-3xl">
                Welcome to FruitionHR{firstName ? ", " + firstName : ""}!
              </Dialog.Title>
              <Dialog.Description className="mt-3 text-sm leading-6 text-slate-600">
                {completed
                  ? (companyName ?? "Your company") + " is ready. Your starter records are in place, and you can begin building your team."
                  : (companyName ?? "Your workspace") + " is ready to explore. We added sensible starter records, and you can finish the remaining details anytime."}
              </Dialog.Description>
            </div>

            <div className="mt-6 flex flex-col-reverse justify-center gap-2 sm:flex-row">
              {!completed && (
                <Dialog.Close render={<Button variant="outline" render={<Link href="/onboarding" />} />}>
                  Complete setup
                </Dialog.Close>
              )}
              <Dialog.Close render={<Button size="lg" />}>
                Explore dashboard <ArrowRight className="size-4" />
              </Dialog.Close>
            </div>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/* ── Dashboard building blocks ───────────────────────────────────────────── */

function Rise({ index, children, className }: { index: number; children: ReactNode; className?: string }) {
  return (
    <div className={cn("rise-in", className)} style={{ "--rise-index": index } as CSSProperties}>
      {children}
    </div>
  );
}

function StatCard({
  label,
  value,
  caption,
  icon: Icon,
  href,
  loading,
}: {
  label: string;
  value: ReactNode;
  caption: string;
  icon: LucideIcon;
  href: string;
  loading?: boolean;
}) {
  return (
    <Link
      href={href}
      className="group block rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:border-fruition-200 hover:shadow-md"
    >
      <div className="flex items-start justify-between">
        <span className="grid size-10 place-items-center rounded-xl bg-fruition-50 text-fruition-700 ring-1 ring-fruition-100">
          <Icon className="size-5" />
        </span>
        <ArrowUpRight className="size-4 text-slate-300 transition-colors group-hover:text-fruition-500" />
      </div>
      <div className="mt-4">
        {loading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <p className="text-2xl font-bold tracking-tight text-slate-900">{value}</p>
        )}
        <p className="mt-0.5 text-sm font-medium text-slate-600">{label}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{caption}</p>
      </div>
    </Link>
  );
}

function PanelCard({
  title,
  action,
  children,
  className,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-2xl border border-slate-200/80 bg-white shadow-sm", className)}>
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
        <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function EmptyHint({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-6 text-center">
      <span className="grid size-10 place-items-center rounded-full bg-slate-50 text-slate-400 ring-1 ring-slate-100">
        <Icon className="size-5" />
      </span>
      <p className="text-sm text-muted-foreground">{text}</p>
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
  const [y, m] = period.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-NG", { month: "long", year: "numeric" });
}

/* ── Page ────────────────────────────────────────────────────────────────── */

const setupAreas = [
  {
    title: "Company structure",
    description: "Branches, departments, positions, grades, and calendars.",
    href: "/settings/organisation",
    icon: Building2,
    permission: "company.view",
  },
  {
    title: "Employees",
    description: "Add your first employee or build the team directory.",
    href: "/employees",
    icon: Users,
    permission: "employees.view",
  },
  {
    title: "Payroll readiness",
    description: "Salary components and statutory configuration.",
    href: "/payroll",
    icon: Settings2,
    permission: "payroll.view",
  },
];

export default function TenantDashboardPage() {
  const { data: me } = useMe();
  const permissions = me?.permissions ?? [];
  const can = (p: string) => permissions.includes(p);

  const setupSkipped = me?.tenant?.onboarding_status === "skipped";
  const firstName = me?.name?.split(" ")[0];

  const headcount = useHeadcount(can("employees.view"));
  const attendance = useAttendanceToday(can("attendance.view"));
  const payroll = useLatestPayrollRun(can("payroll.view"));
  const approvals = useApprovals();
  const approvedLeave = useLeaveRequests(can("leave.view") ? { status: "approved" } : undefined);

  const today = new Date().toISOString().slice(0, 10);
  const outToday = can("leave.view")
    ? (approvedLeave.data ?? []).filter((r) => r.start_date <= today && r.end_date >= today)
    : [];

  const pendingApprovals = approvals.data?.pending_for_me ?? [];

  const todayLabel = new Date().toLocaleDateString("en-NG", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const visibleSetupAreas = setupAreas.filter((area) => can(area.permission));

  return (
    <div className="grid gap-6">
      <OnboardingWelcome firstName={firstName} companyName={me?.tenant?.name} />

      {/* Hero band */}
      <Rise index={0}>
        <section className="relative overflow-hidden rounded-2xl bg-linear-135 from-fruition-950 via-fruition-800 to-fruition-600 px-6 py-7 text-white shadow-lg shadow-fruition-900/10 sm:px-8">
          <div className="pointer-events-none absolute -right-16 -top-24 size-72 rounded-full bg-fruition-400/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-28 left-1/3 size-72 rounded-full bg-fruition-500/20 blur-3xl" />

          <div className="relative flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm text-fruition-100/80">{todayLabel}</p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-[1.7rem]">
                {greeting()}, {firstName} 👋
              </h1>
              <p className="mt-1 text-sm text-fruition-100/75">
                Here&apos;s what&apos;s happening at {me?.tenant?.name} today.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {can("employees.create") && (
                <Button
                  className="border border-white/15 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
                  render={<Link href="/employees/new" />}
                >
                  <Plus className="size-4" /> Add employee
                </Button>
              )}
              {can("payroll.process") && (
                <Button
                  className="bg-white font-semibold text-fruition-800 hover:bg-fruition-50"
                  render={<Link href="/payroll" />}
                >
                  <Banknote className="size-4" /> Run payroll
                </Button>
              )}
              {!can("payroll.process") && can("ess.leave.apply") && (
                <Button
                  className="bg-white font-semibold text-fruition-800 hover:bg-fruition-50"
                  render={<Link href="/self-service" />}
                >
                  <CalendarDays className="size-4" /> My self-service
                </Button>
              )}
            </div>
          </div>
        </section>
      </Rise>

      {/* Setup paused banner (behavior unchanged) */}
      {setupSkipped && (
        <Rise index={1}>
          <section className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-amber-800">Setup paused</p>
                <h2 className="mt-1 text-lg font-semibold text-slate-950">Finish configuring your workspace</h2>
                <p className="mt-1 max-w-2xl text-sm text-slate-600">
                  Starter records are ready. Add your company preferences when convenient.
                </p>
              </div>
              <Button render={<Link href="/onboarding" />}>
                Continue setup <ArrowRight className="size-4" />
              </Button>
            </div>
          </section>
        </Rise>
      )}

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {can("employees.view") && (
          <Rise index={1}>
            <StatCard
              label="Employees"
              value={headcount.data ?? 0}
              caption="Active team members"
              icon={Users}
              href="/employees"
              loading={headcount.isLoading}
            />
          </Rise>
        )}
        {can("attendance.view") && (
          <Rise index={2}>
            <StatCard
              label="Present today"
              value={attendance.data?.present ?? 0}
              caption={`${attendance.data?.onLeave ?? 0} on leave · ${attendance.data?.absent ?? 0} absent`}
              icon={CalendarCheck2}
              href="/attendance"
              loading={attendance.isLoading}
            />
          </Rise>
        )}
        <Rise index={3}>
          <StatCard
            label="Pending approvals"
            value={pendingApprovals.length}
            caption="Waiting for your action"
            icon={ClipboardCheck}
            href="/approvals"
            loading={approvals.isLoading}
          />
        </Rise>
        {can("payroll.view") && (
          <Rise index={4}>
            <StatCard
              label="Last payroll"
              value={payroll.data ? <MoneyText kobo={payroll.data.total_net} /> : "—"}
              caption={payroll.data ? `${periodLabel(payroll.data.period)} · net pay` : "No runs yet"}
              icon={Banknote}
              href="/payroll"
              loading={payroll.isLoading}
            />
          </Rise>
        )}
      </div>

      {/* Two-column zone */}
      <div className="grid items-start gap-4 lg:grid-cols-5">
        {/* Payroll snapshot */}
        {can("payroll.view") && (
          <Rise index={5} className="lg:col-span-3">
            <PanelCard
              title="Payroll snapshot"
              action={
                <Link href="/payroll" className="inline-flex items-center gap-1 text-xs font-semibold text-fruition-700 hover:underline">
                  View payroll <ArrowUpRight className="size-3.5" />
                </Link>
              }
            >
              {payroll.isLoading ? (
                <Skeleton className="h-28 w-full" />
              ) : !payroll.data ? (
                <EmptyHint icon={Banknote} text="No payroll run yet — start one when attendance is finalized." />
              ) : (
                <div className="grid gap-5 sm:grid-cols-[1fr_auto]">
                  <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Period</p>
                      <p className="mt-0.5 font-semibold text-slate-900">{periodLabel(payroll.data.period)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Employees</p>
                      <p className="mt-0.5 font-semibold text-slate-900">{payroll.data.employee_count}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Status</p>
                      <div className="mt-0.5"><StatusBadge status={payroll.data.status} /></div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Gross</p>
                      <p className="mt-0.5 font-semibold text-slate-900"><MoneyText kobo={payroll.data.total_gross} /></p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Net pay</p>
                      <p className="mt-0.5 font-semibold text-fruition-700"><MoneyText kobo={payroll.data.total_net} /></p>
                    </div>
                  </div>
                </div>
              )}
            </PanelCard>
          </Rise>
        )}

        {/* Right column: approvals + out today */}
        <div className={cn("grid gap-4", can("payroll.view") ? "lg:col-span-2" : "lg:col-span-5")}>
          <Rise index={6}>
            <PanelCard
              title="Needs your approval"
              action={
                pendingApprovals.length > 0 ? (
                  <Link href="/approvals" className="inline-flex items-center gap-1 text-xs font-semibold text-fruition-700 hover:underline">
                    View all <ArrowUpRight className="size-3.5" />
                  </Link>
                ) : undefined
              }
            >
              {approvals.isLoading ? (
                <Skeleton className="h-20 w-full" />
              ) : pendingApprovals.length === 0 ? (
                <EmptyHint icon={ClipboardCheck} text="All caught up — nothing waiting on you." />
              ) : (
                <ul className="grid gap-2">
                  {pendingApprovals.slice(0, 4).map((request) => (
                    <li key={request.id}>
                      <Link
                        href="/approvals"
                        className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 px-3 py-2.5 transition-colors hover:border-fruition-200 hover:bg-fruition-50/40"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-800">{request.record_summary}</p>
                          <p className="text-xs capitalize text-muted-foreground">
                            {request.module.replace(/_/g, " ")} · {request.requested_by.name}
                          </p>
                        </div>
                        <ArrowUpRight className="size-4 shrink-0 text-slate-300" />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </PanelCard>
          </Rise>

          {can("leave.view") && (
            <Rise index={7}>
              <PanelCard title="Out today">
                {approvedLeave.isLoading ? (
                  <Skeleton className="h-16 w-full" />
                ) : outToday.length === 0 ? (
                  <EmptyHint icon={Plane} text="Everyone is in today." />
                ) : (
                  <ul className="grid gap-2">
                    {outToday.slice(0, 4).map((request) => (
                      <li key={request.id} className="flex items-center gap-2.5">
                        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-info/10 text-info">
                          <Plane className="size-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-800">{request.employee?.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {request.leave_type?.name} · back {new Date(request.end_date).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}
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
      </div>

      {/* Setup shortcuts */}
      {visibleSetupAreas.length > 0 && (
        <Rise index={8}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visibleSetupAreas.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:border-fruition-200 hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span className="grid size-9 place-items-center rounded-lg bg-fruition-50 text-fruition-700 ring-1 ring-fruition-100">
                    <item.icon className="size-4.5" />
                  </span>
                  <ArrowUpRight className="size-4 text-slate-300 transition-colors group-hover:text-fruition-500" />
                </div>
                <p className="mt-3 font-semibold text-slate-900">{item.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
              </Link>
            ))}
          </div>
        </Rise>
      )}
    </div>
  );
}
