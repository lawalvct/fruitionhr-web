"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";
import type {
  ApplicationQuery,
  PlatformApplication,
  PlatformVacancy,
  RecruitmentSummary,
  VacancyQuery,
} from "./recruitment-types";
import type { PaginatedResponse } from "./types";

const ADMIN_API = "/api/admin/v1";

type VacancyResponse = PaginatedResponse<PlatformVacancy> & { summary: RecruitmentSummary };

export const recruitmentKeys = {
  all: ["admin", "recruitment"] as const,
  vacancies: (query: VacancyQuery) => ["admin", "recruitment", "vacancies", query] as const,
  applications: (query: ApplicationQuery) =>
    ["admin", "recruitment", "applications", query] as const,
};

export function usePlatformVacancies(query: VacancyQuery) {
  return useQuery({
    queryKey: recruitmentKeys.vacancies(query),
    queryFn: async () => {
      const { data } = await api.get<VacancyResponse>(`${ADMIN_API}/recruitment/vacancies`, {
        params: {
          page: query.page,
          search: query.search || undefined,
          status: query.status || undefined,
        },
      });
      return data;
    },
    placeholderData: keepPreviousData,
  });
}

export function usePlatformApplications(query: ApplicationQuery) {
  return useQuery({
    queryKey: recruitmentKeys.applications(query),
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<PlatformApplication>>(
        `${ADMIN_API}/recruitment/applications`,
        {
          params: {
            page: query.page,
            search: query.search || undefined,
            stage: query.stage || undefined,
          },
        },
      );
      return data;
    },
    placeholderData: keepPreviousData,
  });
}
