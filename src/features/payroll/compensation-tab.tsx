"use client";

import { History, Plus, RotateCcw, TrendingUp, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AmountInput } from "@/components/amount-input";
import { Can } from "@/components/can";
import { MoneyText } from "@/components/money-text";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { apiErrorMessage } from "@/lib/api";
import {
  isReservedBasicSalaryComponent,
  useAssignSalary,
  useEmployeeSalary,
  useIncreaseSalary,
  useSalaryHistory,
  useSalaryComponents,
  useSalaryStructures,
} from "@/features/payroll/use-payroll";

export function CompensationTab({ employeeId }: { employeeId: string }) {
  const { data: salary, isLoading } = useEmployeeSalary(employeeId);
  const { data: salaryHistory } = useSalaryHistory(employeeId);
  const { data: structures } = useSalaryStructures();
  const { data: components } = useSalaryComponents();
  const assign = useAssignSalary(employeeId);
  const increaseSalary = useIncreaseSalary(employeeId);

  const [editing, setEditing] = useState(false);
  const [basic, setBasic] = useState(0); // naira
  const [structureId, setStructureId] = useState<number | "">("");
  const [from, setFrom] = useState(monthStart());
  const [increasing, setIncreasing] = useState(false);
  const [newBasic, setNewBasic] = useState(0);
  const [increaseFrom, setIncreaseFrom] = useState(nextMonthStart());
  const [increaseReason, setIncreaseReason] = useState("");
  const [overrideAmounts, setOverrideAmounts] = useState<Record<number, number>>({});
  const [excludedIds, setExcludedIds] = useState<number[]>([]);
  const [additionalAmounts, setAdditionalAmounts] = useState<Record<number, number>>({});
  const [componentToAdd, setComponentToAdd] = useState<number | "">("");

  if (isLoading) return <Skeleton className="h-40 w-full" />;

  const selectedStructure = structures?.find((structure) => structure.id === Number(structureId));
  const structuredComponents = selectedStructure?.components.filter(
    (component) => !isReservedBasicSalaryComponent(component),
  ) ?? [];
  const structuredComponentIds = new Set(structuredComponents.map((component) => component.salary_component_id));
  const availableAdditionalComponents = components?.filter(
    (component) => component.is_active
      && !isReservedBasicSalaryComponent(component)
      && !structuredComponentIds.has(component.id)
      && !(component.id in additionalAmounts),
  ) ?? [];

  const structureDefaultNaira = (line: (typeof structuredComponents)[number]) => {
    if (line.amount != null) return line.amount / 100;

    const component = components?.find((item) => item.id === line.salary_component_id);
    const percent = line.percent ?? component?.percent ?? 0;
    return basic * percent / 100;
  };

  const startEditing = () => {
    setBasic((salary?.basic_salary ?? 0) / 100);
    setStructureId(salary?.structure?.id ?? "");
    setOverrideAmounts(Object.fromEntries(
      (salary?.component_overrides ?? [])
        .filter((override) => override.mode === "override")
        .map((override) => [override.salary_component_id, (override.amount ?? 0) / 100]),
    ));
    setExcludedIds((salary?.component_overrides ?? [])
      .filter((override) => override.mode === "excluded")
      .map((override) => override.salary_component_id));
    setAdditionalAmounts(Object.fromEntries(
      (salary?.component_overrides ?? [])
        .filter((override) => override.mode === "additional")
        .map((override) => [override.salary_component_id, (override.amount ?? 0) / 100]),
    ));
    setComponentToAdd("");
    setFrom(salary ? nextMonthStart() : monthStart());
    setEditing(true);
  };

  const startIncrease = () => {
    setNewBasic((salary?.basic_salary ?? 0) / 100);
    setIncreaseFrom(nextMonthStart());
    setIncreaseReason("");
    setIncreasing(true);
  };

  const submitIncrease = async () => {
    try {
      await increaseSalary.mutateAsync({
        basic_salary: Math.round(newBasic * 100),
        effective_from: increaseFrom,
        change_reason: increaseReason.trim(),
      });
      toast.success("Basic salary increase scheduled.");
      setIncreasing(false);
    } catch (error) {
      toast.error(apiErrorMessage(error));
    }
  };

  const submit = async () => {
    try {
      await assign.mutateAsync({
        basic_salary: Math.round(basic * 100),
        salary_structure_id: structureId === "" ? null : Number(structureId),
        effective_from: from,
        component_overrides: [
          ...Object.entries(overrideAmounts).filter(([componentId]) => !excludedIds.includes(Number(componentId))).map(([componentId, amount]) => ({
            salary_component_id: Number(componentId),
            mode: "override" as const,
            amount: Math.round(amount * 100),
          })),
          ...excludedIds.map((componentId) => ({
            salary_component_id: componentId,
            mode: "excluded" as const,
          })),
          ...Object.entries(additionalAmounts).map(([componentId, amount]) => ({
            salary_component_id: Number(componentId),
            mode: "additional" as const,
            amount: Math.round(amount * 100),
          })),
        ],
      });
      toast.success("Salary assigned.");
      setEditing(false);
    } catch (error) {
      toast.error(apiErrorMessage(error));
    }
  };

  return (
    <div className="space-y-5">
      {salary ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Basic", value: salary.breakdown.basic },
            { label: "Gross", value: salary.breakdown.gross },
            { label: "Taxable", value: salary.breakdown.taxable_pay },
            { label: "Pensionable", value: salary.breakdown.pensionable_pay },
          ].map((tile) => (
            <div key={tile.label} className="rounded-xl border bg-card p-4">
              <p className="text-xs text-muted-foreground">{tile.label}</p>
              <p className="text-lg font-bold text-fruition-700"><MoneyText kobo={tile.value} /></p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No salary assigned yet.</p>
      )}

      {salary && (
        <div className="rounded-lg border">
          <div className="border-b bg-muted/40 px-4 py-2 text-sm font-medium">
            Breakdown {salary.structure ? `· ${salary.structure.name}` : ""}
          </div>
          <ul className="divide-y text-sm">
            <li className="flex justify-between px-4 py-2">
              <span>Basic Salary</span><MoneyText kobo={salary.breakdown.basic} />
            </li>
            {salary.breakdown.earnings.map((e) => (
              <li key={e.code} className="flex justify-between px-4 py-2">
                <span>{e.name}</span><MoneyText kobo={e.amount} />
              </li>
            ))}
            {salary.breakdown.fringe_benefits.map((benefit) => (
              <li key={benefit.code} className="flex justify-between bg-amber-50/60 px-4 py-2 text-amber-900 dark:bg-amber-950/20 dark:text-amber-200">
                <span>{benefit.name} <span className="text-xs opacity-70">(non-cash)</span></span>
                <MoneyText kobo={benefit.amount} />
              </li>
            ))}
            <li className="flex justify-between bg-muted/30 px-4 py-2 font-semibold">
              <span>Gross</span><MoneyText kobo={salary.breakdown.gross} />
            </li>
          </ul>
        </div>
      )}

      {increasing && salary && (
        <div className="grid gap-4 rounded-lg border border-fruition-200 bg-fruition-50/40 p-4 dark:bg-fruition-950/10">
          <div>
            <h3 className="font-semibold">Increase basic salary</h3>
            <p className="text-xs text-muted-foreground">The existing salary remains valid until the day before this increase takes effect.</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="grid gap-2">
              <Label>Current basic salary</Label>
              <div className="flex h-9 items-center rounded-md border bg-muted/50 px-3 text-sm font-medium"><MoneyText kobo={salary.basic_salary} /></div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="increase-basic">New basic salary (₦ / month)</Label>
              <AmountInput id="increase-basic" value={newBasic} onValueChange={setNewBasic} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="increase-from">Effective from</Label>
              <Input id="increase-from" type="date" value={increaseFrom} onChange={(event) => setIncreaseFrom(event.target.value)} />
              <p className="text-xs text-muted-foreground">Use the first day of a payroll month.</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="increase-reason">Reason</Label>
              <Input id="increase-reason" value={increaseReason} onChange={(event) => setIncreaseReason(event.target.value)} placeholder="e.g. Annual salary review" />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIncreasing(false)}>Cancel</Button>
            <Button onClick={submitIncrease} disabled={increaseSalary.isPending || newBasic <= salary.basic_salary / 100 || !increaseReason.trim()}>
              {increaseSalary.isPending ? "Scheduling…" : "Schedule increase"}
            </Button>
          </div>
        </div>
      )}

      <Can permission="employees.manage_salary">
        {editing ? (
          <div className="grid gap-3 rounded-lg border bg-muted/40 p-4">
            <div className="grid gap-2">
              <Label htmlFor="comp-basic">Basic salary (₦ / month)</Label>
              <AmountInput id="comp-basic" value={basic} onValueChange={setBasic} placeholder="0" />
              <p className="text-xs text-muted-foreground">
                Enter the employee&apos;s monthly basic salary here. Salary structures add allowances, deductions, benefits, and employer contributions only.
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="comp-structure">Salary structure</Label>
              <select id="comp-structure" className="h-9 rounded-md border bg-background px-2 text-sm" value={structureId} onChange={(e) => {
                setStructureId(e.target.value === "" ? "" : Number(e.target.value));
                setOverrideAmounts({});
                setExcludedIds([]);
                setAdditionalAmounts({});
              }}>
                <option value="">None (basic only)</option>
                {structures?.filter((s) => s.is_active || s.id === salary?.structure?.id).map((s) => {
                  const componentNames = s.components
                    .filter((component) => !isReservedBasicSalaryComponent(component))
                    .map((component) => component.component_name || component.component_code)
                    .filter(Boolean)
                    .join(", ");

                  return (
                    <option key={s.id} value={s.id}>
                      {s.name}{componentNames ? ` (${componentNames})` : ""}
                    </option>
                  );
                })}
              </select>
            </div>
            {structuredComponents.length > 0 && (
              <div className="grid gap-2">
                <div>
                  <Label>Structure components</Label>
                  <p className="text-xs text-muted-foreground">Change an amount for this employee only, exclude it, or reset it to the structure default.</p>
                </div>
                <div className="space-y-2">
                  {structuredComponents.map((line) => {
                    const component = components?.find((item) => item.id === line.salary_component_id);
                    const excluded = excludedIds.includes(line.salary_component_id);
                    const overridden = line.salary_component_id in overrideAmounts;
                    const amount = overridden ? overrideAmounts[line.salary_component_id] : structureDefaultNaira(line);

                    return (
                      <div key={line.salary_component_id} className="grid gap-2 rounded-md border bg-background p-3 sm:grid-cols-[minmax(0,1fr)_10rem_auto] sm:items-center">
                        <div className="min-w-0">
                          <p className={`truncate text-sm font-medium ${excluded ? "line-through text-muted-foreground" : ""}`}>
                            {line.component_name || line.component_code}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {excluded ? "Excluded for this employee" : overridden ? "Employee override" : component?.calc_type === "percent_of_basic" ? `Structure default · ${line.percent ?? component.percent}% of basic` : "Structure default"}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-muted-foreground">₦</span>
                          <AmountInput
                            value={amount}
                            disabled={excluded}
                            onValueChange={(value) => setOverrideAmounts((current) => ({ ...current, [line.salary_component_id]: value }))}
                            placeholder="0"
                          />
                        </div>
                        <div className="flex items-center justify-end gap-1">
                          {overridden && !excluded && (
                            <Button type="button" size="icon-sm" variant="ghost" aria-label={`Reset ${line.component_name}`} onClick={() => setOverrideAmounts((current) => {
                              const next = { ...current };
                              delete next[line.salary_component_id];
                              return next;
                            })}>
                              <RotateCcw className="size-4" />
                            </Button>
                          )}
                          <Button type="button" size="sm" variant={excluded ? "outline" : "ghost"} onClick={() => setExcludedIds((current) => excluded ? current.filter((id) => id !== line.salary_component_id) : [...current, line.salary_component_id])}>
                            {excluded ? "Restore" : "Exclude"}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            <div className="grid gap-2">
              <div>
                <Label>Employee-only components</Label>
                <p className="text-xs text-muted-foreground">Add a component without changing the shared salary structure.</p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <select className="h-9 min-w-0 flex-1 rounded-md border bg-background px-2 text-sm" value={componentToAdd} onChange={(e) => setComponentToAdd(e.target.value === "" ? "" : Number(e.target.value))}>
                  <option value="">Select a component</option>
                  {availableAdditionalComponents.map((component) => (
                    <option key={component.id} value={component.id}>{component.name} ({component.code})</option>
                  ))}
                </select>
                <Button type="button" variant="outline" disabled={componentToAdd === ""} onClick={() => {
                  if (componentToAdd === "") return;
                  setAdditionalAmounts((current) => ({ ...current, [componentToAdd]: 0 }));
                  setComponentToAdd("");
                }}>
                  <Plus className="size-4" /> Add component
                </Button>
              </div>
              {Object.entries(additionalAmounts).map(([componentId, amount]) => {
                const component = components?.find((item) => item.id === Number(componentId));
                if (!component) return null;

                return (
                  <div key={componentId} className="grid gap-2 rounded-md border border-primary/20 bg-primary/5 p-3 sm:grid-cols-[minmax(0,1fr)_10rem_auto] sm:items-center">
                    <div>
                      <p className="text-sm font-medium">{component.name}</p>
                      <p className="text-xs text-muted-foreground">Employee-only · {component.code}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">₦</span>
                      <AmountInput value={amount} onValueChange={(value) => setAdditionalAmounts((current) => ({ ...current, [component.id]: value }))} placeholder="0" />
                    </div>
                    <Button type="button" size="icon-sm" variant="ghost" aria-label={`Remove ${component.name}`} onClick={() => setAdditionalAmounts((current) => {
                      const next = { ...current };
                      delete next[component.id];
                      return next;
                    })}>
                      <X className="size-4 text-destructive" />
                    </Button>
                  </div>
                );
              })}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="comp-from">Effective from</Label>
              <Input id="comp-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
              <Button onClick={submit} disabled={assign.isPending || basic <= 0}>
                {assign.isPending ? "Saving…" : "Save salary"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={startEditing}>{salary ? "Change compensation" : "Assign salary"}</Button>
            {salary && <Button onClick={startIncrease}><TrendingUp className="size-4" /> Increase basic salary</Button>}
          </div>
        )}
      </Can>

      <div className="overflow-hidden rounded-lg border">
        <div className="flex items-center gap-2 border-b bg-muted/40 px-4 py-3 font-medium"><History className="size-4" /> Salary history</div>
        {salaryHistory?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b text-xs text-muted-foreground"><tr><th className="px-4 py-2">Effective dates</th><th className="px-4 py-2">Basic</th><th className="px-4 py-2">Gross</th><th className="px-4 py-2">Change</th><th className="px-4 py-2">Status</th><th className="px-4 py-2">Reason</th></tr></thead>
              <tbody className="divide-y">
                {salaryHistory.map((entry) => (
                  <tr key={entry.id}>
                    <td className="whitespace-nowrap px-4 py-3">{formatDate(entry.effective_from)} – {entry.effective_to ? formatDate(entry.effective_to) : "Present"}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-medium"><MoneyText kobo={entry.basic_salary} /></td>
                    <td className="whitespace-nowrap px-4 py-3"><MoneyText kobo={entry.breakdown.gross} /></td>
                    <td className="px-4 py-3">{changeLabel(entry.change_type)}</td>
                    <td className="px-4 py-3"><Badge variant={entry.status === "current" ? "default" : "secondary"}>{entry.status}</Badge></td>
                    <td className="max-w-xs px-4 py-3 text-muted-foreground">{entry.change_reason || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="px-4 py-5 text-sm text-muted-foreground">No salary history yet.</p>}
      </div>
    </div>
  );
}

function monthStart() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`;
}

function nextMonthStart() {
  const date = new Date();
  return `${date.getFullYear() + (date.getMonth() === 11 ? 1 : 0)}-${String((date.getMonth() + 1) % 12 + 1).padStart(2, "0")}-01`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-NG", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
}

function changeLabel(type: string | null) {
  if (type === "basic_salary_increase") return "Basic salary increase";
  if (type === "compensation_update") return "Compensation update";
  return "Initial assignment";
}
