"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api, ensureCsrf } from "@/lib/api";

// ── Salary components ────────────────────────────────────────────────────────

export interface SalaryComponent {
  id: number;
  name: string;
  code: string;
  type: "earning" | "deduction";
  calc_type: "fixed" | "percent_of_basic";
  percent: number | null;
  is_taxable: boolean;
  is_pensionable: boolean;
  is_active: boolean;
}

export interface SalaryStructure {
  id: number;
  name: string;
  description: string | null;
  is_active: boolean;
  components: Array<{
    id: number;
    salary_component_id: number;
    component_name: string;
    component_code: string;
    type: string;
    amount: number | null;
    percent: number | null;
  }>;
}

// ── Payroll runs ─────────────────────────────────────────────────────────────

export interface PayrollRunSummary {
  id: number;
  period: string;
  status: string;
  is_reversal?: boolean;
  reversed_of_run_id?: number | null;
  reversal_reason?: string | null;
  employee_count: number;
  total_gross: number;
  total_statutory: number;
  total_deductions: number;
  total_net: number;
  total_employer_cost: number;
  submitted_at: string | null;
  approved_at: string | null;
  locked_at: string | null;
}

export interface VarianceRow {
  employee_id: number;
  name: string;
  current_net: number;
  previous_net: number;
  delta: number;
  percent: number | null;
  flag: "new" | "changed" | "removed";
}

export interface VarianceReport {
  current_period: string;
  previous_period: string | null;
  totals: { current_net: number; previous_net: number; delta: number; percent: number | null };
  rows: VarianceRow[];
}

export interface PayrollRunEmployeeRow {
  id: number;
  employee: { id: number; name: string; number: string };
  gross: number;
  total_statutory: number;
  total_deductions: number;
  net: number;
}

export interface PreflightCheck {
  key: string;
  label: string;
  passed: boolean;
  detail: string | null;
}

export const payrollKeys = {
  components: ["payroll", "salary-components"] as const,
  structures: ["payroll", "salary-structures"] as const,
  runs: ["payroll", "runs"] as const,
  run: (id: number) => ["payroll", "run", id] as const,
  preflight: (period: string) => ["payroll", "preflight", period] as const,
  employeeSalary: (employeeId: number | string) => ["payroll", "employee-salary", String(employeeId)] as const,
};

export function useSalaryComponents() {
  return useQuery({
    queryKey: payrollKeys.components,
    queryFn: async () => (await api.get<{ data: SalaryComponent[] }>("/api/v1/salary-components")).data.data,
  });
}

export function useSaveSalaryComponent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id?: number; input: Partial<SalaryComponent> }) => {
      await ensureCsrf();
      const url = id ? `/api/v1/salary-components/${id}` : "/api/v1/salary-components";
      return (await api[id ? "put" : "post"](url, input)).data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: payrollKeys.components }),
  });
}

export function useDeleteSalaryComponent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await ensureCsrf();
      await api.delete(`/api/v1/salary-components/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: payrollKeys.components }),
  });
}

export function useSalaryStructures() {
  return useQuery({
    queryKey: payrollKeys.structures,
    queryFn: async () => (await api.get<{ data: SalaryStructure[] }>("/api/v1/salary-structures")).data.data,
  });
}

export interface StructureInput {
  name: string;
  description?: string;
  is_active: boolean;
  components: Array<{ salary_component_id: number; amount?: number | null; percent?: number | null }>;
}

export function useSaveSalaryStructure() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id?: number; input: StructureInput }) => {
      await ensureCsrf();
      const url = id ? `/api/v1/salary-structures/${id}` : "/api/v1/salary-structures";
      return (await api[id ? "put" : "post"](url, input)).data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: payrollKeys.structures }),
  });
}

// Employee compensation
export interface EmployeeSalary {
  id: number;
  basic_salary: number;
  effective_from: string;
  structure: { id: number; name: string } | null;
  breakdown: {
    basic: number;
    earnings: Array<{ code: string; name: string; amount: number }>;
    gross: number;
    taxable_pay: number;
    pensionable_pay: number;
  };
}

export function useEmployeeSalary(employeeId: number | string) {
  return useQuery({
    queryKey: payrollKeys.employeeSalary(employeeId),
    queryFn: async () =>
      (await api.get<{ data: EmployeeSalary | null }>(`/api/v1/employees/${employeeId}/salary`)).data.data,
  });
}

export function useAssignSalary(employeeId: number | string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { basic_salary: number; salary_structure_id: number | null; effective_from: string }) => {
      await ensureCsrf();
      return (await api.post(`/api/v1/employees/${employeeId}/salary`, input)).data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: payrollKeys.employeeSalary(employeeId) }),
  });
}

export function usePayrollRuns() {
  return useQuery({
    queryKey: payrollKeys.runs,
    queryFn: async () => (await api.get<{ data: PayrollRunSummary[] }>("/api/v1/payroll-runs")).data.data,
  });
}

export function usePayrollRun(id: number) {
  return useQuery({
    queryKey: payrollKeys.run(id),
    queryFn: async () =>
      (await api.get<{ data: PayrollRunSummary & { employees: PayrollRunEmployeeRow[] } }>(`/api/v1/payroll-runs/${id}`)).data.data,
    refetchInterval: (query) =>
      query.state.data?.status === "calculating" ? 1500 : false,
  });
}

export function usePreflight(period: string, enabled: boolean) {
  return useQuery({
    queryKey: payrollKeys.preflight(period),
    enabled,
    queryFn: async () =>
      (await api.get<{ data: { period: string; passed: boolean; checks: PreflightCheck[] } }>(
        "/api/v1/payroll/preflight",
        { params: { period } },
      )).data.data,
  });
}

export function useCreatePayrollRun() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (period: string) => {
      await ensureCsrf();
      return (await api.post<{ data: PayrollRunSummary }>("/api/v1/payroll-runs", { period })).data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: payrollKeys.runs }),
  });
}

export function usePayrollAction(runId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (action: "submit" | "lock") => {
      await ensureCsrf();
      return (await api.post(`/api/v1/payroll-runs/${runId}/${action}`)).data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: payrollKeys.run(runId) });
      qc.invalidateQueries({ queryKey: payrollKeys.runs });
      qc.invalidateQueries({ queryKey: ["approvals"] });
    },
  });
}

export function useReversePayrollRun(runId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (reason: string) => {
      await ensureCsrf();
      return (await api.post<{ data: PayrollRunSummary }>(`/api/v1/payroll-runs/${runId}/reverse`, { reason })).data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: payrollKeys.run(runId) });
      qc.invalidateQueries({ queryKey: payrollKeys.runs });
    },
  });
}

export function useVariance(runId: number, enabled: boolean) {
  return useQuery({
    queryKey: ["payroll", "variance", runId],
    enabled,
    queryFn: async () => (await api.get<{ data: VarianceReport }>(`/api/v1/payroll-runs/${runId}/variance`)).data.data,
  });
}

/** Same-origin download URL (session cookie rides along). */
export function payrollDownloadUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_API_URL || "";
  return `${base}/api/v1${path}`;
}
