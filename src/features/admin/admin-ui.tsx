"use client";

import type { LucideIcon } from "lucide-react";
import { AlertTriangle, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";

import { FormDialog } from "@/components/form-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { DashboardSeriesPoint, PaginationMeta } from "./types";

export function humanize(value: string): string {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function formatAdminDate(value?: string | null, withTime = false): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(date);
}

export function initials(name?: string | null): string {
  return (name ?? "?")
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const statusClasses: Record<string, string> = {
  active: "border-emerald-200 bg-emerald-50 text-emerald-800",
  completed: "border-emerald-200 bg-emerald-50 text-emerald-800",
  suspended: "border-amber-200 bg-amber-50 text-amber-800",
  in_progress: "border-blue-200 bg-blue-50 text-blue-800",
  not_started: "border-slate-200 bg-slate-100 text-slate-700",
  skipped: "border-violet-200 bg-violet-50 text-violet-800",
  disabled: "border-red-200 bg-red-50 text-red-700",
  cancelled: "border-slate-300 bg-slate-100 text-slate-600",
  invited: "border-blue-200 bg-blue-50 text-blue-800",
  verified: "border-emerald-200 bg-emerald-50 text-emerald-800",
  unverified: "border-amber-200 bg-amber-50 text-amber-800",
};

export function AdminStatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant="outline"
      className={cn("h-6 border px-2 text-[11px] font-semibold capitalize", statusClasses[status])}
    >
      {humanize(status)}
    </Badge>
  );
}

const metricTones = {
  green: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  blue: "bg-blue-50 text-blue-700 ring-blue-100",
  amber: "bg-amber-50 text-amber-700 ring-amber-100",
  violet: "bg-violet-50 text-violet-700 ring-violet-100",
} as const;

export function AdminMetricCard({
  label,
  value,
  detail,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number | string;
  detail: string;
  icon: LucideIcon;
  tone: keyof typeof metricTones;
}) {
  return (
    <Card className="border-slate-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <CardContent className="flex items-start justify-between gap-4 p-5">
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">{label}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">{value}</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">{detail}</p>
        </div>
        <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl ring-1", metricTones[tone])}>
          <Icon className="size-4.5" />
        </span>
      </CardContent>
    </Card>
  );
}

export function QueryErrorState({
  title = "We could not load this information",
  onRetry,
}: {
  title?: string;
  onRetry: () => void;
}) {
  return (
    <div className="grid min-h-64 place-items-center rounded-2xl border border-dashed border-red-200 bg-red-50/40 p-6 text-center">
      <div>
        <span className="mx-auto grid size-11 place-items-center rounded-xl bg-white text-red-600 ring-1 ring-red-100">
          <AlertTriangle className="size-5" />
        </span>
        <p className="mt-3 text-sm font-semibold text-slate-900">{title}</p>
        <p className="mt-1 text-xs text-slate-500">Check the connection and try again.</p>
        <Button type="button" variant="outline" size="sm" className="mt-4" onClick={onRetry}>
          <RefreshCw className="size-3.5" /> Try again
        </Button>
      </div>
    </div>
  );
}

