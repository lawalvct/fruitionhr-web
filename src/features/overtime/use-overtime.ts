"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api, ensureCsrf } from "@/lib/api";

export type OvertimeStatus = "draft" | "pending" | "approved" | "rejected" | "paid";
export type OvertimePayType = "hourly" | "fixed";
export type OvertimeMode = "in_payroll" | "off_cycle";

export interface OvertimePayment {
  id: number;
  employee?: { id: number; name: string; number: string };
  employee_id: number;
  period: string;
  work_date: string | null;
  source: "manual" | "attendance";
  pay_type: OvertimePayType;
  hours: number | null;
  multiplier: number;
  hourly_rate: number | null; // kobo/hour
  amount: number; // kobo
  disbursement_mode: OvertimeMode;
  status: OvertimeStatus;
  reason: string | null;
  payroll_run_id: number | null;
  paid_at: string | null;
  is_editable: boolean;
  created_at: string;
}

export interface AttendanceOvertimeCandidate {
  attendance_summary_id: number;
  employee: { id: number; name: string; number: string };
  period: string;
  overtime_minutes: number;
  overtime_hours: number;
  already_recorded: boolean;
}

export const OVERTIME_MULTIPLIERS = [1, 1.5, 2] as const;

export interface OvertimeFilters {
  period?: string;
  status?: OvertimeStatus;
  disbursement_mode?: OvertimeMode;
}

export const overtimeKeys = {
  list: (filters?: OvertimeFilters) => ["overtime", "list", filters ?? {}] as const,
  candidates: (period: string) => ["overtime", "candidates", period] as const,
};

export function useOvertime(filters?: OvertimeFilters) {
  return useQuery({
    queryKey: overtimeKeys.list(filters),
    queryFn: async () => {
      const { data } = await api.get<{ data: OvertimePayment[] }>("/api/v1/overtime", { params: filters });
      return data.data;
    },
  });
}

export function useAttendanceOvertimeCandidates(period: string) {
  return useQuery({
    queryKey: overtimeKeys.candidates(period),
    queryFn: async () => {
      const { data } = await api.get<{ data: AttendanceOvertimeCandidate[] }>(
        "/api/v1/overtime/attendance-candidates",
        { params: { period } },
      );
      return data.data;
    },
  });
}

export interface RecordOvertimeInput {
  employee_id: number;
  period: string;
  pay_type: OvertimePayType;
  disbursement_mode: OvertimeMode;
  hours?: number;
  multiplier?: number;
  amount?: number; // kobo
  work_date?: string;
  reason?: string;
}

function invalidateOvertime(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ["overtime"] });
  qc.invalidateQueries({ queryKey: ["approvals"] });
}

export function useRecordOvertime() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: RecordOvertimeInput) => {
      await ensureCsrf();
      return (await api.post<{ data: OvertimePayment }>("/api/v1/overtime", input)).data.data;
    },
    onSuccess: () => invalidateOvertime(qc),
  });
}

export function useUpdateOvertime() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: number; input: RecordOvertimeInput }) => {
      await ensureCsrf();
      return (await api.put<{ data: OvertimePayment }>(`/api/v1/overtime/${id}`, input)).data.data;
    },
    onSuccess: () => invalidateOvertime(qc),
  });
}

export function useDeleteOvertime() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await ensureCsrf();
      await api.delete(`/api/v1/overtime/${id}`);
    },
    onSuccess: () => invalidateOvertime(qc),
  });
}

export function useSubmitOvertime() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await ensureCsrf();
      return (await api.post<{ data: OvertimePayment }>(`/api/v1/overtime/${id}/submit`)).data.data;
    },
    onSuccess: () => invalidateOvertime(qc),
  });
}

export function usePayOvertime() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await ensureCsrf();
      return (await api.post<{ data: OvertimePayment }>(`/api/v1/overtime/${id}/pay`)).data.data;
    },
    onSuccess: () => invalidateOvertime(qc),
  });
}

export interface FromAttendanceInput {
  attendance_summary_id: number;
  multiplier: number;
  disbursement_mode: OvertimeMode;
}

export function useRecordFromAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: FromAttendanceInput) => {
      await ensureCsrf();
      return (await api.post<{ data: OvertimePayment }>("/api/v1/overtime/from-attendance", input)).data.data;
    },
    onSuccess: () => invalidateOvertime(qc),
  });
}
