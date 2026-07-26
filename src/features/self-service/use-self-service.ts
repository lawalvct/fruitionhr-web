"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api, ensureCsrf } from "@/lib/api";
import type { Employee } from "@/features/employees/types";
import type { LeaveBalanceItem, LeaveRequestItem, LeaveType } from "@/features/leave/use-leave";

export interface ProfileUpdateRequestItem {
  id: number;
  employee_id: number;
  status: "pending" | "approved" | "rejected";
  current_values: Record<string, string | null>;
  requested_values: Record<string, string | null>;
  submitted_at: string | null;
  completed_at: string | null;
  created_at: string | null;
}

export interface AttendanceDay {
  status: string;
  late_minutes: number;
  overtime_minutes: number;
}

export interface TodayAttendance {
  date: string;
  state: "not_clocked_in" | "clocked_in" | "clocked_out";
  clock_in: string | null;
  clock_out: string | null;
  status: string;
  late_minutes: number;
  overtime_minutes: number;
  kiosk: string | null;
  self_clock_enabled: boolean;
  kiosk_scanning_enabled: boolean;
}

export interface SelfAttendance {
  period: string;
  employee: { id: number; name: string; employee_number: string };
  days: Record<string, AttendanceDay>;
  summary: {
    days_present: number;
    days_late: number;
    days_absent: number;
    days_on_leave: number;
    late_minutes: number;
    overtime_minutes: number;
    status: string;
  } | null;
}

export interface PayslipItem {
  id: number;
  payroll_run_id: number;
  period: string;
  status: string;
  gross: number;
  total_deductions: number;
  net: number;
  download_url: string;
}

export interface SelfLeaveInput {
  leave_type_id: number;
  start_date: string;
  end_date: string;
  reason?: string;
}

export type ProfileUpdateInput = Partial<{
  personal_email: string | null;
  phone: string | null;
  marital_status: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
}>;

export const selfServiceKeys = {
  profile: ["self-service", "profile"] as const,
  profileUpdates: ["self-service", "profile-updates"] as const,
  leaveRequests: ["self-service", "leave-requests"] as const,
  leaveBalances: (year: number) => ["self-service", "leave-balances", year] as const,
  attendance: (period: string) => ["self-service", "attendance", period] as const,
  attendanceToday: ["self-service", "attendance-today"] as const,
  payslips: ["self-service", "payslips"] as const,
  leaveTypes: ["self-service", "leave-types"] as const,
};

export function useSelfProfile() {
  return useQuery({
    queryKey: selfServiceKeys.profile,
    queryFn: async () => (await api.get<{ data: Employee }>("/api/v1/self/profile")).data.data,
  });
}

export function useProfileUpdateRequests() {
  return useQuery({
    queryKey: selfServiceKeys.profileUpdates,
    queryFn: async () =>
      (await api.get<{ data: ProfileUpdateRequestItem[] }>("/api/v1/self/profile-update-requests")).data.data,
  });
}

export function useSubmitProfileUpdate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ProfileUpdateInput) => {
      await ensureCsrf();
      return (await api.post<{ data: ProfileUpdateRequestItem }>("/api/v1/self/profile-update-requests", input)).data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: selfServiceKeys.profileUpdates });
      queryClient.invalidateQueries({ queryKey: selfServiceKeys.profile });
    },
  });
}

export function useSelfLeaveTypes() {
  return useQuery({
    queryKey: selfServiceKeys.leaveTypes,
    queryFn: async () => (await api.get<{ data: LeaveType[] }>("/api/v1/self/leave-types")).data.data,
  });
}

export function useSelfLeaveRequests() {
  return useQuery({
    queryKey: selfServiceKeys.leaveRequests,
    queryFn: async () => (await api.get<{ data: LeaveRequestItem[] }>("/api/v1/self/leave-requests")).data.data,
  });
}

export function useSelfLeaveBalances(year: number) {
  return useQuery({
    queryKey: selfServiceKeys.leaveBalances(year),
    queryFn: async () =>
      (await api.get<{ data: LeaveBalanceItem[] }>("/api/v1/self/leave-balances", { params: { year } })).data.data,
  });
}

export function useApplySelfLeave(year: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SelfLeaveInput) => {
      await ensureCsrf();
      return (await api.post<{ data: LeaveRequestItem }>("/api/v1/self/leave-requests", input)).data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: selfServiceKeys.leaveRequests });
      queryClient.invalidateQueries({ queryKey: selfServiceKeys.leaveBalances(year) });
    },
  });
}

export function useSelfAttendance(period: string) {
  return useQuery({
    queryKey: selfServiceKeys.attendance(period),
    queryFn: async () =>
      (await api.get<{ data: SelfAttendance }>("/api/v1/self/attendance", { params: { period } })).data.data,
  });
}

export function useTodayAttendance() {
  return useQuery({
    queryKey: selfServiceKeys.attendanceToday,
    queryFn: async () =>
      (await api.get<{ data: TodayAttendance }>("/api/v1/self/attendance/today")).data.data,
  });
}

export function useClockIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (kioskToken?: string) => {
      await ensureCsrf();
      return (
        await api.post<{ data: TodayAttendance }>(
          "/api/v1/self/attendance/clock-in",
          kioskToken ? { kiosk_token: kioskToken } : {},
        )
      ).data.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(selfServiceKeys.attendanceToday, data);
      queryClient.invalidateQueries({ queryKey: ["self-service", "attendance"] });
    },
  });
}

export function useClockOut() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await ensureCsrf();
      return (await api.post<{ data: TodayAttendance }>("/api/v1/self/attendance/clock-out")).data.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(selfServiceKeys.attendanceToday, data);
      queryClient.invalidateQueries({ queryKey: ["self-service", "attendance"] });
    },
  });
}

export function useSelfPayslips() {
  return useQuery({
    queryKey: selfServiceKeys.payslips,
    queryFn: async () => (await api.get<{ data: PayslipItem[] }>("/api/v1/self/payslips")).data.data,
  });
}
