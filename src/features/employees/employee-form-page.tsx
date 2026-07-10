"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm, type FieldErrors, type UseFormRegister } from "react-hook-form";
import { z } from "zod";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { mapLaravelErrorsToForm, nullableNumber } from "@/lib/forms";
import { useCompanyOptions } from "@/features/company/use-company";
import { useCreateEmployee, type EmployeeInput } from "@/features/employees/use-employees";

const schema = z.object({
  first_name: z.string().min(1, "First name is required"),
  middle_name: z.string().optional(),
  last_name: z.string().min(1, "Last name is required"),
  official_email: z.string().optional(),
  personal_email: z.string().optional(),
  phone: z.string().optional(),
  gender: z.string().optional(),
  date_of_birth: z.string().optional(),
  marital_status: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  employment_status: z.enum(["active", "on_leave", "suspended", "exited"]),
  hired_at: z.string().min(1, "Hire date is required"),
  branch_id: z.number().nullable(),
  department_id: z.number().nullable(),
  position_id: z.number().nullable(),
  job_grade_id: z.number().nullable(),
  employment_type_id: z.number().nullable(),
  effective_from: z.string().optional(),
  contact_name: z.string().optional(),
  contact_type: z.enum(["emergency", "next_of_kin"]),
  contact_relationship: z.string().optional(),
  contact_phone: z.string().optional(),
  contact_email: z.string().optional(),
  bank_name: z.string().optional(),
  bank_code: z.string().optional(),
  account_number: z.string().optional(),
  account_name: z.string().optional(),
  tax_id: z.string().optional(),
  pension_pin: z.string().optional(),
  pension_fund_administrator: z.string().optional(),
  nhf_number: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;
const fieldNames = Object.keys(schema.shape) as Array<keyof FormValues>;

function Field({
  label,
  name,
  register,
  errors,
  type = "text",
}: {
  label: string;
  name: keyof FormValues;
  register: UseFormRegister<FormValues>;
  errors: FieldErrors<FormValues>;
  type?: string;
}) {
  const error = errors[name]?.message?.toString();

  return (
    <div className="grid gap-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} type={type} {...register(name)} />
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

function SelectField({
  label,
  name,
  register,
  errors,
  options,
}: {
  label: string;
  name: keyof FormValues;
  register: UseFormRegister<FormValues>;
  errors: FieldErrors<FormValues>;
  options: { id: number; name: string }[];
}) {
  const error = errors[name]?.message?.toString();

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
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 border-t pt-5">
      <h2 className="font-heading text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function emptyToUndefined(value?: string) {
  return value === "" ? undefined : value;
}

export function EmployeeFormPage() {
  const router = useRouter();
  const createEmployee = useCreateEmployee();
  const { branches, departments, positions, jobGrades, employmentTypes } = useCompanyOptions();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      first_name: "",
      middle_name: "",
      last_name: "",
      official_email: "",
      personal_email: "",
      phone: "",
      gender: "",
      date_of_birth: "",
      marital_status: "",
      address: "",
      city: "",
      state: "",
      employment_status: "active",
      hired_at: new Date().toISOString().slice(0, 10),
      branch_id: null,
      department_id: null,
      position_id: null,
      job_grade_id: null,
      employment_type_id: null,
      effective_from: "",
      contact_name: "",
      contact_type: "emergency",
      contact_relationship: "",
      contact_phone: "",
      contact_email: "",
      bank_name: "",
      bank_code: "",
      account_number: "",
      account_name: "",
      tax_id: "",
      pension_pin: "",
      pension_fund_administrator: "",
      nhf_number: "",
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    const input: EmployeeInput = {
      first_name: values.first_name,
      middle_name: emptyToUndefined(values.middle_name),
      last_name: values.last_name,
      official_email: emptyToUndefined(values.official_email),
      personal_email: emptyToUndefined(values.personal_email),
      phone: emptyToUndefined(values.phone),
      gender: emptyToUndefined(values.gender),
      date_of_birth: emptyToUndefined(values.date_of_birth),
      marital_status: emptyToUndefined(values.marital_status),
      address: emptyToUndefined(values.address),
      city: emptyToUndefined(values.city),
      state: emptyToUndefined(values.state),
      employment_status: values.employment_status,
      hired_at: values.hired_at,
      assignment: {
        branch_id: values.branch_id,
        department_id: values.department_id,
        position_id: values.position_id,
        job_grade_id: values.job_grade_id,
        employment_type_id: values.employment_type_id,
        effective_from: emptyToUndefined(values.effective_from) ?? values.hired_at,
      },
      contacts: values.contact_name
        ? [
            {
              type: values.contact_type,
              name: values.contact_name,
              relationship: emptyToUndefined(values.contact_relationship),
              phone: emptyToUndefined(values.contact_phone),
              email: emptyToUndefined(values.contact_email),
            },
          ]
        : [],
      bank_accounts: values.bank_name && values.account_number && values.account_name
        ? [
            {
              bank_name: values.bank_name,
              bank_code: emptyToUndefined(values.bank_code),
              account_number: values.account_number,
              account_name: values.account_name,
              is_primary: true,
            },
          ]
        : [],
      statutory: {
        tax_id: emptyToUndefined(values.tax_id),
        pension_pin: emptyToUndefined(values.pension_pin),
        pension_fund_administrator: emptyToUndefined(values.pension_fund_administrator),
        nhf_number: emptyToUndefined(values.nhf_number),
      },
    };

    try {
      const employee = await createEmployee.mutateAsync(input);
      router.replace(`/employees/${employee.id}`);
    } catch (error) {
      mapLaravelErrorsToForm(error, form.setError, fieldNames, {
        "assignment.branch_id": "branch_id",
        "assignment.department_id": "department_id",
        "assignment.position_id": "position_id",
        "assignment.job_grade_id": "job_grade_id",
        "assignment.employment_type_id": "employment_type_id",
        "assignment.effective_from": "effective_from",
        "statutory.tax_id": "tax_id",
        "statutory.pension_pin": "pension_pin",
        "statutory.pension_fund_administrator": "pension_fund_administrator",
        "statutory.nhf_number": "nhf_number",
      });
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <PageHeader
        title="Add employee"
        description="Create the employee master record and initial employment assignment."
        actions={
          <Button type="submit" disabled={createEmployee.isPending}>
            <Save className="size-4" />
            {createEmployee.isPending ? "Saving..." : "Save employee"}
          </Button>
        }
      />

      {form.formState.errors.root && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {form.formState.errors.root.message}
        </p>
      )}

      <Section title="Personal">
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="First name" name="first_name" register={form.register} errors={form.formState.errors} />
          <Field label="Middle name" name="middle_name" register={form.register} errors={form.formState.errors} />
          <Field label="Last name" name="last_name" register={form.register} errors={form.formState.errors} />
          <Field label="Official email" name="official_email" type="email" register={form.register} errors={form.formState.errors} />
          <Field label="Personal email" name="personal_email" type="email" register={form.register} errors={form.formState.errors} />
          <Field label="Phone" name="phone" register={form.register} errors={form.formState.errors} />
          <Field label="Gender" name="gender" register={form.register} errors={form.formState.errors} />
          <Field label="Date of birth" name="date_of_birth" type="date" register={form.register} errors={form.formState.errors} />
          <Field label="Marital status" name="marital_status" register={form.register} errors={form.formState.errors} />
          <Field label="City" name="city" register={form.register} errors={form.formState.errors} />
          <Field label="State" name="state" register={form.register} errors={form.formState.errors} />
          <Field label="Address" name="address" register={form.register} errors={form.formState.errors} />
        </div>
      </Section>

      <Section title="Employment">
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Hire date" name="hired_at" type="date" register={form.register} errors={form.formState.errors} />
          <Field label="Effective from" name="effective_from" type="date" register={form.register} errors={form.formState.errors} />
          <div className="grid gap-2">
            <Label htmlFor="employment_status">Status</Label>
            <select id="employment_status" className="h-8 rounded-md border bg-background px-2 text-sm" {...form.register("employment_status")}>
              <option value="active">Active</option>
              <option value="on_leave">On leave</option>
              <option value="suspended">Suspended</option>
              <option value="exited">Exited</option>
            </select>
          </div>
          <SelectField label="Branch" name="branch_id" register={form.register} errors={form.formState.errors} options={branches.data ?? []} />
          <SelectField label="Department" name="department_id" register={form.register} errors={form.formState.errors} options={departments.data ?? []} />
          <SelectField
            label="Position"
            name="position_id"
            register={form.register}
            errors={form.formState.errors}
            options={(positions.data ?? []).map((position) => ({ id: position.id, name: position.title }))}
          />
          <SelectField label="Job grade" name="job_grade_id" register={form.register} errors={form.formState.errors} options={jobGrades.data ?? []} />
          <SelectField label="Employment type" name="employment_type_id" register={form.register} errors={form.formState.errors} options={employmentTypes.data ?? []} />
        </div>
      </Section>

      <Section title="Contacts">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="grid gap-2">
            <Label htmlFor="contact_type">Type</Label>
            <select id="contact_type" className="h-8 rounded-md border bg-background px-2 text-sm" {...form.register("contact_type")}>
              <option value="emergency">Emergency</option>
              <option value="next_of_kin">Next of kin</option>
            </select>
          </div>
          <Field label="Name" name="contact_name" register={form.register} errors={form.formState.errors} />
          <Field label="Relationship" name="contact_relationship" register={form.register} errors={form.formState.errors} />
          <Field label="Phone" name="contact_phone" register={form.register} errors={form.formState.errors} />
          <Field label="Email" name="contact_email" type="email" register={form.register} errors={form.formState.errors} />
        </div>
      </Section>

      <Section title="Bank and statutory">
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Bank name" name="bank_name" register={form.register} errors={form.formState.errors} />
          <Field label="Bank code" name="bank_code" register={form.register} errors={form.formState.errors} />
          <Field label="Account number" name="account_number" register={form.register} errors={form.formState.errors} />
          <Field label="Account name" name="account_name" register={form.register} errors={form.formState.errors} />
          <Field label="Tax ID" name="tax_id" register={form.register} errors={form.formState.errors} />
          <Field label="Pension PIN" name="pension_pin" register={form.register} errors={form.formState.errors} />
          <Field label="PFA" name="pension_fund_administrator" register={form.register} errors={form.formState.errors} />
          <Field label="NHF number" name="nhf_number" register={form.register} errors={form.formState.errors} />
        </div>
      </Section>
    </form>
  );
}
