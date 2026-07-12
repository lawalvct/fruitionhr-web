"use client";

import {
  CalendarDays,
  Clock3,
  Filter,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserRoundCheck,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/confirm-dialog";
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
import {
  type Shift,
  type ShiftAssignmentRow,
  type ShiftInput,
  useAssignShift,
  useDeleteShift,
  useSaveShift,
  useShiftAssignments,
  useShifts,
} from "@/features/attendance/use-attendance";
import { apiErrorMessage } from "@/lib/api";

const WEEKDAYS = [
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
  { value: 7, label: "Sun" },
];

const emptyShift: ShiftInput = {
  name: "",
  start_time: "08:00",
  end_time: "17:00",
  grace_minutes: 15,
  working_days: [1, 2, 3, 4, 5],
  is_active: true,
};

const selectClass =
  "h-10 w-full rounded-lg border border-slate-300 bg-background px-3 text-sm shadow-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600";

function localDate(): string {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

function employeeLabel(row: ShiftAssignmentRow): string {
  const department = row.employee.department?.name;
  return `${department ? `[${department}] ` : ""}${row.employee.name} - ${row.employee.employee_number}`;
}

export function ShiftsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: shiftData, isLoading: shiftsLoading } = useShifts();
  const { data: assignmentData, isLoading: assignmentsLoading } = useShiftAssignments(open);
  const save = useSaveShift();
  const remove = useDeleteShift();
  const assign = useAssignShift();

  const shifts = shiftData ?? [];
  const assignmentRows = useMemo(() => assignmentData ?? [], [assignmentData]);
  const [view, setView] = useState<"shifts" | "assignments">("shifts");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ShiftInput>(emptyShift);
  const [showShiftForm, setShowShiftForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  const [assignmentDepartmentId, setAssignmentDepartmentId] = useState<number | "">("");
  const [assignmentEmployeeId, setAssignmentEmployeeId] = useState<number | "">("");
  const [assignmentShiftId, setAssignmentShiftId] = useState<number | "">("");
  const [effectiveFrom, setEffectiveFrom] = useState(localDate());
  const [departmentFilter, setDepartmentFilter] = useState<number | "">("");
  const [search, setSearch] = useState("");

  const departments = useMemo(() => {
    const values = new Map<number, string>();
    assignmentRows.forEach((row) => {
      if (row.employee.department) {
        values.set(row.employee.department.id, row.employee.department.name);
      }
    });
    return Array.from(values, ([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [assignmentRows]);

  const assignmentCounts = useMemo(() => {
    const counts = new Map<number, number>();
    assignmentRows.forEach((row) => {
      if (row.assignment) {
        counts.set(row.assignment.shift.id, (counts.get(row.assignment.shift.id) ?? 0) + 1);
      }
    });
    return counts;
  }, [assignmentRows]);

  const employeeOptions = useMemo(
    () => assignmentRows.filter((row) => !assignmentDepartmentId || row.employee.department?.id === assignmentDepartmentId),
    [assignmentDepartmentId, assignmentRows],
  );

  const filteredAssignments = useMemo(() => {
    const term = search.trim().toLowerCase();
    return assignmentRows.filter((row) => {
      const inDepartment = !departmentFilter || row.employee.department?.id === departmentFilter;
      const matchesSearch = !term || [row.employee.name, row.employee.employee_number, row.assignment?.shift.name]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(term));
      return inDepartment && matchesSearch;
    });
  }, [assignmentRows, departmentFilter, search]);

  const assignedCount = assignmentRows.filter((row) => row.assignment !== null).length;
  const unassignedCount = assignmentRows.length - assignedCount;

  const resetAssignmentForm = () => {
    setShowAssignmentForm(false);
    setAssignmentDepartmentId("");
    setAssignmentEmployeeId("");
    setAssignmentShiftId("");
    setEffectiveFrom(localDate());
  };

  const startCreate = () => {
    setEditingId(null);
    setForm(emptyShift);
    setShowShiftForm(true);
  };

  const startEdit = (shift: Shift) => {
    setEditingId(shift.id);
    setForm({
      name: shift.name,
      start_time: shift.start_time,
      end_time: shift.end_time,
      grace_minutes: shift.grace_minutes,
      working_days: shift.working_days,
      is_active: shift.is_active,
    });
    setShowShiftForm(true);
  };

  const startAssignment = (row?: ShiftAssignmentRow) => {
    setAssignmentDepartmentId(row?.employee.department?.id ?? "");
    setAssignmentEmployeeId(row?.employee.id ?? "");
    setAssignmentShiftId(row?.assignment?.shift.id ?? "");
    setEffectiveFrom(localDate());
    setShowAssignmentForm(true);
  };

  const toggleDay = (day: number) => {
    setForm((current) => ({
      ...current,
      working_days: current.working_days.includes(day)
        ? current.working_days.filter((item) => item !== day)
        : [...current.working_days, day].sort((a, b) => a - b),
    }));
  };

  const submitShift = async () => {
    if (!form.name.trim()) {
      toast.error("Enter a shift name.");
      return;
    }
    if (form.start_time === form.end_time) {
      toast.error("Start and end time must be different.");
      return;
    }
    if (form.working_days.length === 0) {
      toast.error("Select at least one working day.");
      return;
    }

    try {
      await save.mutateAsync({ id: editingId ?? undefined, input: form });
      toast.success(editingId ? "Shift updated." : "Shift created.");
      setShowShiftForm(false);
    } catch (error) {
      toast.error(apiErrorMessage(error));
    }
  };

  const submitAssignment = async () => {
    if (assignmentEmployeeId === "" || assignmentShiftId === "" || !effectiveFrom) {
      toast.error("Select an employee, shift, and effective date.");
      return;
    }

    try {
      await assign.mutateAsync({
        employee_id: assignmentEmployeeId,
        shift_id: assignmentShiftId,
        effective_from: effectiveFrom,
      });
      const employee = assignmentRows.find((row) => row.employee.id === assignmentEmployeeId);
      const shift = shifts.find((item) => item.id === assignmentShiftId);
      toast.success(`${employee?.employee.name ?? "Employee"} assigned to ${shift?.name ?? "shift"}.`);
      resetAssignmentForm();
    } catch (error) {
      toast.error(apiErrorMessage(error));
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setShowShiftForm(false);
      resetAssignmentForm();
      setDeleteTarget(null);
    }
    onOpenChange(nextOpen);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>Shifts and assignments</SheetTitle>
          <SheetDescription>
            Define working schedules and assign employees to the correct shift for attendance calculations.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5 px-4 pb-6">
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1" role="tablist" aria-label="Shift settings">
            <button
              type="button"
              role="tab"
              aria-selected={view === "shifts"}
              onClick={() => setView("shifts")}
              className={`flex h-9 items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors ${
                view === "shifts" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Clock3 className="size-4" /> Shifts
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={view === "assignments"}
              onClick={() => setView("assignments")}
              className={`flex h-9 items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors ${
                view === "assignments" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <UserRoundCheck className="size-4" /> Assignments
            </button>
          </div>

          {view === "shifts" && (
            <div className="space-y-4">
              {!showShiftForm && (
                <Button type="button" onClick={startCreate} className="w-full sm:w-auto">
                  <Plus className="size-4" /> New shift
                </Button>
              )}

              {showShiftForm && (
                <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
                  <div className="grid gap-2">
                    <Label htmlFor="shift-name">Shift name</Label>
                    <Input
                      id="shift-name"
                      className="h-10 border-slate-300"
                      value={form.name}
                      onChange={(event) => setForm({ ...form, name: event.target.value })}
                      placeholder="Day Shift"
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="grid gap-2">
                      <Label htmlFor="shift-start">Start</Label>
                      <Input id="shift-start" type="time" value={form.start_time} onChange={(event) => setForm({ ...form, start_time: event.target.value })} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="shift-end">End</Label>
                      <Input id="shift-end" type="time" value={form.end_time} onChange={(event) => setForm({ ...form, end_time: event.target.value })} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="shift-grace">Grace (minutes)</Label>
                      <Input id="shift-grace" type="number" min={0} max={240} value={form.grace_minutes} onChange={(event) => setForm({ ...form, grace_minutes: Number(event.target.value) })} />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    An end time earlier than the start is treated as the following day for overnight shifts.
                  </p>
                  <div className="grid gap-2">
                    <Label>Working days</Label>
                    <div className="grid grid-cols-7 gap-1.5">
                      {WEEKDAYS.map((day) => (
                        <button
                          key={day.value}
                          type="button"
                          onClick={() => toggleDay(day.value)}
                          aria-pressed={form.working_days.includes(day.value)}
                          className={`h-9 rounded-md border text-xs font-medium ${
                            form.working_days.includes(day.value)
                              ? "border-fruition-500 bg-fruition-500 text-white"
                              : "border-border text-muted-foreground hover:bg-muted"
                          }`}
                        >
                          {day.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={form.is_active} onChange={(event) => setForm({ ...form, is_active: event.target.checked })} />
                    Active shift
                  </label>
                  <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
                    <Button type="button" variant="outline" onClick={() => setShowShiftForm(false)}>Cancel</Button>
                    <Button type="button" onClick={() => void submitShift()} disabled={save.isPending}>
                      {save.isPending ? "Saving..." : editingId ? "Update shift" : "Create shift"}
                    </Button>
                  </div>
                </div>
              )}

              {shiftsLoading ? (
                <p className="text-sm text-muted-foreground">Loading shifts...</p>
              ) : shifts.length === 0 ? (
                <div className="rounded-lg border border-dashed px-4 py-10 text-center">
                  <Clock3 className="mx-auto size-7 text-muted-foreground" />
                  <p className="mt-3 text-sm font-semibold">No shifts yet</p>
                  <p className="mt-1 text-xs text-muted-foreground">Create a shift before assigning employees.</p>
                </div>
              ) : (
                <ul className="divide-y rounded-lg border">
                  {shifts.map((shift) => {
                    const employeeCount = assignmentCounts.get(shift.id) ?? 0;
                    return (
                      <li key={shift.id} className="flex items-center justify-between gap-3 px-3 py-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-sm font-semibold">{shift.name}</p>
                            <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${shift.is_active ? "bg-fruition-50 text-fruition-700" : "bg-muted text-muted-foreground"}`}>
                              {shift.is_active ? "Active" : "Inactive"}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {shift.start_time} - {shift.end_time} / {shift.grace_minutes}m grace / {employeeCount} employee{employeeCount === 1 ? "" : "s"}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {shift.working_days.map((day) => WEEKDAYS.find((item) => item.value === day)?.label).join(" ")}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <Button variant="ghost" size="icon-sm" onClick={() => startEdit(shift)} aria-label={`Edit ${shift.name}`} title="Edit shift">
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            disabled={employeeCount > 0}
                            onClick={() => setDeleteTarget(shift.id)}
                            aria-label={`Delete ${shift.name}`}
                            title={employeeCount > 0 ? "Reassign employees before deleting this shift" : "Delete shift"}
                          >
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}

          {view === "assignments" && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 divide-x rounded-lg border bg-muted/20 text-center">
                <div className="px-2 py-3"><p className="text-lg font-bold">{assignmentRows.length}</p><p className="text-[11px] text-muted-foreground">Employees</p></div>
                <div className="px-2 py-3"><p className="text-lg font-bold text-fruition-700">{assignedCount}</p><p className="text-[11px] text-muted-foreground">Assigned</p></div>
                <div className="px-2 py-3"><p className="text-lg font-bold text-amber-600">{unassignedCount}</p><p className="text-[11px] text-muted-foreground">Unassigned</p></div>
              </div>

              {!showAssignmentForm && (
                <Button type="button" onClick={() => startAssignment()} disabled={shifts.length === 0} className="w-full sm:w-auto">
                  <UserRoundCheck className="size-4" /> Assign employee
                </Button>
              )}

              {showAssignmentForm && (
                <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
                  <div>
                    <p className="text-sm font-semibold">Assign an employee</p>
                    <p className="mt-1 text-xs text-muted-foreground">A new assignment closes the employee&apos;s current shift while preserving its history.</p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="assignment-department">Department</Label>
                      <select
                        id="assignment-department"
                        className={selectClass}
                        value={assignmentDepartmentId}
                        onChange={(event) => {
                          setAssignmentDepartmentId(event.target.value === "" ? "" : Number(event.target.value));
                          setAssignmentEmployeeId("");
                        }}
                      >
                        <option value="">All departments</option>
                        {departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
                      </select>
                    </div>
                    <div className="grid gap-2 sm:col-span-2">
                      <Label htmlFor="assignment-employee">Employee</Label>
                      <select id="assignment-employee" className={selectClass} value={assignmentEmployeeId} onChange={(event) => setAssignmentEmployeeId(event.target.value === "" ? "" : Number(event.target.value))}>
                        <option value="">Select employee</option>
                        {employeeOptions.map((row) => <option key={row.employee.id} value={row.employee.id}>{employeeLabel(row)}</option>)}
                      </select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="assignment-shift">Shift</Label>
                      <select id="assignment-shift" className={selectClass} value={assignmentShiftId} onChange={(event) => setAssignmentShiftId(event.target.value === "" ? "" : Number(event.target.value))}>
                        <option value="">Select shift</option>
                        {shifts.filter((shift) => shift.is_active).map((shift) => <option key={shift.id} value={shift.id}>{shift.name} ({shift.start_time} - {shift.end_time})</option>)}
                      </select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="assignment-date">Effective from</Label>
                      <Input id="assignment-date" type="date" value={effectiveFrom} onChange={(event) => setEffectiveFrom(event.target.value)} />
                    </div>
                  </div>
                  <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <Button type="button" variant="outline" onClick={resetAssignmentForm}>Cancel</Button>
                    <Button type="button" onClick={() => void submitAssignment()} disabled={assign.isPending}>
                      {assign.isPending ? "Assigning..." : "Save assignment"}
                    </Button>
                  </div>
                </div>
              )}

              <div className="grid gap-2 sm:grid-cols-[1fr_200px]">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input className="h-10 pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search employee or shift" aria-label="Search assignments" />
                </div>
                <div className="relative">
                  <Filter className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <select className={`${selectClass} pl-9`} value={departmentFilter} onChange={(event) => setDepartmentFilter(event.target.value === "" ? "" : Number(event.target.value))} aria-label="Filter assignments by department">
                    <option value="">All departments</option>
                    {departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
                  </select>
                </div>
              </div>

              {assignmentsLoading ? (
                <p className="text-sm text-muted-foreground">Loading assignments...</p>
              ) : filteredAssignments.length === 0 ? (
                <div className="rounded-lg border border-dashed px-4 py-10 text-center">
                  <Users className="mx-auto size-7 text-muted-foreground" />
                  <p className="mt-3 text-sm font-semibold">No matching employees</p>
                  <p className="mt-1 text-xs text-muted-foreground">Clear the search or choose another department.</p>
                </div>
              ) : (
                <ul className="divide-y rounded-lg border">
                  {filteredAssignments.map((row) => (
                    <li key={row.employee.id} className="flex items-center justify-between gap-3 px-3 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                          {row.employee.department ? `[${row.employee.department.name}] ` : ""}{row.employee.name}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{row.employee.employee_number}</p>
                        {row.assignment ? (
                          <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
                            <span className="rounded-full bg-fruition-50 px-2 py-0.5 font-medium text-fruition-700">{row.assignment.shift.name}</span>
                            <span className="text-muted-foreground">{row.assignment.shift.start_time} - {row.assignment.shift.end_time} / effective {row.assignment.effective_from}</span>
                          </p>
                        ) : (
                          <p className="mt-1 text-xs font-medium text-amber-600">No shift assigned</p>
                        )}
                      </div>
                      <Button variant="ghost" size="icon-sm" onClick={() => startAssignment(row)} aria-label={`Assign shift to ${row.employee.name}`} title="Change assignment">
                        {row.assignment ? <Pencil className="size-4" /> : <CalendarDays className="size-4" />}
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <ConfirmDialog
          open={deleteTarget !== null}
          onOpenChange={(nextOpen) => !nextOpen && setDeleteTarget(null)}
          title="Delete shift?"
          description="This removes the shift from future use. Continue?"
          confirmLabel="Delete"
          isPending={remove.isPending}
          onConfirm={async () => {
            if (deleteTarget === null) return;
            try {
              await remove.mutateAsync(deleteTarget);
              toast.success("Shift deleted.");
            } catch (error) {
              toast.error(apiErrorMessage(error));
            } finally {
              setDeleteTarget(null);
            }
          }}
        />
      </SheetContent>
    </Sheet>
  );
}
