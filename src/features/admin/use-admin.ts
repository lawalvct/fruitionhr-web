"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { api, ensureCsrf } from "@/lib/api";
import type {
  AdminDashboard,
  AdminTenantDetail,
  AdminTenantSummary,
  AdministratorCreateInput,
  AdministratorListQuery,
  AdministratorUpdateInput,
  PaginatedResponse,
  PlatformActivity,
  PlatformAdministrator,
  TenantListQuery,
  TenantUpdateInput,
} from "./types";

const ADMIN_API = "/api/admin/v1";

interface ResourceResponse<TData> {
  data: TData;
}

export const adminKeys = {
  all: ["admin"] as const,
  dashboard: ["admin", "dashboard"] as const,
  tenants: ["admin", "tenants"] as const,
  tenantList: (query: TenantListQuery) => ["admin", "tenants", "list", query] as const,
  tenant: (id: number | string) => ["admin", "tenants", String(id)] as const,
  administrators: ["admin", "administrators"] as const,
  administratorList: (query: AdministratorListQuery) =>
    ["admin", "administrators", "list", query] as const,
  activity: (page: number) => ["admin", "activity", page] as const,
};

export function useAdminDashboard() {
  return useQuery({
    queryKey: adminKeys.dashboard,
    queryFn: async () => {
      const { data } = await api.get<ResourceResponse<AdminDashboard>>(`${ADMIN_API}/dashboard`);
      return data.data;
    },
  });
}

export function useAdminTenants(query: TenantListQuery) {
  return useQuery({
    queryKey: adminKeys.tenantList(query),
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<AdminTenantSummary>>(`${ADMIN_API}/tenants`, {
        params: {
          page: query.page,
          search: query.search || undefined,
          status: query.status || undefined,
          onboarding_status: query.onboarding_status || undefined,
          sort: query.sort || undefined,
          per_page: 15,
        },
      });
      return data;
    },
    placeholderData: keepPreviousData,
  });
}

export function useAdminTenant(id: number | string) {
  return useQuery({
    queryKey: adminKeys.tenant(id),
    enabled: String(id).length > 0,
    queryFn: async () => {
      const { data } = await api.get<ResourceResponse<AdminTenantDetail>>(`${ADMIN_API}/tenants/${id}`);
      return data.data;
    },
  });
}

export function useUpdateAdminTenant(id: number | string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: TenantUpdateInput) => {
      await ensureCsrf();
      const { data } = await api.put<ResourceResponse<AdminTenantDetail>>(`${ADMIN_API}/tenants/${id}`, input);
      return data.data;
    },
    onSuccess: (tenant) => {
      queryClient.setQueryData(adminKeys.tenant(id), tenant);
      queryClient.invalidateQueries({ queryKey: adminKeys.tenants });
      queryClient.invalidateQueries({ queryKey: adminKeys.dashboard });
    },
  });
}

export function useSuspendTenant(id: number | string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reason: string) => {
      await ensureCsrf();
      const { data } = await api.post<ResourceResponse<AdminTenantDetail>>(
        `${ADMIN_API}/tenants/${id}/suspend`,
        { reason },
      );
      return data.data;
    },
    onSuccess: (tenant) => {
      queryClient.setQueryData(adminKeys.tenant(id), tenant);
      queryClient.invalidateQueries({ queryKey: adminKeys.tenants });
      queryClient.invalidateQueries({ queryKey: adminKeys.dashboard });
      queryClient.invalidateQueries({ queryKey: ["admin", "activity"] });
    },
  });
}

export function useActivateTenant(id: number | string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await ensureCsrf();
      const { data } = await api.post<ResourceResponse<AdminTenantDetail>>(
        `${ADMIN_API}/tenants/${id}/activate`,
      );
      return data.data;
    },
    onSuccess: (tenant) => {
      queryClient.setQueryData(adminKeys.tenant(id), tenant);
      queryClient.invalidateQueries({ queryKey: adminKeys.tenants });
      queryClient.invalidateQueries({ queryKey: adminKeys.dashboard });
      queryClient.invalidateQueries({ queryKey: ["admin", "activity"] });
    },
  });
}

export function useAdministrators(query: AdministratorListQuery) {
  return useQuery({
    queryKey: adminKeys.administratorList(query),
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<PlatformAdministrator>>(
        `${ADMIN_API}/administrators`,
        {
          params: {
            page: query.page,
            search: query.search || undefined,
            status: query.status || undefined,
            sort: query.sort || undefined,
            per_page: 15,
          },
        },
      );
      return data;
    },
    placeholderData: keepPreviousData,
  });
}

export function useCreateAdministrator() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: AdministratorCreateInput) => {
      await ensureCsrf();
      const { data } = await api.post<ResourceResponse<PlatformAdministrator>>(
        `${ADMIN_API}/administrators`,
        input,
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.administrators });
      queryClient.invalidateQueries({ queryKey: adminKeys.dashboard });
      queryClient.invalidateQueries({ queryKey: ["admin", "activity"] });
    },
  });
}

export function useUpdateAdministrator(id: number | string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: AdministratorUpdateInput) => {
      await ensureCsrf();
      const { data } = await api.put<ResourceResponse<PlatformAdministrator>>(
        `${ADMIN_API}/administrators/${id}`,
        input,
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.administrators });
      queryClient.invalidateQueries({ queryKey: ["admin", "activity"] });
    },
  });
}

export function useDisableAdministrator(id: number | string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reason: string) => {
      await ensureCsrf();
      const { data } = await api.post<ResourceResponse<PlatformAdministrator>>(
        `${ADMIN_API}/administrators/${id}/disable`,
        { reason },
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.administrators });
      queryClient.invalidateQueries({ queryKey: adminKeys.dashboard });
      queryClient.invalidateQueries({ queryKey: ["admin", "activity"] });
    },
  });
}

export function useActivateAdministrator(id: number | string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await ensureCsrf();
      const { data } = await api.post<ResourceResponse<PlatformAdministrator>>(
        `${ADMIN_API}/administrators/${id}/activate`,
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.administrators });
      queryClient.invalidateQueries({ queryKey: adminKeys.dashboard });
      queryClient.invalidateQueries({ queryKey: ["admin", "activity"] });
    },
  });
}

export function usePlatformActivity(page: number) {
  return useQuery({
    queryKey: adminKeys.activity(page),
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<PlatformActivity>>(`${ADMIN_API}/activity`, {
        params: { page, per_page: 20, sort: "-created_at" },
      });
      return data;
    },
    placeholderData: keepPreviousData,
  });
}
