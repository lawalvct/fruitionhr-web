"use client";

import axios from "axios";
import {
  ArrowLeft,
  ArrowUpRight,
  Banknote,
  BarChart3,
  BriefcaseBusiness,
  CalendarCheck2,
  CalendarDays,
  ChevronRight,
  FilterX,
  Gauge,
  LockKeyhole,
  RefreshCw,
  ShieldAlert,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type CSSProperties, type ReactNode } from "react";

import { PageHeader } from "@/components/page-header";
import { PageLoader } from "@/components/page-loader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useMe } from "@/features/auth/use-auth";
import { cn } from "@/lib/utils";
import { ReportExportControls } from "./report-export-controls";
import type {
  ReportAnalysisDataset,
  ReportAnalysisMetric,
  ReportModule,
  ReportRecord,
  ReportScalar,
  ReportValueFormat,
} from "./types";
import { useReportAnalysis, type ReportAnalysisQueryFilters } from "./use-reports";

interface ModuleConfig {
  label: string;
  description: string;
  sourceHref: string;
  sourceLabel: string;
  icon: LucideIcon;
  iconTone: string;
  accent: string;
}

const MODULE_CONFIG: Record<ReportModule, ModuleConfig> = {
  workforce: {
    label: "Workforce",
    description: "Analyse headcount, employee movement, demographics, and department distribution.",
    sourceHref: "/employees",
    sourceLabel: "Manage employees",
    icon: Users,
    iconTone: "bg-fruition-50 text-fruition-700",
    accent: "bg-fruition-600",
  },
  attendance: {
    label: "Attendance",
    description: "Review attendance consistency, punctuality, absence, and overtime patterns.",
    sourceHref: "/attendance",
    sourceLabel: "Open attendance",
    icon: CalendarCheck2,
    iconTone: "bg-blue-50 text-blue-700",
    accent: "bg-blue-600",
  },
  leave: {
    label: "Leave",
    description: "Understand leave demand, approval outcomes, utilisation, and seasonal trends.",
    sourceHref: "/leave",
    sourceLabel: "Manage leave",
    icon: CalendarDays,
    iconTone: "bg-amber-50 text-amber-700",
    accent: "bg-amber-500",
  },
  payroll: {
    label: "Payroll",
    description: "Examine completed payroll costs, employee payments, deductions, and statutory totals.",
    sourceHref: "/payroll",
    sourceLabel: "Open payroll",
    icon: Banknote,
    iconTone: "bg-violet-50 text-violet-700",
    accent: "bg-violet-600",
  },
  performance: {
    label: "Performance",
    description: "Explore finalized appraisal scores, grade distribution, and performance outcomes.",
    sourceHref: "/performance",
    sourceLabel: "Open performance",
    icon: Gauge,
    iconTone: "bg-cyan-50 text-cyan-700",
    accent: "bg-cyan-600",
  },
  recruitment: {
    label: "Recruitment",
    description: "Follow candidate volume, pipeline conversion, hiring outcomes, and application sources.",
    sourceHref: "/recruitment",
    sourceLabel: "Open recruitment",
    icon: BriefcaseBusiness,
    iconTone: "bg-rose-50 text-rose-700",
    accent: "bg-rose-500",
  },
};

const FILTER_DEFINITIONS = {
  departments: { appliedKey: "department_id", label: "Department", allLabel: "All departments" },
  periods: { appliedKey: "period", label: "Period", allLabel: "All periods" },
  statuses: { appliedKey: "status", label: "Status", allLabel: "All statuses" },
  stages: { appliedKey: "stage", label: "Stage", allLabel: "All stages" },
} as const;

const SERIES_STYLES = [
  { bar: "bg-fruition-600", swatch: "bg-fruition-600", hex: "#059669" },
  { bar: "bg-blue-500", swatch: "bg-blue-500", hex: "#3b82f6" },
  { bar: "bg-amber-400", swatch: "bg-amber-400", hex: "#fbbf24" },
  { bar: "bg-violet-500", swatch: "bg-violet-500", hex: "#8b5cf6" },
  { bar: "bg-rose-400", swatch: "bg-rose-400", hex: "#fb7185" },
  { bar: "bg-cyan-500", swatch: "bg-cyan-500", hex: "#06b6d4" },
] as const;

