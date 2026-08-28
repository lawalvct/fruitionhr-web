"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useCan } from "@/features/auth/use-auth";
import { api, ensureCsrf } from "@/lib/api";
import type {
  BillingPayment,
  BillingSubscription,
  PlansResponse,
  SubscriptionResponse,
  SubscriptionStanding,
} from "./types";

const BILLING_API = "/api/v1/billing";

export const billingKeys = {
  all: ["billing"] as const,
  plans: ["billing", "plans"] as const,
  subscription: ["billing", "subscription"] as const,
  payments: ["billing", "payments"] as const,
  status: ["billing", "status"] as const,
};

export function useBillingPlans() {
  const canView = useCan("billing.view");

  return useQuery({
    queryKey: billingKeys.plans,
    queryFn: async () => {
      const { data } = await api.get<PlansResponse>(`${BILLING_API}/plans`);
      return data;
    },
    enabled: canView,
  });
}

export function useSubscription() {
  // The sidebar pill renders on every page for every user; without this the
  // majority of logins would fire a 403 on each navigation.
  const canView = useCan("billing.view");

  return useQuery({
    queryKey: billingKeys.subscription,
    queryFn: async () => {
      const { data } = await api.get<SubscriptionResponse>(`${BILLING_API}/subscription`);
      return data;
    },
    enabled: canView,
  });
}

/**
 * Ungated counterpart to useSubscription: every user may ask whether the
 * workspace is writable, so the read-only banner works for all of them.
 */
export function useSubscriptionStatus() {
  return useQuery({
    queryKey: billingKeys.status,
    queryFn: async () => {
      const { data } = await api.get<{ data: SubscriptionStanding | null }>(`${BILLING_API}/status`);
      return data.data;
    },
  });
}

export function useBillingPayments() {
  const canView = useCan("billing.view");

  return useQuery({
    queryKey: billingKeys.payments,
    queryFn: async () => {
      const { data } = await api.get<{ data: BillingPayment[] }>(`${BILLING_API}/payments`);
      return data.data;
    },
    enabled: canView,
  });
}

export function useSubscribe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (planId: number) => {
      await ensureCsrf();
      const { data } = await api.post<{ data: BillingSubscription; message: string }>(
        `${BILLING_API}/subscribe`,
        { plan_id: planId },
      );
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: billingKeys.all }),
  });
}

/**
 * Starts a charge and returns the gateway URL. The API never redirects — the
 * browser is sent to the gateway from here.
 */
export function useStartPayment() {
  return useMutation({
    mutationFn: async (input: { planId?: number; gateway?: string }) => {
      await ensureCsrf();
      const { data } = await api.post<{
        data: { payment_url: string; reference: string; amount: number };
      }>(`${BILLING_API}/payments`, {
        plan_id: input.planId,
        gateway: input.gateway,
      });
      return data.data;
    },
  });
}

/** Confirms a charge server-side after the gateway sends the customer back. */
export function useVerifyPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reference: string) => {
      await ensureCsrf();
      const { data } = await api.post<{ data: BillingPayment; message: string }>(
        `${BILLING_API}/payments/${encodeURIComponent(reference)}/verify`,
        undefined,
        // The client has no global timeout, and this screen is the one place a
        // stalled request strands someone who has just been charged. Fail loudly
        // instead of spinning forever.
        { timeout: 20000 },
      );
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: billingKeys.all }),
  });
}

export function useCancelSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await ensureCsrf();
      const { data } = await api.post<{ data: BillingSubscription; message: string }>(
        `${BILLING_API}/subscription/cancel`,
      );
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: billingKeys.all }),
  });
}