export function AdminPagination({
  meta,
  isFetching,
  onPageChange,
}: {
  meta?: PaginationMeta;
  isFetching: boolean;
  onPageChange: (page: number) => void;
}) {
  const current = meta?.current_page ?? 1;
  const last = meta?.last_page ?? 1;

  return (
    <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
      <span>
        {meta?.total
          ? `Showing ${meta.from ?? 0}–${meta.to ?? 0} of ${meta.total}`
          : "No records"}
      </span>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-label="Previous page"
          disabled={current <= 1 || isFetching}
          onClick={() => onPageChange(current - 1)}
        >
          <ChevronLeft className="size-3.5" /> Previous
        </Button>
        <span className="min-w-20 text-center">Page {current} of {last}</span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-label="Next page"
          disabled={current >= last || isFetching}
          onClick={() => onPageChange(current + 1)}
        >
          Next <ChevronRight className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}

export function MiniBarChart({ points }: { points: DashboardSeriesPoint[] }) {
  const maximum = Math.max(...points.map((point) => point.count), 1);

  if (!points.length) {
    return <p className="py-12 text-center text-sm text-slate-500">Growth data will appear here.</p>;
  }

  return (
    <div className="flex h-52 items-end gap-2 pt-8" role="img" aria-label="Company growth by month">
      {points.map((point, index) => {
        const height = Math.max((point.count / maximum) * 100, point.count ? 8 : 2);
        return (
          <div key={`${point.period ?? point.label}-${index}`} className="group flex h-full min-w-0 flex-1 flex-col items-center gap-2">
            <span className="text-[10px] font-semibold text-slate-500 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
              {point.count}
            </span>
            {/*
              The bar's percentage height needs a parent of definite height to
              resolve against. Without this flex-1 track the column is
              auto-height, the percentage never resolves, and every bar
              collapses to zero — the chart renders as bare axis labels.
            */}
            <span className="flex w-full flex-1 items-end justify-center">
              <span
                tabIndex={0}
                aria-label={`${point.label}: ${point.count} companies`}
                className="w-full max-w-12 rounded-t-lg bg-linear-to-t from-fruition-800 to-emerald-400 outline-none transition hover:from-fruition-700 focus-visible:ring-2 focus-visible:ring-fruition-400"
                style={{ height: `${height}%` }}
              />
            </span>
            <span className="max-w-full truncate text-[10px] font-medium text-slate-500">{point.label}</span>
          </div>
        );
      })}
    </div>
  );
}

const distributionColors = ["bg-fruition-700", "bg-emerald-400", "bg-amber-400", "bg-blue-500", "bg-violet-500"];

export function DistributionList({ points }: { points: DashboardSeriesPoint[] }) {
  const total = points.reduce((sum, point) => sum + point.count, 0);

  if (!points.length) {
    return <p className="py-10 text-center text-sm text-slate-500">No distribution data yet.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex h-2.5 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
        {points.map((point, index) => (
          <span
            key={`${point.key ?? point.status ?? point.label}-${index}`}
            className={distributionColors[index % distributionColors.length]}
            style={{ width: `${total ? (point.count / total) * 100 : 0}%` }}
          />
        ))}
      </div>
      <ul className="grid gap-2.5">
        {points.map((point, index) => (
          <li key={`${point.key ?? point.status ?? point.label}-${index}`} className="flex items-center gap-2 text-sm">
            <span className={cn("size-2.5 rounded-full", distributionColors[index % distributionColors.length])} />
            <span className="min-w-0 flex-1 truncate text-slate-600">{point.label}</span>
            <span className="font-semibold text-slate-900">{point.count}</span>
            <span className="w-9 text-right text-xs text-slate-400">
              {total ? Math.round((point.count / total) * 100) : 0}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Identity({ name, detail }: { name: string; detail?: ReactNode }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar className="size-9 shrink-0 ring-1 ring-slate-200">
        <AvatarFallback className="bg-fruition-50 text-xs font-bold text-fruition-800">
          {initials(name)}
        </AvatarFallback>
      </Avatar>
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold text-slate-900">{name}</span>
        {detail && <span className="mt-0.5 block truncate text-xs text-slate-500">{detail}</span>}
      </span>
    </div>
  );
}

export function ReasonDialog({
  open,
  onOpenChange,
  title,
  description,
  subject,
  actionLabel,
  isPending,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  subject: string;
  actionLabel: string;
  isPending: boolean;
  onConfirm: (reason: string) => Promise<void>;
}) {
  const [reason, setReason] = useState("");
  const [wasOpen, setWasOpen] = useState(open);
  const formId = useMemo(() => `reason-${actionLabel.toLowerCase().replaceAll(" ", "-")}`, [actionLabel]);

  // Clear the reason whenever the dialog closes. Adjusting during render rather
  // than in an effect avoids a cascading re-render, and unlike doing it in
  // onOpenChange it also catches the parent closing us directly after a
  // successful action (e.g. setDisabling(null)).
  if (wasOpen !== open) {
    setWasOpen(open);
    if (!open) setReason("");
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      formId={formId}
      isPending={isPending}
      submitLabel={actionLabel}
      pendingLabel="Working..."
    >
      <form
        id={formId}
        className="space-y-4 py-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (reason.trim().length >= 5) void onConfirm(reason.trim());
        }}
      >
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          This action affects <span className="font-semibold">{subject}</span> and will be recorded in the activity log.
        </div>
        <div className="space-y-1.5">
          <label htmlFor={`${formId}-input`} className="text-sm font-medium text-slate-800">
            Reason
          </label>
          <textarea
            id={`${formId}-input`}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={5}
            minLength={5}
            maxLength={500}
            required
            placeholder="Explain why this action is necessary..."
            className="w-full resize-y rounded-lg border border-input bg-white px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20"
          />
          <p className="text-xs text-slate-500">Use at least 5 characters. Do not include passwords or other secrets.</p>
        </div>
        <span className="sr-only">Submitting this form will {actionLabel.toLowerCase()} {subject}.</span>
      </form>
    </FormDialog>
  );
}
