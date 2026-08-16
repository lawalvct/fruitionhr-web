export type VacancyStatus = "draft" | "open" | "closed";

export interface PlatformCompanyRef {
  id: number;
  name: string;
  slug: string;
}

export interface PlatformVacancy {
  id: number;
  title: string;
  status: VacancyStatus;
  visibility: string;
  location: string | null;
  positions_available: number;
  public_slug: string | null;
  opens_at: string | null;
  closes_at: string | null;
  applications_count: number;
  employment_type?: string | null;
  company?: PlatformCompanyRef;
  created_at: string | null;
}

export interface PlatformApplication {
  id: number;
  stage: string;
  source: string | null;
  applied_at: string | null;
  hired_at: string | null;
  applicant?: { id: number; name: string; email: string | null; phone: string | null } | null;
  vacancy?: { id: number; title: string } | null;
  company?: PlatformCompanyRef;
}

export interface RecruitmentSummary {
  total_vacancies: number;
  open_vacancies: number;
  total_applications: number;
  hired: number;
  hiring_companies: number;
}

export interface VacancyQuery {
  page: number;
  search: string;
  status: VacancyStatus | "";
}

export interface ApplicationQuery {
  page: number;
  search: string;
  stage: string;
}

export const APPLICATION_STAGES = [
  "applied",
  "shortlisted",
  "interview_scheduled",
  "interviewed",
  "second_interview",
  "assessment",
  "offer",
  "accepted",
  "rejected",
  "hired",
] as const;
