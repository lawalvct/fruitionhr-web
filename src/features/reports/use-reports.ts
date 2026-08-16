"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";
import type { ReportAnalysis, ReportModule, ReportsOverview } from "./types";

export function useReportsOverview(year: number, enabled = true) {
  return useQuery({
    queryKey: ["reports", "overview", year],
    enabled,
    queryFn: async () => {
      const { data } = await api.get<{ data: ReportsOverview }>("/api/v1/reports/overview", {
        params: { year },
      });
      return data.data;
    },
  });
}

export type ReportAnalysisQueryFilters = Record<string, string | number | undefined>;

export function useReportAnalysis(
  module: ReportModule,
  year: number,
  filters: ReportAnalysisQueryFilters,
  enabled = true,
) {
  return useQuery({
    queryKey: ["reports", "analysis", module, year, filters],
    enabled,
    queryFn: async () => {
      const query: ReportAnalysisQueryFilters = { year, ...filters };
      const params = Object.fromEntries(
        Object.entries(query).filter(([, value]) => value !== undefined && value !== ""),
      );
      const { data } = await api.get<{ data: ReportAnalysis }>(`/api/v1/reports/${module}/analysis`, {
        params,
      });
      return data.data;
    },
  });
}
