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

type ListPayload<T> = T[] | { data?: T[] | { data?: T[] } };
type ListEnvelope<T> = { data?: T[] | { data?: T[] } };

function extractList<T>(payload: ListPayload<T>): T[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;

  return Array.isArray(payload.data?.data) ? payload.data.data : [];
}

export function useCountries() {
  return useQuery({
    queryKey: ["reference", "countries", "v3"],
    queryFn: async () => {
      const { data } = await api.get<ListEnvelope<CountryOption>>("/api/v1/reference/countries");
      return extractList(data);
    },
    staleTime: 24 * 60 * 60 * 1000,
  });
}

export function useStates(countryCode?: string) {
  return useQuery({
    queryKey: ["reference", "states", "v3", countryCode],
    queryFn: async () => {
      const { data } = await api.get<ListEnvelope<StateOption>>(`/api/v1/reference/countries/${countryCode}/states`);
      return extractList(data);
    },
    enabled: Boolean(countryCode),
    staleTime: 24 * 60 * 60 * 1000,
  });
}
