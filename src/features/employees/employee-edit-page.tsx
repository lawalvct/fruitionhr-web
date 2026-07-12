"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { mapLaravelErrorsToForm } from "@/lib/forms";
import { useCountries, useStates } from "@/features/reference/use-locations";
import { useEmployee, useUpdateEmployee } from "@/features/employees/use-employees";

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
  const countries = useCountries();
  const form = useForm<FormValues>({ resolver: zodResolver(schema) });
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
    });
  }, [employee, form]);

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading employee...</p>;
  if (!employee) return <p className="text-sm text-muted-foreground">Employee not found.</p>;

  return (
    <form
      className="space-y-6"
      onSubmit={form.handleSubmit(async (values) => {
        try {
          await updateEmployee.mutateAsync({
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
          });
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

      <section className="rounded-xl border border-slate-200 bg-card p-4 shadow-sm sm:p-6 dark:border-slate-700"><div className="border-b border-slate-200 pb-4 dark:border-slate-700"><h2 className="font-heading text-lg font-semibold">Employment</h2><p className="mt-1 text-sm text-muted-foreground">Assignment changes are handled through Transfer on the profile.</p></div><div className="mt-5 grid gap-4 sm:grid-cols-2"><div className="grid gap-2"><Label htmlFor="employment_status">Status</Label><select id="employment_status" className={selectClass} {...form.register("employment_status")}><option value="active">Active</option><option value="on_leave">On leave</option><option value="suspended">Suspended</option><option value="exited">Exited</option></select></div><div className="grid gap-2"><Label htmlFor="hired_at">Hire date</Label><Input id="hired_at" className={inputClass} type="date" {...form.register("hired_at")} /></div></div></section>

      <div className="flex justify-end border-t pt-5"><Button type="submit" disabled={updateEmployee.isPending}><Save className="size-4" />{updateEmployee.isPending ? "Saving..." : "Save changes"}</Button></div>
    </form>
  );
}
