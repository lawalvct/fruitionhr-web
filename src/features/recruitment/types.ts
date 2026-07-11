export type RecruitmentStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'open' | 'closed';


export interface Requisition {
  id: number;
  title: string;
  headcount: number;
  reason: string;
  target_start_date: string | null;
  status: RecruitmentStatus;
  department: { id: number; name: string } | null;
  position: { id: number; title: string } | null;
  employment_type: { id: number; name: string } | null;
  requester: { id: number; name: string };
  submitted_at: string | null;
  created_at: string;
}

export interface Vacancy {
  id: number;
  title: string;
  code: string | null;
  description: string;
  requirements: string | null;
  location: string | null;
  positions_available: number;
  opens_at: string | null;
  closes_at: string | null;
  status: RecruitmentStatus;
  applications_count: number;
  requisition: { id: number; title: string };
  employment_type: { id: number; name: string } | null;
}

export type ApplicationStage =
  | 'applied'
  | 'shortlisted'
  | 'interview_scheduled'
  | 'interviewed'
  | 'second_interview'
  | 'assessment'
  | 'offer'
  | 'accepted'
  | 'rejected'
  | 'hired';

export interface RecruitmentApplication {
  id: number;
  stage: ApplicationStage;
  source: string | null;
  applied_at: string;
  applicant: { id: number; name: string; first_name: string; last_name: string; email: string; phone: string | null; city: string | null; state: string | null };
  vacancy: { id: number; title: string };
  stage_history?: Array<{ id: number; from_stage: string | null; to_stage: string; notes: string | null; created_at: string }>;
  interviews?: Array<{ id: number; type: string; scheduled_at: string; location: string | null; meeting_url: string | null; status: string }>;
  offers?: Array<{ id: number; annual_salary: number | null; start_date: string; expires_at: string | null; terms: string | null; status: string }>;
  onboarding_tasks?: Array<{ id: number; title: string; description: string | null; due_date: string | null; status: string }>;
}

export const applicationStages: ApplicationStage[] = [
  'applied', 'shortlisted', 'interview_scheduled', 'interviewed', 'second_interview',
  'assessment', 'offer', 'accepted', 'rejected', 'hired',
];
