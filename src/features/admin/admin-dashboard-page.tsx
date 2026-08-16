"use client";

import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Building2,
  CalendarClock,
  ChevronRight,
  CircleAlert,
  ShieldCheck,
  UserCog,
  Users,
} from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AdminMetricCard,
  AdminStatusBadge,
  DistributionList,
  formatAdminDate,
  humanize,
  Identity,
  MiniBarChart,
  QueryErrorState,
} from "./admin-ui";
import { useAdminDashboard } from "./use-admin";

function DashboardSkeleton() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-44 rounded-2xl" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => <Skeleton key={item} className="h-36 rounded-xl" />)}
      </div>
      <div className="grid gap-4 xl:grid-cols-12">
        <Skeleton className="h-80 rounded-xl xl:col-span-7" />
        <Skeleton className="h-80 rounded-xl xl:col-span-5" />
      </div>
    </div>
  );
}

export function AdminDashboardPage() {
  const dashboard = useAdminDashboard();

  if (dashboard.isLoading) return <DashboardSkeleton />;
  if (dashboard.isError || !dashboard.data) {
    return <QueryErrorState title="The platform overview is unavailable" onRetry={() => void dashboard.refetch()} />;
  }

  const data = dashboard.data;
  const metrics = data.metrics;
  const activationRate = metrics.tenants_total
    ? Math.round((metrics.tenants_active / metrics.tenants_total) * 100)
    : 0;
  const onboardingRate = metrics.tenants_total
    ? Math.round((metrics.onboarding_completed / metrics.tenants_total) * 100)
    : 0;
  const needsAttention = metrics.tenants_suspended + metrics.trials_ending_soon;

  return (
    <div className="space-y-5 xl:space-y-6">
      <PageHeader
        title="Platform overview"
        description="Monitor company growth, onboarding, platform access, and the administrative actions that keep FruitionHR running."
        actions={
          <Button render={<Link href="/administrators" />}>
            <UserCog className="size-4" /> Manage administrators
          </Button>
        }
      />

      <section className="relative overflow-hidden rounded-2xl bg-linear-135 from-fruition-950 via-fruition-800 to-emerald-500 px-5 py-6 text-white shadow-[0_12px_32px_rgba(2,44,34,0.18)] sm:px-7 sm:py-7">
        <div className="absolute -right-16 -top-20 size-64 rounded-full border border-white/10 bg-white/5" aria-hidden="true" />
        <div className="absolute -bottom-28 right-24 size-56 rounded-full border border-white/10" aria-hidden="true" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-bold tracking-[0.16em] text-emerald-200 uppercase">Platform command centre</p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">Your companies, clearly in view.</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-emerald-50/75">
              {metrics.tenants_active} active companies serve {metrics.tenant_users_total.toLocaleString("en-NG")} users across the platform.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white"
              render={<Link href="/activity" />}
            >
              <Activity className="size-4" /> View activity
            </Button>
            <Button className="bg-white text-fruition-900 hover:bg-emerald-50" render={<Link href="/tenants" />}>
              Companies <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminMetricCard
          label="Companies"
          value={metrics.tenants_total.toLocaleString("en-NG")}
          detail={`${metrics.tenants_active} active · ${activationRate}% activation`}
          icon={Building2}
          tone="green"
        />
        <AdminMetricCard
          label="Tenant users"
          value={metrics.tenant_users_total.toLocaleString("en-NG")}
          detail="People with access across every company"
          icon={Users}
          tone="blue"
        />
        <AdminMetricCard
          label="Administrators"
          value={metrics.administrators_total.toLocaleString("en-NG")}
          detail="FruitionHR platform operators"
          icon={ShieldCheck}
          tone="violet"
        />
        <AdminMetricCard
          label="Needs attention"
          value={needsAttention.toLocaleString("en-NG")}
          detail={`${metrics.tenants_suspended} suspended · ${metrics.trials_ending_soon} trials ending`}
          icon={CircleAlert}
          tone="amber"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        <Card className="border-slate-200/80 xl:col-span-7">
          <CardHeader className="border-b border-slate-100">
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="text-base">Company growth</CardTitle>
                <p className="mt-1 text-xs text-slate-500">New companies added over the last six months</p>
              </div>
              <Building2 className="size-4 text-slate-400" />
            </div>
          </CardHeader>
          <CardContent className="pt-5">
            <MiniBarChart points={data.company_growth} />
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 xl:col-span-5">
          <CardHeader className="border-b border-slate-100">
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="text-base">Company lifecycle</CardTitle>
                <p className="mt-1 text-xs text-slate-500">Current status across the platform</p>
              </div>
              <span className="text-xs font-semibold text-fruition-700">{activationRate}% active</span>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <DistributionList points={data.status_distribution} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        <Card className="border-slate-200/80 xl:col-span-4">
          <CardHeader className="border-b border-slate-100">
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="text-base">Onboarding progress</CardTitle>
                <p className="mt-1 text-xs text-slate-500">How far companies have progressed</p>
              </div>
              <span className="text-xs font-semibold text-fruition-700">{onboardingRate}% complete</span>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <DistributionList points={data.onboarding_distribution} />
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 xl:col-span-4">
          <CardHeader className="border-b border-slate-100">
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="text-base">Newest companies</CardTitle>
                <p className="mt-1 text-xs text-slate-500">Recently created workspaces</p>
              </div>
              <Link href="/tenants" className="text-xs font-semibold text-fruition-700 hover:underline">View all</Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {data.recent_tenants.length === 0 ? (
              <p className="px-5 py-12 text-center text-sm text-slate-500">No companies have been created yet.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {data.recent_tenants.slice(0, 5).map((tenant) => (
                  <li key={tenant.id}>
                    <Link href={`/tenants/${tenant.id}`} className="group flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50">
                      <Identity name={tenant.name} detail={`${tenant.users_count} users · ${formatAdminDate(tenant.created_at)}`} />
                      <span className="ml-auto flex shrink-0 items-center gap-2">
                        <AdminStatusBadge status={tenant.status} />
                        <ChevronRight className="size-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-fruition-700" />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 xl:col-span-4">
          <CardHeader className="border-b border-slate-100">
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="text-base">Administrative activity</CardTitle>
                <p className="mt-1 text-xs text-slate-500">Latest privileged platform actions</p>
              </div>
              <Link href="/activity" className="text-xs font-semibold text-fruition-700 hover:underline">View log</Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {data.recent_activity.length === 0 ? (
              <p className="px-5 py-12 text-center text-sm text-slate-500">Administrative actions will appear here.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {data.recent_activity.slice(0, 5).map((item) => (
                  <li key={item.id} className="flex items-start gap-3 px-5 py-3.5">
                    <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-600">
                      <Activity className="size-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-800">{humanize(item.action)}</p>
                      <p className="mt-0.5 truncate text-xs text-slate-500">
                        {item.actor?.name ?? "System"}{item.subject?.label ? ` · ${item.subject.label}` : ""}
                      </p>
                    </div>
                    <span className="shrink-0 text-[10px] text-slate-400">{formatAdminDate(item.created_at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <p className="flex items-center justify-end gap-1.5 text-[11px] text-slate-400">
        <CalendarClock className="size-3" /> Updated {formatAdminDate(data.generated_at, true)}
      </p>
    </div>
  );
}
