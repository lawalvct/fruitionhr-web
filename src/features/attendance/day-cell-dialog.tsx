"use client";

import { useState } from "react";
import { toast } from "sonner";

import { FormDialog } from "@/components/form-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiErrorMessage } from "@/lib/api";
import {
  SKIP_REASON_LABEL,
  useBulkMark,
  type AttendanceDay,
  type SettableStatus,
} from "@/features/attendance/use-attendance";

const STATUS_OPTIONS: { value: SettableStatus; label: string }[] = [
  { value: "present", label: "Present" },
  { value: "late", label: "Late" },
  { value: "absent", label: "Absent" },
];

/** Statuses owned by another source, which this dialog must not overrule. */
const UNMARKABLE = new Set(["holiday", "on_leave", "weekend", "no_shift"]);

export interface DayCellTarget {
  employeeId: number;
  employeeName: string;
  date: string;
  day: AttendanceDay | undefined;
}

/**
 * Edit one employee's one day.
 *
 * Goes through the same bulk endpoint as the multi-select sheet, with a single
 * employee and a single date, so a cell edit and a bulk edit can never drift
 * apart in what a status means.
 */
export function DayCellDialog({
  target,
  onOpenChange,
  period,
}: {
  target: DayCellTarget | null;
  onOpenChange: (open: boolean) => void;
  period: string;
}) {
  const bulk = useBulkMark(period);
  const [status, setStatus] = useState<SettableStatus>("present");
  const [useShiftTimes, setUseShiftTimes] = useState(true);
  const [clockIn, setClockIn] = useState("08:00");
  const [clockOut, setClockOut] = useState("17:00");
  const [note, setNote] = useState("");

  const current = target?.day?.status;
  const blocked = current !== undefined && UNMARKABLE.has(current);

  // Start from what the day already is, so "open, glance, close" is a no-op.
  // Adjusted during render rather than in an effect, so the buttons never
  // paint the previous cell's status first.
  const [openedFor, setOpenedFor] = useState<string | null>(null);
  const openKey = target ? `${target.employeeId}:${target.date}` : null;

  if (openKey !== openedFor) {
    setOpenedFor(openKey);

    if (openKey !== null) {
      const settable = STATUS_OPTIONS.some((option) => option.value === current);
      setStatus(settable ? (current as SettableStatus) : "present");
      setUseShiftTimes(true);
      setNote("");
    }
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!target) return;

    const times =
      status === "absent" || useShiftTimes ? {} : { clock_in: clockIn, clock_out: clockOut };

    try {
      const response = await bulk.mutateAsync({
        employee_ids: [target.employeeId],
        date: target.date,
        status,
        ...times,
        note: note || undefined,
        // A deliberate click on one cell is always an override.
        overwrite: true,
      });

      if (response.marked + response.cleared > 0) {
        toast.success(`${target.employeeName} · ${target.date} updated.`);
        onOpenChange(false);
        return;
      }

      const reason = response.skipped[0]?.reason;
      toast.warning(reason ? `Not changed — ${SKIP_REASON_LABEL[reason] ?? reason}.` : response.message);
    } catch (error) {
      toast.error(apiErrorMessage(error));
    }
  };

  return (
    <FormDialog
      open={target !== null}
      onOpenChange={onOpenChange}
      title={target ? target.employeeName : "Edit day"}
      description={target ? `Attendance for ${target.date}` : undefined}
      formId="day-cell-form"
      isPending={bulk.isPending}
      submitLabel="Save day"
    >
      <form id="day-cell-form" onSubmit={submit} className="grid gap-5 py-2">
        {blocked && (
          <p className="rounded-lg border border-amber-200 bg-amber-50/70 px-3 py-2 text-sm text-amber-900">
            This day is <strong>{SKIP_REASON_LABEL[current as keyof typeof SKIP_REASON_LABEL] ?? current}</strong>.
            It is set by the leave module, the holiday calendar or the shift pattern — change it there rather
            than here.
          </p>
        )}

        <div className="grid gap-2">
          <Label>Status</Label>
          <div className="grid grid-cols-3 gap-2">
            {STATUS_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                disabled={blocked}
                onClick={() => setStatus(option.value)}
                aria-pressed={status === option.value}
                className={`rounded-lg border px-3 py-2 text-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${
                  status === option.value
                    ? "border-primary bg-primary/5 font-medium ring-2 ring-primary/25"
                    : "border-slate-300 hover:bg-muted dark:border-slate-600"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {status !== "absent" && !blocked && (
          <div className="grid gap-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={useShiftTimes}
                onChange={(event) => setUseShiftTimes(event.target.checked)}
              />
              Use their shift hours
            </label>
            {!useShiftTimes && (
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="cell-in" className="text-xs text-muted-foreground">Clock in</Label>
                  <Input id="cell-in" type="time" value={clockIn} onChange={(event) => setClockIn(event.target.value)} />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="cell-out" className="text-xs text-muted-foreground">Clock out</Label>
                  <Input id="cell-out" type="time" value={clockOut} onChange={(event) => setClockOut(event.target.value)} />
                </div>
              </div>
            )}
          </div>
        )}

        {!blocked && (
          <div className="grid gap-2">
            <Label htmlFor="cell-note">Note (optional)</Label>
            <Input
              id="cell-note"
              value={note}
              maxLength={255}
              placeholder="Why this was changed"
              onChange={(event) => setNote(event.target.value)}
            />
          </div>
        )}

        {target?.day && (
          <p className="text-xs text-muted-foreground">
            Currently <strong>{current}</strong>
            {target.day.late_minutes ? ` · ${target.day.late_minutes} minutes late` : ""}
            {target.day.overtime_minutes ? ` · ${target.day.overtime_minutes} minutes overtime` : ""}
          </p>
        )}
      </form>
    </FormDialog>
  );
}
