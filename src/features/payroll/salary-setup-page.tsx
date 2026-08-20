"use client";

import { ArrowLeft, Layers3, Settings2, Sparkles, WalletCards } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCan } from "@/features/auth/use-auth";
import { SalaryFormulaBuilder } from "@/features/payroll/salary-formula-builder";
import {
  SalaryComponentsManager,
  SalaryStructuresManager,
} from "@/features/payroll/salary-setup-dialog";
import { usePayrollSettings } from "@/features/payroll/use-payroll";
import { cn } from "@/lib/utils";

type SetupTab = "components" | "structures";

export function SalarySetupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const canViewSalary = useCan("employees.view_salary");
  const canManageFormulas = useCan("payroll.formulas.manage");
  const settings = usePayrollSettings(canViewSalary || canManageFormulas);
  const requestedTab = searchParams.get("tab");
  const activeTab: SetupTab = requestedTab === "structures" ? "structures" : "components";
  const componentParam = searchParams.get("component");
  const componentId = componentParam && /^\d+$/.test(componentParam) ? Number(componentParam) : null;
  const advancedEnabled = settings.data?.advanced_salary_formulas_enabled ?? false;

  function setQuery(updates: { tab?: SetupTab; component?: number | null }) {
    const params = new URLSearchParams(searchParams.toString());
    if (updates.tab) params.set("tab", updates.tab);
    if (updates.component === null) params.delete("component");
    if (typeof updates.component === "number") params.set("component", String(updates.component));
    const query = params.toString();
    router.replace(query ? `/payroll/setup?${query}` : "/payroll/setup");
  }

  if (!canViewSalary) {
    return (
      <div className="rounded-xl border border-dashed bg-muted/20 px-6 py-12 text-center">
        <WalletCards className="mx-auto size-8 text-muted-foreground" />
        <h1 className="mt-3 font-heading text-xl font-semibold">Salary setup access required</h1>
        <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
          You need salary visibility access to review salary components and structures.
        </p>
        <Button className="mt-4" variant="outline" render={<Link href="/payroll" />}>
          <ArrowLeft className="size-4" /> Back to payroll
        </Button>
      </div>
    );
  }

  if (componentId !== null) {
    if (settings.isLoading) {
      return (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-[34rem] w-full rounded-xl" />
        </div>
      );
    }

    if (settings.isError) {
      return (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
          <h1 className="font-heading text-xl font-semibold">Payroll settings could not be loaded</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Formula editing is paused until the feature state can be confirmed.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={() => void settings.refetch()}>Retry</Button>
            <Button variant="outline" onClick={() => setQuery({ tab: "components", component: null })}>
              Back to salary setup
            </Button>
          </div>
        </div>
      );
    }

    if (!advancedEnabled) {
      return (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-6 text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100">
          <Sparkles className="size-7" />
          <h1 className="mt-3 font-heading text-xl font-semibold">Advanced salary formulas are off</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6">
            Enable this optional payroll feature in Organisation settings before opening a formula workspace.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {canManageFormulas && (
              <Button render={<Link href="/settings/organisation?tab=features" />}>
                Open feature settings
              </Button>
            )}
            <Button variant="outline" onClick={() => setQuery({ tab: "components", component: null })}>
              Back to salary setup
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="@container/formula-workspace">
        <SalaryFormulaBuilder
          componentId={componentId}
          onBack={() => setQuery({ tab: "components", component: null })}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Salary setup"
        description="Define reusable pay components and structures, then assign them from each employee’s Compensation tab."
        actions={
          <div className="flex flex-wrap gap-2">
            {canManageFormulas && (
              <Button variant="outline" render={<Link href="/settings/organisation?tab=features" />}>
                <Settings2 className="size-4" /> Payroll features
              </Button>
            )}
            <Button variant="outline" render={<Link href="/payroll" />}>
              <ArrowLeft className="size-4" /> Payroll
            </Button>
          </div>
        }
      />

      <section className={cn(
        "relative overflow-hidden rounded-2xl border p-5 shadow-sm sm:p-6",
        advancedEnabled
          ? "border-fruition-200 bg-gradient-to-r from-fruition-50 via-background to-background dark:border-fruition-800 dark:from-fruition-950/25"
          : "bg-card",
      )}>
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span className={cn(
              "grid size-11 shrink-0 place-items-center rounded-xl",
              advancedEnabled
                ? "bg-fruition-100 text-fruition-800 dark:bg-fruition-900/40 dark:text-fruition-200"
                : "bg-muted text-muted-foreground",
            )}>
              <Sparkles className="size-5" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-heading text-lg font-semibold">Advanced salary formulas</h2>
                <Badge variant={advancedEnabled ? "default" : "secondary"}>
                  {advancedEnabled ? "Enabled" : "Optional"}
                </Badge>
              </div>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                {advancedEnabled
                  ? "Formula components can use ordered conditions, basic salary, fixed values, percentages, and other published components."
                  : "Your current fixed and percentage salary setup remains available. Enable formulas only when your company needs custom calculations."}
              </p>
            </div>
          </div>
          {!advancedEnabled && canManageFormulas && (
            <Button render={<Link href="/settings/organisation?tab=features" />}>
              Enable in settings
            </Button>
          )}
        </div>
      </section>

      <div
        className="flex gap-1 overflow-x-auto rounded-xl border bg-muted/30 p-1"
        role="tablist"
        aria-label="Salary setup sections"
      >
        {([
          { id: "components" as const, label: "Components", icon: WalletCards },
          { id: "structures" as const, label: "Salary structures", icon: Layers3 },
        ]).map((tab) => (
          <button
            key={tab.id}
            id={`salary-tab-${tab.id}`}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`salary-panel-${tab.id}`}
            onClick={() => setQuery({ tab: tab.id, component: null })}
            className={cn(
              "inline-flex min-h-10 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-4 text-sm font-medium outline-none transition focus-visible:ring-3 focus-visible:ring-ring/50",
              activeTab === tab.id
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:bg-background/60 hover:text-foreground",
            )}
          >
            <tab.icon className="size-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <section
        id={`salary-panel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`salary-tab-${activeTab}`}
      >
        {activeTab === "components" ? (
          <SalaryComponentsManager
            advancedEnabled={advancedEnabled}
            onOpenFormula={(id) => setQuery({ tab: "components", component: id })}
          />
        ) : (
          <SalaryStructuresManager advancedEnabled={advancedEnabled} />
        )}
      </section>
    </div>
  );
}
