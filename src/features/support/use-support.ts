"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api, ensureCsrf } from "@/lib/api";
import type { SupportTicket } from "./types";

const API = "/api/v1/support";

export const supportKeys = {
  all: ["support"] as const,
  list: (status: string, search: string) => ["support", "list", status, search] as const,
  detail: (id: number) => ["support", "ticket", id] as const,
};

export function useTickets(status: string, search: string) {
  return useQuery({
    queryKey: supportKeys.list(status, search),
    queryFn: async () => {
      const { data } = await api.get<{ data: SupportTicket[] }>(`${API}/tickets`, {
        params: { status: status || undefined, search: search || undefined },
      });
      return data.data;
    },
    placeholderData: keepPreviousData,
  });
}

export function useTicket(id: number | null) {
  return useQuery({
    queryKey: supportKeys.detail(id ?? 0),
    enabled: id !== null,
    queryFn: async () => {
      const { data } = await api.get<{ data: SupportTicket }>(`${API}/tickets/${id}`);
      return data.data;
    },
  });
}

export function useOpenTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      subject: string;
      body: string;
      category?: string;
      priority?: string;
    }) => {
      await ensureCsrf();
      const { data } = await api.post<{ data: SupportTicket; message: string }>(
        `${API}/tickets`,
        input,
      );
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: supportKeys.all }),
  });
}

export function useReplyToTicket(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: string) => {
      await ensureCsrf();
      const { data } = await api.post<{ data: SupportTicket }>(
        `${API}/tickets/${id}/messages`,
        { body },
      );
      return data.data;
    },
    onSuccess: (ticket) => {
      queryClient.setQueryData(supportKeys.detail(id), ticket);
      queryClient.invalidateQueries({ queryKey: supportKeys.all });
    },
  });
}

export function useCloseTicket(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await ensureCsrf();
      const { data } = await api.post<{ data: SupportTicket }>(`${API}/tickets/${id}/close`);
      return data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: supportKeys.all }),
  });
}
