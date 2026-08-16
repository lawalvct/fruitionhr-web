"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  Banknote,
  BarChart3,
  BriefcaseBusiness,
  CalendarCheck2,
  CalendarDays,
  Gauge,
  LockKeyhole,
  ShieldAlert,
  Users,
  type LucideIcon,
} from "lucide-react";
import { type ReactNode, useState } from "react";

import { MoneyText } from "@/components/money-text";
import { PageHeader } from "@/components/page-header";
import { PageLoader } from "@/components/page-loader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMe } from "@/features/auth/use-auth";
import { cn } from "@/lib/utils";
import type { LabelValue, MonthPoint } from "./types";
import { useReportsOverview } from "./use-reports";

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  tone,
}: {
  label: string;
  value: ReactNode;
  detail: string;
  icon: LucideIcon;
  tone: string;
}) {
  return (
    <Card size="sm">
      <CardContent className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="mt-1 truncate text-2xl font-semibold tracking-tight text-slate-950">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
        </div>
        <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl", tone)}>
          <Icon className="size-4.5" />
        </span>
      </CardContent>
    </Card>
  );
}

function ReportPanel({
  title,
  description,
  icon: Icon,
  href,
  children,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  children: ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-fruition-50 text-fruition-700">
              <Icon className="size-4" />
            </span>
            <div>
              <CardTitle>{title}</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">{description}</p>
            </div>
          </div>
          <Button size="sm" variant="ghost" render={<Link href={href} />}>
            Open <ArrowUpRight className="size-3.5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-4">{children}</CardContent>
    </Card>
  );
}

