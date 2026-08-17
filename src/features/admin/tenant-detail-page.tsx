"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  LifeBuoy,
  Lock,
  Mail,
  Pencil,
  Phone,
  ShieldAlert,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { MoneyText } from "@/components/money-text";
import { FormDialog } from "@/components/form-dialog";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { mapLaravelErrorsToForm } from "@/lib/forms";
import { apiErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  AdminStatusBadge,
  formatAdminDate,
  Identity,
  QueryErrorState,
  ReasonDialog,
} from "./admin-ui";
import type { AdminTenantDetail, TenantUpdateInput } from "./types";
import { useActivateTenant, useAdminTenant, useSuspendTenant, useUpdateAdminTenant } from "./use-admin";

const tenantSchema = z.object({
  name: z.string().trim().min(2, "Enter the company name").max(255),
  email: z.email("Enter a valid company email"),
  phone: z.string().trim().max(30).optional(),
  trial_ends_at: z.string().optional(),
});

type TenantFormValues = z.infer<typeof tenantSchema>;
const tenantFields = ["name", "email", "phone", "trial_ends_at"] as const;

function EditTenantDialog({
  tenant,
  open,
  onOpenChange,
}: {
  tenant: AdminTenantDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const updateTenant = useUpdateAdminTenant(tenant.id);
  const form = useForm<TenantFormValues>({
    resolver: zodResolver(tenantSchema),
    values: {
      name: tenant.name,
      email: tenant.email,
      phone: tenant.phone ?? "",
      trial_ends_at: tenant.trial_ends_at?.slice(0, 10) ?? "",
    },
  });

  const submit = form.handleSubmit(async (values) => {
    const input: TenantUpdateInput = {
      name: values.name.trim(),
      email: values.email.trim(),
      phone: values.phone?.trim() || null,
      trial_ends_at: values.trial_ends_at || null,
    };

    try {
      await updateTenant.mutateAsync(input);
      toast.success("Company details updated.");
      onOpenChange(false);
    } catch (error) {
      mapLaravelErrorsToForm(error, form.setError, tenantFields);
    }
  });

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Edit company"
      description="Update platform-level company contact and trial information."
      formId="edit-admin-tenant"
      isPending={updateTenant.isPending}
    >
      <form id="edit-admin-tenant" onSubmit={submit} className="space-y-4 py-4">
        {form.formState.errors.root?.message && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{form.formState.errors.root.message}</p>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="tenant-name">Company name</Label>
          <Input id="tenant-name" {...form.register("name")} />
          {form.formState.errors.name && <p className="text-xs text-red-600">{form.formState.errors.name.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tenant-email">Company email</Label>
          <Input id="tenant-email" type="email" {...form.register("email")} />
          {form.formState.errors.email && <p className="text-xs text-red-600">{form.formState.errors.email.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tenant-phone">Phone</Label>
          <Input id="tenant-phone" type="tel" {...form.register("phone")} />
          {form.formState.errors.phone && <p className="text-xs text-red-600">{form.formState.errors.phone.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tenant-trial">Trial ends</Label>
          <Input id="tenant-trial" type="date" {...form.register("trial_ends_at")} />
          <p className="text-xs text-slate-500">Leave blank when this company is not on a timed trial.</p>
          {form.formState.errors.trial_ends_at && <p className="text-xs text-red-600">{form.formState.errors.trial_ends_at.message}</p>}
        </div>
      </form>
    </FormDialog>
  );
}

function DetailItem({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white text-fruition-700 ring-1 ring-slate-200">
        <Icon className="size-3.5" />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold tracking-wide text-slate-400 uppercase">{label}</p>
        <p className="mt-1 break-words text-sm font-medium text-slate-800">{value}</p>
      </div>
    </div>
  );
}

export function TenantDetailPage({ tenantId }: { tenantId: string }) {
  const tenant = useAdminTenant(tenantId);
  const suspendTenant = useSuspendTenant(tenantId);
  const activateTenant = useActivateTenant(tenantId);
  const [editOpen, setEditOpen] = useState(false);
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [activateOpen, setActivateOpen] = useState(false);

  if (tenant.isLoading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-44 rounded-2xl" />
        <div className="grid gap-4 lg:grid-cols-2"><Skeleton className="h-80" /><Skeleton className="h-80" /></div>
      </div>
    );
  }

  if (tenant.isError || !tenant.data) {
    return <QueryErrorState title="This company could not be loaded" onRetry={() => void tenant.refetch()} />;
  }

  const company = tenant.data;

  return (
    <div className="space-y-6">
      <Link href="/tenants" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-fruition-700">
        <ArrowLeft className="size-4" /> Back to companies
      </Link>

      <PageHeader
        title={company.name}
        description="Review company access, onboarding, contact details, and lifecycle status."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              <Pencil className="size-4" /> Edit company
            </Button>
            {company.status === "active" && (
              <Button variant="destructive" onClick={() => setSuspendOpen(true)}>
                <ShieldAlert className="size-4" /> Suspend
              </Button>
            )}
            {company.status === "suspended" && (
              <Button onClick={() => setActivateOpen(true)}>
                <CheckCircle2 className="size-4" /> Activate
              </Button>
            )}
          </div>
        }
      />

      <section className="overflow-hidden rounded-2xl border border-fruition-900/20 bg-linear-135 from-fruition-950 to-fruition-800 p-5 text-white shadow-[0_10px_28px_rgba(2,44,34,0.14)] sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <Identity
            tone="dark"
            size="lg"
            name={company.name}
            // A plain string, not markup: Identity truncates its detail line,
            // and a flex row inside a truncating span cuts mid-element instead
            // of ellipsising on a narrow screen.
            detail={`/${company.slug} · Company #${company.id} · Customer since ${formatAdminDate(company.created_at)}`}
          />
          <div className="flex flex-wrap items-center gap-2">
            <AdminStatusBadge status={company.status} />
            <AdminStatusBadge status={company.onboarding_status} />
          </div>
        </div>
      </section>

      {company.status === "suspended" && (
        <section className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5 text-sm text-amber-900">
          <ShieldAlert className="mt-0.5 size-4 shrink-0" />
          <div>
            <p className="font-semibold">Company access is suspended</p>
            <p className="mt-1 text-xs leading-5 text-amber-800/80">Company users cannot enter the workspace until a platform administrator activates it.</p>
          </div>
        </section>
      )}

      <CustomerSnapshot company={company} />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-slate-200/80">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="text-base">Company details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 pt-5 sm:grid-cols-2">
            <DetailItem icon={Mail} label="Company email" value={company.email} />
            <DetailItem icon={Phone} label="Phone" value={company.phone ?? "Not provided"} />
            <DetailItem icon={CalendarDays} label="Created" value={formatAdminDate(company.created_at, true)} />
            <DetailItem icon={CalendarDays} label="Last updated" value={formatAdminDate(company.updated_at, true)} />
          </CardContent>
        </Card>

        <Card className="border-slate-200/80">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="text-base">Getting started</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 pt-5">
            <OnboardingProgress company={company} />
            <div className="grid gap-3 sm:grid-cols-2">
              <DetailItem icon={CalendarDays} label="Trial ends" value={formatAdminDate(company.trial_ends_at)} />
              <DetailItem icon={Users} label="Company users" value={company.users_count.toLocaleString("en-NG")} />
            </div>
            <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
              <Button variant="outline" size="sm" render={<Link href={`/users?tenant_id=${company.id}&company=${encodeURIComponent(company.name)}`} />}>
                <Users className="size-3.5" /> View their users
              </Button>
              <Button variant="outline" size="sm" render={<Link href={`/support?tenant_id=${company.id}&company=${encodeURIComponent(company.name)}`} />}>
                <LifeBuoy className="size-3.5" /> View their tickets
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <EditTenantDialog tenant={company} open={editOpen} onOpenChange={setEditOpen} />
      <ReasonDialog
        open={suspendOpen}
        onOpenChange={setSuspendOpen}
        title="Suspend company access"
        description="All company users will be blocked from their workspace until the company is activated again."
        subject={company.name}
        actionLabel="Suspend"
        isPending={suspendTenant.isPending}
        onConfirm={async (reason) => {
          try {
            await suspendTenant.mutateAsync(reason);
            toast.success(`${company.name} has been suspended.`);
            setSuspendOpen(false);
          } catch (error) {
            toast.error(apiErrorMessage(error));
          }
        }}
      />
      <ConfirmDialog
        open={activateOpen}
        onOpenChange={setActivateOpen}
        title="Activate company access?"
        description={`Company users at ${company.name} will be able to sign in and use their workspace again.`}
        confirmLabel="Activate"
        isPending={activateTenant.isPending}
        onConfirm={async () => {
          try {
            await activateTenant.mutateAsync();
            toast.success(`${company.name} is active again.`);
            setActivateOpen(false);
          } catch (error) {
            toast.error(apiErrorMessage(error));
          }
        }}
      />
    </div>
  );
}

/**
 * How this company is doing as a customer: what they are on, whether anything
 * needs chasing, and — for those allowed to see it — what they are worth.
 *
 * The revenue tile is absent whenever the API omits it, which happens when the
 * viewer has not been given the revenue ability. Nothing is decided here.
 */
function CustomerSnapshot({ company }: { company: AdminTenantDetail }) {
  const subscription = company.subscription;
  const unresolved = company.support.unresolved;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <SnapshotTile
        icon={CreditCard}
        label="Subscription"
        value={subscription?.plan ?? "No plan"}
        detail={
          subscription === null
            ? "Has never subscribed"
            : subscription.on_trial
              ? `On trial until ${formatAdminDate(subscription.trial_ends_at)}`
              : `${SUBSCRIPTION_LABELS[subscription.status] ?? subscription.status}${
                  subscription.current_period_end
                    ? ` · renews ${formatAdminDate(subscription.current_period_end)}`
                    : ""
                }`
        }
        tone={subscriptionTone(subscription?.status)}
      />

      <SnapshotTile
        icon={Users}
        label="Billable employees"
        value={(subscription?.employee_count ?? 0).toLocaleString("en-NG")}
        detail={`${company.users_count.toLocaleString("en-NG")} sign-in ${company.users_count === 1 ? "account" : "accounts"}`}
        tone="slate"
      />

      <SnapshotTile
        icon={LifeBuoy}
        label="Support"
        value={unresolved.toLocaleString("en-NG")}
        detail={
          company.support.total === 0
            ? "Has never raised a ticket"
            : `${unresolved === 0 ? "Nothing" : unresolved === 1 ? "1 ticket" : `${unresolved} tickets`} open of ${company.support.total} ever`
        }
        tone={unresolved > 0 ? "amber" : "slate"}
      />

      {company.revenue ? (
        <SnapshotTile
          icon={Wallet}
          label="Collected"
          value={<MoneyText kobo={company.revenue.collected} />}
          detail={
            company.revenue.last_payment_at
              ? `Last paid ${formatAdminDate(company.revenue.last_payment_at)}`
              : "No payment has settled yet"
          }
          tone="green"
        />
      ) : (
        <SnapshotTile
          icon={Lock}
          label="Collected"
          value="Hidden"
          detail="Needs the Revenue access level"
          tone="slate"
        />
      )}
    </div>
  );
}

const SUBSCRIPTION_LABELS: Record<string, string> = {
  active: "Active",
  trialing: "On trial",
  past_due: "Payment overdue",
  cancelled: "Cancelled",
  expired: "Expired",
};

const snapshotTones = {
  green: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  amber: "bg-amber-50 text-amber-700 ring-amber-100",
  red: "bg-red-50 text-red-700 ring-red-100",
  slate: "bg-slate-100 text-slate-500 ring-slate-200",
} as const;

/** Colour means state here, never identity — so it stays semantic. */
function subscriptionTone(status?: string): keyof typeof snapshotTones {
  if (status === "active") return "green";
  if (status === "trialing") return "amber";
  if (status === "past_due" || status === "expired") return "red";
  return "slate";
}

function SnapshotTile({
  icon: Icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  detail: string;
  tone: keyof typeof snapshotTones;
}) {
  return (
    <Card className="border-slate-200/80">
      <CardContent className="flex items-start justify-between gap-3 p-5">
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">{label}</p>
          <p className="mt-2 truncate text-xl font-bold tracking-tight text-slate-950">{value}</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">{detail}</p>
        </div>
        <span className={cn("grid size-9 shrink-0 place-items-center rounded-xl ring-1", snapshotTones[tone])}>
          <Icon className="size-4" />
        </span>
      </CardContent>
    </Card>
  );
}

/** Onboarding has three steps — see features/onboarding/onboarding-page. */
const ONBOARDING_STEPS = 3;

function OnboardingProgress({ company }: { company: AdminTenantDetail }) {
  const done = company.onboarding_status === "completed";
  const skipped = company.onboarding_status === "skipped";
  const step = Math.min(Math.max(company.onboarding_step ?? 1, 1), ONBOARDING_STEPS);
  // Real fractions of the real step count. The previous bar multiplied the step
  // by 20 and capped at 90, so a company on the last of three steps read as 60%.
  const percent = done ? 100 : skipped ? 0 : Math.round((step / ONBOARDING_STEPS) * 100);

  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="font-medium text-slate-600">
          {done ? "Setup complete" : skipped ? "Setup skipped" : `Step ${step} of ${ONBOARDING_STEPS}`}
        </span>
        <AdminStatusBadge status={company.onboarding_status} />
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-linear-to-r from-fruition-700 to-emerald-400 transition-[width] duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
      {skipped && (
        <p className="mt-2 text-xs leading-5 text-slate-500">
          They chose to skip setup and configure things as they go.
        </p>
      )}
    </div>
  );
}
