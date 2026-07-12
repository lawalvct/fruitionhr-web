"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api, ensureCsrf } from "@/lib/api";
import type { Employee } from "@/features/employees/types";

interface ResourceResponse<TData> {
  data: TData;
}

export const employeeKeys = {
  all: ["employees"] as const,
  detail: (id: number | string) => ["employees", String(id)] as const,
};

export interface EmployeeInput {
  first_name: string;
  middle_name?: string;
  last_name: string;
  official_email?: string;
  personal_email?: string;
  phone?: string;
  gender?: string;
  date_of_birth?: string;
  marital_status?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  employment_status: Employee["employment_status"];
  hired_at: string;
  assignment?: {
    branch_id?: number | null;
    department_id?: number | null;
    position_id?: number | null;
    job_grade_id?: number | null;
    employment_type_id?: number | null;
    supervisor_id?: number | null;
    effective_from?: string;
  };
  contacts?: Array<{
    type: "emergency" | "next_of_kin";
    name: string;
    relationship?: string;
    phone?: string;
    email?: string;
    address?: string;
  }>;
  bank_accounts?: Array<{
    bank_name: string;
    bank_code?: string;
    account_number: string;
    account_name: string;
    is_primary: boolean;
  }>;
  statutory?: {
    tax_id?: string;
    pension_pin?: string;
    pension_fund_administrator?: string;
    nhf_number?: string;
  };
}

export function useEmployee(id: string) {
  return useQuery({
    queryKey: employeeKeys.detail(id),
    queryFn: async () => {
      const { data } = await api.get<ResourceResponse<Employee>>(`/api/v1/employees/${id}`);
      return data.data;
    },
  });
}

export function useEmployeePhoto(photoUrl: string | null | undefined) {
  return useQuery({
    queryKey: ["employees", "photo", photoUrl],
    enabled: Boolean(photoUrl),
    queryFn: async () => {
      const { data } = await api.get<Blob>(photoUrl!, { responseType: "blob" });
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: EmployeeInput) => {
      await ensureCsrf();
      const { data } = await api.post<ResourceResponse<Employee>>("/api/v1/employees", input);
      return data.data;
    },
    onSuccess: (employee) => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.all });
      queryClient.setQueryData(employeeKeys.detail(employee.id), employee);
    },
  });
}

export function useUpdateEmployee(id: number | string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: Partial<EmployeeInput>) => {
      await ensureCsrf();
      const { data } = await api.put<ResourceResponse<Employee>>(`/api/v1/employees/${id}`, input);
      return data.data;
    },
    onSuccess: (employee) => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.all });
      queryClient.setQueryData(employeeKeys.detail(employee.id), employee);
    },
  });
}

export function useUploadEmployeePhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ employeeId, photo }: { employeeId: number; photo: File }) => {
      await ensureCsrf();
      const form = new FormData();
      form.append("photo", photo);
      const { data } = await api.post<ResourceResponse<Employee>>(`/api/v1/employees/${employeeId}/photo`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data.data;
    },
    onSuccess: (employee) => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.all });
      queryClient.setQueryData(employeeKeys.detail(employee.id), employee);
    },
  });
}

export interface EmployeeImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

export function useImportEmployees() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      await ensureCsrf();
      const form = new FormData();
      form.append("file", file);
      const { data } = await api.post<{ data: EmployeeImportResult }>("/api/v1/employees/import", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: employeeKeys.all }),
  });
}

export function useAssignEmployee(id: number | string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: NonNullable<EmployeeInput["assignment"]> & { effective_from: string }) => {
      await ensureCsrf();
      const { data } = await api.post(`/api/v1/employees/${id}/assignments`, input);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.all });
      queryClient.invalidateQueries({ queryKey: employeeKeys.detail(id) });
    },
  });
}
