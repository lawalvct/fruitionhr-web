"use client";

import Link from "next/link";
import { ArrowUpDown, Building2, ChevronRight, Search, Users } from "lucide-react";
import { useEffect, useState } from "react";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AdminPagination,
  AdminStatusBadge,
  formatAdminDate,
  Identity,
  QueryErrorState,
} from "./admin-ui";
import type { OnboardingStatus, TenantStatus } from "./types";
import { useAdminTenants } from "./use-admin";

const selectClass =
  "h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-700 outline-none focus:border-fruition-400 focus:ring-2 focus:ring-fruition-500/15";

export function TenantsPage() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<TenantStatus | "">("");
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus | "">("");
  const [sort, setSort] = useState("-created_at");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const tenants = useAdminTenants({
    page,
    search,
    status,
    onboarding_status: onboardingStatus,
    sort,
  });
  const rows = tenants.data?.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Companies"
        description="Review every FruitionHR workspace, follow onboarding, and manage company access without entering tenant data."
      />

      <Card className="border-slate-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <CardContent className="p-0">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search company, slug, or email"
                aria-label="Search companies"
                className="pl-9"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value as TenantStatus | "");
                  setPage(1);
                }}
                className={selectClass}
                aria-label="Filter companies by status"
              >
                <option value="">All statuses</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <select
                value={onboardingStatus}
                onChange={(event) => {
                  setOnboardingStatus(event.target.value as OnboardingStatus | "");
                  setPage(1);
                }}
                className={selectClass}
                aria-label="Filter companies by onboarding status"
              >
                <option value="">All onboarding</option>
                <option value="not_started">Not started</option>
                <option value="in_progress">In progress</option>
                <option value="completed">Completed</option>
                <option value="skipped">Skipped</option>
              </select>
              <label className="relative">
                <ArrowUpDown className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
                <select
                  value={sort}
                  onChange={(event) => {
                    setSort(event.target.value);
                    setPage(1);
                  }}
                  className={`${selectClass} pl-8`}
                  aria-label="Sort companies"
                >
                  <option value="-created_at">Newest first</option>
                  <option value="created_at">Oldest first</option>
                  <option value="name">Name A–Z</option>
                  <option value="-name">Name Z–A</option>
                  <option value="trial_ends_at">Trial ending first</option>
                  <option value="status">Status</option>
                </select>
              </label>
            </div>
          </div>

          {tenants.isError ? (
            <div className="p-4">
              <QueryErrorState title="Companies could not be loaded" onRetry={() => void tenants.refetch()} />
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="min-w-[980px] w-full border-collapse text-sm">
                  <thead className="bg-slate-50/80 text-left text-[11px] tracking-wide text-slate-500 uppercase">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Company</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold">Onboarding</th>
                      <th className="px-4 py-3 font-semibold">Users</th>
                      <th className="px-4 py-3 font-semibold">Trial ends</th>
                      <th className="px-4 py-3 font-semibold">Created</th>
                      <th className="px-4 py-3"><span className="sr-only">Actions</span></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {tenants.isLoading
                      ? Array.from({ length: 6 }).map((_, index) => (
                          <tr key={index}>
                            {Array.from({ length: 7 }).map((__, cell) => (
                              <td key={cell} className="px-4 py-4"><Skeleton className="h-5 w-full max-w-36" /></td>
                            ))}
                          </tr>
                        ))
                      : rows.map((tenant) => (
                          <tr key={tenant.id} className="transition-colors hover:bg-slate-50/70">
                            <td className="px-4 py-3.5">
                              <Link href={`/tenants/${tenant.id}`} className="hover:underline">
                                <Identity name={tenant.name} detail={tenant.email} />
                              </Link>
                            </td>
                            <td className="px-4 py-3.5"><AdminStatusBadge status={tenant.status} /></td>
                            <td className="px-4 py-3.5"><AdminStatusBadge status={tenant.onboarding_status} /></td>
                            <td className="px-4 py-3.5">
                              <span className="inline-flex items-center gap-1.5 font-medium text-slate-700">
                                <Users className="size-3.5 text-slate-400" /> {tenant.users_count}
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-4 py-3.5 text-slate-600">{formatAdminDate(tenant.trial_ends_at)}</td>
                            <td className="whitespace-nowrap px-4 py-3.5 text-slate-600">{formatAdminDate(tenant.created_at)}</td>
                            <td className="px-4 py-3.5 text-right">
                              <Button variant="ghost" size="icon" aria-label={`Open ${tenant.name}`} render={<Link href={`/tenants/${tenant.id}`} />}>
                                <ChevronRight className="size-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                  </tbody>
                </table>
              </div>

              <div className="divide-y divide-slate-100 md:hidden">
                {tenants.isLoading
                  ? Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="m-4 h-28" />)
                  : rows.map((tenant) => (
                      <Link key={tenant.id} href={`/tenants/${tenant.id}`} className="block p-4 transition-colors hover:bg-slate-50">
                        <div className="flex items-start justify-between gap-3">
                          <Identity name={tenant.name} detail={tenant.email} />
                          <ChevronRight className="mt-2 size-4 shrink-0 text-slate-300" />
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <AdminStatusBadge status={tenant.status} />
                          <AdminStatusBadge status={tenant.onboarding_status} />
                          <span className="ml-auto text-xs text-slate-500">{tenant.users_count} users</span>
                        </div>
                      </Link>
                    ))}
              </div>

              {!tenants.isLoading && rows.length === 0 && (
                <div className="grid min-h-64 place-items-center p-6 text-center">
                  <div>
                    <span className="mx-auto grid size-11 place-items-center rounded-xl bg-slate-100 text-slate-500">
                      <Building2 className="size-5" />
                    </span>
                    <p className="mt-3 text-sm font-semibold text-slate-900">No companies found</p>
                    <p className="mt-1 text-xs text-slate-500">Try changing the search or filters.</p>
                  </div>
                </div>
              )}

              <AdminPagination meta={tenants.data?.meta} isFetching={tenants.isFetching} onPageChange={setPage} />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
