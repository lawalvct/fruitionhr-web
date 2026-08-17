"use client";

import { AlertTriangle, ArrowDownRight, ArrowUpRight, CalendarClock, Repeat, Search, Sprout, Wallet } from "lucide-react";
import { useEffect, useState } from "react";

import { MoneyText } from "@/components/money-text";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminMetricCard, AdminStatusBadge, QueryErrorState, formatAdminDate } from "./admin-ui";
import type { RevenueCompany, RevenueMonth, RevenueOverview } from "./types";
import { useRevenueCompanies, useRevenueOverview } from "./use-admin";

/** Kobo → a compact axis/tooltip label. Full precision belongs in MoneyText. */
function compactNaira(kobo: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(kobo / 100);
}

export function RevenuePage() {
  const overview = useRevenueOverview(12);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Revenue"
        description="What the platform earns, which companies it comes from, and what is due to arrive next."
      />

      {overview.isError ? (
        <QueryErrorState onRetry={() => overview.refetch()} />
      ) : overview.isPending || !overview.data ? (
        <RevenueSkeleton />
      ) : (
        <>
          <Headline data={overview.data} />
          <RecurringCards data={overview.data} />
          <div className="grid gap-4 lg:grid-cols-5">
            <Card className="lg:col-span-3">
              <CardContent className="p-5">
                <h2 className="text-sm font-semibold text-slate-900">Collected each month</h2>
                <p className="mt-0.5 text-xs text-slate-500">Settled payments only — failed and pending charges are not money.</p>
                <RevenueTrend points={overview.data.monthly_trend} />
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardContent className="p-5">
                <h2 className="text-sm font-semibold text-slate-900">Where it comes from</h2>
                <p className="mt-0.5 text-xs text-slate-500">Recurring revenue by plan.</p>
                <PlanSplit data={overview.data} />
              </CardContent>
            </Card>
          </div>
        </>
      )}

      <CompanyRevenue />
    </div>
  );
}

/**
 * The two numbers the owner actually came for: what is recurring, and what
 * arrived this month. Given as hero figures rather than a chart — a single
 * number is not a bar chart.
 */
