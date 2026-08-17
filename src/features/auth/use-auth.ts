"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

import { api, ensureCsrf } from "@/lib/api";
import type { LoginInput, Me, RegisterInput } from "@/types/auth";
import { adminHomeDestination } from "@/features/admin/admin-access";
import { tenantHomeDestination } from "./access-destinations";

export const ME_QUERY_KEY = ["me"] as const;

export function authDestination(me: Me): string {
  if (!me.is_email_verified) return "/verify-email";

  // Platform staff land in the admin console, on the first section their role
  // can reach — a blog editor has no Overview to be sent to.
  if (me.is_super_admin) return adminHomeDestination(me);

  const onboarding = me.tenant?.onboarding_status;
  if (me.roles?.includes("owner") && onboarding !== "completed" && onboarding !== "skipped") {
    return "/onboarding";
  }

  return tenantHomeDestination(me);
}

async function fetchMe(): Promise<Me | null> {
  try {
    const { data } = await api.get<{ data: Me }>("/api/v1/me");
    return data.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      return null; // guest
    }
    throw error;
  }
}

export function useMe() {
  return useQuery({
    queryKey: ME_QUERY_KEY,
    queryFn: fetchMe,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: LoginInput) => {
      await ensureCsrf();
      const { data } = await api.post<{ data: Me }>("/api/v1/login", input);
      return data.data;
    },
    onSuccess: (me) => {
      queryClient.setQueryData(ME_QUERY_KEY, me);
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: RegisterInput) => {
      await ensureCsrf();
      const { data } = await api.post<{ data: Me }>("/api/v1/register", input);
      return data.data;
    },
    onSuccess: (me) => {
      queryClient.setQueryData(ME_QUERY_KEY, me);
    },
  });
}

export function useVerifyEmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (code: string) => {
      await ensureCsrf();
      const { data } = await api.post<{ data: Me }>("/api/v1/email/verify", { code });
      return data.data;
    },
    onSuccess: (me) => queryClient.setQueryData(ME_QUERY_KEY, me),
  });
}

export function useResendVerificationCode() {
  return useMutation({
    mutationFn: async () => {
      await ensureCsrf();
      await api.post("/api/v1/email/resend");
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  const finishLogout = () => {
    queryClient.setQueryData(ME_QUERY_KEY, null);
    queryClient.clear();
    // Hard navigation guarantees a clean slate and respects host-based routing
    // (the proxy rewrites /login to the correct surface).
    if (typeof window !== "undefined") {
      window.location.assign("/login");
    }
  };

  return useMutation({
    mutationFn: async () => {
      // Invalidate the server session. Even if this fails (expired session,
      // network), we still complete the logout locally below.
      try {
        await ensureCsrf();
        await api.post("/api/v1/logout");
      } catch {
        // ignore — client-side logout still proceeds
      }
    },
    onSuccess: finishLogout,
    onError: finishLogout,
  });
}

/** True when the current user holds the permission (owner role has all). */
export function useCan(permission: string): boolean {
  const { data: me } = useMe();
  return me?.permissions?.includes(permission) ?? false;
}
