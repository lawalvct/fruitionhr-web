"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api, ensureCsrf } from "@/lib/api";

export type DayStatusCode =
  | "present"
  | "late"
  | "early_exit"
  | "absent"
  | "holiday"
  | "weekend"
  | "on_leave"
  | "no_shift";

export interface AttendanceDay {
  status: DayStatusCode;
  late_minutes: number;
  overtime_minutes: number;
}

export interface AttendanceRow {
  employee: {
    id: number;
    name: string;
    employee_number: string;
    department: string | null;
  };
  days: Record<string, AttendanceDay>;
  summary: {
    days_present: number;
    days_late: number;
    days_absent: number;
    days_on_leave: number;
    late_minutes: number;
    overtime_minutes: number;
    status: "open" | "finalized";
  } | null;
}

export interface AttendanceGrid {
  period: string;
  is_finalized: boolean;
  rows: AttendanceRow[];
}

export interface Shift {
  id: number;
  name: string;
  start_time: string;
  end_time: string;
  grace_minutes: number;
  working_days: number[];
  is_active: boolean;
}

export interface ShiftAssignmentRow {
  employee: {
    id: number;
    employee_number: string;
    name: string;
    department: { id: number; name: string } | null;
  };
  assignment: {
    id: number;
    effective_from: string;
    shift: {
      id: number;
      name: string;
      start_time: string;
      end_time: string;
    };
  } | null;
}

export interface Kiosk {
  id: number;
  name: string;
  location: string | null;
  is_active: boolean;
}

export interface KioskInput {
  name: string;
  location?: string | null;
  is_active?: boolean;
}

export interface AttendanceSettings {
  self_clock_enabled: boolean;
  kiosk_enabled: boolean;
}

export const attendanceKeys = {
  grid: (period: string) => ["attendance", "grid", period] as const,
  shifts: ["attendance", "shifts"] as const,
  shiftAssignments: ["attendance", "shift-assignments"] as const,
  kiosks: ["attendance", "kiosks"] as const,
  settings: ["attendance", "settings"] as const,
};

export function useAttendanceGrid(period: string) {
  return useQuery({
    queryKey: attendanceKeys.grid(period),
    queryFn: async () => {
      const { data } = await api.get<{ data: AttendanceGrid }>("/api/v1/attendance", {
        params: { period },
      });
      return data.data;
    },
  });
}

export function useShifts() {
  return useQuery({
    queryKey: attendanceKeys.shifts,
    queryFn: async () => {
      const { data } = await api.get<{ data: Shift[] }>("/api/v1/shifts");
      return data.data;
    },
  });
}

export function useShiftAssignments(enabled = true) {
  return useQuery({
    queryKey: attendanceKeys.shiftAssignments,
    enabled,
    queryFn: async () => {
      const { data } = await api.get<{ data: ShiftAssignmentRow[] }>("/api/v1/shift-assignments");
      return data.data;
    },
  });
}

export interface ShiftAssignmentInput {
  employee_id: number;
  shift_id: number;
  effective_from: string;
}

export function useAssignShift() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ShiftAssignmentInput) => {
      await ensureCsrf();
      const { data } = await api.post("/api/v1/shift-assignments", input);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.shiftAssignments });
      queryClient.invalidateQueries({ queryKey: ["attendance", "grid"] });
    },
  });
}

export interface ShiftInput {
  name: string;
  start_time: string;
  end_time: string;
  grace_minutes: number;
  working_days: number[];
  is_active: boolean;
}

export function useSaveShift() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id?: number; input: ShiftInput }) => {
      await ensureCsrf();
      if (id) {
        const { data } = await api.put(`/api/v1/shifts/${id}`, input);
        return data;
      }
      const { data } = await api.post("/api/v1/shifts", input);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: attendanceKeys.shifts }),
  });
}

