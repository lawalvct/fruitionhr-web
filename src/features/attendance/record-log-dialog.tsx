"use client";

import { useState } from "react";
import { toast } from "sonner";

import { FormDialog } from "@/components/form-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiErrorMessage } from "@/lib/api";
import { useRecordLog } from "@/features/attendance/use-attendance";

interface EmployeeOption {
  id: number;
  name: string;
}

export function RecordLogDialog({
  open,
  onOpenChange,
  period,
  employees,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  period: string;
  employees: EmployeeOption[];
}) {
  const record = useRecordLog(period);
  const [employeeId, setEmployeeId] = useState<number | "">("");
  const [date, setDate] = useState(`${period}-01`);
  const [clockIn, setClockIn] = useState("08:00");
  const [clockOut, setClockOut] = useState("17:00");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (employeeId === "") {
      toast.error("Select an employee.");
      return;
    }
    try {
      await record.mutateAsync({
        employee_id: Number(employeeId),
        date,
        clock_in: clockIn || undefined,
        clock_out: clockOut || undefined,
      });
      toast.success("Attendance recorded.");
      onOpenChange(false);
    } catch (error) {
      toast.error(apiErrorMessage(error));
    }
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Record attendance"
      description="Manually enter a clock-in/out for an employee."
      formId="record-log-form"
      isPending={record.isPending}
    >
      <form id="record-log-form" onSubmit={submit} className="grid gap-4 py-2">
        <div className="grid gap-2">
          <Label htmlFor="rl-employee">Employee</Label>
          <select
            id="rl-employee"
            className="h-9 rounded-md border bg-background px-2 text-sm"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value === "" ? "" : Number(e.target.value))}
          >
            <option value="">Select…</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="rl-date">Date</Label>
          <Input id="rl-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-2">
            <Label htmlFor="rl-in">Clock in</Label>
            <Input id="rl-in" type="time" value={clockIn} onChange={(e) => setClockIn(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="rl-out">Clock out</Label>
            <Input id="rl-out" type="time" value={clockOut} onChange={(e) => setClockOut(e.target.value)} />
          </div>
        </div>
      </form>
    </FormDialog>
  );
}
