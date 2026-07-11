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

type ListEnvelope<T> = { data: T[] | { data: T[] } };

function extractList<T>(payload: ListEnvelope<T>): T[] {
  if (Array.isArray(payload.data)) return payload.data;

  return Array.isArray(payload.data.data) ? payload.data.data : [];
}

export function useCountries() {
  return useQuery({
    queryKey: ["reference", "countries", "v2"],
    queryFn: async () => {
      const { data } = await api.get<ListEnvelope<CountryOption>>("/api/v1/reference/countries");
      return extractList(data);
    },
    staleTime: 24 * 60 * 60 * 1000,
  });
}

export function useStates(countryCode?: string) {
  return useQuery({
    queryKey: ["reference", "states", "v2", countryCode],
    queryFn: async () => {
      const { data } = await api.get<ListEnvelope<StateOption>>(`/api/v1/reference/countries/${countryCode}/states`);
      return extractList(data);
    },
    enabled: Boolean(countryCode),
    staleTime: 24 * 60 * 60 * 1000,
  });
}
