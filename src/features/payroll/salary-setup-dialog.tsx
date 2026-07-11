"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { MoneyText } from "@/components/money-text";
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
import {
  useSalaryComponents,
  useSalaryStructures,
  useSaveSalaryComponent,
  useSaveSalaryStructure,
  type SalaryComponent,
} from "@/features/payroll/use-payroll";

type Tab = "components" | "structures";

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
        <SheetHeader>
          <SheetTitle>Salary setup</SheetTitle>
          <SheetDescription>
            Define pay components and bundle them into structures employees are
            assigned to.
          </SheetDescription>
        </SheetHeader>

        <div className="px-4 pb-6">
          <div className="mb-4 flex gap-1 border-b">
            {(["components", "structures"] as Tab[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`border-b-2 px-3 py-2 text-sm font-medium capitalize ${
                  tab === t ? "border-primary text-foreground" : "border-transparent text-muted-foreground"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {tab === "components" ? <ComponentsTab /> : <StructuresTab />}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function ComponentsTab() {
  const { data: components } = useSalaryComponents();
  const save = useSaveSalaryComponent();

  const [form, setForm] = useState({
    name: "",
    code: "",
    type: "earning" as "earning" | "deduction",
    calc_type: "fixed" as "fixed" | "percent_of_basic",
    percent: 0,
    is_taxable: true,
    is_pensionable: false,
  });

  const submit = async () => {
    try {
      await save.mutateAsync({
        input: {
          ...form,
          percent: form.calc_type === "percent_of_basic" ? form.percent : undefined,
        },
      });
      toast.success("Component saved.");
      setForm({ ...form, name: "", code: "" });
    } catch (error) {
      toast.error(apiErrorMessage(error));
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 rounded-lg border bg-muted/40 p-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-2">
            <Label htmlFor="c-name">Name</Label>
            <Input id="c-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Housing Allowance" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="c-code">Code</Label>
            <Input id="c-code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="HOU" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-2">
            <Label htmlFor="c-type">Type</Label>
            <select id="c-type" className="h-9 rounded-md border bg-background px-2 text-sm" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as "earning" | "deduction" })}>
              <option value="earning">Earning</option>
              <option value="deduction">Deduction</option>
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="c-calc">Calculation</Label>
            <select id="c-calc" className="h-9 rounded-md border bg-background px-2 text-sm" value={form.calc_type} onChange={(e) => setForm({ ...form, calc_type: e.target.value as "fixed" | "percent_of_basic" })}>
              <option value="fixed">Fixed amount (set per structure)</option>
              <option value="percent_of_basic">Percent of basic</option>
            </select>
          </div>
        </div>
        {form.calc_type === "percent_of_basic" && (
          <div className="grid gap-2">
            <Label htmlFor="c-percent">Percent of basic (%)</Label>
            <Input id="c-percent" type="number" min={0} max={100} value={form.percent} onChange={(e) => setForm({ ...form, percent: Number(e.target.value) })} />
          </div>
        )}
        <div className="flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.is_taxable} onChange={(e) => setForm({ ...form, is_taxable: e.target.checked })} /> Taxable
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.is_pensionable} onChange={(e) => setForm({ ...form, is_pensionable: e.target.checked })} /> Pensionable
          </label>
        </div>
        <div className="flex justify-end">
          <Button type="button" onClick={submit} disabled={save.isPending || !form.name || !form.code}>
            <Plus className="size-4" /> Add component
          </Button>
        </div>
      </div>

      <ul className="divide-y rounded-lg border">
        {components?.map((c) => (
          <li key={c.id} className="flex items-center justify-between px-3 py-2 text-sm">
            <span>
              <span className="font-medium">{c.name}</span>{" "}
              <span className="text-xs text-muted-foreground">{c.code}</span>
            </span>
            <span className="text-xs text-muted-foreground">
              {c.type} · {c.calc_type === "percent_of_basic" ? `${c.percent}% of basic` : "fixed"}
              {c.is_pensionable ? " · pensionable" : ""}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function StructuresTab() {
  const { data: components } = useSalaryComponents();
  const { data: structures } = useSalaryStructures();
  const save = useSaveSalaryStructure();

  const [name, setName] = useState("");
  const [picked, setPicked] = useState<Record<number, number>>({}); // componentId → amount (naira)

  const toggle = (c: SalaryComponent) => {
    setPicked((p) => {
      const next = { ...p };
      if (c.id in next) delete next[c.id];
      else next[c.id] = 0;
      return next;
    });
  };

  const submit = async () => {
    try {
      await save.mutateAsync({
        input: {
          name,
          is_active: true,
          components: Object.entries(picked).map(([id, naira]) => {
            const comp = components?.find((c) => c.id === Number(id));
            // Percent components carry their own percent; fixed ones take an amount (kobo).
            return comp?.calc_type === "percent_of_basic"
              ? { salary_component_id: Number(id) }
              : { salary_component_id: Number(id), amount: Math.round(naira * 100) };
          }),
        },
      });
      toast.success("Structure saved.");
      setName("");
      setPicked({});
    } catch (error) {
      toast.error(apiErrorMessage(error));
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 rounded-lg border bg-muted/40 p-4">
        <div className="grid gap-2">
          <Label htmlFor="s-name">Structure name</Label>
          <Input id="s-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Senior Structure" />
        </div>
        <div className="grid gap-2">
          <Label>Components</Label>
          <div className="space-y-2">
            {components?.filter((c) => c.is_active).map((c) => (
              <div key={c.id} className="flex items-center gap-2">
                <label className="flex flex-1 items-center gap-2 text-sm">
                  <input type="checkbox" checked={c.id in picked} onChange={() => toggle(c)} />
                  {c.name} <span className="text-xs text-muted-foreground">{c.code}</span>
                </label>
                {c.id in picked && c.calc_type === "fixed" && (
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground">₦</span>
                    <Input
                      type="number"
                      min={0}
                      className="h-8 w-32"
                      value={picked[c.id]}
                      onChange={(e) => setPicked({ ...picked, [c.id]: Number(e.target.value) })}
                    />
                  </div>
                )}
                {c.id in picked && c.calc_type === "percent_of_basic" && (
                  <span className="text-xs text-muted-foreground">{c.percent}% of basic</span>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-end">
          <Button type="button" onClick={submit} disabled={save.isPending || !name}>
            <Plus className="size-4" /> Add structure
          </Button>
        </div>
      </div>

      <ul className="divide-y rounded-lg border">
        {structures?.map((s) => (
          <li key={s.id} className="px-3 py-2 text-sm">
            <span className="font-medium">{s.name}</span>
            <span className="ml-2 text-xs text-muted-foreground">
              {s.components.length} component(s)
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
