"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Can } from "@/components/can";
import { MoneyText } from "@/components/money-text";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { apiErrorMessage } from "@/lib/api";
import {
  useAssignSalary,
  useEmployeeSalary,
  useSalaryStructures,
} from "@/features/payroll/use-payroll";

export function CompensationTab({ employeeId }: { employeeId: string }) {
  const { data: salary, isLoading } = useEmployeeSalary(employeeId);
  const { data: structures } = useSalaryStructures();
  const assign = useAssignSalary(employeeId);

  const [editing, setEditing] = useState(false);
  const [basic, setBasic] = useState(0); // naira
  const [structureId, setStructureId] = useState<number | "">("");
  const [from, setFrom] = useState(new Date().toISOString().slice(0, 10));

  if (isLoading) return <Skeleton className="h-40 w-full" />;

  const submit = async () => {
    try {
      await assign.mutateAsync({
        basic_salary: Math.round(basic * 100),
        salary_structure_id: structureId === "" ? null : Number(structureId),
        effective_from: from,
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
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: "Basic", value: salary.breakdown.basic },
            { label: "Gross", value: salary.breakdown.gross },
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
            <li className="flex justify-between bg-muted/30 px-4 py-2 font-semibold">
              <span>Gross</span><MoneyText kobo={salary.breakdown.gross} />
            </li>
          </ul>
        </div>
      )}

      <Can permission="employees.manage_salary">
        {editing ? (
          <div className="grid gap-3 rounded-lg border bg-muted/40 p-4">
            <div className="grid gap-2">
              <Label htmlFor="comp-basic">Basic salary (₦ / month)</Label>
              <Input id="comp-basic" type="number" min={0} value={basic} onChange={(e) => setBasic(Number(e.target.value))} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="comp-structure">Salary structure</Label>
              <select id="comp-structure" className="h-9 rounded-md border bg-background px-2 text-sm" value={structureId} onChange={(e) => setStructureId(e.target.value === "" ? "" : Number(e.target.value))}>
                <option value="">None (basic only)</option>
                {structures?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
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
          <Button variant="outline" onClick={() => setEditing(true)}>
            {salary ? "Change salary" : "Assign salary"}
          </Button>
        )}
      </Can>
    </div>
  );
}
