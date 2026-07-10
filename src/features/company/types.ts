export interface Branch {
  id: number;
  name: string;
  code: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  is_active: boolean;
}

export interface Department {
  id: number;
  name: string;
  code: string | null;
  branch_id: number | null;
  branch?: { id: number; name: string };
  parent_id: number | null;
  parent?: { id: number; name: string };
  is_active: boolean;
}

export interface JobGrade {
  id: number;
  name: string;
  code: string | null;
  level: number;
  min_salary: number | null;
  max_salary: number | null;
  is_active: boolean;
}

export interface Position {
  id: number;
  title: string;
  code: string | null;
  department_id: number | null;
  department?: { id: number; name: string };
  job_grade_id: number | null;
  job_grade?: { id: number; name: string; level: number };
  description: string | null;
  is_active: boolean;
}

export interface EmploymentType {
  id: number;
  name: string;
  is_active: boolean;
}

export interface HolidayDate {
  id?: number;
  holiday_calendar_id?: number;
  date: string;
  name: string;
  is_recurring: boolean;
}

export interface HolidayCalendar {
  id: number;
  year: number;
  name: string;
  dates: HolidayDate[];
}

export type CompanyResource =
  | Branch
  | Department
  | JobGrade
  | Position
  | EmploymentType
  | HolidayCalendar;
