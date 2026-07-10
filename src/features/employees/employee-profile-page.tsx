"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, MoveRight } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Can } from "@/components/can";
import { FormDialog } from "@/components/form-dialog";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { mapLaravelErrorsToForm, nullableNumber } from "@/lib/forms";
import { useCompanyOptions } from "@/features/company/use-company";
import { useAssignEmployee, useEmployee } from "@/features/employees/use-employees";

const tabs = ["Overview", "Employment history", "Contacts", "Bank & statutory", "Documents"] as const;

const assignmentSchema = z.object({
  branch_id: z.number().nullable(),
  department_id: z.number().nullable(),
  position_id: z.number().nullable(),
  job_grade_id: z.number().nullable(),
  employment_type_id: z.number().nullable(),
  effective_from: z.string().min(1, "Effective date is required"),
});
type AssignmentValues = z.infer<typeof assignmentSchema>;
const assignmentFields = ["branch_id", "department_id", "position_id", "job_grade_id", "employment_type_id", "effective_from"] as const;

function initials(name?: string) {
  return (name ?? "?")
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function SelectField({
  label,
  name,
  register,
  options,
}: {
  label: string;
  name: keyof AssignmentValues;
  register: ReturnType<typeof useForm<AssignmentValues>>["register"];
  options: { id: number; name: string }[];
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={name}>{label}</Label>
      <select
        id={name}
        className="h-8 rounded-md border bg-background px-2 text-sm"
        {...register(name, { setValueAs: nullableNumber })}
      >
        <option value="">None</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>
    </div>
  );
}

function AssignmentDialog({
  employeeId,
  open,
  onOpenChange,
}: {
  employeeId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const assignEmployee = useAssignEmployee(employeeId);
  const { branches, departments, positions, jobGrades, employmentTypes } = useCompanyOptions();
  const form = useForm<AssignmentValues>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      branch_id: null,
      department_id: null,
      position_id: null,
      job_grade_id: null,
      employment_type_id: null,
      effective_from: new Date().toISOString().slice(0, 10),
    },
  });

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="New assignment"
      formId="employee-assignment-form"
      isPending={assignEmployee.isPending}
    >
      <form
        id="employee-assignment-form"
        className="grid gap-4"
        onSubmit={form.handleSubmit(async (values) => {
          try {
            await assignEmployee.mutateAsync(values);
            onOpenChange(false);
            form.reset();
          } catch (error) {
            mapLaravelErrorsToForm(error, form.setError, assignmentFields);
          }
        })}
      >
        {form.formState.errors.root && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {form.formState.errors.root.message}
          </p>
        )}
        <div className="grid gap-2">
          <Label htmlFor="effective_from">Effective from</Label>
          <input
            id="effective_from"
            type="date"
            className="h-8 rounded-md border bg-background px-2 text-sm"
            {...form.register("effective_from")}
          />
          {form.formState.errors.effective_from && (
            <p className="text-sm text-destructive">{form.formState.errors.effective_from.message}</p>
          )}
        </div>
        <SelectField label="Branch" name="branch_id" register={form.register} options={branches.data ?? []} />
        <SelectField label="Department" name="department_id" register={form.register} options={departments.data ?? []} />
        <SelectField
          label="Position"
          name="position_id"
          register={form.register}
          options={(positions.data ?? []).map((position) => ({ id: position.id, name: position.title }))}
        />
        <SelectField label="Job grade" name="job_grade_id" register={form.register} options={jobGrades.data ?? []} />
        <SelectField label="Employment type" name="employment_type_id" register={form.register} options={employmentTypes.data ?? []} />
      </form>
    </FormDialog>
  );
}

