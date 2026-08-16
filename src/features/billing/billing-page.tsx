"use client";

import {
  AlertTriangle,
  Check,
  CreditCard,
  Download,
  Loader2,
  Receipt,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { MoneyText } from "@/components/money-text";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { apiErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { BillingPlan, BillingSubscription } from "./types";
import {
  useBillingPayments,
  useBillingPlans,
  useCancelSubscription,
  useStartPayment,
  useSubscribe,
  useSubscription,
} from "./use-billing";

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-NG", { dateStyle: "medium" }).format(new Date(value));
}

export function BillingPage() {
  const plans = useBillingPlans();
  const subscription = useSubscription();
  const payments = useBillingPayments();

  const subscribe = useSubscribe();
  const startPayment = useStartPayment();
  const cancel = useCancelSubscription();

  const [cancelling, setCancelling] = useState(false);
  const [busyPlanId, setBusyPlanId] = useState<number | null>(null);

  const current = subscription.data?.data ?? null;
  const employees = subscription.data?.meta.employees ?? plans.data?.meta.employees ?? 0;
  const renewal = subscription.data?.meta.renewal_quote ?? null;
  const gateways = subscription.data?.meta.gateways ?? plans.data?.meta.gateways ?? [];
  const suggested = subscription.data?.meta.suggested_plan ?? null;
  const defaultGateway = subscription.data?.meta.default_gateway ?? null;
  const [gateway, setGateway] = useState<string | null>(null);
  // Fall back to whatever the platform preselected.
  const chosenGateway = gateway ?? defaultGateway ?? gateways[0]?.slug ?? undefined;

  const choosePlan = async (plan: BillingPlan) => {
    setBusyPlanId(plan.id);
    try {
      const result = await subscribe.mutateAsync(plan.id);
      toast.success(result.message);
    } catch (error) {
      toast.error(apiErrorMessage(error));
    } finally {
      setBusyPlanId(null);
    }
  };

  const pay = async (planId?: number, gateway?: string) => {
    try {
      const result = await startPayment.mutateAsync({ planId, gateway });
      // The API returns a URL rather than redirecting — send the browser now.
      window.location.href = result.payment_url;
    } catch (error) {
      toast.error(apiErrorMessage(error));
    }
  };

  const confirmCancel = async () => {
    try {
      const result = await cancel.mutateAsync();
      toast.success(result.message);
      setCancelling(false);
    } catch (error) {
      toast.error(apiErrorMessage(error));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing"
        description="FruitionHR is charged per employee. Your bill follows your headcount."
      />

      {subscription.isPending ? (
        <Skeleton className="h-44 w-full rounded-2xl" />
      ) : (
        <CurrentPlanCard
          subscription={current}
          employees={employees}
          renewalAmount={renewal?.amount ?? null}
          isPaying={startPayment.isPending}
          onPay={() => pay(undefined, chosenGateway)}
          onCancel={() => setCancelling(true)}
        />
      )}

      {suggested && current?.plan && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm font-semibold text-amber-900">
            You have outgrown {current.plan.name}
          </p>
          <p className="mt-0.5 text-xs leading-5 text-amber-800/90">
            {current.plan.name} is designed for up to {current.plan.max_employees} employees and
            you have {employees}. You are billed for every employee either way —{" "}
            {suggested.name} is simply a better fit.
          </p>
        </div>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold tracking-wide text-slate-500 uppercase">
          Plans
        </h2>

        {plans.isPending ? (
          <div className="grid gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-72 w-full rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {(plans.data?.data ?? []).map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                isCurrent={current?.plan?.id === plan.id}
                isBusy={busyPlanId === plan.id || subscribe.isPending}
                onChoose={() => choosePlan(plan)}
              />
            ))}
          </div>
        )}

        {gateways.length > 1 && (
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3">
            <span className="text-sm font-medium text-slate-700">Pay with</span>
            {gateways.map((method) => (
              <button
                key={method.slug}
                type="button"
                onClick={() => setGateway(method.slug)}
                className={
                  chosenGateway === method.slug
                    ? "rounded-lg bg-fruition-600 px-3 py-1.5 text-sm font-semibold text-white"
                    : "rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:border-fruition-300"
                }
              >
                {method.label}
              </button>
            ))}
          </div>
        )}

        {gateways.length === 0 && (
          <p className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
            <AlertTriangle className="size-3.5" /> No payment method is available right now.
            Contact support if this persists.
          </p>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold tracking-wide text-slate-500 uppercase">
          Payment history
        </h2>
        <Card className="overflow-hidden p-0">
          <CardContent className="p-0">
            {payments.isPending ? (
              <div className="space-y-3 p-4">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={index} className="h-12 w-full rounded-lg" />
                ))}
              </div>
            ) : (payments.data ?? []).length === 0 ? (
              <div className="grid min-h-40 place-items-center p-6 text-center">
                <div>
                  <span className="mx-auto grid size-10 place-items-center rounded-xl bg-slate-50 text-slate-400 ring-1 ring-slate-100">
                    <Receipt className="size-4" />
                  </span>
                  <p className="mt-2 text-sm font-medium text-slate-700">No payments yet</p>
                </div>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {(payments.data ?? []).map((payment) => (
                  <li
                    key={payment.id}
                    className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900">
                        <MoneyText kobo={payment.amount} />
                      </p>
                      <p className="mt-0.5 truncate font-mono text-xs text-slate-400">
                        {payment.reference}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <PaymentPill status={payment.status} />
                        <p className="mt-0.5 text-xs text-slate-500">
                          {formatDate(payment.paid_at ?? payment.created_at)} · {payment.gateway}
                        </p>
                      </div>
                      {payment.status === "successful" && (
                        // A plain link, not fetch: the browser handles the file
                        // save and the session cookie rides along.
                        <Button
                          variant="outline"
                          size="sm"
                          render={
                            <a
                              href={`/api/v1/billing/payments/${encodeURIComponent(payment.reference)}/receipt`}
                            />
                          }
                        >
                          <Download className="size-3.5" /> Receipt
                        </Button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>

      <ConfirmDialog
        open={cancelling}
        onOpenChange={setCancelling}
        title="Cancel your subscription?"
        description={
          current?.current_period_end
            ? `You keep full access until ${formatDate(current.current_period_end)}. After that the workspace becomes read-only.`
            : "You keep access until the end of the period you have paid for."
        }
        confirmLabel="Cancel subscription"
        isPending={cancel.isPending}
        onConfirm={confirmCancel}
      />
    </div>
  );
}

function CurrentPlanCard({
  subscription,
  employees,
  renewalAmount,
  isPaying,
  onPay,
  onCancel,
}: {
  subscription: BillingSubscription | null;
  employees: number;
  renewalAmount: number | null;
  isPaying: boolean;
  onPay: () => void;
  onCancel: () => void;
}) {
  if (!subscription) {
    return (
      <Card>
        <CardContent className="flex flex-col items-start gap-2 p-6">
          <p className="text-base font-semibold text-slate-900">No plan yet</p>
          <p className="text-sm text-slate-600">
            You have {employees} billable {employees === 1 ? "employee" : "employees"}. Pick a
            plan below to get started.
          </p>
        </CardContent>
      </Card>
    );
  }

  const needsPayment =
    subscription.status === "past_due" || subscription.status === "expired";

  return (
    <Card className={cn(needsPayment && "border-amber-300 bg-amber-50/40")}>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="text-base">
            {subscription.plan?.name ?? "Current plan"}
          </CardTitle>
          <p className="mt-1 text-sm text-slate-600">
            <StatusLine subscription={subscription} />
          </p>
        </div>
        <StatusPill subscription={subscription} />
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <Metric
            label="Billable employees"
            value={String(employees)}
            icon={<Users className="size-4" />}
          />
          <Metric
            label="Per employee"
            value={<MoneyText kobo={subscription.plan?.price_per_employee ?? 0} />}
          />
          <Metric
            label="Next charge"
            value={renewalAmount === null ? "—" : <MoneyText kobo={renewalAmount} />}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={onPay} disabled={isPaying}>
            {isPaying ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <CreditCard className="size-4" />
            )}
            {needsPayment ? "Pay now" : "Renew early"}
          </Button>
          {subscription.status !== "cancelled" && (
            <Button variant="ghost" onClick={onCancel}>
              Cancel subscription
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function StatusLine({ subscription }: { subscription: BillingSubscription }) {
  if (subscription.on_trial) {
    return <>Trial ends {formatDate(subscription.trial_ends_at)}.</>;
  }
  if (subscription.status === "cancelled") {
    return <>Cancelled — access ends {formatDate(subscription.ends_at)}.</>;
  }
  if (subscription.status === "active") {
    return <>Renews {formatDate(subscription.current_period_end)}.</>;
  }
  return <>Payment needed to activate this plan.</>;
}

function StatusPill({ subscription }: { subscription: BillingSubscription }) {
  const tone = subscription.is_usable
    ? "bg-fruition-50 text-fruition-800"
    : "bg-amber-100 text-amber-900";

  const label = subscription.on_trial
    ? "Trial"
    : subscription.status.replace("_", " ");

  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wide uppercase",
        tone,
      )}
    >
      {label}
    </span>
  );
}

function Metric({
  label,
  value,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
        {icon} {label}
      </p>
      <p className="mt-1 text-lg font-bold text-slate-900">{value}</p>
    </div>
  );
}

function PlanCard({
  plan,
  isCurrent,
  isBusy,
  onChoose,
}: {
  plan: BillingPlan;
  isCurrent: boolean;
  isBusy: boolean;
  onChoose: () => void;
}) {
  return (
    <Card className={cn("flex flex-col", isCurrent && "border-fruition-400 ring-1 ring-fruition-200")}>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">{plan.name}</CardTitle>
          {isCurrent && (
            <span className="rounded-full bg-fruition-600 px-2 py-0.5 text-[10px] font-bold tracking-wide text-white uppercase">
              Current
            </span>
          )}
        </div>
        {plan.description && (
          <p className="mt-1 text-sm text-slate-600">{plan.description}</p>
        )}
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-4">
        <div>
          <p className="text-2xl font-bold tracking-tight text-slate-900">
            <MoneyText kobo={plan.price_per_employee} />
            <span className="text-sm font-normal text-slate-500"> / employee</span>
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            per {plan.billing_interval === "yearly" ? "year" : "month"}
            {plan.min_employees > 1 ? ` · minimum ${plan.min_employees} seats` : ""}
          </p>
        </div>

        {plan.quote && (
          <div className="rounded-xl bg-fruition-50/70 p-3">
            <p className="text-xs font-medium text-fruition-900">Your cost today</p>
            <p className="mt-0.5 text-xl font-bold text-fruition-900">
              <MoneyText kobo={plan.quote.amount} />
            </p>
            <p className="mt-0.5 text-xs text-fruition-800">
              {plan.quote.billable_seats} seats
              {plan.quote.billable_seats !== plan.quote.employees
                ? ` (you have ${plan.quote.employees})`
                : ""}
            </p>
            {plan.quote.exceeds_ceiling && (
              <p className="mt-1 text-xs font-medium text-amber-700">
                Above this plan&apos;s {plan.quote.ceiling}-employee guideline
              </p>
            )}
          </div>
        )}

        <ul className="flex-1 space-y-1.5">
          {(plan.features ?? []).map((feature) => (
            <li key={feature} className="flex items-start gap-2 text-sm text-slate-600">
              <Check className="mt-0.5 size-3.5 shrink-0 text-fruition-600" />
              {feature}
            </li>
          ))}
        </ul>

        <Button
          variant={isCurrent ? "outline" : "default"}
          disabled={isCurrent || isBusy}
          onClick={onChoose}
          className="w-full"
        >
          {isBusy && <Loader2 className="size-4 animate-spin" />}
          {isCurrent ? "Current plan" : `Choose ${plan.name}`}
        </Button>
      </CardContent>
    </Card>
  );
}

function PaymentPill({ status }: { status: string }) {
  const tone =
    status === "successful"
      ? "bg-fruition-50 text-fruition-800"
      : status === "failed"
        ? "bg-red-50 text-red-700"
        : "bg-slate-100 text-slate-600";

  return (
    <span
      className={cn(
        "inline-block rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase",
        tone,
      )}
    >
      {status}
    </span>
  );
}
