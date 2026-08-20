"use client";

import { CalendarRange, CheckCheck, Info } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { FormDialog } from "@/components/form-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiErrorMessage } from "@/lib/api";
import {
  SKIP_REASON_LABEL,
  useBulkMark,
  type AttendanceRow,
  type BulkMarkResult,
  type SettableStatus,
} from "@/features/attendance/use-attendance";

const STATUS_OPTIONS: { value: SettableStatus; label: string; hint: string }[] = [
  { value: "present", label: "Present", hint: "Writes each employee's own shift hours" },
  { value: "late", label: "Late", hint: "Writes an arrival just past their grace period" },
  { value: "absent", label: "Absent", hint: "Clears the day's record" },
];

/** Days already accounted for elsewhere can't be marked, so don't offer them. */
const UNMARKABLE = new Set(["holiday", "on_leave", "weekend", "no_shift"]);

function todayWithin(period: string): string {
  const today = new Date().toISOString().slice(0, 10);
  return today.startsWith(period) ? today : `${period}-01`;
}

/** Last day of the viewed month, so the pickers can't wander into another
 * period — the API scopes finalization and summaries per month, so a stray
 * date would quietly write somewhere the user isn't looking. */
function lastDayOf(period: string): string {
  const [year, month] = period.split("-").map(Number);
  return `${period}-${String(new Date(year, month, 0).getDate()).padStart(2, "0")}`;
}

