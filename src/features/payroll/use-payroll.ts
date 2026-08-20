"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api, ensureCsrf } from "@/lib/api";

// ── Salary components ────────────────────────────────────────────────────────

/** How a salary component turns into money. Mirrors SalaryComponent::CALC_TYPES. */
export type CalcType = "fixed" | "percent_of_basic" | "percent_of_gross" | "formula";

export function isPercentCalc(calcType: CalcType): boolean {
  return calcType === "percent_of_basic" || calcType === "percent_of_gross";
}

/**
 * What a percentage is measured against, in the words the payslip will bear
 * out. Gross-percent earnings are measured against basic plus the earnings
 * that don't themselves follow gross — a component can't be a percentage of
 * itself — while deductions and employer costs use the finished gross.
 */
export function calcBaseLabel(calcType: CalcType, type?: string): string {
  if (calcType === "percent_of_basic") return "basic";
  if (calcType !== "percent_of_gross") return "";
  return type === "earning" ? "gross (basic + other earnings)" : "gross";
}

/** Short summary of a component's calculation, e.g. "20% of gross". */
export function calcSummary(component: {
  calc_type: CalcType;
  percent?: number | null;
  type?: string;
}): string {
  if (component.calc_type === "formula") return "custom formula";
  if (!isPercentCalc(component.calc_type)) return "fixed";
  const base = component.calc_type === "percent_of_basic" ? "basic" : "gross";
  return `${component.percent ?? 0}% of ${base}`;
}

export interface SalaryComponent {
  id: number;
  name: string;
  code: string;
  type: "earning" | "deduction" | "employer_contributor" | "fringe_benefit";
  calc_type: CalcType;
  percent: number | null;
  is_taxable: boolean;
  is_pensionable: boolean;
  is_active: boolean;
  formula?: {
    has_draft: boolean;
    published_revision_id: number | null;
    published_version: number | null;
    summary: string | null;
    dependency_ids: number[];
  } | null;
}

export type FormulaComparator = "eq" | "neq" | "gt" | "gte" | "lt" | "lte";
export type FormulaOperator = "+" | "-" | "*" | "/";

export type FormulaOperand =
  | { type: "basic" }
  | { type: "component"; component_id: number }
  | { type: "amount"; value_kobo: number }
  | { type: "percentage"; basis_points: number };

export type FormulaToken =
  | FormulaOperand
  | { type: "operator"; value: FormulaOperator }
  | { type: "left_parenthesis" }
  | { type: "right_parenthesis" };

export interface FormulaCondition {
  left: FormulaOperand;
  comparator: FormulaComparator;
  right: FormulaOperand;
}

export interface FormulaRule {
  condition: FormulaCondition | null;
  calculation: FormulaToken[];
}

export interface FormulaDefinition {
  schema_version: 1;
  rules: FormulaRule[];
}

export interface FormulaRevision {
  id: number;
  version: number;
  status: "draft" | "published";
  definition: FormulaDefinition;
  summary: string;
  checksum: string | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  dependency_ids: number[];
}

export interface SalaryFormula {
  component: Pick<SalaryComponent, "id" | "name" | "code" | "type" | "calc_type">;
  advanced_salary_formulas_enabled: boolean;
  draft: FormulaRevision | null;
  published: FormulaRevision | null;
}

export interface FormulaCatalogItem {
  label: string;
  value_type: string;
  token: FormulaToken;
  available: boolean;
  unavailable_reason?: string | null;
}

export interface FormulaCatalogGroup {
  key: string;
  label: string;
  items: FormulaCatalogItem[];
}

export interface FormulaCatalog {
  schema_version: 1;
  limits: Record<string, number>;
  operators: Array<{ value: FormulaOperator; label: string }>;
  comparators: Array<{ value: FormulaComparator; label: string }>;
  groups: FormulaCatalogGroup[];
}

export interface FormulaEvaluation {
  result_kobo: number;
  matched_rule_index: number;
  dependencies: Array<{ id: number; name: string; code: string; amount: number }>;
  inputs: { basic_salary: number };
  summary: string;
}

export interface PayrollSettings {
  advanced_salary_formulas_enabled: boolean;
  active_formula_salary_count: number;
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
    uses_formula?: boolean;
    formula_revision_id?: number | null;
    formula?: {
      revision_id: number;
      version: number;
      summary: string;
      checksum: string;
      dependency_ids: number[];
    } | null;
  }>;
}

