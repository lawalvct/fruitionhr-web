"use client";

import { Filter, UserRound } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { FormDialog } from "@/components/form-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiErrorMessage } from "@/lib/api";
import { useRecordLog } from "@/features/attendance/use-attendance";

interface EmployeeOption {
  id: number;
  name: string;
  department?: string | null;
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
  const [department, setDepartment] = useState("");
  const [date, setDate] = useState(`${period}-01`);
  const [clockIn, setClockIn] = useState("08:00");
  const [clockOut, setClockOut] = useState("17:00");
  const departments = useMemo(
    () => Array.from(new Set(employees.map((employee) => employee.department).filter((item): item is string => Boolean(item)))).sort(),
    [employees],
  );
  const visibleEmployees = useMemo(
    () => employees.filter((employee) => !department || employee.department === department),
    [department, employees],
  );

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
      setEmployeeId("");
      setDepartment("");
      onOpenChange(false);
    } catch (error) {
      toast.error(apiErrorMessage(error));
    }
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          setEmployeeId("");
          setDepartment("");
        }
        onOpenChange(nextOpen);
      }}
      title="Record attendance"
      description="Manually enter a clock-in/out for an employee."
      formId="record-log-form"
      isPending={record.isPending}
    >
      <form id="record-log-form" onSubmit={submit} className="grid gap-4 py-2">
        <div className="grid gap-2">
          <Label htmlFor="rl-department">Department</Label>
          <div className="relative">
            <Filter className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <select
              id="rl-department"
              className="h-10 w-full rounded-lg border border-slate-300 bg-background pl-9 pr-3 text-sm shadow-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 dark:border-slate-600"
              value={department}
              onChange={(e) => {
                setDepartment(e.target.value);
                setEmployeeId("");
              }}
            >
              <option value="">All departments</option>
              {departments.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="rl-employee">Employee</Label>
          <div className="relative">
            <UserRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <select
            id="rl-employee"
            className="h-10 w-full rounded-lg border border-slate-300 bg-background pl-9 pr-3 text-sm shadow-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value === "" ? "" : Number(e.target.value))}
            disabled={visibleEmployees.length === 0}
          >
            <option value="">Select…</option>
            {visibleEmployees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.department ? `[${e.department}] ${e.name}` : e.name}
              </option>
            ))}
            </select>
          </div>
          <p className="text-xs text-muted-foreground">
            {department
              ? `${visibleEmployees.length} employee${visibleEmployees.length === 1 ? "" : "s"} in ${department}`
              : `${visibleEmployees.length} employee${visibleEmployees.length === 1 ? "" : "s"} available`}
          </p>
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
