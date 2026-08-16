"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api, ensureCsrf } from "@/lib/api";
import type { BillingPlan } from "@/features/billing/types";

const ADMIN_API = "/api/admin/v1/billing";

export interface AdminSubscriptionRow {
  id: number;
  status: string;
  on_trial: boolean;
  employee_count: number;
  amount: number;
  current_period_end: string | null;
  plan: { id: number; name: string } | null;
  company: { id: number; name: string } | null;
}

export interface BillingSummary {
  active: number;
  trialing: number;
  past_due: number;
  cancelled: number;
  collected: number;
  billable_employees: number;
}

export interface PlanInput {
  name: string;
  description?: string | null;
  price_per_employee: number;
  billing_interval: "monthly" | "yearly";
  min_employees: number;
  max_employees?: number | null;
  trial_days: number;
  features?: string[];
  is_active?: boolean;
  sort_order?: number;
}

export const adminBillingKeys = {
  all: ["admin", "billing"] as const,
  plans: ["admin", "billing", "plans"] as const,
  subscriptions: (page: number, status: string) =>
    ["admin", "billing", "subscriptions", page, status] as const,
};

export function useAdminPlans() {
  return useQuery({
    queryKey: adminBillingKeys.plans,
    queryFn: async () => {
      const { data } = await api.get<{ data: BillingPlan[] }>(`${ADMIN_API}/plans`);
      return data.data;
    },
  });
}

export function useAdminSubscriptions(page: number, status: string) {
  return useQuery({
    queryKey: adminBillingKeys.subscriptions(page, status),
    queryFn: async () => {
      const { data } = await api.get<{
        data: AdminSubscriptionRow[];
        meta: { current_page: number; last_page: number; total: number };
        summary: BillingSummary;
      }>(`${ADMIN_API}/subscriptions`, { params: { page, status: status || undefined } });
      return data;
    },
    placeholderData: keepPreviousData,
  });
}

export function useCreatePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: PlanInput) => {
      await ensureCsrf();
      const { data } = await api.post<{ data: BillingPlan }>(`${ADMIN_API}/plans`, input);
      return data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminBillingKeys.all }),
  });
}

export function useUpdatePlan(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: Partial<PlanInput>) => {
      await ensureCsrf();
      const { data } = await api.put<{ data: BillingPlan }>(`${ADMIN_API}/plans/${id}`, input);
      return data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminBillingKeys.all }),
  });
}
