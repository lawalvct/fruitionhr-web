// Hand-written until the OpenAPI-generated client lands (see architecture plan §2).

/** Sections of the admin console. Mirrors App\Support\Authorization\PlatformAbilities. */
export type PlatformAbility =
  | "dashboard"
  | "tenants"
  | "users"
  | "support"
  | "billing"
  | "revenue"
  | "careers"
  | "blog"
  | "activity"
  | "administrators";

export interface MeTenant {
  id: number;
  name: string;
  slug: string;
  status: "active" | "suspended" | "cancelled";
  logo_url: string | null;
  onboarding_status: "not_started" | "in_progress" | "completed" | "skipped";
  onboarding_step: number;
}

export interface MeEmployee {
  id: number;
  employee_number: string;
  name: string;
}

export interface Me {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  timezone: string | null;
  bio: string | null;
  avatar_url: string | null;
  is_email_verified: boolean;
  is_super_admin: boolean;
  status: "active" | "invited" | "disabled";
  tenant?: MeTenant;
  employee?: MeEmployee;
  roles?: string[];
  permissions?: string[];
  /** Platform staff only: the name of their role, e.g. "Support agent". */
  platform_role?: string | null;
  /** Platform staff only: the admin sections they can reach. */
  platform_abilities?: PlatformAbility[];
}

export interface LoginInput {
  email: string;
  password: string;
  remember?: boolean;
}

export interface RegisterInput {
  company_name: string;
  name: string;
  email: string;
  phone?: string;
  password: string;
  password_confirmation: string;
}

export interface ResetPasswordInput {
  email: string;
  token: string;
  password: string;
  password_confirmation: string;
}
