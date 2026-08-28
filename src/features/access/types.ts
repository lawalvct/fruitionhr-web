export interface AccessPermission {
  name: string;
  label: string;
  /** One line on what the permission actually unlocks. Null if uncatalogued. */
  description: string | null;
  action: string;
}

export interface PermissionGroup {
  module: string;
  label: string;
  permissions: AccessPermission[];
}

export interface AccessRole {
  id: number;
  name: string;
  label: string;
  is_system: boolean;
  is_owner: boolean;
  user_count: number;
  permissions: string[];
}

export interface AccessUserRole {
  id: number;
  name: string;
  label: string;
}

export interface AccessUser {
  id: number;
  name: string;
  email: string;
  status: "active" | "invited" | "disabled";
  is_current_user: boolean;
  roles: AccessUserRole[];
  employee?: {
    id: number;
    employee_number: string;
    name: string;
  };
}

export interface RoleInput {
  name: string;
  permissions: string[];
}