const METRIC_TONES = [
  "bg-fruition-50 text-fruition-700",
  "bg-blue-50 text-blue-700",
  "bg-amber-50 text-amber-700",
  "bg-violet-50 text-violet-700",
] as const;

function toNumber(value: ReportScalar | undefined): number {
  const numeric = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric : 0;
}

function headline(value: string): string {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatDate(value: string | number, withTime: boolean): string {
  const source = typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? `${value}T00:00:00`
    : value;
  const date = new Date(source);
  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(date);
}

function formatValue(value: ReportScalar | undefined, format: ReportValueFormat): string {
  if (value === null || value === undefined || value === "") return "—";

  if (format === "money") {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 2,
    }).format(toNumber(value) / 100);
  }
  if (format === "number") return toNumber(value).toLocaleString("en-NG");
  if (format === "percent") return `${toNumber(value).toLocaleString("en-NG", { maximumFractionDigits: 2 })}%`;
  if (format === "basis_points") return `${(toNumber(value) / 100).toLocaleString("en-NG", { maximumFractionDigits: 2 })}%`;
  if (format === "minutes") {
    const minutes = Math.round(toNumber(value));
    const hours = Math.floor(minutes / 60);
    const remainder = Math.abs(minutes % 60);
    return hours === 0 ? `${remainder} min` : `${hours} hr${hours === 1 ? "" : "s"} ${remainder} min`;
  }
  if (format === "date" || format === "datetime") return formatDate(value as string | number, format === "datetime");
  if (format === "status") return headline(String(value));
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

function MetricCard({ metric, index, icon: Icon }: { metric: ReportAnalysisMetric; index: number; icon: LucideIcon }) {
  return (
    <Card size="sm" className="relative">
      <span className="absolute inset-x-0 top-0 h-0.5 bg-fruition-500/80" />
      <CardContent className="flex items-start justify-between gap-4 pt-1">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">{metric.label}</p>
          <p className="mt-1 break-words text-2xl font-semibold tracking-tight text-slate-950">
            {formatValue(metric.value, metric.format)}
          </p>
          {metric.hint && <p className="mt-1.5 text-xs leading-5 text-muted-foreground">{metric.hint}</p>}
        </div>
        <span className={cn("grid size-9 shrink-0 place-items-center rounded-xl", METRIC_TONES[index % METRIC_TONES.length])}>
          <Icon className="size-4" aria-hidden="true" />
        </span>
      </CardContent>
    </Card>
  );
}

function EmptyChart() {
  return (
    <div className="grid min-h-52 place-items-center rounded-xl border border-dashed bg-slate-50/60 px-5 text-center">
      <div>
        <BarChart3 className="mx-auto size-6 text-slate-300" aria-hidden="true" />
        <p className="mt-2 text-sm font-medium text-slate-700">No activity for these filters</p>
        <p className="mt-1 text-xs text-muted-foreground">Try another period or remove a filter.</p>
      </div>
    </div>
  );
}