export function EmployeeProfilePage() {
  const params = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("Overview");
  const [assignmentOpen, setAssignmentOpen] = useState(false);
  const { data: employee, isLoading } = useEmployee(params.id);

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading employee...</p>;
  }

  if (!employee) {
    return <p className="text-sm text-muted-foreground">Employee not found.</p>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={employee.full_name}
        description={`${employee.employee_number} · ${employee.current_assignment?.department?.name ?? "No department"}`}
        actions={
          <Button variant="outline" render={<Link href="/employees" />}>
            <ArrowLeft className="size-4" />
            Employees
          </Button>
        }
      />

      <section className="flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="size-14">
            <AvatarFallback>{initials(employee.full_name)}</AvatarFallback>
          </Avatar>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-heading text-xl font-semibold">{employee.full_name}</h2>
              <StatusBadge status={employee.employment_status} />
            </div>
            <p className="text-sm text-muted-foreground">
              {employee.current_assignment?.position?.title ?? "No position"} · Hired {employee.hired_at}
            </p>
          </div>
        </div>
        <Can permission="employees.update">
          <Button type="button" onClick={() => setAssignmentOpen(true)}>
            <MoveRight className="size-4" />
            Transfer
          </Button>
        </Can>
      </section>

      <div className="flex gap-1 overflow-x-auto border-b">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium ${
              activeTab === tab ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Overview" && (
        <dl className="grid gap-4 text-sm md:grid-cols-3">
          <div><dt className="text-muted-foreground">Official email</dt><dd>{employee.official_email ?? "-"}</dd></div>
          <div><dt className="text-muted-foreground">Phone</dt><dd>{employee.phone ?? "-"}</dd></div>
          <div><dt className="text-muted-foreground">Location</dt><dd>{[employee.city, employee.state].filter(Boolean).join(", ") || "-"}</dd></div>
          <div><dt className="text-muted-foreground">Branch</dt><dd>{employee.current_assignment?.branch?.name ?? "-"}</dd></div>
          <div><dt className="text-muted-foreground">Department</dt><dd>{employee.current_assignment?.department?.name ?? "-"}</dd></div>
          <div><dt className="text-muted-foreground">Employment type</dt><dd>{employee.current_assignment?.employment_type?.name ?? "-"}</dd></div>
        </dl>
      )}

      {activeTab === "Employment history" && (
        <div className="overflow-hidden rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Department</th>
                <th className="px-3 py-2">Position</th>
                <th className="px-3 py-2">From</th>
                <th className="px-3 py-2">To</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {(employee.employment_records ?? []).map((record) => (
                <tr key={record.id} className="border-t">
                  <td className="px-3 py-3">{record.department?.name ?? "-"}</td>
                  <td className="px-3 py-3">{record.position?.title ?? "-"}</td>
                  <td className="px-3 py-3">{record.effective_from}</td>
                  <td className="px-3 py-3">{record.effective_to ?? "-"}</td>
                  <td className="px-3 py-3">{record.is_current ? <StatusBadge status="active" /> : <StatusBadge status="draft" />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "Contacts" && (
        <div className="grid gap-3 md:grid-cols-2">
          {(employee.contacts ?? []).map((contact) => (
            <div key={contact.id} className="rounded-md border p-3 text-sm">
              <div className="font-medium">{contact.name}</div>
              <div className="text-muted-foreground">{contact.type.replace("_", " ")} · {contact.relationship ?? "-"}</div>
              <div>{contact.phone ?? contact.email ?? "-"}</div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "Bank & statutory" && (
        <div className="grid gap-4 md:grid-cols-2">
          <section className="space-y-2">
            <h3 className="font-heading text-base font-semibold">Bank accounts</h3>
            {(employee.bank_accounts ?? []).map((account) => (
              <div key={account.id} className="rounded-md border p-3 text-sm">
                <div className="font-medium">{account.bank_name}</div>
                <div>{account.account_name} · {account.account_number}</div>
              </div>
            ))}
          </section>
          <section className="space-y-2 text-sm">
            <h3 className="font-heading text-base font-semibold">Statutory</h3>
            <p>TIN: {employee.statutory_details?.tax_id ?? "-"}</p>
            <p>Pension PIN: {employee.statutory_details?.pension_pin ?? "-"}</p>
            <p>NHF: {employee.statutory_details?.nhf_number ?? "-"}</p>
          </section>
        </div>
      )}

      {activeTab === "Documents" && (
        <p className="text-sm text-muted-foreground">Document upload lands with the document engine.</p>
      )}

      <AssignmentDialog employeeId={params.id} open={assignmentOpen} onOpenChange={setAssignmentOpen} />
    </div>
  );
}
