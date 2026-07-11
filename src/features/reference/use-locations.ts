"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";

export interface CountryOption {
  id: number;
  name: string;
  code: string;
  iso3: string | null;
  phone_code: string | null;
  currency_code: string | null;
}

export interface StateOption {
  id: number;
  name: string;
  code: string | null;
  type: string | null;
}

export function useCountries() {
  return useQuery({
    queryKey: ["reference", "countries"],
    queryFn: async () => {
      const { data } = await api.get<{ data: CountryOption[] }>("/api/v1/reference/countries");
      return data.data;
    },
    staleTime: 24 * 60 * 60 * 1000,
  });
}

export function useStates(countryCode?: string) {
  return useQuery({
    queryKey: ["reference", "states", countryCode],
    queryFn: async () => {
      const { data } = await api.get<{ data: StateOption[] }>(`/api/v1/reference/countries/${countryCode}/states`);
      return data.data;
    },
    enabled: Boolean(countryCode),
    staleTime: 24 * 60 * 60 * 1000,
  });
}