export function isReservedBasicSalaryComponent(component: {
  component_name?: string | null;
  component_code?: string | null;
  name?: string | null;
  code?: string | null;
}): boolean {
  const name = component.component_name ?? component.name ?? "";
  const code = component.component_code ?? component.code ?? "";

  return code.trim().toUpperCase() === "BASIC" || name.trim().toLowerCase() === "basic salary";
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
  calculation_failure: {
    code: string | null;
    message: string | null;
    failed_at: string;
    retryable: boolean;
  } | null;
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
  settings: ["payroll", "settings"] as const,
  formulaCatalog: ["payroll", "formula-catalog"] as const,
  formula: (componentId: number) => ["payroll", "formula", componentId] as const,
  runs: ["payroll", "runs"] as const,
  run: (id: number) => ["payroll", "run", id] as const,
  preflight: (period: string) => ["payroll", "preflight", period] as const,
  employeeSalary: (employeeId: number | string) => ["payroll", "employee-salary", String(employeeId)] as const,
  salaryHistory: (employeeId: number | string) => ["payroll", "salary-history", String(employeeId)] as const,
};

export function useSalaryComponents(enabled = true) {
  return useQuery({
    queryKey: payrollKeys.components,
    enabled,
    queryFn: async () => (await api.get<{ data: SalaryComponent[] }>("/api/v1/salary-components")).data.data,
  });
}

export function useSaveSalaryComponent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id?: number; input: Partial<SalaryComponent> }) => {
      await ensureCsrf();
      const url = id ? `/api/v1/salary-components/${id}` : "/api/v1/salary-components";
      return (await api[id ? "put" : "post"]<{ data: SalaryComponent }>(url, input)).data.data;
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

export function useSalaryStructures(enabled = true) {
  return useQuery({
    queryKey: payrollKeys.structures,
    enabled,
    queryFn: async () => (await api.get<{ data: SalaryStructure[] }>("/api/v1/salary-structures")).data.data,
  });
}

export function usePayrollSettings(enabled = true) {
  return useQuery({
    queryKey: payrollKeys.settings,
    enabled,
    queryFn: async () =>
      (await api.get<{ data: PayrollSettings }>("/api/v1/payroll-settings")).data.data,
  });
}

export function useSetAdvancedSalaryFormulas() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (enabled: boolean) => {
      await ensureCsrf();
      const action = enabled ? "enable" : "disable";
      const { data } = await api.post<{ data: PayrollSettings }>(
        `/api/v1/payroll-settings/advanced-salary-formulas/${action}`,
      );
      return data.data;
    },
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: payrollKeys.settings }),
        qc.invalidateQueries({ queryKey: payrollKeys.components }),
        qc.invalidateQueries({ queryKey: payrollKeys.structures }),
      ]);
    },
  });
}

export function useFormulaCatalog(enabled = true) {
  return useQuery({
    queryKey: payrollKeys.formulaCatalog,
    enabled,
    staleTime: 5 * 60 * 1000,
    queryFn: async () =>
      (await api.get<{ data: FormulaCatalog }>("/api/v1/salary-formulas/catalog")).data.data,
  });
}

export function useSalaryFormula(componentId: number | null, enabled = true) {
  return useQuery({
    queryKey: payrollKeys.formula(componentId ?? 0),
    enabled: enabled && componentId !== null,
    queryFn: async () =>
      (
        await api.get<{ data: SalaryFormula }>(
          `/api/v1/salary-components/${componentId}/formula`,
        )
      ).data.data,
  });
}

export function useSaveFormulaDraft(componentId: number) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      definition: FormulaDefinition;
      expected_draft_id: number | null;
      expected_checksum: string | null;
    }) => {
      await ensureCsrf();
      return (
        await api.put<{ data: SalaryFormula }>(
          `/api/v1/salary-components/${componentId}/formula/draft`,
          input,
        )
      ).data.data;
    },
    onSuccess: async (formula) => {
      qc.setQueryData(payrollKeys.formula(componentId), formula);
      await qc.invalidateQueries({ queryKey: payrollKeys.components });
    },
  });
}

