"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ME_QUERY_KEY } from "@/features/auth/use-auth";
import { api, ensureCsrf } from "@/lib/api";
import type { Me } from "@/types/auth";

export type OnboardingStatus = "not_started" | "in_progress" | "completed" | "skipped";

export interface OnboardingData {
  company_name?: string;
  phone?: string;
  industry?: string;
  company_size?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  country_code?: string;
  timezone?: string;
  currency?: "NGN";
  pay_frequency?: "monthly" | "biweekly" | "weekly";
  pay_day?: number;
  working_days?: string[];
  tax_state?: string;
  tin?: string;
  rc_number?: string;
}

export interface Onboarding {
  status: OnboardingStatus;
  step: number;
  data: OnboardingData;
  completed_at: string | null;
  skipped_at: string | null;
  version: number;
}

const ONBOARDING_KEY = ["onboarding"] as const;

function useFinishOnboarding(action: "complete" | "skip") {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await ensureCsrf();
      const { data } = await api.post<{ data: Onboarding }>(`/api/v1/onboarding/${action}`);
      return data.data;
    },
    onSuccess: (onboarding) => {
      queryClient.setQueryData(ONBOARDING_KEY, onboarding);
      queryClient.setQueryData<Me | null>(ME_QUERY_KEY, (me) =>
        me?.tenant
          ? { ...me, tenant: { ...me.tenant, onboarding_status: onboarding.status, onboarding_step: onboarding.step } }
          : me,
      );
    },
  });
}

export function useOnboarding(enabled = true) {
  return useQuery({
    queryKey: ONBOARDING_KEY,
    queryFn: async () => {
      const { data } = await api.get<{ data: Onboarding }>("/api/v1/onboarding");
      return data.data;
    },
    enabled,
  });
}

export function useSaveOnboarding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: OnboardingData & { step: number }) => {
      await ensureCsrf();
      const { data } = await api.patch<{ data: Onboarding }>("/api/v1/onboarding", input);
      return data.data;
    },
    onSuccess: (onboarding) => queryClient.setQueryData(ONBOARDING_KEY, onboarding),
  });
}

export const useCompleteOnboarding = () => useFinishOnboarding("complete");
export const useSkipOnboarding = () => useFinishOnboarding("skip");
