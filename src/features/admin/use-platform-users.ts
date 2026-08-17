"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api, ensureCsrf } from "@/lib/api";
import type { PaginatedResponse } from "./types";
import type { PlatformUser, PlatformUserQuery, PlatformUserSummary } from "./user-types";

const ADMIN_API = "/api/admin/v1";

type UserResponse = PaginatedResponse<PlatformUser> & { summary: PlatformUserSummary };

export const platformUserKeys = {
  all: ["admin", "users"] as const,
  list: (query: PlatformUserQuery) => ["admin", "users", "list", query] as const,
};

export function usePlatformUsers(query: PlatformUserQuery) {
  return useQuery({
    queryKey: platformUserKeys.list(query),
    queryFn: async () => {
      const { data } = await api.get<UserResponse>(`${ADMIN_API}/users`, {
        params: {
          page: query.page,
          search: query.search || undefined,
          status: query.status || undefined,
          type: query.type || undefined,
          // Omit entirely when unset so the API does not read it as "false".
          verified: query.verified === "" ? undefined : query.verified,
          tenant_id: query.tenant_id,
        },
      });
      return data;
    },
    placeholderData: keepPreviousData,
  });
}

export function useVerifyUserEmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await ensureCsrf();
      const { data } = await api.post<{ data: PlatformUser }>(
        `${ADMIN_API}/users/${id}/verify-email`,
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: platformUserKeys.all });
      queryClient.invalidateQueries({ queryKey: ["admin", "activity"] });
    },
  });
}

/**
 * Issues a temporary password and emails it to the user. The password is never
 * returned to the browser — only the confirmation message is.
 */
export function useResetUserPassword() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await ensureCsrf();
      const { data } = await api.post<{ data: PlatformUser; message: string }>(
        `${ADMIN_API}/users/${id}/reset-password`,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: platformUserKeys.all });
      queryClient.invalidateQueries({ queryKey: ["admin", "activity"] });
    },
  });
}
