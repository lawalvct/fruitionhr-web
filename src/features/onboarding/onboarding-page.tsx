"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Banknote,
  Building2,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  Clock3,
  FileCheck2,
  Globe2,
  Landmark,
  Loader2,
  MapPin,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useMe } from "@/features/auth/use-auth";
import {
  type OnboardingData,
  useCompleteOnboarding,
  useOnboarding,
  useSaveOnboarding,
  useSkipOnboarding,
} from "@/features/onboarding/use-onboarding";
import { useCountries, useStates } from "@/features/reference/use-locations";
import { apiErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";

const weekdays = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const defaultData: OnboardingData = {
  country: "Nigeria",
  country_code: "NG",
  timezone: "Africa/Lagos",
  currency: "NGN",
  pay_frequency: "monthly",
  pay_day: 25,
  working_days: weekdays.slice(0, 5),
};

const steps = [
  { label: "Company profile", description: "Identity and location", icon: Building2 },
  { label: "Work and payroll", description: "Calendar and pay cycle", icon: Banknote },
  { label: "Starter workspace", description: "Review your defaults", icon: Sparkles },
];

const selectClass = "h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-800 shadow-xs outline-none transition focus:border-fruition-500 focus:ring-2 focus:ring-fruition-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400";

function Field({
  label,
  hint,
  className,
  children,
}: {
  label: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("grid content-start gap-2", className)}>
      <div>
        <Label>{label}</Label>
        {hint && <p className="mt-0.5 text-xs text-slate-400">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <Image
        src="/fruitionhr-logo-full.svg"
        alt="FruitionHR"
        width={150}
        height={53}
        priority
        className="h-auto w-36"
      />
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="grid size-11 place-items-center rounded-lg bg-white shadow-sm">
        <Image src="/fruitionhr-logo-icon.svg" alt="" width={34} height={34} priority />
      </span>
      <span className="text-xl font-extrabold text-white">
        Fruition<span className="text-fruition-300">HR</span>
      </span>
    </div>
  );
}

function SetupRail({ step }: { step: number }) {
  return (
    <aside className="sticky top-0 hidden h-screen flex-col bg-fruition-950 px-8 py-8 text-white lg:flex">
      <Brand />

      <div className="mt-16">
        <p className="text-xs font-semibold uppercase text-fruition-300">Workspace setup</p>
        <h1 className="mt-3 text-2xl font-bold leading-tight">A strong foundation for your people operations.</h1>
        <p className="mt-3 text-sm leading-6 text-fruition-100/75">
          We will use these details to prepare your company structure, work calendar, and payroll defaults.
        </p>
      </div>

      <ol className="mt-10 grid gap-1">
        {steps.map((item, index) => {
          const number = index + 1;
          const Icon = item.icon;
          const active = number === step;
          const complete = number < step;

          return (
            <li key={item.label} className="relative flex min-h-20 gap-4">
              {number < steps.length && (
                <span className={cn("absolute left-4 top-10 h-10 w-px", complete ? "bg-fruition-400" : "bg-white/15")} />
              )}
              <span className={cn(
                "relative grid size-8 shrink-0 place-items-center rounded-full border",
                complete && "border-fruition-400 bg-fruition-400 text-fruition-950",
                active && "border-white bg-white text-fruition-800",
                !active && !complete && "border-white/20 text-fruition-100/50",
              )}>
                {complete ? <Check className="size-4" /> : <Icon className="size-4" />}
              </span>
              <div className="pt-0.5">
                <p className={cn("text-sm font-semibold", active || complete ? "text-white" : "text-fruition-100/50")}>{item.label}</p>
                <p className={cn("mt-1 text-xs", active ? "text-fruition-200" : "text-fruition-100/40")}>{item.description}</p>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="mt-auto flex gap-3 border-t border-white/10 pt-5 text-xs leading-5 text-fruition-100/65">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-fruition-300" />
        Your progress is saved securely and every setting remains editable later.
      </div>
    </aside>
  );
}

function MobileProgress({ step }: { step: number }) {
  return (
    <div className="border-b border-slate-200 bg-white px-4 py-4 lg:hidden">
      <div className="mx-auto flex max-w-3xl items-center gap-2">
        {steps.map((item, index) => {
          const number = index + 1;
          return (
            <div key={item.label} className="flex flex-1 items-center gap-2">
              <span className={cn(
                "grid size-7 shrink-0 place-items-center rounded-full border text-xs font-bold",
                number < step && "border-fruition-600 bg-fruition-600 text-white",
                number === step && "border-fruition-700 bg-fruition-50 text-fruition-800",
                number > step && "border-slate-200 text-slate-400",
              )}>
                {number < step ? <Check className="size-3.5" /> : number}
              </span>
              {number < steps.length && <span className={cn("h-px flex-1", number < step ? "bg-fruition-500" : "bg-slate-200")} />}
            </div>
          );
        })}
      </div>
      <p className="mx-auto mt-2 max-w-3xl text-xs font-medium text-slate-500">Step {step} of {steps.length}: {steps[step - 1].label}</p>
    </div>
  );
}

export function OnboardingPage() {
  const router = useRouter();
  const { data: me, isPending: mePending } = useMe();
  const canLoad = Boolean(me?.is_email_verified && me.roles?.includes("owner"));
  const onboarding = useOnboarding(canLoad);

  useEffect(() => {
    if (mePending) return;
    if (!me) router.replace("/login");
    else if (!me.is_email_verified) router.replace("/verify-email");
    else if (!me.roles?.includes("owner") || onboarding.data?.status === "completed") router.replace("/dashboard");
  }, [me, mePending, onboarding.data?.status, router]);

  if (mePending || onboarding.isPending || !me || !onboarding.data) {
    return (
      <main className="grid min-h-screen lg:grid-cols-[320px_minmax(0,1fr)]">
        <Skeleton className="hidden h-screen rounded-none bg-fruition-950 lg:block" />
        <div className="mx-auto grid w-full max-w-3xl content-start gap-5 px-5 py-10">
          <Skeleton className="h-10 w-56" />
          <Skeleton className="h-[32rem] w-full" />
        </div>
      </main>
    );
  }

  if (!canLoad || onboarding.data.status === "completed") return null;

  return (
    <OnboardingForm
      initial={{ ...defaultData, company_name: me.tenant?.name, ...onboarding.data.data }}
      initialStep={onboarding.data.status === "skipped" ? 1 : onboarding.data.step}
    />
  );
}

function OnboardingForm({ initial, initialStep }: { initial: OnboardingData; initialStep: number }) {
  const router = useRouter();
  const save = useSaveOnboarding();
  const complete = useCompleteOnboarding();
  const skip = useSkipOnboarding();
  const countries = useCountries();
  const [step, setStep] = useState(Math.min(Math.max(initialStep, 1), 3));
  const [form, setForm] = useState<OnboardingData>(initial);
  const states = useStates(form.country_code);
  const [error, setError] = useState<string | null>(null);
  const busy = save.isPending || complete.isPending || skip.isPending;
  const countryOptions = countries.data ?? [];
  const stateOptions = states.data ?? [];

  const set = <K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  async function next() {
    setError(null);
    try {
      const nextStep = Math.min(step + 1, 3);
      await save.mutateAsync({ ...form, step: nextStep });
      setStep(nextStep);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (requestError) {
      setError(apiErrorMessage(requestError));
    }
  }

  async function finish(action: "complete" | "skip") {
    setError(null);
    try {
      if (action === "complete") {
        await save.mutateAsync({ ...form, step: 3 });
        await complete.mutateAsync();
      } else {
        await skip.mutateAsync();
      }
      router.replace("/dashboard");
    } catch (requestError) {
      setError(apiErrorMessage(requestError));
    }
  }

  function changeCountry(code: string) {
    const country = countryOptions.find((item) => item.code === code);
    setForm((current) => ({
      ...current,
      country_code: country?.code,
      country: country?.name,
      state: "",
      tax_state: "",
    }));
  }

  return (
    <main className="min-h-screen bg-white lg:grid lg:grid-cols-[320px_minmax(0,1fr)]">
      <SetupRail step={step} />

      <div className="min-w-0">
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 lg:px-10">
          <div className="lg:hidden"><Brand compact /></div>
          <p className="hidden text-sm text-slate-500 lg:block">Step {step} of {steps.length}</p>
          <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={() => finish("skip")}>
            {skip.isPending && <Loader2 className="size-4 animate-spin" />}
            Skip for now
          </Button>
        </header>

        <MobileProgress step={step} />

        <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-12">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase text-fruition-700">{steps[step - 1].description}</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-950 sm:text-3xl">
              {step === 1 && "Tell us about your company"}
              {step === 2 && "Set your working rhythm"}
              {step === 3 && "Review your starter workspace"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500 sm:text-base">
              {step === 1 && "These details appear across company records, documents, and your main office profile."}
              {step === 2 && "Choose sensible defaults for your work week and payroll. You can fine-tune policies later."}
              {step === 3 && "We will create useful, editable master data so your team can start without an empty workspace."}
            </p>
          </div>

          <section className="mt-8 border-t border-slate-200 pt-8">
            {step === 1 && (
              <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
                <Field label="Company name" className="sm:col-span-2"><Input value={form.company_name ?? ""} onChange={(event) => set("company_name", event.target.value)} /></Field>
                <Field label="Industry"><Input placeholder="Professional services" value={form.industry ?? ""} onChange={(event) => set("industry", event.target.value)} /></Field>
                <Field label="Company size"><select className={selectClass} value={form.company_size ?? ""} onChange={(event) => set("company_size", event.target.value)}><option value="">Select size</option>{["1-10", "11-50", "51-200", "201-500", "500+"].map((size) => <option key={size}>{size} employees</option>)}</select></Field>
                <Field label="Phone"><Input type="tel" placeholder="+234 800 000 0000" value={form.phone ?? ""} onChange={(event) => set("phone", event.target.value)} /></Field>
                <Field label="Website"><Input type="url" placeholder="https://company.com" value={form.website ?? ""} onChange={(event) => set("website", event.target.value)} /></Field>
                <Field label="Main office address" className="sm:col-span-2"><Input placeholder="Street and building" value={form.address ?? ""} onChange={(event) => set("address", event.target.value)} /></Field>
                <Field label="Country">
                  <select className={selectClass} value={form.country_code ?? ""} onChange={(event) => changeCountry(event.target.value)} disabled={countries.isPending}>
                    <option value="">{countries.isPending ? "Loading countries..." : "Select country"}</option>
                    {countryOptions.map((country) => <option key={country.code} value={country.code}>{country.name}</option>)}
                  </select>
                  {countries.isError && (
                    <button type="button" className="w-fit text-xs font-medium text-destructive underline-offset-4 hover:underline" onClick={() => void countries.refetch()}>
                      Countries could not load. Retry
                    </button>
                  )}
                </Field>
                <Field label="State / region">
                  <select className={selectClass} value={form.state ?? ""} onChange={(event) => set("state", event.target.value)} disabled={!form.country_code || states.isPending || states.isError}>
                    <option value="">{states.isPending ? "Loading regions..." : stateOptions.length ? "Select state or region" : "No regions available"}</option>
                    {stateOptions.map((state) => <option key={state.id} value={state.name}>{state.name}</option>)}
                  </select>
                  {states.isError && (
                    <button type="button" className="w-fit text-xs font-medium text-destructive underline-offset-4 hover:underline" onClick={() => void states.refetch()}>
                      Regions could not load. Retry
                    </button>
                  )}
                </Field>
                <Field label="City"><Input value={form.city ?? ""} onChange={(event) => set("city", event.target.value)} /></Field>
                <Field label="RC number" hint="Optional company registration number"><Input value={form.rc_number ?? ""} onChange={(event) => set("rc_number", event.target.value)} /></Field>
              </div>
            )}

            {step === 2 && (
              <div>
                <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
                  <Field label="Pay frequency"><select className={selectClass} value={form.pay_frequency} onChange={(event) => set("pay_frequency", event.target.value as OnboardingData["pay_frequency"])}><option value="monthly">Monthly</option><option value="biweekly">Every two weeks</option><option value="weekly">Weekly</option></select></Field>
                  <Field label="Pay day" hint="Day of the month"><Input type="number" min={1} max={31} value={form.pay_day ?? 25} onChange={(event) => set("pay_day", Number(event.target.value))} /></Field>
                  <Field label="Tax state">
                    <select className={selectClass} value={form.tax_state ?? ""} onChange={(event) => set("tax_state", event.target.value)} disabled={!form.country_code || states.isPending || states.isError}>
                      <option value="">{states.isPending ? "Loading tax states..." : stateOptions.length ? "Select tax state" : "No tax states available"}</option>
                      {stateOptions.map((state) => <option key={state.id} value={state.name}>{state.name}</option>)}
                    </select>
                    {states.isError && (
                      <button type="button" className="w-fit text-xs font-medium text-destructive underline-offset-4 hover:underline" onClick={() => void states.refetch()}>
                        Tax states could not load. Retry
                      </button>
                    )}
                  </Field>
                  <Field label="Company TIN" hint="Optional tax identification number"><Input value={form.tin ?? ""} onChange={(event) => set("tin", event.target.value)} /></Field>
                </div>

                <div className="mt-8 border-t border-slate-200 pt-7">
                  <div className="flex items-start gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-md bg-fruition-50 text-fruition-700"><Clock3 className="size-4.5" /></span>
                    <div><h3 className="text-sm font-semibold text-slate-900">Standard working week</h3><p className="mt-1 text-xs text-slate-500">Select every regular working day. Attendance and leave calculations will start here.</p></div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
                    {weekdays.map((day) => {
                      const active = form.working_days?.includes(day) ?? false;
                      return (
                        <label key={day} className={cn("flex min-h-10 cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm capitalize transition", active ? "border-fruition-500 bg-fruition-50 text-fruition-900" : "border-slate-200 text-slate-500 hover:border-slate-300")}>
                          <input type="checkbox" className="size-4 accent-fruition-700" checked={active} onChange={() => set("working_days", active ? form.working_days?.filter((item) => item !== day) : [...(form.working_days ?? []), day])} />
                          <span className="truncate">{day.slice(0, 3)}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-7 grid gap-3 border-y border-slate-200 bg-slate-50 px-4 py-4 sm:grid-cols-3">
                  <div className="flex items-center gap-2 text-sm text-slate-600"><Globe2 className="size-4 text-fruition-700" /><span>{form.timezone}</span></div>
                  <div className="flex items-center gap-2 text-sm text-slate-600"><Landmark className="size-4 text-fruition-700" /><span>{form.currency} currency</span></div>
                  <div className="flex items-center gap-2 text-sm text-slate-600"><MapPin className="size-4 text-fruition-700" /><span>{form.country}</span></div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <div className="grid border-y border-slate-200 bg-slate-50 sm:grid-cols-3">
                  <div className="p-4"><p className="text-xs text-slate-400">Company</p><p className="mt-1 truncate text-sm font-semibold text-slate-800">{form.company_name}</p></div>
                  <div className="border-t border-slate-200 p-4 sm:border-l sm:border-t-0"><p className="text-xs text-slate-400">Main office</p><p className="mt-1 truncate text-sm font-semibold text-slate-800">{[form.city, form.state, form.country].filter(Boolean).join(", ") || "Not provided"}</p></div>
                  <div className="border-t border-slate-200 p-4 sm:border-l sm:border-t-0"><p className="text-xs text-slate-400">Payroll cycle</p><p className="mt-1 text-sm font-semibold capitalize text-slate-800">{form.pay_frequency}, day {form.pay_day}</p></div>
                </div>

                <div className="mt-7 grid gap-3 sm:grid-cols-2">
                  {[
                    { label: "Main Office branch", icon: Building2 },
                    { label: "4 common departments", icon: Users },
                    { label: "4 employment types", icon: FileCheck2 },
                    { label: "4 standard leave types", icon: CalendarDays },
                    { label: "4 salary components", icon: Banknote },
                    { label: `${form.country ?? "Company"} holiday calendar`, icon: Globe2 },
                  ].map((item) => {
                    const Icon = item.icon;
                    return <div key={item.label} className="flex items-center gap-3 rounded-md border border-slate-200 p-4"><span className="grid size-9 shrink-0 place-items-center rounded-md bg-fruition-50 text-fruition-700"><Icon className="size-4.5" /></span><span className="text-sm font-medium text-slate-700">{item.label}</span><CircleCheck className="ml-auto size-4 text-fruition-600" /></div>;
                  })}
                </div>

                <div className="mt-6 flex gap-3 rounded-md border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-900">
                  <ShieldCheck className="mt-0.5 size-5 shrink-0 text-blue-600" />
                  No fake employees, salaries, attendance, or payroll runs will be added. These are ordinary master records you can rename or remove later.
                </div>
              </div>
            )}

            {error && <p className="mt-6 rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}
          </section>

          <footer className="mt-10 flex items-center justify-between border-t border-slate-200 pt-5">
            {step > 1 ? (
              <Button type="button" variant="outline" disabled={busy} onClick={() => setStep((current) => current - 1)}><ChevronLeft className="size-4" />Back</Button>
            ) : <span />}
            {step < 3 ? (
              <Button type="button" className="min-w-36" onClick={next} disabled={busy || (step === 1 && !form.company_name)}>{save.isPending && <Loader2 className="size-4 animate-spin" />}Save and continue<ChevronRight className="size-4" /></Button>
            ) : (
              <Button type="button" className="min-w-36" onClick={() => finish("complete")} disabled={busy}>{complete.isPending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}Finish setup</Button>
            )}
          </footer>
        </div>
      </div>
    </main>
  );
}
