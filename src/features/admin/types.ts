import type { PlatformAbility } from "@/types/auth";

export type TenantStatus = "active" | "suspended" | "cancelled";

export type OnboardingStatus =
  | "not_started"
  | "in_progress"
  | "completed"
  | "skipped";

export interface AdminPersonSummary {
  id: number;
  name: string;
  email: string;
}

export interface AdminTenantSummary {
  id: number;
  name: string;
  slug: string;
  email: string;
  phone: string | null;
  status: TenantStatus;
  trial_ends_at: string | null;
  onboarding_status: OnboardingStatus;
  onboarding_step?: number;
  users_count: number;
  created_at: string;
  updated_at: string;
}

export type AdminTenantDetail = AdminTenantSummary;

export interface PlatformRoleSummary {
  id: number;
  name: string;
  is_owner: boolean;
}

export interface PlatformRole {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  abilities: PlatformAbility[];
  /** Built in (Owner): cannot be edited or deleted. */
  is_system: boolean;
  /** Holders can hand out platform access to others. */
  is_owner: boolean;
  administrators_count?: number;
}

/** One assignable section, as described by the API for the ability picker. */
export interface PlatformAbilityOption {
  key: PlatformAbility;
  label: string;
  description: string;
  assignable: boolean;
}

export interface PlatformAdministrator {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  timezone: string | null;
  status: "active" | "invited" | "disabled";
  is_email_verified: boolean;
  is_current_user?: boolean;
  platform_role?: PlatformRoleSummary | null;
  platform_abilities?: PlatformAbility[];
  created_at: string;
  updated_at?: string;
}

export interface DashboardMetricSet {
  tenants_total: number;
  tenants_active: number;
  tenants_suspended: number;
  tenants_cancelled: number;
  tenant_users_total: number;
  administrators_total: number;
  trials_ending_soon: number;
  onboarding_completed: number;
  onboarding_pending: number;
}

export interface DashboardSeriesPoint {
  label: string;
  count: number;
  period?: string;
  status?: string;
  key?: string;
}

export interface PlatformActivity {
  id: number | string;
  action: string;
  actor: AdminPersonSummary | null;
  subject: {
    type: string;
    id: number | string | null;
    label: string;
  } | null;
  changes: {
    before: Record<string, unknown> | null;
    after: Record<string, unknown> | null;
  } | null;
  reason: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface AdminDashboard {
  generated_at: string;
  metrics: DashboardMetricSet;
  company_growth: DashboardSeriesPoint[];
  status_distribution: DashboardSeriesPoint[];
  onboarding_distribution: DashboardSeriesPoint[];
  recent_tenants: AdminTenantSummary[];
  recent_activity: PlatformActivity[];
}

export interface PaginationMeta {
  current_page: number;
  from: number | null;
  last_page: number;
  per_page: number;
  to: number | null;
  total: number;
}

export interface PaginatedResponse<TData> {
  data: TData[];
  meta: PaginationMeta;
  links?: {
    first?: string | null;
    last?: string | null;
    prev?: string | null;
    next?: string | null;
  };
}

export interface TenantListQuery {
  page: number;
  search?: string;
  status?: TenantStatus | "";
  onboarding_status?: OnboardingStatus | "";
  sort?: string;
}

export interface AdministratorListQuery {
  page: number;
  search?: string;
  status?: PlatformAdministrator["status"] | "";
  sort?: string;
}

export interface ActivityListQuery {
  page: number;
  action?: string;
  subject_type?: string;
  from?: string;
  to?: string;
}

export interface TenantUpdateInput {
  name: string;
  email: string;
  phone?: string | null;
  trial_ends_at?: string | null;
}

export interface AdministratorCreateInput {
  name: string;
  email: string;
  phone?: string | null;
  timezone?: string | null;
  password: string;
  password_confirmation: string;
  platform_role_id: number;
}

export interface AdministratorUpdateInput {
  name: string;
  email: string;
  phone?: string | null;
  timezone?: string | null;
  platform_role_id?: number;
}

export interface PlatformRoleInput {
  name: string;
  description?: string | null;
  abilities: PlatformAbility[];
}
