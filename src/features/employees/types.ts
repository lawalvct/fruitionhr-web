export interface EmployeeAssignment {
  id: number;
  employee_id: number;
  branch_id: number | null;
  branch?: { id: number; name: string } | null;
  department_id: number | null;
  department?: { id: number; name: string } | null;
  position_id: number | null;
  position?: { id: number; title: string } | null;
  job_grade_id: number | null;
  job_grade?: { id: number; name: string } | null;
  employment_type_id: number | null;
  employment_type?: { id: number; name: string } | null;
  supervisor_id: number | null;
  supervisor?: { id: number; employee_number: string; name: string } | null;
  effective_from: string;
  effective_to: string | null;
  is_current: boolean;
}

export interface EmployeeContact {
  id?: number;
  type: "emergency" | "next_of_kin";
  name: string;
  relationship?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
}

export interface EmployeeBankAccount {
  id?: number;
  bank_name: string;
  bank_code?: string | null;
  account_number: string;
  account_name: string;
  is_primary: boolean;
}

export interface EmployeeStatutoryDetails {
  id?: number;
  tax_id?: string | null;
  pension_pin?: string | null;
  pension_fund_administrator?: string | null;
  nhf_number?: string | null;
}

export interface Employee {
  id: number;
  employee_number: string;
  user_id: number | null;
  ess_account?: { email: string; status: "invited" | "active" | "disabled" } | null;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  full_name: string;
  official_email: string | null;
  personal_email: string | null;
  phone: string | null;
  gender: string | null;
  date_of_birth: string | null;
  marital_status: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  photo_path: string | null;
  photo_url: string | null;
  employment_status: "active" | "on_leave" | "suspended" | "exited";
  hired_at: string;
  exited_at: string | null;
  current_assignment?: EmployeeAssignment | null;
  current_basic_salary?: number | null;
  employment_records?: EmployeeAssignment[];
  contacts?: EmployeeContact[];
  bank_accounts?: EmployeeBankAccount[];
  statutory_details?: EmployeeStatutoryDetails | null;
}
