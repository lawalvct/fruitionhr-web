"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ImagePlus, Save, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { mapLaravelErrorsToForm, nullableNumber } from "@/lib/forms";
import { toast } from "sonner";
import { useCompanyOptions } from "@/features/company/use-company";
import { useCountries, useStates } from "@/features/reference/use-locations";
import { useEmployee, useUpdateEmployee, useUploadEmployeePhoto, type EmployeeInput } from "@/features/employees/use-employees";

const maxDateOfBirth = `${new Date().getFullYear() - 1}-12-31`;
const schema = z.object({
  first_name: z.string().min(1, "First name is required"),
  middle_name: z.string().optional(),
  last_name: z.string().min(1, "Last name is required"),
  official_email: z.string().optional(),
  personal_email: z.string().optional(),
  phone: z.string().optional(),
  gender: z.string().optional(),
  marital_status: z.string().optional(),
  date_of_birth: z.string().optional().refine((value) => !value || value <= maxDateOfBirth, "Date of birth must be before this year"),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  country_code: z.string().optional(),
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
const inputClass = "h-10 border-slate-300 bg-background shadow-sm dark:border-slate-600";
const selectClass = "h-10 w-full rounded-lg border border-slate-300 bg-background px-3 text-sm shadow-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 dark:border-slate-600";

function emptyToUndefined(value?: string) {
  return value === "" ? undefined : value;
}

export function EmployeeEditPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { data: employee, isLoading } = useEmployee(params.id);
  const updateEmployee = useUpdateEmployee(params.id);
  const uploadEmployeePhoto = useUploadEmployeePhoto();
  const countries = useCountries();
  const form = useForm<FormValues>({ resolver: zodResolver(schema) });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const departmentId = useWatch({ control: form.control, name: "department_id" });
  const { branches, departments, positions, jobGrades, employmentTypes } = useCompanyOptions(departmentId);
  const countryCode = useWatch({ control: form.control, name: "country_code" });
  const states = useStates(countryCode);

  useEffect(() => {
    if (!employee) return;
    form.reset({
      first_name: employee.first_name,
      middle_name: employee.middle_name ?? "",
      last_name: employee.last_name,
      official_email: employee.official_email ?? "",
      personal_email: employee.personal_email ?? "",
      phone: employee.phone ?? "",
      gender: employee.gender ?? "",
      marital_status: employee.marital_status ?? "",
      date_of_birth: employee.date_of_birth ?? "",
      address: employee.address ?? "",
      city: employee.city ?? "",
      state: employee.state ?? "",
      country: employee.country ?? "",
      country_code: employee.country?.toLowerCase() === "nigeria" ? "NG" : "",
      employment_status: employee.employment_status,
      hired_at: employee.hired_at,
      branch_id: employee.current_assignment?.branch_id ?? null,
      department_id: employee.current_assignment?.department_id ?? null,
      position_id: employee.current_assignment?.position_id ?? null,
      job_grade_id: employee.current_assignment?.job_grade_id ?? null,
      employment_type_id: employee.current_assignment?.employment_type_id ?? null,
      effective_from: employee.current_assignment?.effective_from ?? employee.hired_at,
      contact_name: employee.contacts?.[0]?.name ?? "",
      contact_type: employee.contacts?.[0]?.type ?? "emergency",
      contact_relationship: employee.contacts?.[0]?.relationship ?? "",
      contact_phone: employee.contacts?.[0]?.phone ?? "",
      contact_email: employee.contacts?.[0]?.email ?? "",
      bank_name: employee.bank_accounts?.[0]?.bank_name ?? "",
      bank_code: employee.bank_accounts?.[0]?.bank_code ?? "",
      account_number: employee.bank_accounts?.[0]?.account_number ?? "",
      account_name: employee.bank_accounts?.[0]?.account_name ?? "",
      tax_id: employee.statutory_details?.tax_id ?? "",
      pension_pin: employee.statutory_details?.pension_pin ?? "",
      pension_fund_administrator: employee.statutory_details?.pension_fund_administrator ?? "",
      nhf_number: employee.statutory_details?.nhf_number ?? "",
    });
  }, [employee, form]);

  function chooseAvatar(file?: File) {
    if (!file) { setAvatarFile(null); setAvatarPreview(null); return; }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) {
      toast.error("Choose a JPG, PNG, or WebP image up to 5 MB.");
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  useEffect(() => () => {
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
  }, [avatarPreview]);

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading employee...</p>;
  if (!employee) return <p className="text-sm text-muted-foreground">Employee not found.</p>;

  return (
    <form
      className="space-y-6"
      onSubmit={form.handleSubmit(async (values) => {
        const currentAssignment = employee.current_assignment;
        const input: Partial<EmployeeInput> = {
          first_name: values.first_name,
          middle_name: emptyToUndefined(values.middle_name),
          last_name: values.last_name,
          official_email: emptyToUndefined(values.official_email),
          personal_email: emptyToUndefined(values.personal_email),
          phone: emptyToUndefined(values.phone),
          gender: emptyToUndefined(values.gender),
          marital_status: emptyToUndefined(values.marital_status),
          date_of_birth: emptyToUndefined(values.date_of_birth),
          address: emptyToUndefined(values.address),
          city: emptyToUndefined(values.city),
          state: emptyToUndefined(values.state),
          country: emptyToUndefined(values.country),
          employment_status: values.employment_status,
          hired_at: values.hired_at,
          contacts: values.contact_name ? [{ type: values.contact_type, name: values.contact_name, relationship: emptyToUndefined(values.contact_relationship), phone: emptyToUndefined(values.contact_phone), email: emptyToUndefined(values.contact_email) }] : [],
          bank_accounts: values.bank_name && values.account_number && values.account_name ? [{ bank_name: values.bank_name, bank_code: emptyToUndefined(values.bank_code), account_number: values.account_number, account_name: values.account_name, is_primary: true }] : [],
          statutory: { tax_id: emptyToUndefined(values.tax_id), pension_pin: emptyToUndefined(values.pension_pin), pension_fund_administrator: emptyToUndefined(values.pension_fund_administrator), nhf_number: emptyToUndefined(values.nhf_number) },
        };
        const assignmentChanged = currentAssignment?.branch_id !== values.branch_id || currentAssignment?.department_id !== values.department_id || currentAssignment?.position_id !== values.position_id || currentAssignment?.job_grade_id !== values.job_grade_id || currentAssignment?.employment_type_id !== values.employment_type_id;
        if (assignmentChanged) input.assignment = { branch_id: values.branch_id, department_id: values.department_id, position_id: values.position_id, job_grade_id: values.job_grade_id, employment_type_id: values.employment_type_id, effective_from: emptyToUndefined(values.effective_from) ?? values.hired_at };

        try {
          await updateEmployee.mutateAsync(input);
          if (avatarFile) {
            try { await uploadEmployeePhoto.mutateAsync({ employeeId: employee.id, photo: avatarFile }); }
            catch { toast.warning("Employee saved, but the profile picture could not be uploaded."); }
          }
          router.replace(`/employees/${employee.id}`);
        } catch (error) {
          mapLaravelErrorsToForm(error, form.setError, Object.keys(schema.shape) as Array<keyof FormValues>);
        }
      })}
    >
      <PageHeader title="Edit employee" description={`${employee.full_name} · ${employee.employee_number}`} actions={<Button variant="outline" render={<Link href={`/employees/${employee.id}`} />}><ArrowLeft className="size-4" /> Back to profile</Button>} />

      {form.formState.errors.root && <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{form.formState.errors.root.message}</p>}

      <section className="rounded-xl border border-slate-200 bg-card p-4 shadow-sm sm:p-6 dark:border-slate-700">
        <div className="border-b border-slate-200 pb-4 dark:border-slate-700"><h2 className="font-heading text-lg font-semibold">Personal details</h2><p className="mt-1 text-sm text-muted-foreground">Keep the employee&apos;s identity and contact information current.</p></div>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <div className="flex items-center gap-4 border-b border-slate-200 pb-5 md:col-span-3 dark:border-slate-700"><div className="relative grid size-20 place-items-center overflow-hidden rounded-full border-2 border-dashed border-slate-300 bg-slate-50 text-slate-400 dark:border-slate-600 dark:bg-slate-900">{avatarPreview ? <Image src={avatarPreview} alt="Avatar preview" fill unoptimized className="object-cover" /> : <ImagePlus className="size-7" />}</div><div><p className="text-sm font-semibold">Employee avatar <span className="font-normal text-muted-foreground">(optional)</span></p><p className="mt-1 text-xs text-muted-foreground">JPG, PNG, or WebP up to 5 MB.</p><div className="mt-2 flex gap-2"><label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground"><ImagePlus className="size-4" />{avatarFile ? "Change picture" : "Choose picture"}<input ref={fileRef} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => chooseAvatar(event.target.files?.[0])} /></label>{avatarFile && <button type="button" className="inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-sm" onClick={() => chooseAvatar()}><X className="size-4" />Remove</button>}</div></div></div>
          {(["first_name", "middle_name", "last_name", "official_email", "personal_email", "phone"] as const).map((name) => <div key={name} className="grid gap-2"><Label htmlFor={name}>{name.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase())}</Label><Input id={name} className={inputClass} type={name.includes("email") ? "email" : "text"} {...form.register(name)} />{form.formState.errors[name]?.message && <p className="text-sm text-destructive">{form.formState.errors[name]?.message}</p>}</div>)}
          <div className="grid gap-2"><Label htmlFor="gender">Gender</Label><select id="gender" className={selectClass} {...form.register("gender")}><option value="">Select gender</option><option value="male">Male</option><option value="female">Female</option></select></div>
          <div className="grid gap-2"><Label htmlFor="marital_status">Marital status</Label><select id="marital_status" className={selectClass} {...form.register("marital_status")}><option value="">Select marital status</option><option value="single">Single</option><option value="married">Married</option><option value="divorced">Divorced</option><option value="widowed">Widowed</option><option value="separated">Separated</option></select></div>
          <div className="grid gap-2"><Label htmlFor="date_of_birth">Date of birth</Label><Input id="date_of_birth" className={inputClass} type="date" max={maxDateOfBirth} {...form.register("date_of_birth")} /></div>
          <div className="grid gap-2"><Label htmlFor="country_code">Country</Label><select id="country_code" className={selectClass} value={countryCode ?? ""} disabled={countries.isPending} onChange={(event) => { const country = (countries.data ?? []).find((item) => item.code === event.target.value); form.setValue("country_code", event.target.value); form.setValue("country", country?.name ?? ""); form.setValue("state", ""); }}><option value="">{countries.isPending ? "Loading countries..." : "Select country"}</option>{(countries.data ?? []).map((country) => <option key={country.code} value={country.code}>{country.name}</option>)}</select></div>
          <div className="grid gap-2"><Label htmlFor="state">State / region</Label><select id="state" className={selectClass} {...form.register("state")} disabled={!countryCode || states.isPending}><option value="">{states.isPending ? "Loading states..." : "Select state or region"}</option>{(states.data ?? []).map((state) => <option key={state.id} value={state.name}>{state.name}</option>)}</select></div>
          <div className="grid gap-2"><Label htmlFor="city">City</Label><Input id="city" className={inputClass} {...form.register("city")} /></div>
          <div className="grid gap-2 md:col-span-3"><Label htmlFor="address">Address</Label><Input id="address" className={inputClass} {...form.register("address")} /></div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-card p-4 shadow-sm sm:p-6 dark:border-slate-700"><div className="border-b border-slate-200 pb-4 dark:border-slate-700"><h2 className="font-heading text-lg font-semibold">Employment</h2><p className="mt-1 text-sm text-muted-foreground">Update the employee&apos;s status and current assignment.</p></div><div className="mt-5 grid gap-4 md:grid-cols-3"><div className="grid gap-2"><Label htmlFor="employment_status">Status</Label><select id="employment_status" className={selectClass} {...form.register("employment_status")}><option value="active">Active</option><option value="on_leave">On leave</option><option value="suspended">Suspended</option><option value="exited">Exited</option></select></div><div className="grid gap-2"><Label htmlFor="hired_at">Hire date</Label><Input id="hired_at" className={inputClass} type="date" {...form.register("hired_at")} /></div><div className="grid gap-2"><Label htmlFor="effective_from">Assignment effective from</Label><Input id="effective_from" className={inputClass} type="date" {...form.register("effective_from")} /></div><div className="grid gap-2"><Label htmlFor="branch_id">Branch</Label><select id="branch_id" className={selectClass} {...form.register("branch_id", { setValueAs: nullableNumber })}><option value="">None</option>{(branches.data ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div><div className="grid gap-2"><Label htmlFor="department_id">Department</Label><select id="department_id" className={selectClass} {...form.register("department_id", { setValueAs: nullableNumber, onChange: () => form.setValue("position_id", null) })}><option value="">None</option>{(departments.data ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div><div className="grid gap-2"><Label htmlFor="position_id">Position</Label><select id="position_id" className={selectClass} disabled={!departmentId || positions.isPending} {...form.register("position_id", { setValueAs: nullableNumber })}><option value="">{positions.isPending ? "Loading positions..." : "None"}</option>{(positions.data ?? []).map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></div><div className="grid gap-2"><Label htmlFor="job_grade_id">Job grade</Label><select id="job_grade_id" className={selectClass} {...form.register("job_grade_id", { setValueAs: nullableNumber })}><option value="">None</option>{(jobGrades.data ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div><div className="grid gap-2"><Label htmlFor="employment_type_id">Employment type</Label><select id="employment_type_id" className={selectClass} {...form.register("employment_type_id", { setValueAs: nullableNumber })}><option value="">None</option>{(employmentTypes.data ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div></div></section>

      <section className="rounded-xl border border-slate-200 bg-card p-4 shadow-sm sm:p-6 dark:border-slate-700"><div className="border-b border-slate-200 pb-4 dark:border-slate-700"><h2 className="font-heading text-lg font-semibold">Emergency contact</h2><p className="mt-1 text-sm text-muted-foreground">Optional contact information for urgent situations.</p></div><div className="mt-5 grid gap-4 md:grid-cols-3"><div className="grid gap-2"><Label htmlFor="contact_type">Type</Label><select id="contact_type" className={selectClass} {...form.register("contact_type")}><option value="emergency">Emergency</option><option value="next_of_kin">Next of kin</option></select></div><div className="grid gap-2"><Label htmlFor="contact_name">Name</Label><Input id="contact_name" className={inputClass} {...form.register("contact_name")} /></div><div className="grid gap-2"><Label htmlFor="contact_relationship">Relationship</Label><select id="contact_relationship" className={selectClass} {...form.register("contact_relationship")}><option value="">Select relationship</option><option value="spouse">Spouse</option><option value="parent">Parent</option><option value="child">Child</option><option value="sibling">Sibling</option><option value="guardian">Guardian</option><option value="relative">Relative</option><option value="friend">Friend</option><option value="colleague">Colleague</option><option value="other">Other</option></select></div><div className="grid gap-2"><Label htmlFor="contact_phone">Phone</Label><Input id="contact_phone" className={inputClass} {...form.register("contact_phone")} /></div><div className="grid gap-2"><Label htmlFor="contact_email">Email</Label><Input id="contact_email" className={inputClass} type="email" {...form.register("contact_email")} /></div></div></section>

      <section className="rounded-xl border border-slate-200 bg-card p-4 shadow-sm sm:p-6 dark:border-slate-700"><div className="border-b border-slate-200 pb-4 dark:border-slate-700"><h2 className="font-heading text-lg font-semibold">Bank and statutory</h2><p className="mt-1 text-sm text-muted-foreground">Maintain payroll and statutory information.</p></div><div className="mt-5 grid gap-4 md:grid-cols-3"><div className="grid gap-2"><Label htmlFor="bank_name">Bank name</Label><Input id="bank_name" className={inputClass} {...form.register("bank_name")} /></div><div className="grid gap-2"><Label htmlFor="bank_code">Bank code</Label><Input id="bank_code" className={inputClass} {...form.register("bank_code")} /></div><div className="grid gap-2"><Label htmlFor="account_number">Account number</Label><Input id="account_number" className={inputClass} {...form.register("account_number")} /></div><div className="grid gap-2"><Label htmlFor="account_name">Account name</Label><Input id="account_name" className={inputClass} {...form.register("account_name")} /></div><div className="grid gap-2"><Label htmlFor="tax_id">Tax ID</Label><Input id="tax_id" className={inputClass} {...form.register("tax_id")} /></div><div className="grid gap-2"><Label htmlFor="pension_pin">Pension PIN</Label><Input id="pension_pin" className={inputClass} {...form.register("pension_pin")} /></div><div className="grid gap-2"><Label htmlFor="pension_fund_administrator">PFA</Label><Input id="pension_fund_administrator" className={inputClass} {...form.register("pension_fund_administrator")} /></div><div className="grid gap-2"><Label htmlFor="nhf_number">NHF number</Label><Input id="nhf_number" className={inputClass} {...form.register("nhf_number")} /></div></div></section>

      <div className="flex justify-end border-t pt-5"><Button type="submit" disabled={updateEmployee.isPending || uploadEmployeePhoto.isPending}><Save className="size-4" />{uploadEmployeePhoto.isPending ? "Uploading picture..." : updateEmployee.isPending ? "Saving..." : "Save changes"}</Button></div>
    </form>
  );
}