export function BulkMarkDialog({
  open,
  onOpenChange,
  period,
  rows,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  period: string;
  rows: AttendanceRow[];
}) {
  const bulk = useBulkMark(period);
  const [mode, setMode] = useState<"day" | "range">("day");
  const [date, setDate] = useState(() => todayWithin(period));
  const [from, setFrom] = useState(() => todayWithin(period));
  const [to, setTo] = useState(() => todayWithin(period));
  const [status, setStatus] = useState<SettableStatus>("present");
  const [selected, setSelected] = useState<number[]>([]);
  const [overwrite, setOverwrite] = useState(false);
  const [useShiftTimes, setUseShiftTimes] = useState(true);
  const [clockIn, setClockIn] = useState("08:00");
  const [clockOut, setClockOut] = useState("17:00");
  const [result, setResult] = useState<BulkMarkResult | null>(null);

  const firstDay = `${period}-01`;
  const lastDay = lastDayOf(period);

  // Reopening, or landing on a different month, must not keep the last run's
  // dates or selection. Adjusted during render rather than in an effect —
  // React re-renders before committing, so no flash of stale state.
  const [openedFor, setOpenedFor] = useState<string | null>(null);
  const openKey = open ? period : null;

  if (openKey !== openedFor) {
    setOpenedFor(openKey);

    if (openKey !== null) {
      const start = todayWithin(period);
      setDate(start);
      setFrom(start);
      setTo(start);
      setSelected(rows.map((row) => row.employee.id));
      setResult(null);
    }
  }

  /**
   * On a single day we can tell in advance who is unmarkable — the grid
   * already knows they're on leave, or it's their rest day. Showing that up
   * front beats reporting it as a skip afterwards. Ranges span mixed days, so
   * everyone stays eligible and the API reports what it skipped.
   */
  const dayStatuses = useMemo(() => {
    if (mode !== "day") return null;
    return new Map(rows.map((row) => [row.employee.id, row.days[date]?.status]));
  }, [date, mode, rows]);

  const isEligible = (employeeId: number) => {
    const dayStatus = dayStatuses?.get(employeeId);
    return dayStatus === undefined || !UNMARKABLE.has(dayStatus);
  };

  const eligible = rows.filter((row) => isEligible(row.employee.id));
  const selectedEligible = selected.filter(isEligible);
  const allSelected = eligible.length > 0 && selectedEligible.length === eligible.length;

  const toggleAll = () => {
    setSelected(allSelected ? [] : eligible.map((row) => row.employee.id));
  };

  const toggleOne = (employeeId: number) => {
    setSelected((current) =>
      current.includes(employeeId)
        ? current.filter((id) => id !== employeeId)
        : [...current, employeeId],
    );
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (selectedEligible.length === 0) {
      toast.error("Select at least one employee.");
      return;
    }

    if (mode === "range" && from.slice(0, 7) !== to.slice(0, 7)) {
      toast.error("The date range must stay inside a single month.");
      return;
    }

    // Times are meaningless for "absent", which clears the day.
    const times =
      status === "absent" || useShiftTimes ? {} : { clock_in: clockIn, clock_out: clockOut };

    try {
      const response = await bulk.mutateAsync({
        employee_ids: selectedEligible,
        status,
        ...(mode === "day" ? { date } : { from, to }),
        ...times,
        overwrite,
      });

      setResult(response);

      if (response.marked + response.cleared > 0) {
        toast.success(response.message);
      } else {
        toast.warning(response.message);
      }

      // Keep the sheet open when anything was skipped so the reasons can be
      // read; a clean run has nothing left to say.
      if (response.skipped.length === 0) onOpenChange(false);
    } catch (error) {
      toast.error(apiErrorMessage(error));
    }
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Mark attendance"
      description="Set a status for many employees at once. Holidays, approved leave and rest days are left untouched."
      formId="bulk-mark-form"
      isPending={bulk.isPending}
      submitLabel={`Apply to ${selectedEligible.length} employee${selectedEligible.length === 1 ? "" : "s"}`}
      pendingLabel="Applying..."
    >
      <form id="bulk-mark-form" onSubmit={submit} className="grid gap-5 py-2">
        {/* Day or range */}
        <div className="grid gap-2">
          <Label>When</Label>
          <div className="flex gap-2">
            {(["day", "range"] as const).map((option) => (
              <Button
                key={option}
                type="button"
                size="sm"
                variant={mode === option ? "default" : "outline"}
                onClick={() => setMode(option)}
              >
                {option === "day" ? <CheckCheck className="size-3.5" /> : <CalendarRange className="size-3.5" />}
                {option === "day" ? "Single day" : "Date range"}
              </Button>
            ))}
          </div>
          {mode === "day" ? (
            <Input
              type="date"
              value={date}
              min={firstDay}
              max={lastDay}
              onChange={(event) => setDate(event.target.value)}
              aria-label="Date"
            />
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="bulk-from" className="text-xs text-muted-foreground">From</Label>
                <Input id="bulk-from" type="date" value={from} min={firstDay} max={lastDay} onChange={(event) => setFrom(event.target.value)} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="bulk-to" className="text-xs text-muted-foreground">To</Label>
                <Input id="bulk-to" type="date" value={to} min={from} max={lastDay} onChange={(event) => setTo(event.target.value)} />
              </div>
            </div>
          )}
        </div>

        {/* Status */}
        <div className="grid gap-2">
          <Label>Status</Label>
          <div className="grid gap-2 sm:grid-cols-3">
            {STATUS_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setStatus(option.value)}
                aria-pressed={status === option.value}
                className={`rounded-lg border px-3 py-2 text-left text-sm transition ${
                  status === option.value
                    ? "border-primary bg-primary/5 ring-2 ring-primary/25"
                    : "border-slate-300 hover:bg-muted dark:border-slate-600"
                }`}
              >
                <span className="font-medium">{option.label}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">{option.hint}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Times — only meaningful when a record is being written */}
        {status !== "absent" && (
          <div className="grid gap-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={useShiftTimes}
                onChange={(event) => setUseShiftTimes(event.target.checked)}
              />
              Use each employee&apos;s own shift hours
            </label>
            {!useShiftTimes && (
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="bulk-in" className="text-xs text-muted-foreground">Clock in</Label>
                  <Input id="bulk-in" type="time" value={clockIn} onChange={(event) => setClockIn(event.target.value)} />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="bulk-out" className="text-xs text-muted-foreground">Clock out</Label>
                  <Input id="bulk-out" type="time" value={clockOut} onChange={(event) => setClockOut(event.target.value)} />
                </div>
              </div>
            )}
          </div>
        )}

        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={overwrite}
            onChange={(event) => setOverwrite(event.target.checked)}
          />
          <span>
            Replace days that already have a record
            <span className="block text-xs text-muted-foreground">
              Off by default, so real clock-ins from kiosks and self-service survive.
            </span>
          </span>
        </label>

        {/* Employees */}
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <Label>Employees</Label>
            <Button type="button" variant="ghost" size="xs" onClick={toggleAll}>
              {allSelected ? "Clear all" : "Select all"}
            </Button>
          </div>
          <div className="max-h-64 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700">
            {rows.length === 0 ? (
              <p className="px-3 py-4 text-sm text-muted-foreground">No employees to show.</p>
            ) : (
              rows.map((row) => {
                const dayStatus = dayStatuses?.get(row.employee.id);
                const blocked = dayStatus !== undefined && UNMARKABLE.has(dayStatus);

                return (
                  <label
                    key={row.employee.id}
                    className={`flex items-center gap-2.5 border-b px-3 py-2 text-sm last:border-0 ${
                      blocked ? "opacity-55" : "hover:bg-muted/40"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={!blocked && selected.includes(row.employee.id)}
                      disabled={blocked}
                      onChange={() => toggleOne(row.employee.id)}
                    />
                    <span className="flex-1 truncate">
                      {row.employee.name}
                      <span className="ml-1.5 text-xs text-muted-foreground">
                        {row.employee.employee_number}
                      </span>
                    </span>
                    {blocked && (
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {SKIP_REASON_LABEL[dayStatus as keyof typeof SKIP_REASON_LABEL] ?? dayStatus}
                      </span>
                    )}
                  </label>
                );
              })
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {selectedEligible.length} of {eligible.length} selectable employee
            {eligible.length === 1 ? "" : "s"} selected
            {mode === "range" ? " · rest days, holidays and leave inside the range are skipped automatically" : ""}
          </p>
        </div>

        {/* What the last run skipped, and why */}
        {result && result.skipped.length > 0 && (
          <div className="grid gap-2 rounded-lg border border-amber-200 bg-amber-50/70 p-3 text-sm text-amber-900">
            <p className="flex items-center gap-1.5 font-semibold">
              <Info className="size-4" /> {result.skipped.length} day
              {result.skipped.length === 1 ? "" : "s"} skipped
            </p>
            <ul className="max-h-40 space-y-0.5 overflow-y-auto text-xs">
              {result.skipped.map((skip) => (
                <li key={`${skip.employee_id}-${skip.date}`}>
                  {skip.employee} · {skip.date} — {SKIP_REASON_LABEL[skip.reason] ?? skip.reason}
                </li>
              ))}
            </ul>
          </div>
        )}
      </form>
    </FormDialog>
  );
}
