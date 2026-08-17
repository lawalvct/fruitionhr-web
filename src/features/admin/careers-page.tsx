"use client";

import { BriefcaseBusiness, Building2, CheckCircle2, Search, Users } from "lucide-react";
import { useEffect, useState } from "react";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AdminMetricCard,
  AdminPagination,
  formatAdminDate,
  humanize,
  Identity,
  QueryErrorState,
} from "./admin-ui";
import { APPLICATION_STAGES, type VacancyStatus } from "./recruitment-types";
import { usePlatformApplications, usePlatformVacancies } from "./use-recruitment";

const selectClass =
  "h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-700 outline-none focus:border-fruition-400 focus:ring-2 focus:ring-fruition-500/15";

type Tab = "vacancies" | "applications";

/** Read-only careers oversight spanning every company on the platform. */
export function CareersPage() {
  const [tab, setTab] = useState<Tab>("vacancies");

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<VacancyStatus | "">("");
  const [stage, setStage] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const vacancies = usePlatformVacancies({ page, search, status });
  const applications = usePlatformApplications({ page, search, stage });
  const summary = vacancies.data?.summary;

  const switchTab = (next: Tab) => {
    setTab(next);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Careers"
        description="Vacancies and applications across every company hiring on FruitionHR."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminMetricCard
          label="Open vacancies"
          value={summary?.open_vacancies ?? 0}
          detail={`${summary?.total_vacancies ?? 0} posted in total`}
          icon={BriefcaseBusiness}
          tone="green"
        />
        <AdminMetricCard
          label="Applications"
          value={summary?.total_applications ?? 0}
          detail="Received across all companies"
          icon={Users}
          tone="blue"
        />
        <AdminMetricCard
          label="Hired"
          value={summary?.hired ?? 0}
          detail="Applications that reached hired"
          icon={CheckCircle2}
          tone="violet"
        />
        <AdminMetricCard
          label="Hiring companies"
          value={summary?.hiring_companies ?? 0}
          detail="Companies with at least one vacancy"
          icon={Building2}
          tone="amber"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
          {(["vacancies", "applications"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => switchTab(value)}
              className={
                tab === value
                  ? "rounded-md bg-fruition-600 px-3 py-1.5 text-sm font-semibold text-white"
                  : "rounded-md px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900"
              }
            >
              {value === "vacancies" ? "Vacancies" : "Applications"}
            </button>
          ))}
        </div>

        <div className="relative min-w-56 flex-1">
          <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder={
              tab === "vacancies" ? "Search role, location or company" : "Search applicant or role"
            }
            className="pl-8"
          />
        </div>

        {tab === "vacancies" ? (
          <select
            className={selectClass}
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as VacancyStatus | "");
              setPage(1);
            }}
          >
            <option value="">All statuses</option>
            <option value="open">Open</option>
            <option value="draft">Draft</option>
            <option value="closed">Closed</option>
          </select>
        ) : (
          <select
            className={selectClass}
            value={stage}
            onChange={(event) => {
              setStage(event.target.value);
              setPage(1);
            }}
          >
            <option value="">All stages</option>
            {APPLICATION_STAGES.map((value) => (
              <option key={value} value={value}>
                {humanize(value)}
              </option>
            ))}
          </select>
        )}
      </div>

      {tab === "vacancies" ? (
        <VacancyList query={vacancies} onPageChange={setPage} />
      ) : (
        <ApplicationList query={applications} onPageChange={setPage} />
      )}
    </div>
  );
}

