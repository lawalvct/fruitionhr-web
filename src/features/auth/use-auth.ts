"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import axios from "axios";

import { api, ensureCsrf } from "@/lib/api";
import type { LoginInput, Me, RegisterInput } from "@/types/auth";

export const ME_QUERY_KEY = ["me"] as const;

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

export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async () => {
      await api.post("/api/v1/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(ME_QUERY_KEY, null);
      queryClient.clear();
      router.replace("/login");
    },
  });
}

/** True when the current user holds the permission (owner role has all). */
export function useCan(permission: string): boolean {
  const { data: me } = useMe();
  return me?.permissions?.includes(permission) ?? false;
}