function SummaryStat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-2.5 ring-1 ring-slate-100">
      <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-base font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function BarList({
  items,
  emptyText = "No data recorded for this period.",
  valueSuffix = "",
}: {
  items: LabelValue[];
  emptyText?: string;
  valueSuffix?: string;
}) {
  const maximum = Math.max(1, ...items.map((item) => item.value));

  if (items.length === 0) {
    return <p className="grid min-h-28 place-items-center text-center text-xs text-muted-foreground">{emptyText}</p>;
  }

  return (
    <div className="space-y-3">
      {items.slice(0, 8).map((item) => (
        <div key={item.label}>
          <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
            <span className="truncate font-medium text-slate-700">{item.label}</span>
            <span className="shrink-0 text-muted-foreground">
              {item.value.toLocaleString()}{valueSuffix}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-fruition-600"
              style={{ width: `${Math.max(item.value > 0 ? 3 : 0, (item.value / maximum) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

interface TrendSeries<T> {
  label: string;
  color: string;
  value: (point: T) => number;
  format?: (value: number) => string;
}

function MonthlyBars<T extends MonthPoint>({
  points,
  series,
  emptyText = "No monthly data recorded for this year.",
}: {
  points: T[];
  series: Array<TrendSeries<T>>;
  emptyText?: string;
}) {
  const values = points.flatMap((point) => series.map((item) => item.value(point)));
  const maximum = Math.max(1, ...values);
  const hasData = values.some((value) => value > 0);

  if (!hasData) {
    return <p className="grid min-h-44 place-items-center px-4 text-center text-xs text-muted-foreground">{emptyText}</p>;
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-3">
        {series.map((item) => (
          <span key={item.label} className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className={cn("size-2 rounded-full", item.color)} />
            {item.label}
          </span>
        ))}
      </div>
      <div className="overflow-x-auto pb-1">
        <div className="flex h-44 min-w-[540px] items-end gap-2 border-b border-slate-100 px-1">
          {points.map((point) => (
            <div key={point.period} className="flex h-full min-w-0 flex-1 flex-col justify-end">
              <div className="flex h-[calc(100%-1.5rem)] items-end justify-center gap-1">
                {series.map((item) => {
                  const value = item.value(point);
                  return (
                    <div
                      key={item.label}
                      title={`${point.label} ${item.label}: ${item.format?.(value) ?? value.toLocaleString()}`}
                      className={cn("w-full max-w-3 rounded-t-sm transition-opacity hover:opacity-75", item.color)}
                      style={{ height: `${Math.max(value > 0 ? 3 : 0, (value / maximum) * 100)}%` }}
                    />
                  );
                })}
              </div>
              <span className="mt-2 text-center text-[10px] text-slate-400">{point.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RestrictedPage() {
  return (
    <div className="space-y-5">
      <PageHeader title="Reports" description="Understand trends across your HR workspace." />
      <Card className="mx-auto max-w-xl">
        <CardContent className="flex flex-col items-center py-12 text-center">
          <span className="grid size-12 place-items-center rounded-2xl bg-amber-50 text-amber-700">
            <ShieldAlert className="size-5" />
          </span>
          <h2 className="mt-4 font-heading text-lg font-semibold">Reports access is restricted</h2>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Ask a company owner to add the View reports permission to your role.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export function ReportsPage() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const { data: me, isLoading: meLoading } = useMe();
  const canViewReports = me?.permissions?.includes("reports.view") ?? false;
  const report = useReportsOverview(year, canViewReports);
  const years = Array.from({ length: 5 }, (_, index) => currentYear - index);

  if (meLoading) return <PageLoader label="Preparing reports..." />;
  if (!canViewReports) return <RestrictedPage />;

  const data = report.data;
  const hiddenSections = data ? Object.values(data.access).filter((allowed) => !allowed).length : 0;
  const availableSections = data ? Object.values(data.access).filter(Boolean).length : 0;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Reports"
        description="Review workforce, attendance, leave, payroll, performance, and hiring trends from one place."
        actions={
          <label className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Reporting year</span>
            <select
              aria-label="Reporting year"
              value={year}
              onChange={(event) => setYear(Number(event.target.value))}
              className="h-9 rounded-lg border border-border bg-background px-3 text-sm font-medium outline-none focus:border-fruition-400 focus:ring-2 focus:ring-fruition-500/20"
            >
              {years.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>
        }
      />

      {report.isLoading ? (
        <PageLoader label={`Building ${year} reports...`} />
      ) : report.isError || !data ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BarChart3 className="mx-auto size-7 text-destructive" />
            <p className="mt-3 font-medium">Reports could not be loaded.</p>
            <p className="mt-1 text-sm text-muted-foreground">Refresh the page to try again.</p>
          </CardContent>
        </Card>
      ) : availableSections === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12 text-center">
            <LockKeyhole className="size-7 text-muted-foreground" />
            <p className="mt-3 font-medium">No report sections are available yet.</p>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              Reports access does not override private module access. Ask an owner to grant access to the source modules you need.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-fruition-100 bg-fruition-50/50 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-fruition-900">{year} reporting overview</p>
              <p className="mt-0.5 text-xs text-fruition-800/70">
                Generated from live workspace records. Attendance includes finalized periods only.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{availableSections} sections available</Badge>
              {hiddenSections > 0 && <Badge variant="secondary">{hiddenSections} hidden by access</Badge>}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {data.workforce && (
              <MetricCard
                label="Current workforce"
                value={data.workforce.total.toLocaleString()}
                detail={`${data.workforce.new_hires} hires · ${data.workforce.exits} exits in ${year}`}
                icon={Users}
                tone="bg-fruition-50 text-fruition-700"
              />
            )}
            {data.attendance && (
              <MetricCard
                label="Attendance rate"
                value={data.attendance.attendance_rate === null ? "—" : `${data.attendance.attendance_rate}%`}
                detail={`${data.attendance.finalized_periods} finalized month${data.attendance.finalized_periods === 1 ? "" : "s"}`}
                icon={CalendarCheck2}
                tone="bg-blue-50 text-blue-700"
              />
            )}
            {data.leave && (
              <MetricCard
                label="Approved leave"
                value={`${data.leave.approved_days.toLocaleString()} days`}
                detail={`${data.leave.requests} requests · ${data.leave.pending} pending`}
                icon={CalendarDays}
                tone="bg-amber-50 text-amber-700"
              />
            )}
            {data.payroll && (
              <MetricCard
                label="Net payroll"
                value={<MoneyText kobo={data.payroll.total_net} />}
                detail={`${data.payroll.completed_runs} completed payroll run${data.payroll.completed_runs === 1 ? "" : "s"}`}
                icon={Banknote}
                tone="bg-violet-50 text-violet-700"
              />
            )}
            {data.performance && (
              <MetricCard
                label="Average performance"
                value={data.performance.average_score_basis_points === null ? "—" : `${data.performance.average_score_basis_points / 100}%`}
                detail={`${data.performance.results} finalized result${data.performance.results === 1 ? "" : "s"}`}
                icon={Gauge}
                tone="bg-cyan-50 text-cyan-700"
              />
            )}
            {data.recruitment && (
              <MetricCard
                label="Applications"
                value={data.recruitment.applications.toLocaleString()}
                detail={`${data.recruitment.hired} hired · ${data.recruitment.open_vacancies} vacancies open`}
                icon={BriefcaseBusiness}
                tone="bg-rose-50 text-rose-700"
              />
            )}
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            {data.workforce && (
              <ReportPanel
                title="Workforce movement"
                description={`Hiring, exits, and current department distribution in ${year}`}
                icon={Users}
                href="/employees"
              >
                <div className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(220px,0.65fr)]">
                  <MonthlyBars
                    points={data.workforce.movement_by_month}
                    series={[
                      { label: "Hires", color: "bg-fruition-600", value: (point) => point.hires },
                      { label: "Exits", color: "bg-rose-400", value: (point) => point.exits },
                    ]}
                  />
                  <div>
                    <p className="mb-3 text-xs font-semibold text-slate-700">Current headcount by department</p>
                    <BarList items={data.workforce.by_department} />
                  </div>
                </div>
              </ReportPanel>
            )}

            {data.attendance && (
              <ReportPanel
                title="Attendance consistency"
                description="Present and absent days from finalized monthly attendance"
                icon={CalendarCheck2}
                href="/attendance"
              >
                <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <SummaryStat label="Present days" value={data.attendance.present_days.toLocaleString()} />
                  <SummaryStat label="Absent days" value={data.attendance.absent_days.toLocaleString()} />
                  <SummaryStat label="Late days" value={data.attendance.late_days.toLocaleString()} />
                  <SummaryStat label="Overtime" value={`${Math.round(data.attendance.overtime_minutes / 60)} hrs`} />
                </div>
                <MonthlyBars
                  points={data.attendance.by_period}
                  series={[
                    { label: "Present", color: "bg-blue-600", value: (point) => point.present },
                    { label: "Absent", color: "bg-rose-400", value: (point) => point.absent },
                  ]}
                  emptyText="Finalize monthly attendance to populate this report."
                />
              </ReportPanel>
            )}

            {data.leave && (
              <ReportPanel
                title="Leave utilization"
                description="Approved leave days and the most-used leave types"
                icon={CalendarDays}
                href="/leave"
              >
                <div className="grid gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(220px,0.75fr)]">
                  <MonthlyBars
                    points={data.leave.by_month}
                    series={[{ label: "Approved days", color: "bg-amber-500", value: (point) => point.days }]}
                  />
                  <div>
                    <p className="mb-3 text-xs font-semibold text-slate-700">Approved days by leave type</p>
                    <BarList items={data.leave.by_type.map((item) => ({ label: item.label, value: item.days }))} valueSuffix=" days" />
                  </div>
                </div>
              </ReportPanel>
            )}

            {data.payroll && (
              <ReportPanel
                title="Payroll cost trend"
                description="Completed payroll only; drafts and reversals are excluded"
                icon={Banknote}
                href="/payroll"
              >
                <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <SummaryStat label="Gross pay" value={<MoneyText kobo={data.payroll.total_gross} />} />
                  <SummaryStat label="Net pay" value={<MoneyText kobo={data.payroll.total_net} />} />
                  <SummaryStat label="Statutory" value={<MoneyText kobo={data.payroll.total_statutory} />} />
                  <SummaryStat label="Employer cost" value={<MoneyText kobo={data.payroll.total_employer_cost} />} />
                </div>
                <MonthlyBars
                  points={data.payroll.by_period}
                  series={[
                    { label: "Gross", color: "bg-violet-500", value: (point) => point.gross, format: (value) => `₦${(value / 100).toLocaleString()}` },
                    { label: "Net", color: "bg-fruition-600", value: (point) => point.net, format: (value) => `₦${(value / 100).toLocaleString()}` },
                  ]}
                  emptyText="Completed payroll runs will appear here."
                />
              </ReportPanel>
            )}

            {data.performance && (
              <ReportPanel
                title="Performance outcomes"
                description="Finalized appraisal scores and grade distribution"
                icon={Gauge}
                href="/performance"
              >
                <div className="grid gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(220px,0.75fr)]">
                  <MonthlyBars
                    points={data.performance.by_month}
                    series={[{
                      label: "Average score",
                      color: "bg-cyan-600",
                      value: (point) => (point.average_score_basis_points ?? 0) / 100,
                      format: (value) => `${value}%`,
                    }]}
                    emptyText="Finalized appraisal results will appear here."
                  />
                  <div>
                    <p className="mb-3 text-xs font-semibold text-slate-700">Results by grade</p>
                    <BarList items={data.performance.by_grade} />
                  </div>
                </div>
              </ReportPanel>
            )}

            {data.recruitment && (
              <ReportPanel
                title="Recruitment funnel"
                description="Candidate volume, hiring outcomes, and current pipeline stages"
                icon={BriefcaseBusiness}
                href="/recruitment"
              >
                <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <SummaryStat label="Applications" value={data.recruitment.applications.toLocaleString()} />
                  <SummaryStat label="Hired" value={data.recruitment.hired.toLocaleString()} />
                  <SummaryStat label="Hire rate" value={data.recruitment.hire_rate === null ? "—" : `${data.recruitment.hire_rate}%`} />
                  <SummaryStat label="Open positions" value={data.recruitment.open_positions.toLocaleString()} />
                </div>
                <div className="grid gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(220px,0.75fr)]">
                  <MonthlyBars
                    points={data.recruitment.by_month}
                    series={[
                      { label: "Applications", color: "bg-rose-500", value: (point) => point.applications },
                      { label: "Hired", color: "bg-fruition-600", value: (point) => point.hired },
                    ]}
                  />
                  <div>
                    <p className="mb-3 text-xs font-semibold text-slate-700">Current pipeline</p>
                    <BarList items={data.recruitment.by_stage} />
                  </div>
                </div>
              </ReportPanel>
            )}
          </div>
        </>
      )}
    </div>
  );
}
