"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  CheckCircle2,
  Mail,
  Pencil,
  Phone,
  ShieldAlert,
  Users,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { FormDialog } from "@/components/form-dialog";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { mapLaravelErrorsToForm } from "@/lib/forms";
import { apiErrorMessage } from "@/lib/api";
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
          <Identity name={company.name} detail={`${company.slug} · Company #${company.id}`} />
          <div className="flex flex-wrap gap-2">
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
            <p className="mt-1 text-xs leading-5 text-amber-800/80">Tenant users cannot enter the workspace until a platform administrator activates it.</p>
          </div>
        </section>
      )}

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
            <CardTitle className="text-base">Workspace progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 pt-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <DetailItem icon={Users} label="Tenant users" value={company.users_count.toLocaleString("en-NG")} />
              <DetailItem icon={Building2} label="Onboarding step" value={`Step ${company.onboarding_step ?? 1}`} />
            </div>
            <div>
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="font-medium text-slate-600">Onboarding completion</span>
                <AdminStatusBadge status={company.onboarding_status} />
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-linear-to-r from-fruition-700 to-emerald-400"
                  style={{ width: company.onboarding_status === "completed" ? "100%" : `${Math.min((company.onboarding_step ?? 1) * 20, 90)}%` }}
                />
              </div>
            </div>
            <DetailItem icon={CalendarDays} label="Trial ends" value={formatAdminDate(company.trial_ends_at)} />
          </CardContent>
        </Card>
      </div>

      <EditTenantDialog tenant={company} open={editOpen} onOpenChange={setEditOpen} />
      <ReasonDialog
        open={suspendOpen}
        onOpenChange={setSuspendOpen}
        title="Suspend company access"
        description="All tenant users will be blocked from their workspace until the company is activated again."
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
        description={`Tenant users at ${company.name} will be able to sign in and use their workspace again.`}
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
