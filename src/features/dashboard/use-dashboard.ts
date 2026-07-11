"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";

/**
 * Lightweight dashboard queries over EXISTING endpoints. Every query is
 * permission-gated by the caller via `enabled` so users without access never
 * fire requests that would 403.
 */

export function useHeadcount(enabled: boolean) {
  return useQuery({
    queryKey: ["dashboard", "headcount"],
    enabled,
    queryFn: async () => {
      const { data } = await api.get<{ meta: { total: number } }>(
        "/api/v1/employees",
        { params: { per_page: 1 } },
      );
      return data.meta.total;
    },
  });
}

interface AttendanceGridRow {
  employee: { id: number };
  days: Record<string, { status: string }>;
}

export interface TodayAttendance {
  present: number;
  onLeave: number;
  absent: number;
}

export function useAttendanceToday(enabled: boolean) {
  const period = new Date().toISOString().slice(0, 7);
  const today = new Date().toISOString().slice(0, 10);

  return useQuery({
    queryKey: ["dashboard", "attendance-today", today],
    enabled,
    queryFn: async (): Promise<TodayAttendance> => {
      const { data } = await api.get<{ data: { rows: AttendanceGridRow[] } }>(
        "/api/v1/attendance",
        { params: { period } },
      );

      const counts: TodayAttendance = { present: 0, onLeave: 0, absent: 0 };
      for (const row of data.data.rows) {
        const status = row.days[today]?.status;
        if (status === "present" || status === "late" || status === "early_exit") counts.present++;
        else if (status === "on_leave") counts.onLeave++;
        else if (status === "absent") counts.absent++;
      }
      return counts;
    },
  });
}

export interface LatestPayrollRun {
  id: number;
  period: string;
  status: string;
  employee_count: number;
  total_gross: number;
  total_net: number;
}

export function useLatestPayrollRun(enabled: boolean) {
  return useQuery({
    queryKey: ["dashboard", "latest-payroll-run"],
    enabled,
    queryFn: async (): Promise<LatestPayrollRun | null> => {
      const { data } = await api.get<{ data: LatestPayrollRun[] }>("/api/v1/payroll-runs");
      return data.data[0] ?? null;
    },
  });
}
