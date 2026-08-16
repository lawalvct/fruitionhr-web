export interface LabelValue {
  label: string;
  value: number;
}

export interface MonthPoint {
  month: number;
  period: string;
  label: string;
}

export interface WorkforceReport {
  total: number;
  active: number;
  on_leave: number;
  suspended: number;
  new_hires: number;
  exits: number;
  by_department: LabelValue[];
  by_gender: LabelValue[];
  movement_by_month: Array<MonthPoint & { hires: number; exits: number }>;
}

export interface AttendanceReport {
  finalized_periods: number;
  present_days: number;
  absent_days: number;
  late_days: number;
  leave_days: number;
  overtime_minutes: number;
  attendance_rate: number | null;
  by_period: Array<
    MonthPoint & {
      finalized: boolean;
      employee_count: number;
      working_days: number;
      present: number;
      late: number;
      absent: number;
      on_leave: number;
      late_minutes: number;
      overtime_minutes: number;
    }
  >;
}

export interface LeaveReport {
  requests: number;
  requested_days: number;
  approved_days: number;
  pending: number;
  by_status: LabelValue[];
  by_type: Array<{ label: string; requests: number; days: number }>;
  by_month: Array<MonthPoint & { days: number }>;
}

export interface PayrollReport {
  completed_runs: number;
  employee_payments: number;
  total_gross: number;
  total_net: number;
  total_statutory: number;
  total_deductions: number;
  total_employer_cost: number;
  by_period: Array<
    MonthPoint & {
      status: string | null;
      employee_count: number;
      gross: number;
      net: number;
      employer_cost: number;
    }
  >;
}

export interface PerformanceReport {
  results: number;
  average_score_basis_points: number | null;
  below_passing: number;
  by_grade: LabelValue[];
  by_month: Array<MonthPoint & { results: number; average_score_basis_points: number | null }>;
}

export interface RecruitmentReport {
  applications: number;
  hired: number;
  open_vacancies: number;
  open_positions: number;
  hire_rate: number | null;
  by_stage: LabelValue[];
  by_source: LabelValue[];
  by_month: Array<MonthPoint & { applications: number; hired: number }>;
}

export interface ReportsOverview {
  year: number;
  generated_at: string;
  access: Record<"workforce" | "attendance" | "leave" | "payroll" | "performance" | "recruitment", boolean>;
  workforce: WorkforceReport | null;
  attendance: AttendanceReport | null;
  leave: LeaveReport | null;
  payroll: PayrollReport | null;
  performance: PerformanceReport | null;
  recruitment: RecruitmentReport | null;
}

export const REPORT_MODULES = [
  "workforce",
  "attendance",
  "leave",
  "payroll",
  "performance",
  "recruitment",
] as const;

export type ReportModule = (typeof REPORT_MODULES)[number];

export type ReportValueFormat =
  | "text"
  | "date"
  | "datetime"
  | "status"
  | "number"
  | "percent"
  | "money"
  | "basis_points"
  | "minutes";

export type ReportScalar = string | number | boolean | null;
export type ReportRecord = Record<string, ReportScalar>;

export interface ReportFilterOption {
  value: string | number;
  label: string;
}

export interface ReportAnalysisFilters {
  available: {
    departments?: ReportFilterOption[];
    periods?: ReportFilterOption[];
    statuses?: ReportFilterOption[];
    stages?: ReportFilterOption[];
  };
  applied: {
    department_id?: number | null;
    period?: string | null;
    status?: string | null;
    stage?: string | null;
  };
}

export interface ReportAnalysisMetric {
  key: string;
  label: string;
  value: number | null;
  format: ReportValueFormat;
  hint?: string;
}

export interface ReportAnalysisSeries {
  key: string;
  label: string;
  format: ReportValueFormat;
}

export interface ReportAnalysisDataset {
  key: string;
  title: string;
  type: "line" | "bar" | "donut";
  x_key: string;
  series: ReportAnalysisSeries[];
  data: ReportRecord[];
}

export interface ReportAnalysisTable {
  title: string;
  columns: Array<{
    key: string;
    label: string;
    format: ReportValueFormat;
  }>;
  rows: ReportRecord[];
  meta: {
    count: number;
    limit: number;
    limited: boolean;
  };
}

export interface ReportAnalysis {
  module: ReportModule;
  title: string;
  year: number;
  generated_at: string;
  filters: ReportAnalysisFilters;
  metrics: ReportAnalysisMetric[];
  datasets: ReportAnalysisDataset[];
  table: ReportAnalysisTable;
}

export function isReportModule(value: string): value is ReportModule {
  return (REPORT_MODULES as readonly string[]).includes(value);
}
