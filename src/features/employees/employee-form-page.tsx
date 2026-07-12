"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, Check, ImagePlus, Save, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useForm, useWatch, type FieldErrors, type UseFormRegister } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { mapLaravelErrorsToForm, nullableNumber } from "@/lib/forms";
import { useCompanyOptions } from "@/features/company/use-company";
import { useCreateEmployee, useUploadEmployeePhoto, type EmployeeInput } from "@/features/employees/use-employees";
import { useCountries, useStates } from "@/features/reference/use-locations";

const maxDateOfBirth = `${new Date().getFullYear() - 1}-12-31`;

const schema = z.object({
  first_name: z.string().min(1, "First name is required"),
  middle_name: z.string().optional(),
  last_name: z.string().min(1, "Last name is required"),
  official_email: z.string().optional(),
  personal_email: z.string().optional(),
  phone: z.string().optional(),
  gender: z.string().optional(),
  date_of_birth: z.string().optional().refine((value) => !value || value <= maxDateOfBirth, "Date of birth must be before this year"),
  marital_status: z.string().optional(),
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
const fieldNames = Object.keys(schema.shape) as Array<keyof FormValues>;

const wizardSteps = [
  { title: "Personal", description: "Identity and contact details", fields: ["first_name", "middle_name", "last_name", "official_email", "personal_email", "phone", "gender", "date_of_birth", "marital_status", "address", "city", "state", "country", "country_code"] as Array<keyof FormValues> },
  { title: "Employment", description: "Role, status, and assignment", fields: ["hired_at", "effective_from", "employment_status", "branch_id", "department_id", "position_id", "job_grade_id", "employment_type_id"] as Array<keyof FormValues> },
  { title: "Contacts", description: "Emergency contact information", fields: ["contact_type", "contact_name", "contact_relationship", "contact_phone", "contact_email"] as Array<keyof FormValues> },
  { title: "Payroll details", description: "Bank and statutory details", fields: ["bank_name", "bank_code", "account_number", "account_name", "tax_id", "pension_pin", "pension_fund_administrator", "nhf_number"] as Array<keyof FormValues> },
] as const;

function Field({
  label,
  name,
  register,
  errors,
  type = "text",
  max,
}: {
  label: string;
  name: keyof FormValues;
  register: UseFormRegister<FormValues>;
  errors: FieldErrors<FormValues>;
  type?: string;
  max?: string;
}) {
  const error = errors[name]?.message?.toString();

  return (
    <div className="grid gap-2">
      <Label className="text-sm font-semibold text-foreground" htmlFor={name}>{label}</Label>
      <Input id={name} type={type} max={max} className="h-10 border-slate-300 bg-background shadow-sm hover:border-slate-400 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/25 dark:border-slate-600 dark:hover:border-slate-500" {...register(name)} />
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
  disabled = false,
  onChange,
}: {
  label: string;
  name: keyof FormValues;
  register: UseFormRegister<FormValues>;
  errors: FieldErrors<FormValues>;
  options: { id: number; name: string }[];
  disabled?: boolean;
  onChange?: (event: React.ChangeEvent<HTMLSelectElement>) => void;
}) {
  const error = errors[name]?.message?.toString();

  return (
    <div className="grid gap-2">
      <Label className="text-sm font-semibold text-foreground" htmlFor={name}>{label}</Label>
      <select
        id={name}
        className="h-10 w-full rounded-lg border border-slate-300 bg-background px-3 text-sm shadow-sm outline-none transition-colors hover:border-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/25 dark:border-slate-600 dark:hover:border-slate-500"
        {...(() => {
          const registration = register(name, { setValueAs: nullableNumber });
          return {
            ...registration,
            onChange: (event: React.ChangeEvent<HTMLSelectElement>) => {
              void registration.onChange(event);
              onChange?.(event);
            },
          };
        })()}
        disabled={disabled}
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
    <section className="space-y-5 rounded-xl border border-slate-200 bg-card p-4 shadow-sm sm:p-6 dark:border-slate-700">
      <div className="border-b border-slate-200 pb-4 dark:border-slate-700">
        <h2 className="font-heading text-lg font-semibold text-foreground">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">Add the information for this section. Optional fields can be completed later.</p>
      </div>
      {children}
    </section>
  );
}

function emptyToUndefined(value?: string) {
  return value === "" ? undefined : value;
}

export function EmployeeFormPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const submitIntentRef = useRef(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const createEmployee = useCreateEmployee();
  const uploadEmployeePhoto = useUploadEmployeePhoto();
  const countries = useCountries();

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
      country: "Nigeria",
      country_code: "NG",
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

  const departmentId = useWatch({ control: form.control, name: "department_id" });
  const { branches, departments, positions, jobGrades, employmentTypes } = useCompanyOptions(departmentId);
  const countryCode = useWatch({ control: form.control, name: "country_code" });
  const states = useStates(countryCode);
  const countryOptions = countries.data ?? [];
  const stateOptions = states.data ?? [];
  const isSaving = createEmployee.isPending || uploadEmployeePhoto.isPending;

  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  function changeAvatar(file?: File) {
    setAvatarError(null);

    if (!file) {
      setAvatarFile(null);
      setAvatarPreview(null);
      return;
    }

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setAvatarError("Choose a JPG, PNG, or WebP image.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setAvatarError("Image must be 5 MB or smaller.");
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  function changeCountry(code: string) {
    const country = countryOptions.find((option) => option.code === code);
    form.setValue("country_code", code);
    form.setValue("country", country?.name ?? "");
    form.setValue("state", "");
  }

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
      country: emptyToUndefined(values.country),
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

      if (avatarFile) {
        try {
          await uploadEmployeePhoto.mutateAsync({ employeeId: employee.id, photo: avatarFile });
        } catch {
          toast.warning("Employee saved, but the profile picture could not be uploaded. You can add it later.");
        }
      }

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

  const currentStep = wizardSteps[step];
  const goNext = async () => {
    const valid = await form.trigger(currentStep.fields);
    if (valid) setStep((value) => Math.min(value + 1, wizardSteps.length - 1));
  };

  const goBack = () => setStep((value) => Math.max(value - 1, 0));

  function handleFormSubmit(event: FormEvent<HTMLFormElement>) {
    if (step !== wizardSteps.length - 1 || !submitIntentRef.current) {
      event.preventDefault();
      return;
    }

    submitIntentRef.current = false;
    void onSubmit(event);
  }

  return (
    <form
      onSubmit={handleFormSubmit}
      onKeyDown={(event) => {
        if (event.key === "Enter" && event.target instanceof HTMLInputElement) {
          event.preventDefault();
        }
      }}
      className="space-y-6"
    >
      <PageHeader
        title="Add employee"
        description="Create the employee master record and initial employment assignment."
        actions={
          <span className="text-sm font-medium text-muted-foreground">Step {step + 1} of {wizardSteps.length}</span>
        }
      />

      <nav aria-label="Employee form progress" className="rounded-xl border border-slate-200 bg-card p-3 shadow-sm sm:p-5 dark:border-slate-700">
        <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-4">
          {wizardSteps.map((item, index) => {
            const active = index === step;
            const complete = index < step;
            return (
              <li key={item.title} className={`relative rounded-lg p-2 sm:p-0 ${active ? "bg-primary/5" : ""}`}>
                {index < wizardSteps.length - 1 && <span className="absolute left-8 top-4 hidden h-px w-[calc(100%-1.5rem)] bg-border sm:block" aria-hidden="true" />}
                <button type="button" onClick={() => index < step && setStep(index)} disabled={index > step} className="relative flex w-full items-center gap-2 text-left disabled:cursor-default sm:block">
                  <span className={`grid size-8 shrink-0 place-items-center rounded-full border text-sm font-semibold transition ${active ? "border-primary bg-primary text-primary-foreground" : complete ? "border-primary/30 bg-primary/10 text-primary" : "border-border bg-muted text-muted-foreground"}`}>
                    {complete ? <Check className="size-4" /> : index + 1}
                  </span>
                  <span className="min-w-0 sm:mt-2 sm:block"><span className={`block truncate text-xs font-semibold sm:text-sm ${active ? "text-foreground" : "text-muted-foreground"}`}>{item.title}</span><span className="hidden text-xs text-muted-foreground sm:block">{item.description}</span></span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      {form.formState.errors.root && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {form.formState.errors.root.message}
        </p>
      )}

      {step === 0 && <Section title="Personal">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 md:col-span-3 sm:flex-row sm:items-center dark:border-slate-700">
            <div className="relative grid size-24 shrink-0 place-items-center overflow-hidden rounded-full border-2 border-dashed border-slate-300 bg-slate-50 text-slate-400 dark:border-slate-600 dark:bg-slate-900">
              {avatarPreview ? <Image src={avatarPreview} alt="Employee picture preview" fill unoptimized className="object-cover" /> : <ImagePlus className="size-8" />}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">Employee picture <span className="font-normal text-muted-foreground">(optional)</span></p>
              <p className="mt-1 text-xs text-muted-foreground">JPG, PNG, or WebP. Maximum file size 5 MB.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <label className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition hover:bg-primary/80">
                  <ImagePlus className="size-4" /> {avatarFile ? "Change picture" : "Choose picture"}
                  <input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => changeAvatar(event.target.files?.[0])} />
                </label>
                {avatarFile && <button type="button" className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 text-sm font-medium transition hover:bg-muted dark:border-slate-600" onClick={() => changeAvatar()}><X className="size-4" /> Remove</button>}
              </div>
              {avatarError && <p className="mt-2 text-sm text-destructive">{avatarError}</p>}
            </div>
          </div>
          <Field label="First name" name="first_name" register={form.register} errors={form.formState.errors} />
          <Field label="Middle name" name="middle_name" register={form.register} errors={form.formState.errors} />
          <Field label="Last name" name="last_name" register={form.register} errors={form.formState.errors} />
          <Field label="Official email" name="official_email" type="email" register={form.register} errors={form.formState.errors} />
          <Field label="Personal email" name="personal_email" type="email" register={form.register} errors={form.formState.errors} />
          <Field label="Phone" name="phone" register={form.register} errors={form.formState.errors} />
          <div className="grid gap-2">
            <Label className="text-sm font-semibold text-foreground" htmlFor="gender">Gender</Label>
            <select
              id="gender"
              className="h-10 w-full rounded-lg border border-slate-300 bg-background px-3 text-sm shadow-sm outline-none transition-colors hover:border-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/25 dark:border-slate-600 dark:hover:border-slate-500"
              {...form.register("gender")}
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
            {form.formState.errors.gender?.message && <p className="text-sm text-destructive">{form.formState.errors.gender.message}</p>}
          </div>
          <Field label="Date of birth" name="date_of_birth" type="date" max={maxDateOfBirth} register={form.register} errors={form.formState.errors} />
          <div className="grid gap-2">
            <Label className="text-sm font-semibold text-foreground" htmlFor="marital_status">Marital status</Label>
            <select
              id="marital_status"
              className="h-10 w-full rounded-lg border border-slate-300 bg-background px-3 text-sm shadow-sm outline-none transition-colors hover:border-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/25 dark:border-slate-600 dark:hover:border-slate-500"
              {...form.register("marital_status")}
            >
              <option value="">Select marital status</option>
              <option value="single">Single</option>
              <option value="married">Married</option>
              <option value="divorced">Divorced</option>
              <option value="widowed">Widowed</option>
              <option value="separated">Separated</option>
            </select>
            {form.formState.errors.marital_status?.message && <p className="text-sm text-destructive">{form.formState.errors.marital_status.message}</p>}
          </div>
          <div className="grid gap-2">
            <Label className="text-sm font-semibold text-foreground" htmlFor="country_code">Country</Label>
            <select
              id="country_code"
              className="h-10 w-full rounded-lg border border-slate-300 bg-background px-3 text-sm shadow-sm outline-none transition-colors hover:border-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/25 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:hover:border-slate-500"
              value={countryCode ?? ""}
              onChange={(event) => changeCountry(event.target.value)}
              disabled={countries.isPending}
            >
              <option value="">{countries.isPending ? "Loading countries..." : "Select country"}</option>
              {countryOptions.map((country) => <option key={country.code} value={country.code}>{country.name}</option>)}
            </select>
            {countries.isError && <button type="button" className="w-fit text-xs font-medium text-destructive underline-offset-4 hover:underline" onClick={() => void countries.refetch()}>Countries could not load. Retry</button>}
          </div>
          <div className="grid gap-2">
            <Label className="text-sm font-semibold text-foreground" htmlFor="state">State / region</Label>
            <select
              id="state"
              className="h-10 w-full rounded-lg border border-slate-300 bg-background px-3 text-sm shadow-sm outline-none transition-colors hover:border-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/25 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:hover:border-slate-500"
              {...form.register("state")}
              disabled={!countryCode || states.isPending || states.isError}
            >
              <option value="">{states.isPending ? "Loading states..." : stateOptions.length ? "Select state or region" : "No states available"}</option>
              {stateOptions.map((state) => <option key={state.id} value={state.name}>{state.name}</option>)}
            </select>
            {states.isError && <button type="button" className="w-fit text-xs font-medium text-destructive underline-offset-4 hover:underline" onClick={() => void states.refetch()}>States could not load. Retry</button>}
          </div>
          <Field label="City" name="city" register={form.register} errors={form.formState.errors} />
          <Field label="Address" name="address" register={form.register} errors={form.formState.errors} />
        </div>
      </Section>}

      {step === 1 && <Section title="Employment">
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Hire date" name="hired_at" type="date" register={form.register} errors={form.formState.errors} />
          <Field label="Effective from" name="effective_from" type="date" register={form.register} errors={form.formState.errors} />
          <div className="grid gap-2">
            <Label className="text-sm font-semibold text-foreground" htmlFor="employment_status">Status</Label>
            <select id="employment_status" className="h-10 w-full rounded-lg border border-slate-300 bg-background px-3 text-sm shadow-sm outline-none transition-colors hover:border-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/25 dark:border-slate-600 dark:hover:border-slate-500" {...form.register("employment_status")}>
              <option value="active">Active</option>
              <option value="on_leave">On leave</option>
              <option value="suspended">Suspended</option>
              <option value="exited">Exited</option>
            </select>
          </div>
          <SelectField label="Branch" name="branch_id" register={form.register} errors={form.formState.errors} options={branches.data ?? []} />
          <SelectField
            label="Department"
            name="department_id"
            register={form.register}
            errors={form.formState.errors}
            options={departments.data ?? []}
            onChange={() => form.setValue("position_id", null)}
          />
          <SelectField
            label="Position"
            name="position_id"
            register={form.register}
            errors={form.formState.errors}
            options={(positions.data ?? []).map((position) => ({ id: position.id, name: position.title }))}
            disabled={!departmentId || positions.isPending}
          />
          <SelectField label="Job grade" name="job_grade_id" register={form.register} errors={form.formState.errors} options={jobGrades.data ?? []} />
          <SelectField label="Employment type" name="employment_type_id" register={form.register} errors={form.formState.errors} options={employmentTypes.data ?? []} />
        </div>
      </Section>}

      {step === 2 && <Section title="Contacts">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="grid gap-2">
            <Label className="text-sm font-semibold text-foreground" htmlFor="contact_type">Type</Label>
            <select id="contact_type" className="h-10 w-full rounded-lg border border-slate-300 bg-background px-3 text-sm shadow-sm outline-none transition-colors hover:border-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/25 dark:border-slate-600 dark:hover:border-slate-500" {...form.register("contact_type")}>
              <option value="emergency">Emergency</option>
              <option value="next_of_kin">Next of kin</option>
            </select>
          </div>
          <Field label="Name" name="contact_name" register={form.register} errors={form.formState.errors} />
          <div className="grid gap-2">
            <Label className="text-sm font-semibold text-foreground" htmlFor="contact_relationship">Relationship</Label>
            <select id="contact_relationship" className="h-10 w-full rounded-lg border border-slate-300 bg-background px-3 text-sm shadow-sm outline-none transition-colors hover:border-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/25 dark:border-slate-600 dark:hover:border-slate-500" {...form.register("contact_relationship")}>
              <option value="">Select relationship</option>
              <option value="spouse">Spouse</option>
              <option value="parent">Parent</option>
              <option value="child">Child</option>
              <option value="sibling">Sibling</option>
              <option value="guardian">Guardian</option>
              <option value="relative">Relative</option>
              <option value="friend">Friend</option>
              <option value="colleague">Colleague</option>
              <option value="other">Other</option>
            </select>
            {form.formState.errors.contact_relationship?.message && <p className="text-sm text-destructive">{form.formState.errors.contact_relationship.message}</p>}
          </div>
          <Field label="Phone" name="contact_phone" register={form.register} errors={form.formState.errors} />
          <Field label="Email" name="contact_email" type="email" register={form.register} errors={form.formState.errors} />
        </div>
      </Section>}

      {step === 3 && <Section title="Bank and statutory">
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
      </Section>}

      <div className="flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
        <Button className="w-full sm:w-auto" type="button" variant="outline" onClick={goBack} disabled={step === 0 || isSaving}>
          <ArrowLeft className="size-4" /> Back
        </Button>
        {step < wizardSteps.length - 1 ? (
          <Button
            className="w-full sm:w-auto"
            type="button"
            onClick={(event) => {
              event.preventDefault();
              void goNext();
            }}
          >
            Continue <ArrowRight className="size-4" />
          </Button>
        ) : (
          <Button
            className="w-full sm:w-auto"
            type="submit"
            disabled={isSaving}
            onClick={() => {
              submitIntentRef.current = true;
            }}
          >
            <Save className="size-4" />
            {uploadEmployeePhoto.isPending ? "Uploading picture..." : createEmployee.isPending ? "Saving..." : "Save employee"}
          </Button>
        )}
      </div>
    </form>
  );
}
