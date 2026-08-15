"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  Banknote,
  CalendarCheck2,
  Target,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";

import { MoneyText } from "@/components/money-text";
import { StatusBadge } from "@/components/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  LatestPayrollRun,
  TodayAttendance,
} from "@/features/dashboard/use-dashboard";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  caption,
  icon: Icon,
  href,
  loading,
  progress,
  tone = "green",
}: {
  label: string;
  value: ReactNode;
  caption: string;
  icon: LucideIcon;
  href: string;
  loading?: boolean;
  progress?: number;
  tone?: "green" | "blue" | "amber" | "violet";
}) {
  const tones = {
    green: "bg-fruition-50 text-fruition-700 ring-fruition-100",
    blue: "bg-blue-50 text-blue-700 ring-blue-100",
    amber: "bg-amber-50 text-amber-700 ring-amber-100",
    violet: "bg-violet-50 text-violet-700 ring-violet-100",
  };
  const progressTones = {
    green: "bg-fruition-500",
    blue: "bg-blue-500",
    amber: "bg-amber-400",
    violet: "bg-violet-500",
  };

  return (
    <Link
      href={href}
      className="group flex h-full min-h-36 flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all duration-150 hover:-translate-y-0.5 hover:border-fruition-200 hover:shadow-md"
    >
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "grid size-10 shrink-0 place-items-center rounded-xl ring-1",
            tones[tone],
          )}
        >
          <Icon className="size-4.5" />
        </span>
        <p className="min-w-0 flex-1 text-sm font-medium text-slate-500">{label}</p>
        <ArrowUpRight className="size-4 shrink-0 text-slate-300 transition-colors group-hover:text-fruition-600" />
      </div>
      <div className="mt-4 flex-1">
        {loading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <p className="text-[1.65rem] font-bold tracking-tight text-slate-950">{value}</p>
        )}
        <p className="mt-1 text-xs leading-5 text-muted-foreground">{caption}</p>
      </div>
      {progress !== undefined && (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className={cn("h-full rounded-full", progressTones[tone])}
            style={{ width: `${Math.max(0, Math.min(progress, 100))}%` }}
          />
        </div>
      )}
    </Link>
  );
}

export function PanelCard({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4 px-5 pb-3 pt-5">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
          {description && (
            <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
          )}
        </div>
        {action}
      </div>
      <div className="px-5 pb-5">{children}</div>
    </section>
  );
}

