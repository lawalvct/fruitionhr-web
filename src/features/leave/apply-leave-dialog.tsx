"use client";

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

// Count Mon–Fri days in a range (client-side preview; server is authoritative).
function previewWorkingDays(start: string, end: string): number {
  if (!start || !end) return 0;
  const s = new Date(start);
  const e = new Date(end);
  if (e < s) return 0;
  let days = 0;
  for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
    const wd = d.getDay();
    if (wd !== 0 && wd !== 6) days++;
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

  const [employeeId, setEmployeeId] = useState<number | "">("");
  const [typeId, setTypeId] = useState<number | "">("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [reason, setReason] = useState("");

  const { data: balances } = useLeaveBalances(
    year,
    employeeId === "" ? undefined : Number(employeeId),
  );

  const remaining = useMemo(() => {
    if (employeeId === "" || typeId === "") return null;
    const match = balances?.find((b) => b.leave_type.id === Number(typeId));
    return match?.remaining ?? null;
  }, [balances, employeeId, typeId]);

  const requestedDays = previewWorkingDays(start, end);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (employeeId === "" || typeId === "" || !start || !end) {
      toast.error("Fill in employee, leave type and dates.");
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
      onOpenChange(false);
      setStart("");
      setEnd("");
      setReason("");
    } catch (error) {
      toast.error(apiErrorMessage(error));
    }
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Apply for leave"
      description="Submit a leave request. It goes through the approval workflow."
      formId="apply-leave-form"
      isPending={apply.isPending}
    >
      <form id="apply-leave-form" onSubmit={submit} className="grid gap-4 py-2">
        <div className="grid gap-2">
          <Label htmlFor="al-employee">Employee</Label>
          <select
            id="al-employee"
            className="h-9 rounded-md border bg-background px-2 text-sm"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value === "" ? "" : Number(e.target.value))}
          >
            <option value="">Select…</option>
            {employees?.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.full_name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="al-type">Leave type</Label>
          <select
            id="al-type"
            className="h-9 rounded-md border bg-background px-2 text-sm"
            value={typeId}
            onChange={(e) => setTypeId(e.target.value === "" ? "" : Number(e.target.value))}
          >
            <option value="">Select…</option>
            {types?.filter((t) => t.is_active).map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        {remaining !== null && (
          <div className="rounded-md bg-fruition-50 px-3 py-2 text-sm text-fruition-800 ring-1 ring-fruition-100">
            Balance: <span className="font-semibold">{remaining}</span> day(s) available
            {requestedDays > 0 && (
              <>
                {" · "}requesting <span className="font-semibold">{requestedDays}</span>
                {requestedDays > remaining && (
                  <span className="ml-1 font-semibold text-danger">(exceeds balance)</span>
                )}
              </>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-2">
            <Label htmlFor="al-start">Start date</Label>
            <Input id="al-start" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="al-end">End date</Label>
            <Input id="al-end" type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="al-reason">Reason (optional)</Label>
          <Input id="al-reason" value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>
      </form>
    </FormDialog>
  );
}
