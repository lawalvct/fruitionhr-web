"use client";

import { useState } from "react";
import { toast } from "sonner";

import { FormDialog } from "@/components/form-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiErrorMessage } from "@/lib/api";
import { useCompanyOptions } from "@/features/company/use-company";
import { useEmployeeOptions } from "@/features/leave/use-leave";
import {
  OVERTIME_MULTIPLIERS,
  useRecordOvertime,
  type OvertimeMode,
  type OvertimePayType,
} from "@/features/overtime/use-overtime";

const selectClass =
  "h-10 w-full rounded-lg border border-slate-300 bg-background px-3 text-sm shadow-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600";

function currentPeriod(): string {
  return new Date().toISOString().slice(0, 7);
}

export function RecordOvertimeDialog({
  open,
  onOpenChange,
  defaultPeriod,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultPeriod?: string;
}) {
  const [departmentId, setDepartmentId] = useState<number | "">("");
  const { departments } = useCompanyOptions();
  const { data: employees, isPending: employeesLoading } = useEmployeeOptions(departmentId || undefined);
  const record = useRecordOvertime();

  const [employeeId, setEmployeeId] = useState<number | "">("");
  const [period, setPeriod] = useState(defaultPeriod ?? currentPeriod());
  const [payType, setPayType] = useState<OvertimePayType>("hourly");
  const [mode, setMode] = useState<OvertimeMode>("in_payroll");
  const [hours, setHours] = useState("");
  const [multiplier, setMultiplier] = useState<number>(1.5);
  const [amountNaira, setAmountNaira] = useState("");
  const [workDate, setWorkDate] = useState("");
  const [reason, setReason] = useState("");

  const reset = () => {
    setDepartmentId("");
    setEmployeeId("");
    setPeriod(defaultPeriod ?? currentPeriod());
    setPayType("hourly");
    setMode("in_payroll");
    setHours("");
    setMultiplier(1.5);
    setAmountNaira("");
    setWorkDate("");
    setReason("");
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (employeeId === "" || !period) {
      toast.error("Select an employee and period.");
      return;
    }
    if (payType === "hourly" && (!hours || Number(hours) <= 0)) {
      toast.error("Enter the number of overtime hours.");
      return;
    }
    if (payType === "fixed" && (!amountNaira || Number(amountNaira) <= 0)) {
      toast.error("Enter a fixed amount greater than zero.");
      return;
    }

    try {
      await record.mutateAsync({
        employee_id: Number(employeeId),
        period,
        pay_type: payType,
        disbursement_mode: mode,
        work_date: workDate || undefined,
        reason: reason || undefined,
        ...(payType === "hourly"
          ? { hours: Number(hours), multiplier }
          : { amount: Math.round(Number(amountNaira) * 100) }),
      });
      toast.success("Overtime recorded as a draft. Submit it for approval when ready.");
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
      title="Record overtime"
      description="Overtime is saved as a draft, then goes through approval before it can be paid."
      formId="record-overtime-form"
      isPending={record.isPending}
    >
      <form id="record-overtime-form" onSubmit={submit} className="grid gap-4 py-2">
        <div className="grid gap-2">
          <Label htmlFor="ot-department">Department</Label>
          <select
            id="ot-department"
            className={selectClass}
            value={departmentId}
            onChange={(event) => {
              setDepartmentId(event.target.value === "" ? "" : Number(event.target.value));
              setEmployeeId("");
            }}
          >
            <option value="">All departments</option>
            {(departments.data ?? []).map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="ot-employee">Employee</Label>
          <select
            id="ot-employee"
            className={selectClass}
            value={employeeId}
            disabled={employeesLoading}
            onChange={(event) => setEmployeeId(event.target.value === "" ? "" : Number(event.target.value))}
          >
            <option value="">
              {employeesLoading ? "Loading employees..." : employees?.length === 0 ? "No employees found" : "Select employee"}
            </option>
            {employees?.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.full_name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="ot-period">Payroll period</Label>
            <Input id="ot-period" type="month" value={period} onChange={(event) => setPeriod(event.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="ot-work-date">Worked on (optional)</Label>
            <Input id="ot-work-date" type="date" value={workDate} onChange={(event) => setWorkDate(event.target.value)} />
          </div>
        </div>

        <div className="grid gap-2">
          <Label>Pay type</Label>
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
            {(["hourly", "fixed"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setPayType(type)}
                className={`h-9 rounded-md text-sm font-medium capitalize transition-colors ${payType === type ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                {type === "hourly" ? "Hourly" : "Fixed amount"}
              </button>
            ))}
          </div>
        </div>

        {payType === "hourly" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="ot-hours">Overtime hours</Label>
              <Input id="ot-hours" type="number" min="0" step="0.25" value={hours} onChange={(event) => setHours(event.target.value)} placeholder="e.g. 8" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ot-multiplier">Rate multiplier</Label>
              <select id="ot-multiplier" className={selectClass} value={multiplier} onChange={(event) => setMultiplier(Number(event.target.value))}>
                {OVERTIME_MULTIPLIERS.map((value) => (
                  <option key={value} value={value}>×{value}</option>
                ))}
              </select>
            </div>
            <p className="text-xs text-muted-foreground sm:col-span-2">
              Amount is calculated from the employee&apos;s basic salary (hourly rate × hours × multiplier).
            </p>
          </div>
        ) : (
          <div className="grid gap-2">
            <Label htmlFor="ot-amount">Fixed amount (₦)</Label>
            <Input id="ot-amount" type="number" min="0" step="0.01" value={amountNaira} onChange={(event) => setAmountNaira(event.target.value)} placeholder="e.g. 50000" />
          </div>
        )}

        <div className="grid gap-2">
          <Label>When is it paid?</Label>
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
            {(
              [
                { value: "in_payroll", label: "In next payroll" },
                { value: "off_cycle", label: "Off-cycle (now)" },
              ] as const
            ).map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setMode(option.value)}
                className={`h-9 rounded-md text-sm font-medium transition-colors ${mode === option.value ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            {mode === "in_payroll"
              ? "Rides the next payroll run for this period and is taxed there."
              : "Paid separately after approval — gross, no tax deducted."}
          </p>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="ot-reason">Reason (optional)</Label>
          <Input id="ot-reason" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="e.g. Weekend stock count" />
        </div>
      </form>
    </FormDialog>
  );
}
