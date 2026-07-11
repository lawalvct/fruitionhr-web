// Hand-written until the OpenAPI-generated client lands (see architecture plan §2).

export interface MeTenant {
  id: number;
  name: string;
  slug: string;
  status: "active" | "suspended" | "cancelled";
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
  is_super_admin: boolean;
  status: "active" | "invited" | "disabled";
  tenant?: MeTenant;
  employee?: MeEmployee;
  roles?: string[];
  permissions?: string[];
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
