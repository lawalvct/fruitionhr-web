"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api, ensureCsrf } from "@/lib/api";

export interface LeaveType {
  id: number;
  name: string;
  code: string | null;
  is_paid: boolean;
  requires_document: boolean;
  is_active: boolean;
  days_per_year: number;
  carry_forward_max: number;
}

export interface LeaveRequestItem {
  id: number;
  employee?: { id: number; name: string };
  leave_type?: { id: number; name: string };
  start_date: string;
  end_date: string;
  days: number;
  reason: string | null;
  status: "pending" | "approved" | "rejected" | "cancelled";
  created_at: string;
}

export interface LeaveBalanceItem {
  id: number;
  employee: { id: number; name: string };
  leave_type: { id: number; name: string };
  year: number;
  allocated: number;
  carried_forward: number;
  taken: number;
  remaining: number;
}

export interface EmployeeOption {
  id: number;
  full_name: string;
  current_assignment?: {
    department?: { id: number; name: string } | null;
  } | null;
}

export const leaveKeys = {
  types: ["leave", "types"] as const,
  requests: (filters?: Record<string, unknown>) => ["leave", "requests", filters ?? {}] as const,
  balances: (year: number, employeeId?: number) => ["leave", "balances", year, employeeId ?? null] as const,
  employees: (departmentId?: number) => ["leave", "employee-options", departmentId ?? "all"] as const,
};

export function useEmployeeOptions(departmentId?: number) {
  return useQuery({
    queryKey: leaveKeys.employees(departmentId),
    queryFn: async () => {
      const { data } = await api.get<{ data: EmployeeOption[] }>("/api/v1/employees", {
        params: {
          per_page: 100,
          sort: "first_name",
          ...(departmentId ? { "filter[department_id]": departmentId } : {}),
        },
      });
      return data.data;
    },
  });
}

export function useLeaveTypes() {
  return useQuery({
    queryKey: leaveKeys.types,
    queryFn: async () => {
      const { data } = await api.get<{ data: LeaveType[] }>("/api/v1/leave-types");
      return data.data;
    },
  });
}

export interface LeaveTypeInput {
  name: string;
  code?: string;
  is_paid: boolean;
  requires_document: boolean;
  is_active: boolean;
  days_per_year: number;
  carry_forward_max: number;
}

export function useSaveLeaveType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id?: number; input: LeaveTypeInput }) => {
      await ensureCsrf();
      if (id) {
        const { data } = await api.put(`/api/v1/leave-types/${id}`, input);
        return data;
      }
      const { data } = await api.post("/api/v1/leave-types", input);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: leaveKeys.types }),
  });
}

export function useDeleteLeaveType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await ensureCsrf();
      await api.delete(`/api/v1/leave-types/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: leaveKeys.types }),
  });
}

export function useLeaveRequests(filters?: { status?: string; employee_id?: number }) {
  return useQuery({
    queryKey: leaveKeys.requests(filters),
    queryFn: async () => {
      const { data } = await api.get<{ data: LeaveRequestItem[] }>("/api/v1/leave-requests", {
        params: filters,
      });
      return data.data;
    },
  });
}

export interface ApplyLeaveInput {
  employee_id: number;
  leave_type_id: number;
  start_date: string;
  end_date: string;
  reason?: string;
}

export function useApplyLeave() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: ApplyLeaveInput) => {
      await ensureCsrf();
      const { data } = await api.post<{ data: LeaveRequestItem }>("/api/v1/leave-requests", input);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave"] });
      queryClient.invalidateQueries({ queryKey: ["approvals"] });
    },
  });
}

export function useCancelLeave() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await ensureCsrf();
      await api.post(`/api/v1/leave-requests/${id}/cancel`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["leave"] }),
  });
}

export function useLeaveBalances(year: number, employeeId?: number) {
  return useQuery({
    queryKey: leaveKeys.balances(year, employeeId),
    queryFn: async () => {
      const { data } = await api.get<{ data: LeaveBalanceItem[] }>("/api/v1/leave-balances", {
        params: { year, employee_id: employeeId },
      });
      return data.data;
    },
  });
}
