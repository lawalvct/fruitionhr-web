"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";
import type { ReportsOverview } from "./types";

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
