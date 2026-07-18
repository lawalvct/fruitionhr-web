"use client";

import { useState } from "react";
import { toast } from "sonner";

import { FormDialog } from "@/components/form-dialog";
import { MoneyText } from "@/components/money-text";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiErrorMessage } from "@/lib/api";
import { useEmployeeOptions } from "@/features/leave/use-leave";
import { useCreateLoan, type LoanType } from "@/features/loans/use-loans";

const selectClass =
  "h-10 w-full rounded-lg border border-slate-300 bg-background px-3 text-sm shadow-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600";

function currentPeriod(): string {
  return new Date().toISOString().slice(0, 7);
}

export function RecordLoanDialog({
  open,
  onOpenChange,
  defaultPeriod,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultPeriod?: string;
}) {
  const { data: employees } = useEmployeeOptions();
  const create = useCreateLoan();

  const [type, setType] = useState<LoanType>("loan");
  const [employeeId, setEmployeeId] = useState<number | "">("");
  const [amountNaira, setAmountNaira] = useState("");
  const [months, setMonths] = useState("3");
  const [startPeriod, setStartPeriod] = useState(defaultPeriod ?? currentPeriod());
  const [reason, setReason] = useState("");

  const principalKobo = Math.round(Number(amountNaira || 0) * 100);
  const monthCount = type === "advance" ? 1 : Math.max(1, Number(months || 1));
  const installment = principalKobo > 0 ? Math.ceil(principalKobo / monthCount) : 0;

  const reset = () => {
    setType("loan");
    setEmployeeId("");
    setAmountNaira("");
    setMonths("3");
    setStartPeriod(defaultPeriod ?? currentPeriod());
    setReason("");
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (employeeId === "" || principalKobo <= 0) {
      toast.error("Select an employee and enter an amount.");
      return;
    }
    if (type === "loan" && monthCount < 1) {
      toast.error("Enter the number of repayment months.");
      return;
    }

    try {
      await create.mutateAsync({
        employee_id: Number(employeeId),
        type,
        principal: principalKobo,
        start_period: startPeriod,
        reason: reason || undefined,
        ...(type === "loan" ? { months: monthCount } : {}),
      });
      toast.success("Saved as draft. Submit it for approval when ready.");
      reset();
      onOpenChange(false);
    } catch (error) {
      toast.error(apiErrorMessage(error));
    }
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
      title="New loan or advance"
      description="Recorded as a draft, then approved before it's recovered from payroll."
      formId="record-loan-form"
      isPending={create.isPending}
    >
      <form id="record-loan-form" onSubmit={submit} className="grid gap-4 py-2">
        <div className="grid gap-2">
          <Label>Type</Label>
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
            {(
              [
                { value: "advance", label: "Salary advance (IOU)" },
                { value: "loan", label: "Loan" },
              ] as const
            ).map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setType(option.value)}
                className={`h-9 rounded-md text-sm font-medium transition-colors ${type === option.value ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            {type === "advance"
              ? "Recovered in full from the coming payroll — no installments."
              : "Recovered over several months; you can pull the balance early any time."}
          </p>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="loan-employee">Employee</Label>
          <select
            id="loan-employee"
            className={selectClass}
            value={employeeId}
            onChange={(event) => setEmployeeId(event.target.value === "" ? "" : Number(event.target.value))}
          >
            <option value="">Select employee</option>
            {employees?.map((employee) => (
              <option key={employee.id} value={employee.id}>{employee.full_name}</option>
            ))}
          </select>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="loan-amount">Amount (₦)</Label>
            <Input id="loan-amount" type="number" min="0" step="0.01" value={amountNaira} onChange={(event) => setAmountNaira(event.target.value)} placeholder="e.g. 100000" />
          </div>
          {type === "loan" && (
            <div className="grid gap-2">
              <Label htmlFor="loan-months">Repayment months</Label>
              <Input id="loan-months" type="number" min="1" max="60" value={months} onChange={(event) => setMonths(event.target.value)} />
            </div>
          )}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="loan-start">Recover from period</Label>
          <Input id="loan-start" type="month" value={startPeriod} onChange={(event) => setStartPeriod(event.target.value)} />
        </div>

        {installment > 0 && (
          <div className="rounded-lg bg-fruition-50 px-3 py-2 text-sm text-fruition-800 ring-1 ring-fruition-100">
            {type === "advance" ? (
              <>Deducts <span className="font-semibold"><MoneyText kobo={installment} /></span> from the {startPeriod} payroll.</>
            ) : (
              <>About <span className="font-semibold"><MoneyText kobo={installment} /></span>/month over {monthCount} month{monthCount === 1 ? "" : "s"}.</>
            )}
          </div>
        )}

        <div className="grid gap-2">
          <Label htmlFor="loan-reason">Reason (optional)</Label>
          <Input id="loan-reason" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="e.g. Rent support" />
        </div>
      </form>
    </FormDialog>
  );
}
