import type { PlatformCompanyRef } from "./recruitment-types";

export type PlatformUserStatus = "active" | "invited" | "disabled";

export interface PlatformUser {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  status: PlatformUserStatus;
  is_super_admin: boolean;
  is_email_verified: boolean;
  email_verified_at: string | null;
  company?: PlatformCompanyRef | null;
  created_at: string | null;
}

export interface PlatformUserSummary {
  total: number;
  active: number;
  invited: number;
  unverified: number;
}

export interface PlatformUserQuery {
  page: number;
  search: string;
  status: PlatformUserStatus | "";
  type: "administrator" | "tenant" | "";
  /** "" means no filter at all — not "unverified". */
  verified: "" | "1" | "0";
  /** Set when arriving from a company page, to show only that company's users. */
  tenant_id?: number;
}