export function EmptyHint({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-8 text-center">
      <span className="grid size-10 place-items-center rounded-full bg-slate-50 text-slate-400 ring-1 ring-slate-100">
        <Icon className="size-4.5" />
      </span>
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

function periodLabel(period: string): string {
  const [year, month] = period.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("en-NG", {
    month: "long",
    year: "numeric",
  });
}

export function WorkforceOverview({
  attendance,
  loading,
}: {
  attendance: TodayAttendance | undefined;
  loading: boolean;
}) {
  const items = [
    {
      label: "Present",
      value: attendance?.present ?? 0,
      color: "#10b981",
      className: "bg-emerald-500",
    },
    {
      label: "On leave",
      value: attendance?.onLeave ?? 0,
      color: "#f59e0b",
      className: "bg-amber-400",
    },
    {
      label: "Absent",
      value: attendance?.absent ?? 0,
      color: "#94a3b8",
      className: "bg-slate-400",
    },
  ];
  const total = items.reduce((sum, item) => sum + item.value, 0);
  const presentRate = total ? Math.round((items[0].value / total) * 100) : 0;
  const max = Math.max(...items.map((item) => item.value), 1);

  return (
    <PanelCard
      title="Workforce overview"
      description="Today’s attendance distribution"
      action={
        <Link
          href="/attendance"
          className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-fruition-700 hover:underline"
        >
          View attendance <ArrowUpRight className="size-3.5" />
        </Link>
      }
      className="h-full"
    >
      {loading ? (
        <Skeleton className="h-56 w-full" />
      ) : total === 0 ? (
        <EmptyHint
          icon={CalendarCheck2}
          text="Attendance data will appear once your team checks in."
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-[minmax(0,1fr)_9rem]">
          <div className="grid min-h-52 grid-cols-3 items-end gap-4 rounded-xl border border-slate-100 bg-slate-50/60 px-4 pb-4 pt-8">
            {items.map((item) => (
              <div
                key={item.label}
                className="flex h-full min-w-0 flex-col justify-end text-center"
              >
                <span className="mb-2 text-xs font-semibold text-slate-700">
                  {item.value}
                </span>
                <div className="mx-auto flex h-32 w-full max-w-12 items-end overflow-hidden rounded-t-lg bg-slate-100">
                  <div
                    className={cn(
                      "w-full rounded-t-lg transition-all duration-500",
                      item.className,
                    )}
                    style={{
                      height: `${Math.max(
                        (item.value / max) * 100,
                        item.value ? 10 : 0,
                      )}%`,
                    }}
                  />
                </div>
                <span className="mt-3 truncate text-[11px] text-muted-foreground">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
          <div className="flex flex-col justify-between gap-5">
            <div>
              <p className="text-[2rem] font-bold tracking-tight text-slate-950">
                {presentRate}%
              </p>
              <p className="text-xs leading-5 text-muted-foreground">
                of recorded employees are present today
              </p>
            </div>
            <div className="grid gap-2.5">
              {items.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between gap-3 text-xs"
                >
                  <span className="flex items-center gap-2 text-slate-500">
                    <span
                      className="size-2 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    {item.label}
                  </span>
                  <span className="font-semibold text-slate-800">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </PanelCard>
  );
}

export function PayrollSnapshot({
  payroll,
  loading,
}: {
  payroll: LatestPayrollRun | null | undefined;
  loading: boolean;
}) {
  const netRatio = payroll?.total_gross
    ? Math.round((payroll.total_net / payroll.total_gross) * 100)
    : 0;

  return (
    <PanelCard
      title="Payroll snapshot"
      description="Latest processed payroll"
      action={
        <Link
          href="/payroll"
          className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-fruition-700 hover:underline"
        >
          View details <ArrowUpRight className="size-3.5" />
        </Link>
      }
      className="h-full"
    >
      {loading ? (
        <Skeleton className="h-56 w-full" />
      ) : !payroll ? (
        <EmptyHint icon={Banknote} text="Run your first payroll to see the latest summary." />
      ) : (
        <div className="grid gap-5">
          <div className="flex items-center justify-between gap-4 rounded-xl bg-fruition-50/70 p-4">
            <div>
              <p className="text-xs text-fruition-800/70">
                {periodLabel(payroll.period)}
              </p>
              <p className="mt-1 text-xl font-bold tracking-tight text-fruition-950">
                <MoneyText kobo={payroll.total_net} />
              </p>
              <p className="mt-1 text-xs text-fruition-800/65">Net pay</p>
            </div>
            <span className="grid size-11 place-items-center rounded-xl bg-white text-fruition-700 shadow-sm ring-1 ring-fruition-100">
              <Banknote className="size-5" />
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-100 p-3">
              <p className="text-[11px] text-muted-foreground">Gross payroll</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                <MoneyText kobo={payroll.total_gross} />
              </p>
            </div>
            <div className="rounded-xl border border-slate-100 p-3">
              <p className="text-[11px] text-muted-foreground">Employees</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {payroll.employee_count}
              </p>
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Net-to-gross ratio</span>
              <span className="font-semibold text-slate-800">{netRatio}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-fruition-600"
                style={{ width: `${netRatio}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Run status</span>
            <StatusBadge status={payroll.status} />
          </div>
        </div>
      )}
    </PanelCard>
  );
}

export function PerformanceOverview({
  score,
  results,
  loading,
}: {
  score: number | null;
  results: number;
  loading: boolean;
}) {
  const normalizedScore = score === null ? 0 : Math.max(0, Math.min(score, 100));

  return (
    <PanelCard
      title="Performance"
      description="Latest appraisal results"
      action={
        <Link
          href="/performance"
          className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-fruition-700 hover:underline"
        >
          View <ArrowUpRight className="size-3.5" />
        </Link>
      }
      className="h-full"
    >
      {loading ? (
        <Skeleton className="h-56 w-full" />
      ) : score === null ? (
        <EmptyHint icon={Target} text="Completed appraisal results will appear here." />
      ) : (
        <div className="flex min-h-56 flex-col items-center justify-center">
          <div
            className="relative grid size-36 place-items-center rounded-full"
            style={{
              background: `conic-gradient(#047857 0 ${normalizedScore}%, #e2e8f0 ${normalizedScore}% 100%)`,
            }}
          >
            <div className="grid size-28 place-items-center rounded-full bg-white text-center shadow-inner">
              <div>
                <p className="text-2xl font-bold tracking-tight text-slate-950">
                  {normalizedScore.toFixed(1)}%
                </p>
                <p className="text-[11px] text-muted-foreground">average score</p>
              </div>
            </div>
          </div>
          <div className="mt-5 flex w-full items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5">
            <span className="text-xs text-muted-foreground">Completed results</span>
            <span className="text-sm font-semibold text-slate-900">{results}</span>
          </div>
        </div>
      )}
    </PanelCard>
  );
}
