import { notFound } from "next/navigation";

import { ReportAnalysisPage } from "@/features/reports/report-analysis-page";
import { isReportModule } from "@/features/reports/types";
import type { ReportAnalysisQueryFilters } from "@/features/reports/use-reports";

interface ReportAnalysisRouteProps {
  params: Promise<{ module: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function singleValue(value: string | string[] | undefined): string | undefined {
  return typeof value === "string" && value !== "" ? value : undefined;
}

export default async function ReportAnalysisRoute({ params, searchParams }: ReportAnalysisRouteProps) {
  const [{ module }, query] = await Promise.all([params, searchParams]);
  if (!isReportModule(module)) notFound();

  const currentYear = new Date().getFullYear();
  const requestedYear = Number(singleValue(query.year));
  const initialYear = Number.isInteger(requestedYear) && requestedYear >= 2000 && requestedYear <= currentYear
    ? requestedYear
    : currentYear;
  const initialFilters: ReportAnalysisQueryFilters = {
    department_id: singleValue(query.department_id),
    period: singleValue(query.period),
    status: singleValue(query.status),
    stage: singleValue(query.stage),
  };
  const viewKey = [
    module,
    initialYear,
    initialFilters.department_id ?? "",
    initialFilters.period ?? "",
    initialFilters.status ?? "",
    initialFilters.stage ?? "",
  ].join(":");

  return <ReportAnalysisPage key={viewKey} module={module} initialYear={initialYear} initialFilters={initialFilters} />;
}