export function useDeleteShift() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await ensureCsrf();
      await api.delete(`/api/v1/shifts/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: attendanceKeys.shifts }),
  });
}

export interface AttendanceLogInput {
  employee_id: number;
  date: string;
  clock_in?: string;
  clock_out?: string;
  note?: string;
}

export function useRecordLog(period: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: AttendanceLogInput) => {
      await ensureCsrf();
      const { data } = await api.post("/api/v1/attendance-logs", input);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: attendanceKeys.grid(period) }),
  });
}

/** The three statuses a human can set. The rest are derived from other
 * sources — leave from the Leave module, holidays from the calendar, weekend
 * and no_shift from the shift config — so the API refuses them. */
export const SETTABLE_STATUSES = ["present", "late", "absent"] as const;

export type SettableStatus = (typeof SETTABLE_STATUSES)[number];

export interface BulkMarkInput {
  employee_ids: number[];
  status: SettableStatus;
  /** Either a single date… */
  date?: string;
  /** …or an inclusive range, which must stay inside one month. */
  from?: string;
  to?: string;
  clock_in?: string;
  clock_out?: string;
  note?: string;
  overwrite?: boolean;
}

export interface BulkMarkSkip {
  employee_id: number;
  employee: string;
  date: string;
  reason:
    | "weekend"
    | "holiday"
    | "on_leave"
    | "no_shift"
    | "already_recorded"
    | "already_absent";
}

export interface BulkMarkResult {
  marked: number;
  cleared: number;
  skipped: BulkMarkSkip[];
}

/** Why a day was left alone, in words the person clicking will recognise. */
export const SKIP_REASON_LABEL: Record<BulkMarkSkip["reason"], string> = {
  weekend: "Rest day",
  holiday: "Public holiday",
  on_leave: "On approved leave",
  no_shift: "No shift assigned",
  already_recorded: "Already recorded",
  already_absent: "Already absent",
};

export function useBulkMark(period: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: BulkMarkInput) => {
      await ensureCsrf();
      const { data } = await api.post<{ data: BulkMarkResult; message: string }>(
        "/api/v1/attendance-logs/bulk",
        input,
      );
      return { ...data.data, message: data.message };
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: attendanceKeys.grid(period) }),
  });
}

export interface ImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

export function useImportLogs(period: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      await ensureCsrf();
      const form = new FormData();
      form.append("file", file);
      const { data } = await api.post<{ data: ImportResult }>(
        "/api/v1/attendance-logs/import",
        form,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      return data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: attendanceKeys.grid(period) }),
  });
}

export function useAttendanceSettings(enabled = true) {
  return useQuery({
    queryKey: attendanceKeys.settings,
    enabled,
    queryFn: async () => {
      const { data } = await api.get<{ data: AttendanceSettings }>("/api/v1/attendance-settings");
      return data.data;
    },
  });
}

export function useSaveAttendanceSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: AttendanceSettings) => {
      await ensureCsrf();
      const { data } = await api.put<{ data: AttendanceSettings }>("/api/v1/attendance-settings", input);
      return data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: attendanceKeys.settings }),
  });
}

export function useKiosks(enabled = true) {
  return useQuery({
    queryKey: attendanceKeys.kiosks,
    enabled,
    queryFn: async () => {
      const { data } = await api.get<{ data: Kiosk[] }>("/api/v1/attendance-kiosks");
      return data.data;
    },
  });
}

export function useSaveKiosk() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id?: number; input: KioskInput }) => {
      await ensureCsrf();
      if (id) {
        const { data } = await api.put(`/api/v1/attendance-kiosks/${id}`, input);
        return data;
      }
      const { data } = await api.post("/api/v1/attendance-kiosks", input);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: attendanceKeys.kiosks }),
  });
}

export function useDeleteKiosk() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await ensureCsrf();
      await api.delete(`/api/v1/attendance-kiosks/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: attendanceKeys.kiosks }),
  });
}

export function useKioskToken(kioskId: number, enabled: boolean) {
  return useQuery({
    queryKey: ["attendance", "kiosk-token", kioskId] as const,
    enabled,
    refetchInterval: 20_000,
    queryFn: async () => {
      const { data } = await api.get<{ data: { token: string; expires_in: number } }>(
        `/api/v1/attendance-kiosks/${kioskId}/token`,
      );
      return data.data;
    },
  });
}

export function useFinalizePeriod(period: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await ensureCsrf();
      const { data } = await api.post(`/api/v1/attendance-periods/${period}/finalize`);
      return data.data as { period: string; finalized: number };
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: attendanceKeys.grid(period) }),
  });
}
