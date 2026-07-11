export interface PerformanceCategory { id: number; name: string; description: string | null; is_active: boolean }
export interface PerformanceKpi { id: number; name: string; description: string | null; measurement_unit: string | null; target_description: string | null; is_active: boolean; category: { id: number; name: string } }
export interface RatingScale { id: number; name: string; description: string | null; is_active: boolean; options: Array<{ id: number; label: string; min_score_basis_points: number; max_score_basis_points: number }> }
export interface AppraisalTemplate {
  id: number;
  name: string;
  description: string | null;
  is_active: boolean;
  rating_scale: { id: number; name: string };
  items: Array<{ id: number; weight: number; kpi: { id: number; name: string; category: string | null } }>;
}
export interface AppraisalCycle {
  id: number;
  name: string;
  starts_at: string;
  ends_at: string;
  review_starts_at: string | null;
  review_ends_at: string | null;
  status: 'draft' | 'open' | 'closed';
  assignments_count: number;
}
export interface AppraisalAssignment {
  id: number;
  status: 'pending' | 'in_progress' | 'completed';
  due_date: string | null;
  employee: { id: number; name: string };
  cycle: { id: number; name: string };
  template: {
    id: number;
    name: string;
    items: Array<{ id: number; weight: number; kpi: { id: number; name: string; description: string | null; category: string | null } }>;
  };
  reviewers: Array<{ id: number; reviewer_type: string; weight: number; status: string; is_mine: boolean; user: { id: number; name: string } }>;
  result: { id: number; final_score_basis_points: number; grade: string; status: string; outcomes: Array<{ id: number; type: string; notes: string | null }> } | null;
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
