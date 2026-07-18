"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api, ensureCsrf } from "@/lib/api";

export type LoanType = "advance" | "loan";
export type LoanStatus = "draft" | "pending" | "active" | "rejected" | "closed";

export interface StaffLoan {
  id: number;
  employee?: { id: number; name: string; number: string };
  employee_id: number;
  type: LoanType;
  principal: number; // kobo
  months: number;
  monthly_installment: number; // kobo
  balance: number; // kobo
  start_period: string;
  next_deduction_override: number | null; // kobo
  scheduled_deduction: number | null; // kobo (active only)
  status: LoanStatus;
  reason: string | null;
  is_editable: boolean;
  disbursed_at: string | null;
  closed_at: string | null;
  created_at: string;
}

export interface LoanRepaymentRow {
  id: number;
  period: string;
  amount: number;
  balance_after: number;
  payroll_run_id: number | null;
  created_at: string;
}

export interface LoanFilters {
  type?: LoanType;
  status?: LoanStatus;
  employee_id?: number;
}

export const loanKeys = {
  list: (filters?: LoanFilters) => ["loans", "list", filters ?? {}] as const,
  repayments: (id: number) => ["loans", "repayments", id] as const,
};

export function useLoans(filters?: LoanFilters) {
  return useQuery({
    queryKey: loanKeys.list(filters),
    queryFn: async () => (await api.get<{ data: StaffLoan[] }>("/api/v1/loans", { params: filters })).data.data,
  });
}

export function useLoanRepayments(id: number, enabled: boolean) {
  return useQuery({
    queryKey: loanKeys.repayments(id),
    enabled,
    queryFn: async () => (await api.get<{ data: LoanRepaymentRow[] }>(`/api/v1/loans/${id}/repayments`)).data.data,
  });
}

export interface CreateLoanInput {
  employee_id: number;
  type: LoanType;
  principal: number; // kobo
  months?: number;
  start_period: string;
  reason?: string;
}

function invalidate(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ["loans"] });
  qc.invalidateQueries({ queryKey: ["approvals"] });
}

export function useCreateLoan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateLoanInput) => {
      await ensureCsrf();
      return (await api.post<{ data: StaffLoan }>("/api/v1/loans", input)).data.data;
    },
    onSuccess: () => invalidate(qc),
  });
}

export function useUpdateLoan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: number; input: CreateLoanInput }) => {
      await ensureCsrf();
      return (await api.put<{ data: StaffLoan }>(`/api/v1/loans/${id}`, input)).data.data;
    },
    onSuccess: () => invalidate(qc),
  });
}

export function useDeleteLoan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await ensureCsrf();
      await api.delete(`/api/v1/loans/${id}`);
    },
    onSuccess: () => invalidate(qc),
  });
}

export function useSubmitLoan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await ensureCsrf();
      return (await api.post<{ data: StaffLoan }>(`/api/v1/loans/${id}/submit`)).data.data;
    },
    onSuccess: () => invalidate(qc),
  });
}

/** amount === null → pull the full remaining balance in the coming run. */
export function usePlanDeduction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, amount }: { id: number; amount: number | null }) => {
      await ensureCsrf();
      return (await api.post<{ data: StaffLoan }>(`/api/v1/loans/${id}/plan-deduction`, amount === null ? {} : { amount })).data.data;
    },
    onSuccess: () => invalidate(qc),
  });
}

export function useClearDeduction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await ensureCsrf();
      return (await api.post<{ data: StaffLoan }>(`/api/v1/loans/${id}/clear-deduction`)).data.data;
    },
    onSuccess: () => invalidate(qc),
  });
}

export function useSetInstallment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, amount }: { id: number; amount: number }) => {
      await ensureCsrf();
      return (await api.post<{ data: StaffLoan }>(`/api/v1/loans/${id}/installment`, { amount })).data.data;
    },
    onSuccess: () => invalidate(qc),
  });
}