function VacancyList({
  query,
  onPageChange,
}: {
  query: ReturnType<typeof usePlatformVacancies>;
  onPageChange: (page: number) => void;
}) {
  if (query.isError) {
    return <QueryErrorState title="We could not load the vacancies" onRetry={() => query.refetch()} />;
  }

  const rows = query.data?.data ?? [];

  return (
    <Card className="overflow-hidden p-0">
      <CardContent className="p-0">
        {query.isPending ? (
          <LoadingRows />
        ) : rows.length === 0 ? (
          <EmptyRows label="No vacancies match those filters" />
        ) : (
          <ul className="divide-y divide-slate-100">
            {rows.map((vacancy) => (
              <li
                key={vacancy.id}
                className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <StatusPill status={vacancy.status} />
                    <span className="truncate text-sm font-semibold text-slate-900">
                      {vacancy.title}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-xs text-slate-500">
                    {vacancy.company?.name ?? "—"}
                    {vacancy.location ? ` · ${vacancy.location}` : ""}
                    {vacancy.employment_type ? ` · ${vacancy.employment_type}` : ""}
                  </p>
                </div>
                <div className="shrink-0 text-left sm:text-right">
                  <p className="text-sm font-semibold text-slate-900">
                    {vacancy.applications_count}{" "}
                    <span className="text-xs font-normal text-slate-500">
                      application{vacancy.applications_count === 1 ? "" : "s"}
                    </span>
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    Posted {formatAdminDate(vacancy.created_at)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
        <AdminPagination
          meta={query.data?.meta}
          isFetching={query.isFetching}
          onPageChange={onPageChange}
        />
      </CardContent>
    </Card>
  );
}

function ApplicationList({
  query,
  onPageChange,
}: {
  query: ReturnType<typeof usePlatformApplications>;
  onPageChange: (page: number) => void;
}) {
  if (query.isError) {
    return (
      <QueryErrorState title="We could not load the applications" onRetry={() => query.refetch()} />
    );
  }

  const rows = query.data?.data ?? [];

  return (
    <Card className="overflow-hidden p-0">
      <CardContent className="p-0">
        {query.isPending ? (
          <LoadingRows />
        ) : rows.length === 0 ? (
          <EmptyRows label="No applications match those filters" />
        ) : (
          <ul className="divide-y divide-slate-100">
            {rows.map((application) => (
              <li
                key={application.id}
                className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <Identity
                  name={application.applicant?.name ?? "Unknown applicant"}
                  detail={application.applicant?.email ?? undefined}
                />
                <div className="min-w-0 sm:flex-1 sm:px-4">
                  <p className="truncate text-sm text-slate-900">
                    {application.vacancy?.title ?? "—"}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    {application.company?.name ?? "—"}
                  </p>
                </div>
                <div className="shrink-0 text-left sm:text-right">
                  <StagePill stage={application.stage} />
                  <p className="mt-1 text-xs text-slate-400">
                    Applied {formatAdminDate(application.applied_at)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
        <AdminPagination
          meta={query.data?.meta}
          isFetching={query.isFetching}
          onPageChange={onPageChange}
        />
      </CardContent>
    </Card>
  );
}

function StatusPill({ status }: { status: string }) {
  const tone =
    status === "open"
      ? "bg-fruition-50 text-fruition-800"
      : status === "closed"
        ? "bg-slate-100 text-slate-600"
        : "bg-amber-50 text-amber-800";

  return (
    <span
      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase ${tone}`}
    >
      {status}
    </span>
  );
}

function StagePill({ stage }: { stage: string }) {
  const tone =
    stage === "hired" || stage === "accepted"
      ? "bg-fruition-50 text-fruition-800"
      : stage === "rejected"
        ? "bg-red-50 text-red-700"
        : "bg-blue-50 text-blue-700";

  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase ${tone}`}
    >
      {humanize(stage)}
    </span>
  );
}

function LoadingRows() {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: 6 }).map((_, index) => (
        <Skeleton key={index} className="h-16 w-full rounded-xl" />
      ))}
    </div>
  );
}

function EmptyRows({ label }: { label: string }) {
  return (
    <div className="grid min-h-64 place-items-center p-6 text-center">
      <div>
        <span className="mx-auto grid size-11 place-items-center rounded-xl bg-slate-50 text-slate-400 ring-1 ring-slate-100">
          <BriefcaseBusiness className="size-5" />
        </span>
        <p className="mt-3 text-sm font-semibold text-slate-900">{label}</p>
        <p className="mt-1 text-xs text-slate-500">Try a different search or filter.</p>
      </div>
    </div>
  );
}
