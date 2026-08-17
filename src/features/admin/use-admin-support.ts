"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api, ensureCsrf } from "@/lib/api";
import type { SupportTicket, TicketSummary } from "@/features/support/types";

const ADMIN_API = "/api/admin/v1/support";

export const adminSupportKeys = {
  all: ["admin", "support"] as const,
  list: (status: string, search: string) => ["admin", "support", "list", status, search] as const,
  detail: (id: number) => ["admin", "support", "ticket", id] as const,
};

export function useAdminTickets(status: string, search: string, tenantId?: number) {
  return useQuery({
    queryKey: [...adminSupportKeys.list(status, search), tenantId ?? null],
    queryFn: async () => {
      const { data } = await api.get<{ data: SupportTicket[]; summary: TicketSummary }>(
        `${ADMIN_API}/tickets`,
        {
          params: {
            status: status || undefined,
            search: search || undefined,
            tenant_id: tenantId,
          },
        },
      );
      return data;
    },
    placeholderData: keepPreviousData,
  });
}

export function useAdminTicket(id: number | null) {
  return useQuery({
    queryKey: adminSupportKeys.detail(id ?? 0),
    enabled: id !== null,
    queryFn: async () => {
      const { data } = await api.get<{ data: SupportTicket }>(`${ADMIN_API}/tickets/${id}`);
      return data.data;
    },
  });
}

export function useAgentReply(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { body: string; internal: boolean }) => {
      await ensureCsrf();
      const { data } = await api.post<{ data: SupportTicket }>(
        `${ADMIN_API}/tickets/${id}/messages`,
        input,
      );
      return data.data;
    },
    onSuccess: (ticket) => {
      queryClient.setQueryData(adminSupportKeys.detail(id), ticket);
      queryClient.invalidateQueries({ queryKey: adminSupportKeys.all });
    },
  });
}

export function useUpdateTicketStatus(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (status: string) => {
      await ensureCsrf();
      const { data } = await api.post<{ data: SupportTicket }>(
        `${ADMIN_API}/tickets/${id}/status`,
        { status },
      );
      return data.data;
    },
    onSuccess: (ticket) => {
      queryClient.setQueryData(adminSupportKeys.detail(id), ticket);
      queryClient.invalidateQueries({ queryKey: adminSupportKeys.all });
    },
  });
}

export function useAssignTicket(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (assignedTo: number | null) => {
      await ensureCsrf();
      const { data } = await api.post<{ data: SupportTicket }>(
        `${ADMIN_API}/tickets/${id}/assign`,
        { assigned_to: assignedTo },
      );
      return data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminSupportKeys.all }),
  });
}
