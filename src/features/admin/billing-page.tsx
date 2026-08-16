"use client";

import { Banknote, CreditCard, Pencil, Plus, Users, Wallet } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { FormDialog } from "@/components/form-dialog";
import { MoneyText } from "@/components/money-text";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import type { BillingPlan } from "@/features/billing/types";
import { apiErrorMessage, isValidationError } from "@/lib/api";
import { AdminMetricCard, AdminPagination, formatAdminDate, humanize, QueryErrorState } from "./admin-ui";
import {
  useAdminPlans,
  useAdminSubscriptions,
  useCreatePlan,
  useUpdatePlan,
  type PlanInput,
} from "./use-admin-billing";

const selectClass =
  "h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-700 outline-none focus:border-fruition-400 focus:ring-2 focus:ring-fruition-500/15";

type Tab = "subscriptions" | "plans";

export function AdminBillingPage() {
  const [tab, setTab] = useState<Tab>("subscriptions");
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [editing, setEditing] = useState<BillingPlan | null>(null);
  const [creating, setCreating] = useState(false);

  const subscriptions = useAdminSubscriptions(page, status);
  const plans = useAdminPlans();
  const summary = subscriptions.data?.summary;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing"
        description="Revenue, subscriptions and the price list. FruitionHR charges per employee."
        actions={
          tab === "plans" ? (
            <Button onClick={() => setCreating(true)}>
              <Plus className="size-4" /> New plan
            </Button>
          ) : undefined
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminMetricCard
          label="Collected"
          value={summary ? formatKobo(summary.collected) : "—"}
          detail="Settled payments to date"
          icon={Wallet}
          tone="green"
        />
        <AdminMetricCard
          label="Active"
          value={summary?.active ?? 0}
          detail={`${summary?.trialing ?? 0} on trial`}
          icon={CreditCard}
          tone="blue"
        />
        <AdminMetricCard
          label="Past due"
          value={summary?.past_due ?? 0}
          detail="Awaiting payment"
          icon={Banknote}
          tone="amber"
        />
        <AdminMetricCard
          label="Billed employees"
          value={summary?.billable_employees ?? 0}
          detail="Across paying companies"
          icon={Users}
          tone="violet"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
          {(["subscriptions", "plans"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setTab(value);
                setPage(1);
              }}
              className={
                tab === value
                  ? "rounded-md bg-fruition-600 px-3 py-1.5 text-sm font-semibold text-white"
                  : "rounded-md px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900"
              }
            >
              {value === "subscriptions" ? "Subscriptions" : "Plans"}
            </button>
          ))}
        </div>

        {tab === "subscriptions" && (
          <select
            className={selectClass}
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="trialing">Trialing</option>
            <option value="past_due">Past due</option>
            <option value="cancelled">Cancelled</option>
          </select>
        )}
      </div>

      {tab === "subscriptions" ? (
        subscriptions.isError ? (
          <QueryErrorState
            title="We could not load the subscriptions"
            onRetry={() => subscriptions.refetch()}
          />
        ) : (
          <Card className="overflow-hidden p-0">
            <CardContent className="p-0">
              {subscriptions.isPending ? (
                <LoadingRows />
              ) : (subscriptions.data?.data ?? []).length === 0 ? (
                <EmptyRows label="No subscriptions match" />
              ) : (
                <ul className="divide-y divide-slate-100">
                  {(subscriptions.data?.data ?? []).map((row) => (
                    <li
                      key={row.id}
                      className="flex flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {row.company?.name ?? "Unknown company"}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {row.plan?.name ?? "No plan"} · {row.employee_count} employees
                        </p>
                      </div>
                      <div className="shrink-0 text-left sm:text-right">
                        <p className="text-sm font-semibold text-slate-900">
                          <MoneyText kobo={row.amount} />
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {humanize(row.status)} · renews {formatAdminDate(row.current_period_end)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <AdminPagination
                meta={
                  subscriptions.data
                    ? {
                        current_page: subscriptions.data.meta.current_page,
                        last_page: subscriptions.data.meta.last_page,
                        per_page: 20,
                        total: subscriptions.data.meta.total,
                        from: null,
                        to: null,
                      }
                    : undefined
                }
                isFetching={subscriptions.isFetching}
                onPageChange={setPage}
              />
            </CardContent>
          </Card>
        )
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {plans.isPending
            ? Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-56 w-full rounded-2xl" />
              ))
            : (plans.data ?? []).map((plan) => (
                <Card key={plan.id}>
                  <CardContent className="space-y-3 p-5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-base font-semibold text-slate-900">{plan.name}</p>
                        <p className="text-xs text-slate-500">/{plan.slug}</p>
                      </div>
                      {!plan.is_active && (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 uppercase">
                          Inactive
                        </span>
                      )}
                    </div>

                    <p className="text-xl font-bold text-slate-900">
                      <MoneyText kobo={plan.price_per_employee} />
                      <span className="text-sm font-normal text-slate-500"> / employee</span>
                    </p>

                    <p className="text-xs text-slate-500">
                      {plan.min_employees} seat minimum
                      {plan.max_employees ? ` · up to ${plan.max_employees}` : " · unlimited"} ·{" "}
                      {plan.trial_days}-day trial
                    </p>

                    <p className="text-xs text-slate-500">
                      {plan.subscriptions_count ?? 0} subscriber
                      {(plan.subscriptions_count ?? 0) === 1 ? "" : "s"}
                    </p>

                    <Button variant="outline" size="sm" onClick={() => setEditing(plan)}>
                      <Pencil className="size-3.5" /> Edit
                    </Button>
                  </CardContent>
                </Card>
              ))}
        </div>
      )}

      <PlanDialog
        open={creating || editing !== null}
        plan={editing}
        onOpenChange={(open) => {
          if (!open) {
            setCreating(false);
            setEditing(null);
          }
        }}
      />
    </div>
  );
}

/** Kobo → a compact ₦ string for the metric tiles. */
function formatKobo(kobo: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(kobo / 100);
}

function PlanDialog({
  open,
  plan,
  onOpenChange,
}: {
  open: boolean;
  plan: BillingPlan | null;
  onOpenChange: (open: boolean) => void;
}) {
  const create = useCreatePlan();
  const update = useUpdatePlan(plan?.id ?? 0);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Admins think in naira; the API stores kobo. Convert at this boundary only.
  const [form, setForm] = useState({
    name: "",
    description: "",
    naira: "",
    min_employees: "1",
    max_employees: "",
    trial_days: "14",
    features: "",
    is_active: true,
  });
  const [loadedId, setLoadedId] = useState<number | null>(null);

  if (open && plan && loadedId !== plan.id) {
    setLoadedId(plan.id);
    setForm({
      name: plan.name,
      description: plan.description ?? "",
      naira: String(plan.price_per_employee / 100),
      min_employees: String(plan.min_employees),
      max_employees: plan.max_employees ? String(plan.max_employees) : "",
      trial_days: String(plan.trial_days),
      features: (plan.features ?? []).join("\n"),
      is_active: plan.is_active,
    });
  }
  if (open && !plan && loadedId !== null) {
    setLoadedId(null);
    setForm({
      name: "",
      description: "",
      naira: "",
      min_employees: "1",
      max_employees: "",
      trial_days: "14",
      features: "",
      is_active: true,
    });
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrors({});

    const naira = Number(form.naira);
    if (!Number.isFinite(naira) || naira < 0) {
      setErrors({ naira: "Enter a price in naira." });
      return;
    }

    const payload: PlanInput = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      // Round to whole kobo — the API rejects fractional values outright.
      price_per_employee: Math.round(naira * 100),
      billing_interval: "monthly",
      min_employees: Number(form.min_employees) || 1,
      max_employees: form.max_employees ? Number(form.max_employees) : null,
      trial_days: Number(form.trial_days) || 0,
      features: form.features.split("\n").map((f) => f.trim()).filter(Boolean),
      is_active: form.is_active,
    };

    try {
      if (plan) {
        await update.mutateAsync(payload);
        toast.success("Plan updated.");
      } else {
        await create.mutateAsync(payload);
        toast.success("Plan created.");
      }
      onOpenChange(false);
    } catch (error) {
      if (isValidationError(error)) {
        const fieldErrors = error.response?.data.errors ?? {};
        setErrors(
          Object.fromEntries(
            Object.entries(fieldErrors).map(([key, messages]) => [key, messages[0]]),
          ),
        );
      }
      toast.error(apiErrorMessage(error));
    }
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={plan ? `Edit ${plan.name}` : "New plan"}
      description="Prices are per employee, per month."
      formId="plan-form"
      isPending={create.isPending || update.isPending}
      submitLabel={plan ? "Save plan" : "Create plan"}
    >
      <form id="plan-form" onSubmit={submit} className="space-y-4 py-4">
        <Field label="Name" error={errors.name}>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </Field>
        <Field label="Description" error={errors.description}>
          <Input
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </Field>
        <Field
          label="Price per employee (₦)"
          error={errors.naira ?? errors.price_per_employee}
          hint="Stored as kobo. 1500 means ₦1,500 per employee per month."
        >
          <Input
            type="number"
            min="0"
            step="0.01"
            value={form.naira}
            onChange={(e) => setForm({ ...form, naira: e.target.value })}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Min seats" error={errors.min_employees}>
            <Input
              type="number"
              min="1"
              value={form.min_employees}
              onChange={(e) => setForm({ ...form, min_employees: e.target.value })}
            />
          </Field>
          <Field label="Max seats" error={errors.max_employees} hint="Blank = unlimited">
            <Input
              type="number"
              min="1"
              value={form.max_employees}
              onChange={(e) => setForm({ ...form, max_employees: e.target.value })}
            />
          </Field>
          <Field label="Trial days" error={errors.trial_days}>
            <Input
              type="number"
              min="0"
              value={form.trial_days}
              onChange={(e) => setForm({ ...form, trial_days: e.target.value })}
            />
          </Field>
        </div>
        <Field label="Features" hint="One per line.">
          <textarea
            rows={4}
            value={form.features}
            onChange={(e) => setForm({ ...form, features: e.target.value })}
            className="w-full rounded-lg border border-input bg-white px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20"
          />
        </Field>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
          />
          Available for new subscriptions
        </label>
      </form>
    </FormDialog>
  );
}

function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error ? (
        <p className="text-xs text-red-600">{error}</p>
      ) : hint ? (
        <p className="text-xs text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}

function LoadingRows() {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: 5 }).map((_, index) => (
        <Skeleton key={index} className="h-14 w-full rounded-xl" />
      ))}
    </div>
  );
}

function EmptyRows({ label }: { label: string }) {
  return (
    <div className="grid min-h-48 place-items-center p-6 text-center">
      <p className="text-sm font-semibold text-slate-900">{label}</p>
    </div>
  );
}
