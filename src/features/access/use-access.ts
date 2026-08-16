"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ME_QUERY_KEY } from "@/features/auth/use-auth";
import { api, ensureCsrf } from "@/lib/api";
import type { AccessRole, AccessUser, PermissionGroup, RoleInput } from "./types";

const ACCESS_QUERY_KEY = ["access"] as const;

export function useAccessRoles(enabled = true) {
  return useQuery({
    queryKey: [...ACCESS_QUERY_KEY, "roles"],
    queryFn: async () => {
      const { data } = await api.get<{ data: AccessRole[] }>("/api/v1/access/roles");
      return data.data;
    },
    enabled,
  });
}

export function usePermissionGroups(enabled = true) {
  return useQuery({
    queryKey: [...ACCESS_QUERY_KEY, "permissions"],
    queryFn: async () => {
      const { data } = await api.get<{ data: PermissionGroup[] }>("/api/v1/access/permissions");
      return data.data;
    },
    enabled,
    staleTime: 10 * 60 * 1000,
  });
}

export function useAccessUsers(enabled = true) {
  return useQuery({
    queryKey: [...ACCESS_QUERY_KEY, "users"],
    queryFn: async () => {
      const { data } = await api.get<{ data: AccessUser[] }>("/api/v1/access/users");
      return data.data;
    },
    enabled,
  });
}

export function useCreateAccessRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: RoleInput) => {
      await ensureCsrf();
      const { data } = await api.post<{ data: AccessRole }>("/api/v1/access/roles", input);
      return data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ACCESS_QUERY_KEY }),
  });
}

export function useUpdateAccessRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, input }: { id: number; input: RoleInput }) => {
      await ensureCsrf();
      const { data } = await api.put<{ data: AccessRole }>(`/api/v1/access/roles/${id}`, input);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ACCESS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY });
    },
  });
}

export function useDeleteAccessRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await ensureCsrf();
      await api.delete(`/api/v1/access/roles/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ACCESS_QUERY_KEY }),
  });
}

export function useSyncUserRoles() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, roleIds }: { userId: number; roleIds: number[] }) => {
      await ensureCsrf();
      const { data } = await api.put<{ data: AccessUser }>(`/api/v1/access/users/${userId}/roles`, {
        role_ids: roleIds,
      });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ACCESS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY });
    },
  });
}
