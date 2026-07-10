"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
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
import { apiErrorMessage } from "@/lib/api";
import {
  useDeleteShift,
  useSaveShift,
  useShifts,
  type Shift,
  type ShiftInput,
} from "@/features/attendance/use-attendance";

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

export function ShiftsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: shifts, isLoading } = useShifts();
  const save = useSaveShift();
  const remove = useDeleteShift();

  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ShiftInput>(emptyShift);
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

  const startCreate = () => {
    setEditingId(null);
    setForm(emptyShift);
    setShowForm(true);
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
    setShowForm(true);
  };

  const toggleDay = (day: number) => {
    setForm((f) => ({
      ...f,
      working_days: f.working_days.includes(day)
        ? f.working_days.filter((d) => d !== day)
        : [...f.working_days, day].sort((a, b) => a - b),
    }));
  };

  const submit = async () => {
    try {
      await save.mutateAsync({ id: editingId ?? undefined, input: form });
      toast.success(editingId ? "Shift updated." : "Shift created.");
      setShowForm(false);
    } catch (error) {
      toast.error(apiErrorMessage(error));
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Shifts</SheetTitle>
          <SheetDescription>
            Define working hours, grace period and working days. Attendance
            lateness and absence are judged against the assigned shift.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 px-4 pb-6">
          {!showForm && (
            <Button type="button" onClick={startCreate} className="w-full">
              <Plus className="size-4" /> New shift
            </Button>
          )}

          {showForm && (
            <div className="space-y-3 rounded-lg border bg-muted/40 p-4">
              <div className="grid gap-2">
                <Label htmlFor="shift-name">Name</Label>
                <Input
                  id="shift-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Day Shift"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="shift-start">Start</Label>
                  <Input
                    id="shift-start"
                    type="time"
                    value={form.start_time}
                    onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="shift-end">End</Label>
                  <Input
                    id="shift-end"
                    type="time"
                    value={form.end_time}
                    onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="shift-grace">Grace (min)</Label>
                  <Input
                    id="shift-grace"
                    type="number"
                    min={0}
                    value={form.grace_minutes}
                    onChange={(e) => setForm({ ...form, grace_minutes: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Working days</Label>
                <div className="flex flex-wrap gap-1.5">
                  {WEEKDAYS.map((day) => (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => toggleDay(day.value)}
                      className={`rounded-md border px-2.5 py-1 text-xs font-medium ${
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
              <div className="flex justify-end gap-2 pt-1">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button type="button" onClick={submit} disabled={save.isPending}>
                  {save.isPending ? "Saving…" : "Save shift"}
                </Button>
              </div>
            </div>
          )}

          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading shifts…</p>
          ) : !shifts?.length ? (
            <p className="text-sm text-muted-foreground">No shifts yet.</p>
          ) : (
            <ul className="divide-y rounded-lg border">
              {shifts.map((shift) => (
                <li key={shift.id} className="flex items-center justify-between gap-2 px-3 py-2.5">
                  <div>
                    <p className="text-sm font-medium">{shift.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {shift.start_time}–{shift.end_time} · grace {shift.grace_minutes}m ·{" "}
                      {shift.working_days
                        .map((d) => WEEKDAYS.find((w) => w.value === d)?.label)
                        .join(" ")}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon-sm" onClick={() => startEdit(shift)} aria-label="Edit">
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setDeleteTarget(shift.id)}
                      aria-label="Delete"
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <ConfirmDialog
          open={deleteTarget !== null}
          onOpenChange={(o) => !o && setDeleteTarget(null)}
          title="Delete shift?"
          description="Employees assigned to this shift will need reassignment."
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
