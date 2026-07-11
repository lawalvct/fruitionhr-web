"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Banknote, Building2, Check, ChevronLeft, ChevronRight, CircleCheck, Loader2, Sparkles } from "lucide-react";

import { useMe } from "@/features/auth/use-auth";
import {
  type OnboardingData,
  useCompleteOnboarding,
  useOnboarding,
  useSaveOnboarding,
  useSkipOnboarding,
} from "@/features/onboarding/use-onboarding";
import { apiErrorMessage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

const weekdays = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const defaultData: OnboardingData = {
  country: "Nigeria",
  timezone: "Africa/Lagos",
  currency: "NGN",
  pay_frequency: "monthly",
  pay_day: 25,
  working_days: weekdays.slice(0, 5),
};

const steps = [
  { label: "Company", icon: Building2 },
  { label: "Payroll", icon: Banknote },
  { label: "Starter setup", icon: Sparkles },
];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="grid gap-2"><Label>{label}</Label>{children}</div>;
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
    else if (!me.roles?.includes("owner") || onboarding.data?.status === "completed") {
      router.replace("/dashboard");
    }
  }, [me, mePending, onboarding.data?.status, router]);

  if (mePending || onboarding.isPending || !me || !onboarding.data) {
    return <main className="mx-auto grid min-h-screen max-w-5xl content-start gap-5 px-5 py-10"><Skeleton className="h-9 w-72" /><Skeleton className="h-96 w-full" /></main>;
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
  const [step, setStep] = useState(Math.min(Math.max(initialStep, 1), 3));
  const [form, setForm] = useState<OnboardingData>(initial);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  async function next() {
    setError(null);
    try {
      const nextStep = Math.min(step + 1, 3);
      await save.mutateAsync({ ...form, step: nextStep });
      setStep(nextStep);
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
      } else await skip.mutateAsync();
      router.replace("/dashboard");
    } catch (requestError) {
      setError(apiErrorMessage(requestError));
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2 font-semibold text-slate-950"><span className="grid size-8 place-items-center rounded-md bg-primary text-primary-foreground">F</span>FruitionHR</div>
          <Button variant="ghost" size="sm" onClick={() => finish("skip")} disabled={skip.isPending}>Skip for now</Button>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-5 py-8 sm:py-12">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-emerald-700">Workspace setup</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-950">Make FruitionHR fit your company</h1>
          <p className="mt-2 text-slate-600">Your progress is saved after each step. Everything here can be changed later in Settings.</p>
        </div>

        <ol className="mt-8 grid grid-cols-3 border-y bg-white">
          {steps.map((item, index) => {
            const number = index + 1;
            const Icon = item.icon;
            return (
              <li key={item.label} className={`flex min-h-16 items-center gap-3 px-3 sm:px-5 ${number === step ? "border-b-2 border-primary text-primary" : "text-slate-500"}`}>
                <span className={`grid size-8 shrink-0 place-items-center rounded-full ${number < step ? "bg-emerald-100 text-emerald-700" : "bg-slate-100"}`}>
                  {number < step ? <Check className="size-4" /> : <Icon className="size-4" />}
                </span>
                <span className="hidden text-sm font-medium sm:inline">{item.label}</span>
              </li>
            );
          })}
        </ol>

        <section className="mt-8 border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          {step === 1 && (
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Company profile</h2>
              <p className="mt-1 text-sm text-slate-500">Basic details used across documents and company records.</p>
              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <Field label="Company name"><Input value={form.company_name ?? ""} onChange={(e) => set("company_name", e.target.value)} /></Field>
                <Field label="Industry"><Input placeholder="Professional services" value={form.industry ?? ""} onChange={(e) => set("industry", e.target.value)} /></Field>
                <Field label="Company size"><select className="h-9 rounded-md border bg-background px-3 text-sm" value={form.company_size ?? ""} onChange={(e) => set("company_size", e.target.value)}><option value="">Select size</option>{["1-10", "11-50", "51-200", "201-500", "500+"].map((size) => <option key={size}>{size}</option>)}</select></Field>
                <Field label="Phone"><Input value={form.phone ?? ""} onChange={(e) => set("phone", e.target.value)} /></Field>
                <Field label="Website"><Input type="url" placeholder="https://company.com" value={form.website ?? ""} onChange={(e) => set("website", e.target.value)} /></Field>
                <Field label="RC number (optional)"><Input value={form.rc_number ?? ""} onChange={(e) => set("rc_number", e.target.value)} /></Field>
                <div className="sm:col-span-2"><Field label="Main office address"><Input value={form.address ?? ""} onChange={(e) => set("address", e.target.value)} /></Field></div>
                <Field label="City"><Input value={form.city ?? ""} onChange={(e) => set("city", e.target.value)} /></Field>
                <Field label="State"><Input value={form.state ?? ""} onChange={(e) => set("state", e.target.value)} /></Field>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Work and payroll preferences</h2>
              <p className="mt-1 text-sm text-slate-500">A practical starting point for calendars and payroll periods.</p>
              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <Field label="Pay frequency"><select className="h-9 rounded-md border bg-background px-3 text-sm" value={form.pay_frequency} onChange={(e) => set("pay_frequency", e.target.value as OnboardingData["pay_frequency"])}><option value="monthly">Monthly</option><option value="biweekly">Every two weeks</option><option value="weekly">Weekly</option></select></Field>
                <Field label="Pay day"><Input type="number" min={1} max={31} value={form.pay_day ?? 25} onChange={(e) => set("pay_day", Number(e.target.value))} /></Field>
                <Field label="Tax state"><Input placeholder="Lagos" value={form.tax_state ?? ""} onChange={(e) => set("tax_state", e.target.value)} /></Field>
                <Field label="Company TIN (optional)"><Input value={form.tin ?? ""} onChange={(e) => set("tin", e.target.value)} /></Field>
                <div className="sm:col-span-2">
                  <Label>Working days</Label>
                  <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {weekdays.map((day) => {
                      const active = form.working_days?.includes(day) ?? false;
                      return <label key={day} className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm capitalize ${active ? "border-emerald-500 bg-emerald-50 text-emerald-800" : "border-slate-200"}`}><input type="checkbox" checked={active} onChange={() => set("working_days", active ? form.working_days?.filter((item) => item !== day) : [...(form.working_days ?? []), day])} />{day}</label>;
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Your editable starter setup</h2>
              <p className="mt-1 text-sm text-slate-500">We will create useful defaults without adding fake employees, salaries, or payroll runs.</p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {["Main Office branch", "4 common departments", "4 employment types", "4 standard leave types", "4 salary components", "Nigeria holiday calendar"].map((item) => <div key={item} className="flex items-center gap-3 border-b px-1 py-3 text-sm text-slate-700"><CircleCheck className="size-5 shrink-0 text-emerald-600" />{item}</div>)}
              </div>
              <div className="mt-6 rounded-md bg-slate-50 p-4 text-sm leading-6 text-slate-600">All starter records are ordinary company data. You can rename or delete them later, subject to records that already reference them.</div>
            </div>
          )}

          {error && <p className="mt-5 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

          <footer className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t pt-5">
            <Button variant="outline" disabled={step === 1 || save.isPending} onClick={() => setStep((current) => current - 1)}><ChevronLeft className="size-4" />Back</Button>
            {step < 3 ? <Button onClick={next} disabled={save.isPending || (step === 1 && !form.company_name)}>{save.isPending ? <Loader2 className="size-4 animate-spin" /> : null}Save and continue<ChevronRight className="size-4" /></Button> : <Button onClick={() => finish("complete")} disabled={complete.isPending || save.isPending}>{complete.isPending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}Finish setup</Button>}
          </footer>
        </section>
      </div>
    </main>
  );
}
