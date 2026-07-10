"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api, ensureCsrf } from "@/lib/api";
import type { Branch, Department, EmploymentType, JobGrade, Position } from "@/features/company/types";

interface CollectionResponse<TData> {
  data: TData[];
}

export const companyKeys = {
  branches: ["company", "branches"] as const,
  departments: ["company", "departments"] as const,
  positions: ["company", "positions"] as const,
  jobGrades: ["company", "job-grades"] as const,
  employmentTypes: ["company", "employment-types"] as const,
  holidayCalendars: ["company", "holiday-calendars"] as const,
};

export function useCompanyOptions() {
  const branches = useQuery({
    queryKey: [...companyKeys.branches, "options"],
    queryFn: async () => {
      const { data } = await api.get<CollectionResponse<Branch>>("/api/v1/branches", {
        params: { per_page: 100, sort: "name" },
      });
      return data.data;
    },
  });

  const departments = useQuery({
    queryKey: [...companyKeys.departments, "options"],
    queryFn: async () => {
      const { data } = await api.get<CollectionResponse<Department>>("/api/v1/departments", {
        params: { per_page: 100, sort: "name" },
      });
      return data.data;
    },
  });

  const jobGrades = useQuery({
    queryKey: [...companyKeys.jobGrades, "options"],
    queryFn: async () => {
      const { data } = await api.get<CollectionResponse<JobGrade>>("/api/v1/job-grades", {
        params: { per_page: 100, sort: "level" },
      });
      return data.data;
    },
  });

  const positions = useQuery({
    queryKey: [...companyKeys.positions, "options"],
    queryFn: async () => {
      const { data } = await api.get<CollectionResponse<Position>>("/api/v1/positions", {
        params: { per_page: 100, sort: "title" },
      });
      return data.data;
    },
  });

  const employmentTypes = useQuery({
    queryKey: [...companyKeys.employmentTypes, "options"],
    queryFn: async () => {
      const { data } = await api.get<CollectionResponse<EmploymentType>>("/api/v1/employment-types", {
        params: { per_page: 100, sort: "name" },
      });
      return data.data;
    },
  });

  return { branches, departments, positions, jobGrades, employmentTypes };
}

export function useCreateCompanyResource<TInput>(endpoint: string, queryKey: readonly unknown[]) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: TInput) => {
      await ensureCsrf();
      const { data } = await api.post(endpoint, input);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ["company"] });
    },
  });
}

export function useUpdateCompanyResource<TInput>(endpoint: string, queryKey: readonly unknown[]) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, input }: { id: number; input: TInput }) => {
      await ensureCsrf();
      const { data } = await api.put(`${endpoint}/${id}`, input);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ["company"] });
    },
  });
}

export function useDeleteCompanyResource(endpoint: string, queryKey: readonly unknown[]) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await ensureCsrf();
      await api.delete(`${endpoint}/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ["company"] });
    },
  });
}