export function useEvaluateFormula(componentId: number) {
  return useMutation({
    mutationFn: async (input: {
      definition?: FormulaDefinition;
      basic_salary: number;
      component_values?: Array<{ salary_component_id: number; amount: number }>;
    }) => {
      await ensureCsrf();
      return (
        await api.post<{ data: FormulaEvaluation }>(
          `/api/v1/salary-components/${componentId}/formula/evaluate`,
          input,
        )
      ).data.data;
    },
  });
}

export function usePublishFormula(componentId: number) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: { expected_draft_id: number; expected_checksum: string }) => {
      await ensureCsrf();
      return (
        await api.post<{ data: SalaryFormula }>(
          `/api/v1/salary-components/${componentId}/formula/publish`,
          input,
        )
      ).data.data;
    },
    onSuccess: async (formula) => {
      qc.setQueryData(payrollKeys.formula(componentId), formula);
      await Promise.all([
        qc.invalidateQueries({ queryKey: payrollKeys.components }),
        qc.invalidateQueries({ queryKey: payrollKeys.structures }),
      ]);
    },
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

export function useDeleteSalaryStructure() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await ensureCsrf();
      await api.delete(`/api/v1/salary-structures/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: payrollKeys.structures }),
  });
}

// Employee compensation
export interface EmployeeSalaryComponentOverride {
  salary_component_id: number;
  formula_revision_id?: number | null;
  mode: "override" | "additional" | "excluded";
  amount: number | null;
  percent: number | null;
  component_name: string | null;
  component_code: string | null;
}

export interface EmployeeSalary {
  id: number;
  basic_salary: number;
  effective_from: string;
  effective_to: string | null;
  change_type: "assignment" | "compensation_update" | "basic_salary_increase" | null;
  change_reason: string | null;
  uses_advanced_formula?: boolean;
  status: "past" | "current" | "scheduled";
  structure: { id: number; name: string } | null;
  component_overrides: EmployeeSalaryComponentOverride[];
  breakdown: {
    basic: number;
    earnings: Array<{ code: string; name: string; amount: number }>;
    deductions: Array<{ code: string; name: string; amount: number }>;
    employer_contributions: Array<{ code: string; name: string; amount: number }>;
    fringe_benefits: Array<{ code: string; name: string; amount: number }>;
    gross: number;
    taxable_pay: number;
    pensionable_pay: number;
  };
}

export function useEmployeeSalary(employeeId: number | string, enabled = true) {
  return useQuery({
    queryKey: payrollKeys.employeeSalary(employeeId),
    enabled,
    queryFn: async () =>
      (await api.get<{ data: EmployeeSalary | null }>(`/api/v1/employees/${employeeId}/salary`)).data.data,
  });
}

export function useSalaryHistory(employeeId: number | string, enabled = true) {
  return useQuery({
    queryKey: payrollKeys.salaryHistory(employeeId),
    enabled,
    queryFn: async () =>
      (await api.get<{ data: EmployeeSalary[] }>(`/api/v1/employees/${employeeId}/salary-history`)).data.data,
  });
}

export function useAssignSalary(employeeId: number | string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      basic_salary: number;
      salary_structure_id: number | null;
      effective_from: string;
      component_overrides: Array<{
        salary_component_id: number;
        mode: "override" | "additional" | "excluded";
        amount?: number | null;
        percent?: number | null;
      }>;
    }) => {
      await ensureCsrf();
      return (await api.post(`/api/v1/employees/${employeeId}/salary`, input)).data;
    },
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: payrollKeys.employeeSalary(employeeId) }),
        qc.invalidateQueries({ queryKey: payrollKeys.salaryHistory(employeeId) }),
      ]);
    },
  });
}

export function useIncreaseSalary(employeeId: number | string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { basic_salary: number; effective_from: string; change_reason: string }) => {
      await ensureCsrf();
      return (await api.post(`/api/v1/employees/${employeeId}/salary/increase`, input)).data;
    },
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: payrollKeys.employeeSalary(employeeId) }),
        qc.invalidateQueries({ queryKey: payrollKeys.salaryHistory(employeeId) }),
      ]);
    },
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

export function useRetryPayrollCalculation(runId: number) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await ensureCsrf();
      return (
        await api.post<{ data: PayrollRunSummary }>(
          `/api/v1/payroll-runs/${runId}/retry-calculation`,
        )
      ).data.data;
    },
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: payrollKeys.run(runId) }),
        qc.invalidateQueries({ queryKey: payrollKeys.runs }),
      ]);
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
