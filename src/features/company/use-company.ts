"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";

import { ME_QUERY_KEY } from "@/features/auth/use-auth";
import { api, ensureCsrf } from "@/lib/api";
import type { Branch, Department, EmploymentType, JobGrade, Position } from "@/features/company/types";
import type { Me } from "@/types/auth";

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

export function useCompanyOptions(departmentId?: number | null) {
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
    queryKey: [...companyKeys.positions, "options", departmentId ?? "all"],
    queryFn: async () => {
      const { data } = await api.get<CollectionResponse<Position>>("/api/v1/positions", {
        params: {
          per_page: 100,
          sort: "title",
          ...(departmentId ? { "filter[department_id]": departmentId } : {}),
        },
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

const LOGO_KEY = ["company", "logo"] as const;

function setTenantLogoUrl(queryClient: ReturnType<typeof useQueryClient>, logoUrl: string | null) {
  queryClient.setQueryData<Me | null>(ME_QUERY_KEY, (me) =>
    me?.tenant ? { ...me, tenant: { ...me.tenant, logo_url: logoUrl } } : me,
  );
  queryClient.invalidateQueries({ queryKey: LOGO_KEY });
}

/** Upload the tenant's logo (JPG/PNG/WebP, ≤2 MB). Requires company.manage. */
export function useUploadCompanyLogo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      await ensureCsrf();
      const form = new FormData();
      form.append("logo", file);
      const { data } = await api.post<{ data: { logo_url: string | null } }>("/api/v1/company/logo", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data.data.logo_url;
    },
    onSuccess: (logoUrl) => setTenantLogoUrl(queryClient, logoUrl),
  });
}

/** Remove the tenant's logo. Requires company.manage. */
export function useDeleteCompanyLogo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await ensureCsrf();
      const { data } = await api.delete<{ data: { logo_url: string | null } }>("/api/v1/company/logo");
      return data.data.logo_url;
    },
    onSuccess: (logoUrl) => setTenantLogoUrl(queryClient, logoUrl),
  });
}

/**
 * Fetch the tenant logo (authenticated endpoint) as an object URL suitable
 * for <img src>. Returns null while loading or when there is no logo.
 */
export function useCompanyLogoImage(logoUrl: string | null | undefined): string | null {
  const { data: blob } = useQuery({
    queryKey: [...LOGO_KEY, logoUrl],
    enabled: Boolean(logoUrl),
    queryFn: async () => (await api.get<Blob>(logoUrl!, { responseType: "blob" })).data,
    staleTime: 5 * 60 * 1000,
  });

  const objectUrl = useMemo(() => (blob ? URL.createObjectURL(blob) : null), [blob]);

  useEffect(() => {
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [objectUrl]);

  return objectUrl;
}
