"use client";

import { Filter } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { FormDialog } from "@/components/form-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiErrorMessage } from "@/lib/api";
import {
  useApplyLeave,
  useEmployeeOptions,
  useLeaveBalances,
  useLeaveTypes,
} from "@/features/leave/use-leave";

const selectClass =
  "h-10 w-full rounded-lg border border-slate-300 bg-background px-3 text-sm shadow-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600";

function previewWorkingDays(start: string, end: string): number {
  if (!start || !end) return 0;
  const from = new Date(`${start}T00:00:00`);
  const to = new Date(`${end}T00:00:00`);
  if (to < from) return 0;

  let days = 0;
  for (const date = new Date(from); date <= to; date.setDate(date.getDate() + 1)) {
    const weekday = date.getDay();
    if (weekday !== 0 && weekday !== 6) days++;
  }
  return days;
}

export function ApplyLeaveDialog({
  open,
  onOpenChange,
  year,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  year: number;
}) {
  const { data: employees } = useEmployeeOptions();
  const { data: types } = useLeaveTypes();
  const apply = useApplyLeave();

  const [departmentId, setDepartmentId] = useState<number | "">("");
  const [employeeId, setEmployeeId] = useState<number | "">("");
  const [typeId, setTypeId] = useState<number | "">("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [reason, setReason] = useState("");

  const departments = useMemo(() => {
    const values = new Map<number, string>();
    employees?.forEach((employee) => {
      const department = employee.current_assignment?.department;
      if (department) values.set(department.id, department.name);
    });
    return Array.from(values, ([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [employees]);

  const visibleEmployees = useMemo(
    () => employees?.filter((employee) => !departmentId || employee.current_assignment?.department?.id === departmentId) ?? [],
    [departmentId, employees],
  );

  const { data: balances } = useLeaveBalances(year, employeeId === "" ? undefined : Number(employeeId));
  const remaining = useMemo(() => {
    if (employeeId === "" || typeId === "") return null;
    return balances?.find((balance) => balance.leave_type.id === Number(typeId))?.remaining ?? null;
  }, [balances, employeeId, typeId]);

  const requestedDays = previewWorkingDays(start, end);

  const reset = () => {
    setDepartmentId("");
    setEmployeeId("");
    setTypeId("");
    setStart("");
    setEnd("");
    setReason("");
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (employeeId === "" || typeId === "" || !start || !end) {
      toast.error("Fill in employee, leave type and dates.");
      return;
    }
    if (end < start) {
      toast.error("End date must be on or after the start date.");
      return;
    }

    try {
      await apply.mutateAsync({
        employee_id: Number(employeeId),
        leave_type_id: Number(typeId),
        start_date: start,
        end_date: end,
        reason: reason || undefined,
      });
      toast.success("Leave request submitted for approval.");
      reset();
      onOpenChange(false);
    } catch (error) {
      toast.error(apiErrorMessage(error));
    }
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) reset();
        onOpenChange(nextOpen);
      }}
      title="Apply for leave"
      description="Submit a leave request. It goes through the approval workflow."
      formId="apply-leave-form"
      isPending={apply.isPending}
    >
      <form id="apply-leave-form" onSubmit={submit} className="grid gap-4 py-2">
        <div className="grid gap-2">
          <Label htmlFor="al-department">Department</Label>
          <div className="relative">
            <Filter className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <select
              id="al-department"
              className={`${selectClass} pl-9`}
              value={departmentId}
              onChange={(event) => {
                setDepartmentId(event.target.value === "" ? "" : Number(event.target.value));
                setEmployeeId("");
              }}
            >
              <option value="">All departments</option>
              {departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
            </select>
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="al-employee">Employee</Label>
          <select
            id="al-employee"
            className={selectClass}
            value={employeeId}
            onChange={(event) => setEmployeeId(event.target.value === "" ? "" : Number(event.target.value))}
            disabled={visibleEmployees.length === 0}
          >
            <option value="">Select employee</option>
            {visibleEmployees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.current_assignment?.department ? `[${employee.current_assignment.department.name}] ` : ""}{employee.full_name}
              </option>
            ))}
          </select>
          {departmentId !== "" && <p className="text-xs text-muted-foreground">{visibleEmployees.length} employee{visibleEmployees.length === 1 ? "" : "s"} in the selected department.</p>}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="al-type">Leave type</Label>
          <select id="al-type" className={selectClass} value={typeId} onChange={(event) => setTypeId(event.target.value === "" ? "" : Number(event.target.value))}>
            <option value="">Select leave type</option>
            {types?.filter((type) => type.is_active).map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}
          </select>
        </div>

        {remaining !== null && (
          <div className="rounded-lg bg-fruition-50 px-3 py-2 text-sm text-fruition-800 ring-1 ring-fruition-100">
            <span className="font-semibold">{remaining}</span> {remaining === 1 ? "day" : "days"} available
            {requestedDays > 0 && <span className="text-muted-foreground"> / requesting <span className="font-semibold text-foreground">{requestedDays}</span></span>}
            {requestedDays > remaining && <span className="ml-1 font-semibold text-danger">(exceeds balance)</span>}
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="al-start">Start date</Label>
            <Input id="al-start" type="date" value={start} onChange={(event) => setStart(event.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="al-end">End date</Label>
            <Input id="al-end" type="date" min={start || undefined} value={end} onChange={(event) => setEnd(event.target.value)} />
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="al-reason">Reason (optional)</Label>
          <Input id="al-reason" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Add a short reason" />
        </div>
      </form>
    </FormDialog>
  );
}
