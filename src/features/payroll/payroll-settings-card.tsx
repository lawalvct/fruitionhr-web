"use client";

import axios from "axios";
import { Calculator, LockKeyhole, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCan } from "@/features/auth/use-auth";
import {
  usePayrollSettings,
  useSetAdvancedSalaryFormulas,
} from "@/features/payroll/use-payroll";
import { apiErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";

type ConflictPayload = {
  code?: string;
  message?: string;
  data?: { blocking_employee_salaries?: number };
};

export function PayrollSettingsCard() {
  const canManage = useCan("payroll.formulas.manage");
  const canViewSalary = useCan("employees.view_salary");
  const canView = canManage || canViewSalary;
  const settings = usePayrollSettings(canView);
  const update = useSetAdvancedSalaryFormulas();
  const [pendingState, setPendingState] = useState<boolean | null>(null);
  const [blockingCount, setBlockingCount] = useState<number | null>(null);
  const enabled = settings.data?.advanced_salary_formulas_enabled ?? false;
  const activeCount = settings.data?.active_formula_salary_count ?? 0;

  async function confirmChange() {
    if (pendingState === null) return;

    try {
      const next = pendingState;
      await update.mutateAsync(next);
      setPendingState(null);
      setBlockingCount(null);
      toast.success(next ? "Advanced salary formulas enabled." : "Advanced salary formulas disabled.");
    } catch (error) {
      if (axios.isAxiosError<ConflictPayload>(error)) {
        const payload = error.response?.data;
        if (payload?.code === "ADVANCED_SALARY_FORMULAS_IN_USE") {
          setBlockingCount(payload.data?.blocking_employee_salaries ?? activeCount);
          setPendingState(null);
          return;
        }
      }

      toast.error(apiErrorMessage(error));
    }
  }

  if (!canView) {
    return (
      <Card>
        <CardContent className="flex items-start gap-3 p-5">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground">
            <LockKeyhole className="size-5" />
          </span>
          <div>
            <h2 className="font-heading font-semibold">Payroll features</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              You need salary visibility or Manage payroll formulas access to view advanced payroll features.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader className="border-b bg-gradient-to-r from-fruition-50/80 to-transparent dark:from-fruition-950/20">
          <div className="flex items-start gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-fruition-100 text-fruition-800 dark:bg-fruition-900/40 dark:text-fruition-200">
              <Calculator className="size-5" />
            </span>
            <div className="min-w-0">
              <CardTitle>Payroll features</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Choose how much calculation flexibility your payroll team needs.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {settings.isLoading ? (
            <div className="space-y-3 p-5">
              <Skeleton className="h-5 w-56" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : settings.isError ? (
            <div className="flex flex-wrap items-center justify-between gap-3 p-5">
              <p className="text-sm text-muted-foreground">
                Payroll feature settings could not be loaded.
              </p>
              <Button variant="outline" onClick={() => void settings.refetch()}>
                Retry
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-5 p-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 items-start gap-3">
                <span className={cn(
                  "grid size-10 shrink-0 place-items-center rounded-xl",
                  enabled
                    ? "bg-fruition-100 text-fruition-800 dark:bg-fruition-900/40 dark:text-fruition-200"
                    : "bg-muted text-muted-foreground",
                )}>
                  <Sparkles className="size-5" />
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">Advanced salary formulas</h3>
                    <Badge variant={enabled ? "default" : "secondary"}>
                      {enabled ? "Enabled" : "Off by default"}
                    </Badge>
                  </div>
                  <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                    Build ordered, conditional salary calculations from basic pay, fixed amounts,
                    percentages, and other components. Regular fixed and percentage components
                    remain available when this is off.
                  </p>
                  {!canManage && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      This setting is read-only. Manage payroll formulas access is required to change it.
                    </p>
                  )}
                  {enabled && activeCount > 0 && (
                    <p className="mt-2 text-xs font-medium text-amber-700 dark:text-amber-300">
                      {activeCount} active employee {activeCount === 1 ? "salary uses" : "salaries use"} a published formula.
                    </p>
                  )}
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={enabled}
                aria-label="Advanced salary formulas"
                disabled={!canManage || update.isPending}
                onClick={() => setPendingState(!enabled)}
                className={cn(
                  "relative h-8 w-14 shrink-0 rounded-full border p-1 outline-none transition focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50",
                  enabled
                    ? "border-fruition-700 bg-fruition-700"
                    : "border-border bg-muted",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "block size-5 rounded-full bg-white shadow-sm transition-transform",
                    enabled && "translate-x-6",
                  )}
                />
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {blockingCount !== null && (
        <div
          role="alert"
          className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100"
        >
          <p className="font-semibold">Advanced salary formulas are still in use</p>
          <p className="mt-1">
            {blockingCount} active employee {blockingCount === 1 ? "salary depends" : "salaries depend"} on a
            published formula. Reassign those employees to simple structures before switching this feature off.
          </p>
          <Button className="mt-3" variant="outline" size="sm" onClick={() => setBlockingCount(null)}>
            Dismiss
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={pendingState !== null}
        onOpenChange={(open) => !open && setPendingState(null)}
        title={pendingState ? "Enable advanced salary formulas?" : "Switch off advanced salary formulas?"}
        description={
          pendingState
            ? "Your payroll team will be able to create, test, and publish conditional salary formulas. Existing salary setup will not change."
            : "This is only allowed when no active employee salary depends on a formula. Existing payroll history remains preserved."
        }
        confirmLabel={pendingState ? "Enable formulas" : "Switch off"}
        confirmVariant={pendingState ? "default" : "destructive"}
        isPending={update.isPending}
        onConfirm={() => void confirmChange()}
      />
    </>
  );
}