function Headline({ data }: { data: RevenueOverview }) {
  const { this_month: thisMonth, last_month: lastMonth } = data.collected;
  const delta = lastMonth > 0 ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : null;
  const up = delta !== null && delta >= 0;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Card className="border-fruition-200 bg-fruition-50/60">
        <CardContent className="p-5">
          <p className="text-xs font-semibold tracking-wide text-fruition-800 uppercase">Monthly recurring revenue</p>
          <p className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950 tabular-nums sm:text-4xl">
            <MoneyText kobo={data.recurring.mrr} />
          </p>
          <p className="mt-1.5 text-xs leading-5 text-slate-600">
            From {data.recurring.paying_companies} paying {data.recurring.paying_companies === 1 ? "company" : "companies"}
            {data.recurring.paying_companies > 0 && (
              <> · {compactNaira(data.recurring.average_per_company)} each on average</>
            )}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Collected this month</p>
          <p className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950 tabular-nums sm:text-4xl">
            <MoneyText kobo={thisMonth} />
          </p>
          <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs leading-5 text-slate-500">
            {delta === null ? (
              <>Nothing collected last month to compare against</>
            ) : (
              <>
                <span className={up ? "inline-flex items-center gap-0.5 font-semibold text-emerald-700" : "inline-flex items-center gap-0.5 font-semibold text-amber-700"}>
                  {up ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
                  {Math.abs(delta)}%
                </span>
                on last month ({compactNaira(lastMonth)})
              </>
            )}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function RecurringCards({ data }: { data: RevenueOverview }) {
  const { expected, recurring, collected } = data;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <AdminMetricCard
        label="Due in 30 days"
        value={compactNaira(expected.next_30_days)}
        detail={`${compactNaira(expected.next_90_days)} within 90 days`}
        icon={CalendarClock}
        tone="blue"
      />
      <AdminMetricCard
        label="Annual run rate"
        value={compactNaira(recurring.arr)}
        detail="Today's MRR × 12, not a forecast"
        icon={Repeat}
        tone="green"
      />
      <AdminMetricCard
        label="Trial pipeline"
        value={compactNaira(expected.trial_pipeline)}
        detail={
          expected.trials_converting_soon > 0
            ? `${expected.trials_converting_soon} trial${expected.trials_converting_soon === 1 ? "" : "s"} ending within 14 days`
            : "Worth this much if every trial converts"
        }
        icon={Sprout}
        tone="violet"
      />
      <AdminMetricCard
        label="At risk"
        value={compactNaira(expected.at_risk)}
        detail={
          expected.at_risk_companies > 0
            ? `${expected.at_risk_companies} compan${expected.at_risk_companies === 1 ? "y" : "ies"} past due — worth chasing`
            : "No overdue subscriptions"
        }
        icon={expected.at_risk > 0 ? AlertTriangle : Wallet}
        tone="amber"
      />
      <p className="sr-only">Collected all time: {compactNaira(collected.all_time)}</p>
    </div>
  );
}

/**
 * Twelve months of collected revenue.
 *
 * One series, so one colour and no legend — the heading names it. Bars are
 * anchored at zero (a truncated baseline would exaggerate every movement), and
 * the value appears on hover rather than above every bar.
 */
function RevenueTrend({ points }: { points: RevenueMonth[] }) {
  const maximum = Math.max(...points.map((point) => point.amount), 1);
  const peak = points.reduce((best, point) => (point.amount > best.amount ? point : best), points[0]);

  if (points.every((point) => point.amount === 0)) {
    return (
      <p className="py-16 text-center text-sm text-slate-500">
        No payments settled yet. Revenue will appear here as companies subscribe.
      </p>
    );
  }

  return (
    <div className="mt-5 flex h-56 items-end gap-2" role="img" aria-label="Revenue collected by month">
      {points.map((point) => {
        // Zero-height bars still get a sliver so the month reads as present-but-empty.
        const height = point.amount > 0 ? Math.max((point.amount / maximum) * 100, 6) : 2;
        const isPeak = point.period === peak?.period && point.amount > 0;

        return (
          <div key={point.period} className="group flex h-full min-w-0 flex-1 flex-col items-center gap-2">
            <span
              className={
                isPeak
                  ? "text-[10px] font-semibold text-slate-600 tabular-nums"
                  : "text-[10px] font-semibold text-slate-600 tabular-nums opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100"
              }
            >
              {point.amount > 0 ? compactNaira(point.amount) : ""}
            </span>
            {/*
              The bar's percentage height needs a parent of definite height to
              resolve against, so it sits in this flex-1 track rather than
              directly in the column — where it would collapse to nothing.
            */}
            <span className="flex w-full flex-1 items-end justify-center">
              <span
                tabIndex={0}
                aria-label={`${point.label}: ${compactNaira(point.amount)} from ${point.payments} payment${point.payments === 1 ? "" : "s"}`}
                className="w-full max-w-12 rounded-t bg-linear-to-t from-fruition-800 to-emerald-400 outline-none transition hover:from-fruition-700 focus-visible:ring-2 focus-visible:ring-fruition-400"
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

/** A table, not a pie — these values are close enough that slices would be unreadable. */
function PlanSplit({ data }: { data: RevenueOverview }) {
  if (data.by_plan.length === 0) {
    return <p className="py-16 text-center text-sm text-slate-500">No active subscriptions yet.</p>;
  }

  return (
    <ul className="mt-5 space-y-3">
      {data.by_plan.map((slice) => {
        const share = data.recurring.mrr > 0 ? Math.round((slice.mrr / data.recurring.mrr) * 100) : 0;

        return (
          <li key={slice.plan}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="truncate text-sm font-medium text-slate-900">{slice.plan}</span>
              <span className="shrink-0 text-sm font-semibold text-slate-900 tabular-nums">
                <MoneyText kobo={slice.mrr} />
              </span>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-fruition-700" style={{ width: `${share}%` }} />
            </div>
            <p className="mt-1 text-xs text-slate-500 tabular-nums">
              {share}% · {slice.companies} {slice.companies === 1 ? "company" : "companies"} · {slice.employees} employees
            </p>
          </li>
        );
      })}
    </ul>
  );
}

function CompanyRevenue() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [payingOnly, setPayingOnly] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const companies = useRevenueCompanies({
    search: search || undefined,
    paying_only: payingOnly || undefined,
  });
  const rows = companies.data?.data ?? [];

  return (
    <Card>
      <CardContent className="p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Revenue by company</h2>
            <p className="mt-0.5 text-xs text-slate-500">Biggest payers first, by money actually settled.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 text-xs text-slate-600">
              <input
                type="checkbox"
                className="size-3.5 accent-fruition-700"
                checked={payingOnly}
                onChange={(event) => setPayingOnly(event.target.checked)}
              />
              Paying only
            </label>
            <div className="relative min-w-52">
              <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search companies"
                className="h-8 pl-8"
              />
            </div>
          </div>
        </div>

        {companies.isPending ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <p className="py-16 text-center text-sm text-slate-500">
            {search ? "No companies match that search." : "No paying companies yet."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/80 text-left text-[11px] tracking-wide text-slate-500 uppercase">
                <tr>
                  <th className="px-4 py-3 font-semibold">Company</th>
                  <th className="px-4 py-3 font-semibold">Plan</th>
                  <th className="px-4 py-3 text-right font-semibold">Per period</th>
                  <th className="px-4 py-3 text-right font-semibold">Collected</th>
                  <th className="px-4 py-3 font-semibold">Renews</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((company) => (
                  <CompanyRow key={company.id} company={company} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CompanyRow({ company }: { company: RevenueCompany }) {
  const subscription = company.subscription;

  return (
    <tr className="transition-colors hover:bg-slate-50/70">
      <td className="px-4 py-3.5">
        <span className="block font-medium text-slate-900">{company.name}</span>
        <span className="text-xs text-slate-500 tabular-nums">
          {company.payments_count} payment{company.payments_count === 1 ? "" : "s"} · since{" "}
          {formatAdminDate(company.customer_since)}
        </span>
      </td>
      <td className="px-4 py-3.5">
        {subscription ? (
          <span className="flex flex-wrap items-center gap-1.5">
            <span className="text-slate-700">{subscription.plan ?? "—"}</span>
            <AdminStatusBadge status={subscription.status} />
          </span>
        ) : (
          <span className="text-slate-400">No subscription</span>
        )}
      </td>
      <td className="px-4 py-3.5 text-right text-slate-700 tabular-nums">
        {subscription ? <MoneyText kobo={subscription.amount} /> : "—"}
      </td>
      <td className="px-4 py-3.5 text-right font-semibold text-slate-900 tabular-nums">
        <MoneyText kobo={company.collected} />
      </td>
      <td className="px-4 py-3.5 whitespace-nowrap text-slate-600">
        {subscription?.is_earning && subscription.renews_at ? formatAdminDate(subscription.renews_at) : "—"}
      </td>
    </tr>
  );
}

function RevenueSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-28 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-72 rounded-xl" />
    </div>
  );
}
