"use client";

import { Pencil, Plus, Sparkles, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AmountInput } from "@/components/amount-input";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { apiErrorMessage } from "@/lib/api";
import { useCan } from "@/features/auth/use-auth";
import {
  calcBaseLabel,
  calcSummary,
  isPercentCalc,
  isReservedBasicSalaryComponent,
  useSalaryComponents,
  useDeleteSalaryComponent,
  useDeleteSalaryStructure,
  useSalaryStructures,
  useSaveSalaryComponent,
  useSaveSalaryStructure,
  type CalcType,
  type SalaryComponent,
  type SalaryStructure,
} from "@/features/payroll/use-payroll";

type Tab = "components" | "structures";
type ComponentType = "earning" | "deduction" | "employer_contributor" | "fringe_benefit";

const emptyComponentForm = () => ({
  name: "",
  code: "",
  type: "earning" as ComponentType,
  calc_type: "fixed" as CalcType,
  percent: 0,
  is_taxable: true,
  is_pensionable: false,
  is_active: true,
});

export function SalarySetupDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [tab, setTab] = useState<Tab>("components");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader className="pr-12">
          <SheetTitle>Salary setup</SheetTitle>
          <SheetDescription>
            Define pay components and bundle them into structures employees are
            assigned to.
          </SheetDescription>
        </SheetHeader>

        <div className="px-4 pb-6">
          <div className="mb-5 flex gap-1 border-b">
            {(["components", "structures"] as Tab[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`flex-1 border-b-2 px-3 py-2 text-sm font-medium capitalize ${
                  tab === t ? "border-primary text-foreground" : "border-transparent text-muted-foreground"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {tab === "components" ? <SalaryComponentsManager /> : <SalaryStructuresManager />}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function SalaryComponentsManager({
  advancedEnabled = false,
  onOpenFormula,
}: {
  advancedEnabled?: boolean;
  onOpenFormula?: (componentId: number) => void;
}) {
  const { data: components } = useSalaryComponents();
  const save = useSaveSalaryComponent();
  const remove = useDeleteSalaryComponent();
  const canManage = useCan("employees.manage_salary");
  const canManageFormulas = useCan("payroll.formulas.manage");
  const [editing, setEditing] = useState<SalaryComponent | null>(null);
  const [deleting, setDeleting] = useState<SalaryComponent | null>(null);

  const [form, setForm] = useState(emptyComponentForm);
  const isReservedBasic = isReservedBasicSalaryComponent(form);

  const submit = async () => {
    try {
      const saved = await save.mutateAsync({
        id: editing?.id,
        input: {
          ...form,
          percent: isPercentCalc(form.calc_type) ? form.percent : null,
        },
      });
      toast.success(editing ? "Component updated." : "Component saved.");
      setEditing(null);
      setForm(emptyComponentForm());
      if (form.calc_type === "formula" && saved.id && onOpenFormula) {
        onOpenFormula(saved.id);
      }
    } catch (error) {
      toast.error(apiErrorMessage(error));
    }
  };

  const edit = (component: SalaryComponent) => {
    setDeleting(null);
    setEditing(component);
    setForm({
      name: component.name,
      code: component.code,
      type: component.type,
      calc_type: component.calc_type,
      percent: component.percent ?? 0,
      is_taxable: component.is_taxable,
      is_pensionable: component.is_pensionable,
      is_active: component.is_active,
    });
  };

  const destroy = async () => {
    if (!deleting) return;

    try {
      await remove.mutateAsync(deleting.id);
      toast.success("Component deleted.");
      if (editing?.id === deleting.id) {
        setEditing(null);
        setForm(emptyComponentForm());
      }
      setDeleting(null);
    } catch (error) {
      toast.error(apiErrorMessage(error));
    }
  };

  return (
    <div className="space-y-4">
      {canManage ? (
        <div className="grid gap-3 rounded-lg border bg-muted/40 p-4">
        {editing && (
          <div className="flex items-center justify-between gap-3 rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
            <span>Editing <strong>{editing.name}</strong></span>
            <Button type="button" size="sm" variant="ghost" onClick={() => { setEditing(null); setForm(emptyComponentForm()); }}>
              Cancel edit
            </Button>
          </div>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="c-name">Name</Label>
            <Input id="c-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Housing Allowance" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="c-code">Code</Label>
            <Input id="c-code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="HOU" />
          </div>
        </div>
        {isReservedBasic && !editing && (
          <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
            Basic Salary is entered per employee in Compensation and cannot be created as a component.
          </p>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid min-w-0 gap-2">
            <Label htmlFor="c-type">Type</Label>
            <select id="c-type" className="h-9 w-full min-w-0 truncate rounded-md border bg-background px-2 text-sm" value={form.type} onChange={(e) => {
              const type = e.target.value as ComponentType;
              setForm({
                ...form,
                type,
                ...(type === "employer_contributor" ? { is_taxable: false, is_pensionable: false } : {}),
                ...(type === "fringe_benefit" ? { is_taxable: true, is_pensionable: false } : {}),
              });
            }}>
              <option value="earning">Earning</option>
              <option value="deduction">Deduction</option>
              <option value="employer_contributor">Employer Contribution</option>
              <option value="fringe_benefit">Fringe Benefit (Non-Cash)</option>
            </select>
          </div>
          <div className="grid min-w-0 gap-2">
            <Label htmlFor="c-calc">Calculation</Label>
            <select id="c-calc" className="h-9 w-full min-w-0 truncate rounded-md border bg-background px-2 text-sm" value={form.calc_type} onChange={(e) => setForm({ ...form, calc_type: e.target.value as CalcType })}>
              <option value="fixed">Fixed amount</option>
              <option value="percent_of_basic">Percent of basic</option>
              <option value="percent_of_gross">Percent of gross</option>
              {((advancedEnabled && canManageFormulas) || form.calc_type === "formula") && (
                <option value="formula">Custom formula</option>
              )}
            </select>
          </div>
        </div>
        {isPercentCalc(form.calc_type) && (
          <div className="grid gap-2">
            <Label htmlFor="c-percent">Percent of {calcBaseLabel(form.calc_type, form.type)} (%)</Label>
            <Input id="c-percent" type="number" min={0} max={100} value={form.percent} onChange={(e) => setForm({ ...form, percent: Number(e.target.value) })} />
            {form.calc_type === "percent_of_gross" && (
              <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300">
                {form.type === "earning" ? (
                  <>
                    Measured against basic salary plus the other earnings. This component is left out
                    of its own base, so adding it never inflates the figure it is a percentage of.
                    Example: ₦100,000 basic with a 30%-of-basic housing allowance gives a
                    ₦130,000 base, so 20% here is ₦26,000.
                  </>
                ) : (
                  <>Measured against the employee&apos;s full gross pay — basic plus every earning.</>
                )}
              </p>
            )}
          </div>
        )}
        {form.calc_type === "formula" && (
          <div className="rounded-lg border border-fruition-200 bg-fruition-50/70 p-3 text-sm text-fruition-950 dark:border-fruition-800 dark:bg-fruition-950/20 dark:text-fruition-100">
            <div className="flex items-start gap-2">
              <Sparkles className="mt-0.5 size-4 shrink-0 text-fruition-700" />
              <div>
                <p className="font-medium">Visual formula</p>
                <p className="mt-1 text-xs opacity-80">
                  Save the component first, then build its ordered rules in the formula workspace.
                </p>
              </div>
            </div>
          </div>
        )}
        {form.type === "employer_contributor" ? (
          <p className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-800 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
            Employer contributions increase company payroll cost only. They do not affect the employee&apos;s gross pay, taxable pay, deductions, or net pay.
          </p>
        ) : form.type === "fringe_benefit" ? (
          <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
            Fringe benefits are taxable non-cash remuneration. Their value increases PAYE taxable pay but is not added to cash gross or net pay.
          </p>
        ) : (
          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.is_taxable} onChange={(e) => setForm({ ...form, is_taxable: e.target.checked })} /> Taxable
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.is_pensionable} onChange={(e) => setForm({ ...form, is_pensionable: e.target.checked })} /> Pensionable
            </label>
          </div>
        )}
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} /> Active
        </label>
        <div className="flex justify-end">
          <Button
            type="button"
            onClick={submit}
            disabled={
              save.isPending
              || !form.name
              || !form.code
              || (isReservedBasic && !editing)
              || (form.calc_type === "formula" && !canManageFormulas)
            }
          >
            {editing ? <Pencil className="size-4" /> : <Plus className="size-4" />} {editing ? "Save changes" : "Add component"}
          </Button>
        </div>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed bg-muted/20 px-4 py-5 text-sm text-muted-foreground">
          You can review salary components, but you need Manage employee salary access to change them.
        </div>
      )}

      <ul className="divide-y overflow-hidden rounded-lg border">
        {components?.map((c) => (
          <li key={c.id} className="flex flex-col gap-2 px-3 py-2.5 text-sm sm:flex-row sm:items-center sm:justify-between">
            <span className="min-w-0">
              <span className="font-medium">{c.name}</span>{" "}
              <span className="text-xs text-muted-foreground">{c.code}</span>
            </span>
            <span className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground sm:justify-end sm:text-right">
              <span>{c.type.replaceAll("_", " ")} · {c.formula?.summary || calcSummary(c)}</span>
              {c.calc_type === "formula" && (
                <Badge variant={c.formula?.published_revision_id ? "default" : "secondary"}>
                  {c.formula?.published_revision_id
                    ? `Published v${c.formula.published_version ?? 1}`
                    : c.formula?.has_draft
                      ? "Draft"
                      : "Not configured"}
                </Badge>
              )}
              {c.is_pensionable ? " · pensionable" : ""}
              {!c.is_active ? " · inactive" : ""}
              {isReservedBasicSalaryComponent(c) ? " · legacy basic (ignored)" : ""}
            </span>
            {canManage && <span className="flex items-center gap-1 self-end sm:self-auto">
              {c.calc_type === "formula" && advancedEnabled && canManageFormulas && onOpenFormula && (
                <Button type="button" size="sm" variant="outline" onClick={() => onOpenFormula(c.id)}>
                  <Sparkles className="size-4" /> Formula
                </Button>
              )}
              <Button type="button" size="icon-sm" variant="ghost" aria-label={`Edit ${c.name}`} onClick={() => edit(c)}>
                <Pencil className="size-4" />
              </Button>
              <Button type="button" size="icon-sm" variant="ghost" aria-label={`Delete ${c.name}`} onClick={() => setDeleting(c)}>
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </span>}
          </li>
        ))}
      </ul>

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete salary component?"
        description={deleting ? `Delete ${deleting.name}? This cannot be undone.` : ""}
        isPending={remove.isPending}
        onConfirm={destroy}
      />
    </div>
  );
}

export function SalaryStructuresManager({
  advancedEnabled = false,
}: {
  advancedEnabled?: boolean;
}) {
  const { data: components } = useSalaryComponents();
  const { data: structures } = useSalaryStructures();
  const save = useSaveSalaryStructure();
  const remove = useDeleteSalaryStructure();
  const canManage = useCan("employees.manage_salary");
  const canManageFormulas = useCan("payroll.formulas.manage");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [editing, setEditing] = useState<SalaryStructure | null>(null);
  const [deleting, setDeleting] = useState<SalaryStructure | null>(null);
  const [picked, setPicked] = useState<Record<number, number>>({}); // componentId → amount (naira)
  const hasSelectedFormula = Object.keys(picked).some((id) =>
    components?.find((component) => component.id === Number(id))?.calc_type === "formula",
  );
  const requiredDependencyIds = new Set<number>();

  function collectFormulaDependencies(
    componentId: number,
    collected: Set<number>,
    visiting = new Set<number>(),
  ) {
    if (visiting.has(componentId)) return;
    visiting.add(componentId);

    const component = components?.find((item) => item.id === componentId);
    for (const dependencyId of component?.formula?.dependency_ids ?? []) {
      collected.add(dependencyId);
      collectFormulaDependencies(dependencyId, collected, visiting);
    }
  }

  for (const id of Object.keys(picked).map(Number)) {
    const component = components?.find((item) => item.id === id);
    if (component?.calc_type === "formula") {
      collectFormulaDependencies(id, requiredDependencyIds);
    }
  }

  const toggle = (c: SalaryComponent) => {
    setPicked((p) => {
      const next = { ...p };
      if (c.id in next) {
        if (requiredDependencyIds.has(c.id)) {
          toast.error(`${c.name} is required by a selected formula component.`);
          return p;
        }
        delete next[c.id];
      } else {
        next[c.id] = 0;
        const dependencies = new Set<number>();
        collectFormulaDependencies(c.id, dependencies);
        for (const dependencyId of dependencies) {
          next[dependencyId] ??= 0;
        }
      }
      return next;
    });
  };

  const submit = async () => {
    if (!canManageFormulas && hasSelectedFormula) {
      toast.error("Manage payroll formulas access is required to save a structure that uses formulas.");
      return;
    }

    if (!advancedEnabled && hasSelectedFormula) {
      toast.error("Enable advanced salary formulas before saving a structure that uses a formula component.");
      return;
    }

    try {
      await save.mutateAsync({
        id: editing?.id,
        input: {
          name,
          description: description || undefined,
          is_active: isActive,
          components: Object.entries(picked).map(([id, naira]) => {
            const comp = components?.find((c) => c.id === Number(id));
            // Percent components carry their own percent; fixed ones take an amount (kobo).
            return comp && (isPercentCalc(comp.calc_type) || comp.calc_type === "formula")
              ? { salary_component_id: Number(id) }
              : { salary_component_id: Number(id), amount: Math.round(naira * 100) };
          }),
        },
      });
      toast.success(editing ? "Structure updated." : "Structure saved.");
      setEditing(null);
      setName("");
      setDescription("");
      setIsActive(true);
      setPicked({});
    } catch (error) {
      toast.error(apiErrorMessage(error));
    }
  };

  const edit = (structure: SalaryStructure) => {
    setDeleting(null);
    setEditing(structure);
    setName(structure.name);
    setDescription(structure.description ?? "");
    setIsActive(structure.is_active);
    setPicked(Object.fromEntries(
      structure.components
        .filter((component) => !isReservedBasicSalaryComponent(component))
        .map((component) => [
          component.salary_component_id,
          component.amount ? component.amount / 100 : 0,
        ]),
    ));
  };

  const cancelEdit = () => {
    setEditing(null);
    setName("");
    setDescription("");
    setIsActive(true);
    setPicked({});
  };

  const destroy = async () => {
    if (!deleting) return;

    try {
      await remove.mutateAsync(deleting.id);
      toast.success("Structure deleted.");
      if (editing?.id === deleting.id) cancelEdit();
      setDeleting(null);
    } catch (error) {
      toast.error(apiErrorMessage(error));
    }
  };

  return (
    <div className="space-y-4">
      {canManage ? (
        <div className="grid gap-3 rounded-lg border bg-muted/40 p-4">
        {editing && (
          <div className="flex items-center justify-between gap-3 rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
            <span>Editing <strong>{editing.name}</strong></span>
            <Button type="button" size="sm" variant="ghost" onClick={cancelEdit}>Cancel edit</Button>
          </div>
        )}
        <div className="grid gap-2">
          <Label htmlFor="s-name">Structure name</Label>
          <Input id="s-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Senior Structure" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="s-description">Description <span className="text-muted-foreground">(optional)</span></Label>
          <Input id="s-description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Basic salary and standard allowances" />
        </div>
        <div className="grid gap-2">
          <Label>Components</Label>
          <div className="space-y-2">
            {components?.filter((c) => !isReservedBasicSalaryComponent(c) && (c.is_active || c.id in picked)).map((c) => (
              <div key={c.id} className="flex flex-col gap-2 rounded-md border p-2.5 min-[460px]:flex-row min-[460px]:items-center">
                <label className="flex min-w-0 flex-1 items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={c.id in picked}
                    disabled={requiredDependencyIds.has(c.id) || (c.calc_type === "formula" && (
                      !canManageFormulas || !advancedEnabled || !c.formula?.published_revision_id
                    ))}
                    onChange={() => toggle(c)}
                  />
                  {c.name} <span className="text-xs text-muted-foreground">{c.code}</span>
                </label>
                {c.id in picked && c.calc_type === "fixed" && (
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground">₦</span>
                    <AmountInput
                      className="h-8 w-full min-[460px]:w-32"
                      value={picked[c.id]}
                      onValueChange={(value) => setPicked({ ...picked, [c.id]: value })}
                      placeholder="0"
                    />
                  </div>
                )}
                {c.id in picked && isPercentCalc(c.calc_type) && (
                  <span className="text-xs text-muted-foreground">{calcSummary(c)}</span>
                )}
                {c.id in picked && c.calc_type === "formula" && (
                  <span className="text-xs text-muted-foreground">
                    {c.formula?.summary || "Server-calculated formula"}
                  </span>
                )}
                {requiredDependencyIds.has(c.id) && (
                  <span className="text-xs font-medium text-fruition-700 dark:text-fruition-300">
                    Required by a selected formula
                  </span>
                )}
                {c.calc_type === "formula" && !canManageFormulas && (
                  <span className="text-xs text-amber-700 dark:text-amber-300">
                    Manage payroll formulas access is required
                  </span>
                )}
                {c.calc_type === "formula" && canManageFormulas && !advancedEnabled && (
                  <span className="text-xs text-amber-700 dark:text-amber-300">
                    {c.id in picked
                      ? "Read-only while advanced formulas are off"
                      : "Enable advanced formulas in Settings to add it"}
                  </span>
                )}
                {c.calc_type === "formula" && canManageFormulas && advancedEnabled && !c.formula?.published_revision_id && (
                  <span className="text-xs text-amber-700 dark:text-amber-300">
                    Publish the formula before adding it
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} /> Active
        </label>
        <div className="flex justify-end">
          <Button
            className="w-full min-[460px]:w-auto"
            type="button"
            onClick={submit}
            disabled={save.isPending
              || !name
              || (hasSelectedFormula && (!canManageFormulas || !advancedEnabled))}
            title={hasSelectedFormula && !canManageFormulas
              ? "Manage payroll formulas access is required to save this structure"
              : !advancedEnabled && hasSelectedFormula
                ? "Enable advanced salary formulas before saving this structure"
                : undefined}
          >
            {editing ? <Pencil className="size-4" /> : <Plus className="size-4" />} {editing ? "Save changes" : "Add structure"}
          </Button>
        </div>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed bg-muted/20 px-4 py-5 text-sm text-muted-foreground">
          You can review salary structures, but you need Manage employee salary access to change them.
        </div>
      )}

      <ul className="divide-y overflow-hidden rounded-lg border">
        {structures?.map((s) => (
          <li key={s.id} className="flex flex-col gap-2 px-3 py-2.5 text-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <span className="font-medium">{s.name}</span>
              <span className="ml-2 text-xs text-muted-foreground">
                {s.components.filter((component) => !isReservedBasicSalaryComponent(component)).length} component(s){!s.is_active ? " · inactive" : ""}
              </span>
              {s.description && <p className="mt-0.5 text-xs text-muted-foreground">{s.description}</p>}
              {s.components.some((component) => !isReservedBasicSalaryComponent(component)) && (
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {s.components
                    .filter((component) => !isReservedBasicSalaryComponent(component))
                    .map((component) => component.component_name ?? component.component_code)
                    .join(", ")}
                </p>
              )}
            </div>
            {canManage && <span className="flex items-center gap-1 self-end sm:self-auto">
              <Button type="button" size="icon-sm" variant="ghost" aria-label={`Edit ${s.name}`} onClick={() => edit(s)}>
                <Pencil className="size-4" />
              </Button>
              <Button type="button" size="icon-sm" variant="ghost" aria-label={`Delete ${s.name}`} onClick={() => setDeleting(s)}>
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </span>}
          </li>
        ))}
      </ul>

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete salary structure?"
        description={deleting ? `Delete ${deleting.name}? This cannot be undone.` : ""}
        isPending={remove.isPending}
        onConfirm={destroy}
      />
    </div>
  );
}