function BarOrTrendChart({ dataset }: { dataset: ReportAnalysisDataset }) {
  const values = dataset.data.flatMap((row) => dataset.series.map((series) => Math.abs(toNumber(row[series.key]))));
  const maximum = Math.max(1, ...values);
  const hasData = values.some((value) => value > 0);

  if (dataset.data.length === 0 || !hasData) return <EmptyChart />;

  const chartSummary = dataset.data
    .slice(0, 12)
    .map((row) => {
      const label = formatValue(row[dataset.x_key], "text");
      const valuesText = dataset.series.map((series) => `${series.label} ${formatValue(row[series.key], series.format)}`).join(", ");
      return `${label}: ${valuesText}`;
    })
    .join("; ");

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-x-4 gap-y-2">
        {dataset.series.map((series, index) => (
          <span key={series.key} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className={cn("size-2 rounded-full", SERIES_STYLES[index % SERIES_STYLES.length].swatch)} />
            {series.label}
          </span>
        ))}
      </div>
      <p className="sr-only">{chartSummary}</p>
      <div className="overflow-x-auto pb-2" role="img" aria-label={`${dataset.title}. ${chartSummary}`}>
        <div
          className="flex h-56 items-end gap-3 border-b border-slate-200 bg-[linear-gradient(to_bottom,transparent_24%,rgb(226_232_240/.65)_25%,transparent_26%,transparent_49%,rgb(226_232_240/.65)_50%,transparent_51%,transparent_74%,rgb(226_232_240/.65)_75%,transparent_76%)] px-2 pt-4"
          style={{ minWidth: `${Math.max(560, dataset.data.length * 76)}px` }}
        >
          {dataset.data.map((row, rowIndex) => {
            const xValue = formatValue(row[dataset.x_key], "text");
            return (
              <div key={`${xValue}-${rowIndex}`} className="flex h-full min-w-0 flex-1 flex-col justify-end">
                <div className="flex h-[calc(100%-2rem)] items-end justify-center gap-1">
                  {dataset.series.map((series, seriesIndex) => {
                    const value = Math.abs(toNumber(row[series.key]));
                    const style = SERIES_STYLES[seriesIndex % SERIES_STYLES.length];
                    return (
                      <div
                        key={series.key}
                        className={cn(
                          "relative w-full max-w-5 rounded-t transition-opacity hover:opacity-80",
                          dataset.type === "line" && "max-w-2 rounded-full",
                          style.bar,
                        )}
                        style={{ height: `${Math.max(value > 0 ? 3 : 0, (value / maximum) * 100)}%` }}
                        title={`${xValue}, ${series.label}: ${formatValue(row[series.key], series.format)}`}
                        aria-label={`${xValue}, ${series.label}: ${formatValue(row[series.key], series.format)}`}
                      >
                        {dataset.type === "line" && value > 0 && (
                          <span className={cn("absolute -top-1 left-1/2 size-2.5 -translate-x-1/2 rounded-full ring-2 ring-white", style.swatch)} />
                        )}
                      </div>
                    );
                  })}
                </div>
                <span className="mt-2 truncate px-0.5 text-center text-[10px] text-slate-500" title={xValue}>{xValue}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function DonutChart({ dataset }: { dataset: ReportAnalysisDataset }) {
  const series = dataset.series[0];
  if (!series || dataset.data.length === 0) return <EmptyChart />;

  const entries = dataset.data.map((row, index) => ({
    label: formatValue(row[dataset.x_key], "text"),
    value: Math.max(0, toNumber(row[series.key])),
    color: SERIES_STYLES[index % SERIES_STYLES.length].hex,
  }));
  const total = entries.reduce((sum, entry) => sum + entry.value, 0);
  if (total <= 0) return <EmptyChart />;

  const stops = entries.map((entry, index) => {
    const start = entries.slice(0, index).reduce((sum, current) => sum + current.value, 0) / total * 100;
    const end = start + (entry.value / total) * 100;
    return `${entry.color} ${start}% ${end}%`;
  });
  const donutStyle = { background: `conic-gradient(${stops.join(", ")})` } satisfies CSSProperties;

  return (
    <div className="grid min-h-56 items-center gap-6 sm:grid-cols-[180px_minmax(0,1fr)]">
      <div
        className="relative mx-auto size-40 rounded-full"
        style={donutStyle}
        role="img"
        aria-label={`${dataset.title}: ${entries.map((entry) => `${entry.label} ${formatValue(entry.value, series.format)}`).join(", ")}`}
      >
        <div className="absolute inset-8 grid place-items-center rounded-full bg-card text-center ring-1 ring-slate-100">
          <div>
            <p className="text-xl font-semibold text-slate-950">{formatValue(total, series.format)}</p>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Total</p>
          </div>
        </div>
      </div>
      <div className="space-y-2.5">
        {entries.slice(0, 10).map((entry, index) => (
          <div key={`${entry.label}-${index}`} className="flex items-center justify-between gap-3 text-xs">
            <span className="flex min-w-0 items-center gap-2 text-slate-700">
              <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="truncate" title={entry.label}>{entry.label}</span>
            </span>
            <span className="shrink-0 font-medium text-slate-900">{formatValue(entry.value, series.format)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DatasetCard({ dataset }: { dataset: ReportAnalysisDataset }) {
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>{dataset.title}</CardTitle>
        <CardDescription>{dataset.data.length.toLocaleString()} data point{dataset.data.length === 1 ? "" : "s"}</CardDescription>
        <CardAction>
          <Badge variant="outline">{dataset.type === "donut" ? "Distribution" : dataset.type === "line" ? "Trend" : "Comparison"}</Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="pt-2">
        {dataset.type === "donut" ? <DonutChart dataset={dataset} /> : <BarOrTrendChart dataset={dataset} />}
      </CardContent>
    </Card>
  );
}

function StatusCell({ value }: { value: ReportScalar | undefined }) {
  if (value === null || value === undefined || value === "") return <span className="text-muted-foreground">—</span>;
  return <Badge variant="secondary">{headline(String(value))}</Badge>;
}

function ReportTable({ title, columns, rows, meta }: {
  title: string;
  columns: Array<{ key: string; label: string; format: ReportValueFormat }>;
  rows: ReportRecord[];
  meta: { count: number; limit: number; limited: boolean };
}) {
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          {rows.length === 0
            ? "No underlying records match the current filters."
            : meta.limited
              ? `Showing the first ${rows.length.toLocaleString()} of ${meta.count.toLocaleString()} records.`
              : `${meta.count.toLocaleString()} record${meta.count === 1 ? "" : "s"} in this analysis.`}
        </CardDescription>
        {meta.limited && <CardAction><Badge variant="outline">Preview limited to {meta.limit.toLocaleString()}</Badge></CardAction>}
      </CardHeader>
      <CardContent className="px-0">
        {columns.length === 0 || rows.length === 0 ? (
          <div className="grid min-h-40 place-items-center px-5 text-center">
            <div>
              <BarChart3 className="mx-auto size-6 text-slate-300" aria-hidden="true" />
              <p className="mt-2 text-sm font-medium text-slate-700">No records to display</p>
              <p className="mt-1 text-xs text-muted-foreground">Adjust the report filters to broaden the analysis.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm" style={{ minWidth: `${Math.max(680, columns.length * 150)}px` }}>
              <caption className="sr-only">{title}</caption>
              <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                <tr>
                  {columns.map((column) => (
                    <th key={column.key} scope="col" className="border-b px-4 py-3 font-semibold">{column.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, rowIndex) => (
                  <tr key={rowIndex} className="border-b last:border-b-0 hover:bg-slate-50/70">
                    {columns.map((column) => (
                      <td key={column.key} className="max-w-72 px-4 py-3 align-middle text-slate-700 first:font-medium first:text-slate-900">
                        {column.format === "status"
                          ? <StatusCell value={row[column.key]} />
                          : <span className="break-words">{formatValue(row[column.key], column.format)}</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StateCard({
  title,
  description,
  icon: Icon,
  actions,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  actions?: ReactNode;
}) {
  return (
    <Card className="mx-auto max-w-xl">
      <CardContent className="flex flex-col items-center py-12 text-center">
        <span className="grid size-12 place-items-center rounded-2xl bg-amber-50 text-amber-700">
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <h2 className="mt-4 font-heading text-lg font-semibold">{title}</h2>
        <p className="mt-1 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
        {actions && <div className="mt-5 flex flex-wrap justify-center gap-2">{actions}</div>}
      </CardContent>
    </Card>
  );
}

interface ReportAnalysisPageProps {
  module: ReportModule;
  initialYear: number;
  initialFilters?: ReportAnalysisQueryFilters;
}

export function ReportAnalysisPage({ module, initialYear, initialFilters = {} }: ReportAnalysisPageProps) {
  const router = useRouter();
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(initialYear);
  const [filters, setFilters] = useState<ReportAnalysisQueryFilters>(initialFilters);
  const { data: me, isLoading: meLoading } = useMe();
  const canViewReports = Boolean(me?.is_super_admin || me?.permissions?.includes("reports.view"));
  const report = useReportAnalysis(module, year, filters, canViewReports);
  const config = MODULE_CONFIG[module];
  const Icon = config.icon;
  const years = Array.from({ length: currentYear - 2000 + 1 }, (_, index) => currentYear - index);

  function updateUrl(nextYear: number, nextFilters: ReportAnalysisQueryFilters) {
    const params = new URLSearchParams({ year: String(nextYear) });
    Object.entries(nextFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== "") params.set(key, String(value));
    });
    router.replace(`/reports/${module}?${params.toString()}`, { scroll: false });
  }

  function changeYear(nextYear: number) {
    setYear(nextYear);
    setFilters({});
    updateUrl(nextYear, {});
  }

  function changeFilter(key: string, value: string) {
    const nextFilters = { ...filters, [key]: value || undefined };
    setFilters(nextFilters);
    updateUrl(year, nextFilters);
  }

  function clearFilters() {
    setFilters({});
    updateUrl(year, {});
  }

  const hasFilters = Object.values(filters).some((value) => value !== undefined && value !== "");
  const responseStatus = axios.isAxiosError(report.error) ? report.error.response?.status : undefined;

  if (meLoading) return <PageLoader label="Preparing report..." />;

  return (
    <div className="space-y-5">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Link href="/reports" className="rounded-sm hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fruition-500/30">Reports</Link>
        <ChevronRight className="size-3.5" aria-hidden="true" />
        <span aria-current="page" className="font-medium text-foreground">{config.label}</span>
      </nav>

      <PageHeader
        title={`${config.label} report`}
        description={config.description}
        actions={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <label className="flex h-8 items-center gap-2 rounded-lg border border-border bg-background px-2.5 text-xs">
              <span className="text-muted-foreground">Year</span>
              <select
                aria-label="Reporting year"
                value={year}
                onChange={(event) => changeYear(Number(event.target.value))}
                className="bg-transparent font-semibold outline-none"
              >
                {years.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </label>
            {canViewReports && report.data && (
              <ReportExportControls module={module} year={year} filters={filters} />
            )}
          </div>
        }
      />

      {!canViewReports ? (
        <StateCard
          title="Reports access is restricted"
          description="Ask a company owner to add the View reports permission to your role before opening this analysis."
          icon={ShieldAlert}
          actions={<Button variant="outline" render={<Link href="/reports" />}><ArrowLeft /> Back to reports</Button>}
        />
      ) : report.isLoading ? (
        <PageLoader label={`Building the ${config.label.toLowerCase()} analysis...`} />
      ) : responseStatus === 403 ? (
        <StateCard
          title={`${config.label} analysis is restricted`}
          description="Your Reports permission does not override access to this module's private data. Ask an owner to grant the relevant module permission."
          icon={LockKeyhole}
          actions={<Button variant="outline" render={<Link href="/reports" />}><ArrowLeft /> Back to reports</Button>}
        />
      ) : report.isError || !report.data ? (
        <StateCard
          title="This analysis could not be loaded"
          description="There was a problem preparing this report. Try again, or return to the reports overview."
          icon={BarChart3}
          actions={
            <>
              <Button onClick={() => void report.refetch()} disabled={report.isFetching}>
                <RefreshCw className={cn(report.isFetching && "animate-spin")} /> Retry
              </Button>
              <Button variant="outline" render={<Link href="/reports" />}>Back to reports</Button>
            </>
          }
        />
      ) : (
        <>
          <section className="flex flex-col gap-4 rounded-2xl border border-fruition-100 bg-gradient-to-r from-fruition-50/80 to-white p-4 sm:flex-row sm:items-center sm:justify-between" aria-label="Report context">
            <div className="flex min-w-0 items-start gap-3">
              <span className={cn("grid size-11 shrink-0 place-items-center rounded-xl", config.iconTone)}>
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-heading text-base font-semibold text-slate-950">{report.data.title}</p>
                  <Badge variant="outline">{report.data.year}</Badge>
                  {report.isFetching && <Badge variant="secondary"><RefreshCw className="animate-spin" /> Updating</Badge>}
                </div>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Generated {formatDate(report.data.generated_at, true)} from live workspace records.
                </p>
              </div>
            </div>
            <Button size="sm" variant="outline" render={<Link href={config.sourceHref} />}>
              {config.sourceLabel} <ArrowUpRight />
            </Button>
          </section>

          {Object.entries(report.data.filters.available).some(([, options]) => options && options.length > 0) && (
            <Card size="sm">
              <CardContent className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
                <div className="flex items-center gap-2 self-start pb-1 text-xs font-semibold text-slate-700 sm:self-end">
                  <BarChart3 className="size-4 text-fruition-700" aria-hidden="true" />
                  Refine analysis
                </div>
                {(Object.keys(FILTER_DEFINITIONS) as Array<keyof typeof FILTER_DEFINITIONS>).map((availableKey) => {
                  const options = report.data.filters.available[availableKey];
                  if (!options || options.length === 0) return null;
                  const definition = FILTER_DEFINITIONS[availableKey];
                  return (
                    <label key={availableKey} className="min-w-40 flex-1 sm:max-w-56">
                      <span className="mb-1 block text-[11px] font-medium text-muted-foreground">{definition.label}</span>
                      <select
                        aria-label={`Filter by ${definition.label.toLowerCase()}`}
                        value={filters[definition.appliedKey] ?? ""}
                        onChange={(event) => changeFilter(definition.appliedKey, event.target.value)}
                        className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-fruition-400 focus:ring-2 focus:ring-fruition-500/20"
                      >
                        <option value="">{definition.allLabel}</option>
                        {options.map((option) => <option key={String(option.value)} value={option.value}>{option.label}</option>)}
                      </select>
                    </label>
                  );
                })}
                {hasFilters && (
                  <Button type="button" variant="ghost" size="sm" onClick={clearFilters} className="self-start sm:self-end">
                    <FilterX /> Clear filters
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {report.data.metrics.length > 0 && (
            <section aria-labelledby="report-highlights" className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 id="report-highlights" className="font-heading text-base font-semibold text-slate-950">Key indicators</h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">A quick reading of the selected report period.</p>
                </div>
                <TrendingUp className="size-4 text-fruition-700" aria-hidden="true" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {report.data.metrics.map((metric, index) => <MetricCard key={metric.key} metric={metric} index={index} icon={Icon} />)}
              </div>
            </section>
          )}

          <section aria-labelledby="report-analysis" className="space-y-3">
            <div>
              <h2 id="report-analysis" className="font-heading text-base font-semibold text-slate-950">Trends and breakdowns</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">Compare changes and distributions within the selected scope.</p>
            </div>
            {report.data.datasets.length === 0 ? (
              <Card><CardContent><EmptyChart /></CardContent></Card>
            ) : (
              <div className="grid gap-4 xl:grid-cols-2">
                {report.data.datasets.map((dataset) => <DatasetCard key={dataset.key} dataset={dataset} />)}
              </div>
            )}
          </section>

          <section aria-labelledby="report-records" className="space-y-3">
            <div>
              <h2 id="report-records" className="font-heading text-base font-semibold text-slate-950">Underlying data</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">Review the records used to build this analysis or export them for further work.</p>
            </div>
            <ReportTable {...report.data.table} />
          </section>
        </>
      )}
    </div>
  );
}
