export interface PerformanceCategory { id: number; name: string; description: string | null; is_active: boolean }
export interface PerformanceKpi {
  id: number;
  name: string;
  department: string | null;
  type: 'qualitative' | 'quantitative';
  description: string | null;
  measurement_unit: string | null;
  target_description: string | null;
  descriptor_low: string | null;
  descriptor_mid: string | null;
  descriptor_high: string | null;
  is_mandatory: boolean;
  is_active: boolean;
  category: { id: number; name: string };
}
export interface RatingScale { id: number; name: string; description: string | null; is_active: boolean; options: Array<{ id: number; label: string; min_score_basis_points: number; max_score_basis_points: number }> }
export interface AppraisalTemplate {
  id: number;
  name: string;
  department: string | null;
  target_role: string | null;
  min_passing_basis_points: number | null;
  description: string | null;
  is_active: boolean;
  rating_scale: { id: number; name: string };
  items: Array<{ id: number; weight: number; is_mandatory: boolean; kpi: { id: number; name: string; category: string | null } }>;
}
export const APPRAISAL_TYPES = [
  'annual', 'mid_year', 'quarterly', 'monthly_checkin', 'probation', 'promotion',
  'salary_review', 'training_needs', 'competency', 'leadership', 'feedback_360',
  'project', 'goal_okr', 'behavioural', 'exit', 'contract_renewal', 'succession', 'sales',
] as const;
export type AppraisalType = (typeof APPRAISAL_TYPES)[number];
export interface AppraisalCycle {
  id: number;
  name: string;
  appraisal_type: AppraisalType;
  starts_at: string;
  ends_at: string;
  review_starts_at: string | null;
  review_ends_at: string | null;
  status: 'draft' | 'open' | 'closed';
  self_review_enabled: boolean;
  calibration_enabled: boolean;
  appeal_window_days: number;
  assignments_count: number;
}
export type ResultStatus =
  | 'pending_calibration' | 'pending_approval' | 'approved' | 'rejected'
  | 'acknowledged' | 'appealed' | 'appeal_resolved' | 'final';
export interface AppraisalResult {
  id: number;
  final_score_basis_points: number;
  raw_score_basis_points: number | null;
  grade: string;
  status: ResultStatus;
  approved_at: string | null;
  acknowledged_at: string | null;
  rejected_reason: string | null;
  is_my_result: boolean;
  outcomes: Array<{ id: number; type: string; notes: string | null }>;
  appeals: Array<{ id: number; status: string; reason: string; resolution_note: string | null }>;
}
export interface AppraisalAssignment {
  id: number;
  status: 'pending' | 'in_progress' | 'completed';
  due_date: string | null;
  is_my_appraisal: boolean;
  employee: { id: number; name: string };
  cycle: { id: number; name: string };
  template: {
    id: number;
    name: string;
    items: Array<{ id: number; weight: number; is_mandatory: boolean; kpi: { id: number; name: string; description: string | null; category: string | null } }>;
  };
  reviewers: Array<{ id: number; reviewer_type: string; weight: number; status: string; is_mine: boolean; user: { id: number; name: string } }>;
  result: AppraisalResult | null;
}
export interface PipMilestone { id: number; description: string; due_at: string; status: 'pending' | 'completed' | 'missed'; notes: string | null }
export interface Pip {
  id: number;
  employee: { id: number; name: string };
  reason: string;
  status: 'draft' | 'active' | 'closed_successful' | 'closed_unsuccessful';
  starts_at: string;
  ends_at: string;
  outcome_note: string | null;
  milestones: PipMilestone[];
}
export interface PerformanceSummary {
  results_count: number;
  average_score_basis_points: number | null;
  below_passing_count: number;
  distribution: Record<string, number>;
  kpi_averages: Record<string, number>;
}
export interface Goal {
  id: number;
  level: 'company' | 'department' | 'individual';
  title: string;
  description: string | null;
  weight: number;
  target_value: number | null;
  current_value: number | null;
  measurement_unit: string | null;
  progress: number;
  status: string;
  starts_at: string | null;
  due_at: string | null;
  department: { id: number; name: string } | null;
  employee: { id: number; name: string } | null;
  owner: { id: number; name: string } | null;
  checkins: Array<{ id: number; progress: number; current_value: number | null; comment: string | null; created_at: string }>;
}
