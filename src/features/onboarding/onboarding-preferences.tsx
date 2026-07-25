"use client";

import { Building2, CalendarDays, ImagePlus, Loader2, Save, ShieldCheck, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMe } from "@/features/auth/use-auth";
import {
  useCompanyLogoImage,
  useDeleteCompanyLogo,
  useUploadCompanyLogo,
} from "@/features/company/use-company";
import {
  type OnboardingData,
  useOnboarding,
  useSaveOnboarding,
} from "@/features/onboarding/use-onboarding";
import { useCountries, useStates } from "@/features/reference/use-locations";
import { apiErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";

const weekdays = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const companySizes = ["1-10", "11-50", "51-200", "201-500", "500+"];
const selectClass = "h-10 w-full rounded-md border bg-background px-3 text-sm shadow-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 disabled:cursor-not-allowed disabled:opacity-60";

const defaultData: OnboardingData = {
  country: "Nigeria",
  country_code: "NG",
  timezone: "Africa/Lagos",
  currency: "NGN",
  pay_frequency: "monthly",
  pay_day: 25,
  working_days: weekdays.slice(0, 5),
};

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return <div className={cn("grid gap-2", className)}><Label>{label}</Label>{children}</div>;
}

function CompanyLogoField({ companyName }: { companyName?: string }) {
  const { data: me } = useMe();
  const logoSrc = useCompanyLogoImage(me?.tenant?.logo_url);
  const uploadLogo = useUploadCompanyLogo();
  const deleteLogo = useDeleteCompanyLogo();
  const busy = uploadLogo.isPending || deleteLogo.isPending;

  function onFile(file?: File) {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Choose a JPG, PNG, or WebP image.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Logo must be 2 MB or smaller.");
      return;
    }
    uploadLogo.mutate(file, {
      onSuccess: () => toast.success("Logo updated"),
      onError: (error) => toast.error(apiErrorMessage(error)),
    });
  }

  return (
    <Field label="Company logo" className="sm:col-span-2">
      <div className="flex items-center gap-4">
        <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted/30">
          {logoSrc ? (
            // eslint-disable-next-line @next/next/no-img-element -- authenticated blob URL, not a static asset
            <img src={logoSrc} alt={`${companyName ?? "Company"} logo`} className="size-full object-contain p-1.5" />
          ) : (
            <Building2 className="size-6 text-muted-foreground" />
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <label className={cn(buttonVariants({ variant: "outline", size: "sm" }), "cursor-pointer", busy && "pointer-events-none opacity-50")}>
            <ImagePlus className="size-4" />
            {me?.tenant?.logo_url ? "Change logo" : "Upload logo"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              disabled={busy}
              onChange={(event) => {
                onFile(event.target.files?.[0]);
                event.target.value = "";
              }}
            />
          </label>
          {me?.tenant?.logo_url && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={busy}
              onClick={() => deleteLogo.mutate(undefined, { onSuccess: () => toast.success("Logo removed") })}
            >
              <Trash2 className="size-4" /> Remove
            </Button>
          )}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">JPG, PNG, or WebP up to 2 MB. Shown in the app sidebar and on payslips.</p>
    </Field>
  );
}

export function OnboardingPreferences() {
  const { data: me, isPending: mePending } = useMe();
  const isOwner = me?.roles?.includes("owner") ?? false;
  const onboarding = useOnboarding(isOwner);
  const save = useSaveOnboarding();
  const countries = useCountries();
  const [changes, setChanges] = useState<Partial<OnboardingData>>({});
  const form = { ...defaultData, company_name: me?.tenant?.name, ...onboarding.data?.data, ...changes };
  const states = useStates(form.country_code);

  const set = <K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) => {
    setChanges((current) => ({ ...current, [key]: value }));
  };

  function changeCountry(code: string) {
    const country = (countries.data ?? []).find((item) => item.code === code);
    setChanges((current) => ({ ...current, country_code: country?.code, country: country?.name, state: "", tax_state: "" }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.company_name?.trim()) {
      toast.error("Company name is required.");
      return;
    }

    try {
      await save.mutateAsync({ ...form, step: 3 });
      toast.success("Organisation preferences saved.");
    } catch (error) {
      toast.error(apiErrorMessage(error));
    }
  }

  if (mePending || (isOwner && onboarding.isPending)) {
    return <div className="h-80 animate-pulse rounded-xl border bg-muted/40" />;
  }

  if (!isOwner) {
    return <div className="rounded-xl border border-dashed px-6 py-12 text-center text-sm text-muted-foreground">Only the organisation owner can update onboarding preferences.</div>;
  }

  if (onboarding.isError) {
    return <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4"><p className="text-sm text-muted-foreground">Preferences could not be loaded.</p><Button variant="outline" size="sm" onClick={() => void onboarding.refetch()}>Retry</Button></div>;
  }

  const stateOptions = states.data ?? [];

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="flex gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-fruition-50 text-fruition-700"><Building2 className="size-5" /></span>
          <div><h2 className="font-heading text-lg font-semibold">Company profile</h2><p className="mt-1 text-sm text-muted-foreground">These details remain editable after workspace setup and are used across company records.</p></div>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <CompanyLogoField companyName={form.company_name} />
          <Field label="Company name" className="sm:col-span-2"><Input value={form.company_name ?? ""} onChange={(event) => set("company_name", event.target.value)} required /></Field>
          <Field label="Industry"><Input value={form.industry ?? ""} onChange={(event) => set("industry", event.target.value)} /></Field>
          <Field label="Company size"><select className={selectClass} value={form.company_size ?? ""} onChange={(event) => set("company_size", event.target.value)}><option value="">Select size</option>{companySizes.map((size) => <option key={size} value={size}>{size} employees</option>)}</select></Field>
          <Field label="Phone"><Input type="tel" value={form.phone ?? ""} onChange={(event) => set("phone", event.target.value)} /></Field>
          <Field label="Website"><Input type="url" value={form.website ?? ""} onChange={(event) => set("website", event.target.value)} placeholder="https://company.com" /></Field>
          <Field label="Main office address" className="sm:col-span-2"><Input value={form.address ?? ""} onChange={(event) => set("address", event.target.value)} /></Field>
          <Field label="Country"><select className={selectClass} value={form.country_code ?? ""} onChange={(event) => changeCountry(event.target.value)} disabled={countries.isPending}><option value="">{countries.isPending ? "Loading countries..." : "Select country"}</option>{(countries.data ?? []).map((country) => <option key={country.code} value={country.code}>{country.name}</option>)}</select></Field>
          <Field label="State / region"><select className={selectClass} value={form.state ?? ""} onChange={(event) => set("state", event.target.value)} disabled={!form.country_code || states.isPending}><option value="">{states.isPending ? "Loading regions..." : "Select state or region"}</option>{stateOptions.map((state) => <option key={state.id} value={state.name}>{state.name}</option>)}</select></Field>
          <Field label="City"><Input value={form.city ?? ""} onChange={(event) => set("city", event.target.value)} /></Field>
          <Field label="RC number"><Input value={form.rc_number ?? ""} onChange={(event) => set("rc_number", event.target.value)} /></Field>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="flex gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-fruition-50 text-fruition-700"><CalendarDays className="size-5" /></span>
          <div><h2 className="font-heading text-lg font-semibold">Work and payroll defaults</h2><p className="mt-1 text-sm text-muted-foreground">Use these defaults to keep attendance and payroll configuration consistent.</p></div>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Field label="Pay frequency"><select className={selectClass} value={form.pay_frequency ?? "monthly"} onChange={(event) => set("pay_frequency", event.target.value as OnboardingData["pay_frequency"])}><option value="monthly">Monthly</option><option value="biweekly">Every two weeks</option><option value="weekly">Weekly</option></select></Field>
          <Field label="Pay day"><Input type="number" min={1} max={31} value={form.pay_day ?? 25} onChange={(event) => set("pay_day", Number(event.target.value))} /></Field>
          <Field label="Tax state"><select className={selectClass} value={form.tax_state ?? ""} onChange={(event) => set("tax_state", event.target.value)} disabled={!form.country_code || states.isPending}><option value="">Select tax state</option>{stateOptions.map((state) => <option key={state.id} value={state.name}>{state.name}</option>)}</select></Field>
          <Field label="Company TIN"><Input value={form.tin ?? ""} onChange={(event) => set("tin", event.target.value)} /></Field>
        </div>
        <div className="mt-6 border-t pt-5"><Label>Standard working week</Label><p className="mt-1 text-sm text-muted-foreground">Select the days that count as regular working days.</p><div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">{weekdays.map((day) => { const active = form.working_days?.includes(day) ?? false; return <label key={day} className={cn("flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm capitalize", active ? "border-fruition-500 bg-fruition-50 text-fruition-900" : "text-muted-foreground hover:border-muted-foreground/40")}><input type="checkbox" className="size-4 accent-fruition-700" checked={active} onChange={() => set("working_days", active ? form.working_days?.filter((item) => item !== day) : [...(form.working_days ?? []), day])} />{day.slice(0, 3)}</label>; })}</div></div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-muted/30 p-4">
        <div className="flex gap-2 text-sm text-muted-foreground"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-fruition-700" />Saving these preferences does not recreate starter data or restart completed onboarding.</div>
        <Button type="submit" disabled={save.isPending}>{save.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}Save preferences</Button>
      </div>
    </form>
  );
}
