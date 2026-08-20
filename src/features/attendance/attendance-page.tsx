"use client";

import { AlertTriangle, CalendarClock, CalendarDays, CheckCheck, CheckCircle2, ChevronLeft, ChevronRight, Clock, Filter, Lock, Plus, QrCode, RotateCcw, Settings, Timer, Upload, UserX, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Can } from "@/components/can";
import { useCan } from "@/features/auth/use-auth";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { PageHeader } from "@/components/page-header";
import { PageLoader } from "@/components/page-loader";
import { Button } from "@/components/ui/button";
import { apiErrorMessage } from "@/lib/api";
import {
  useAttendanceGrid,
  useFinalizePeriod,
  type DayStatusCode,
} from "@/features/attendance/use-attendance";
import { AttendanceSettingsDialog } from "@/features/attendance/attendance-settings-dialog";
import { BulkMarkDialog } from "@/features/attendance/bulk-mark-dialog";
import { DayCellDialog, type DayCellTarget } from "@/features/attendance/day-cell-dialog";
import { ImportDialog } from "@/features/attendance/import-dialog";
import { KiosksDialog } from "@/features/attendance/kiosks-dialog";
import { RecordLogDialog } from "@/features/attendance/record-log-dialog";
import { ShiftsDialog } from "@/features/attendance/shifts-dialog";

// Status → dot colour + short label for legend/cells.
const STATUS_META: Record<DayStatusCode, { color: string; label: string; short: string }> = {
  present: { color: "bg-fruition-500", label: "Present", short: "P" },
  late: { color: "bg-warning", label: "Late", short: "L" },
  early_exit: { color: "bg-amber-400", label: "Early exit", short: "E" },
  absent: { color: "bg-danger", label: "Absent", short: "A" },
  on_leave: { color: "bg-info", label: "On leave", short: "V" },
  holiday: { color: "bg-fruition-200", label: "Holiday", short: "H" },
  weekend: { color: "bg-slate-200", label: "Weekend", short: "" },
  no_shift: { color: "bg-slate-100", label: "No shift", short: "?" },
};

function currentPeriod(): string {
  return new Date().toISOString().slice(0, 7);
}

function shiftPeriod(period: string, delta: number): string {
  const [y, m] = period.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function periodLabel(period: string): string {
  const [y, m] = period.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-NG", { month: "long", year: "numeric" });
}

function daysInPeriod(period: string): string[] {
  const [y, m] = period.split("-").map(Number);
  const count = new Date(y, m, 0).getDate();
  return Array.from({ length: count }, (_, i) => `${period}-${String(i + 1).padStart(2, "0")}`);
}

export function AttendancePage() {
  const [period, setPeriod] = useState(currentPeriod());
  const [department, setDepartment] = useState("");
  const { data: grid, isLoading } = useAttendanceGrid(period);
  const finalize = useFinalizePeriod(period);

  const [recordOpen, setRecordOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [cellTarget, setCellTarget] = useState<DayCellTarget | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [shiftsOpen, setShiftsOpen] = useState(false);
  const [kiosksOpen, setKiosksOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [finalizeOpen, setFinalizeOpen] = useState(false);

  const days = useMemo(() => daysInPeriod(period), [period]);
  const employees = grid?.rows.map((r) => r.employee) ?? [];
  const isFinalized = grid?.is_finalized ?? false;
  const canManage = useCan("attendance.manage");
  // A locked month is read-only, so cells stop being buttons entirely
  // rather than opening a dialog that can only fail with a 409.
  const canEditDays = canManage && !isFinalized;
  const departments = useMemo(() => Array.from(new Set((grid?.rows ?? []).map((row) => row.employee.department).filter((item): item is string => Boolean(item)))).sort(), [grid?.rows]);
  const visibleRows = useMemo(() => (grid?.rows ?? []).filter((row) => !department || row.employee.department === department), [department, grid?.rows]);
  const totals = useMemo(() => visibleRows.reduce((total, row) => ({
    present: total.present + (row.summary?.days_present ?? 0),
    late: total.late + (row.summary?.days_late ?? 0),
    absent: total.absent + (row.summary?.days_absent ?? 0),
    leave: total.leave + (row.summary?.days_on_leave ?? 0),
  }), { present: 0, late: 0, absent: 0, leave: 0 }), [visibleRows]);
  const attendanceRate = totals.present + totals.absent + totals.leave > 0
    ? Math.round((totals.present / (totals.present + totals.absent + totals.leave)) * 100)
    : 0;

  const runFinalize = async () => {
    try {
      const res = await finalize.mutateAsync();
      toast.success(`Attendance finalized for ${res.finalized} employees.`);
    } catch (error) {
      toast.error(apiErrorMessage(error));
    } finally {
      setFinalizeOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance"
        description="Track daily attendance, then finalize the month for payroll."
        actions={
          <Can permission="attendance.manage">
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => setShiftsOpen(true)}>
                <Clock className="size-4" /> Shifts
              </Button>
              <Button variant="outline" onClick={() => setKiosksOpen(true)}>
                <QrCode className="size-4" /> Kiosks
              </Button>
              <Button variant="outline" onClick={() => setSettingsOpen(true)}>
                <Settings className="size-4" /> Settings
              </Button>
              <Button variant="outline" onClick={() => setImportOpen(true)} disabled={isFinalized}>
                <Upload className="size-4" /> Import
              </Button>
              <Button onClick={() => setRecordOpen(true)} variant="outline" disabled={isFinalized}>
                <Plus className="size-4" /> Record
              </Button>
              <Button onClick={() => setBulkOpen(true)} disabled={isFinalized}>
                <CheckCheck className="size-4" /> Mark attendance
              </Button>
            </div>
          </Can>
        }
      />

      {/* Period navigator + finalize */}
      <section className="rounded-2xl border border-slate-200 bg-card p-4 shadow-sm sm:p-5 dark:border-slate-700">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon-sm" onClick={() => setPeriod(shiftPeriod(period, -1))} aria-label="Previous month">
            <ChevronLeft className="size-4" />
          </Button>
          <div className="min-w-40 text-center"><p className="text-xs uppercase tracking-wide text-muted-foreground">Attendance period</p><p className="text-sm font-semibold">{periodLabel(period)}</p></div>
          <Button variant="outline" size="icon-sm" onClick={() => setPeriod(shiftPeriod(period, 1))} aria-label="Next month">
            <ChevronRight className="size-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => { setPeriod(currentPeriod()); setDepartment(""); }} disabled={period === currentPeriod() && department === ""}>
            <RotateCcw className="size-3.5" /> Today
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2"><Filter className="size-4 text-muted-foreground" /><select value={department} onChange={(event) => setDepartment(event.target.value)} className="h-9 rounded-lg border border-slate-300 bg-background px-3 text-sm dark:border-slate-600" aria-label="Filter by department"><option value="">All departments</option>{departments.map((item) => <option key={item} value={item}>{item}</option>)}</select></div>
          {isFinalized ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-fruition-50 px-3 py-1 text-xs font-semibold text-fruition-700 ring-1 ring-fruition-200">
              <Lock className="size-3" /> Finalized
            </span>
          ) : (
            <Can permission="attendance.approve">
              <Button variant="outline" onClick={() => setFinalizeOpen(true)}>
                <CalendarClock className="size-4" /> Finalize month
              </Button>
            </Can>
          )}
        </div>
      </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Employees", value: visibleRows.length, detail: department || "All departments", icon: Users, tone: "text-fruition-700 bg-fruition-50" },
          { label: "Attendance rate", value: `${attendanceRate}%`, detail: "Present vs scheduled days", icon: CheckCircle2, tone: "text-fruition-700 bg-fruition-50" },
          { label: "Late arrivals", value: totals.late, detail: "Recorded this month", icon: Timer, tone: "text-warning bg-warning/10" },
          { label: "Absent days", value: totals.absent, detail: `${totals.leave} day${totals.leave === 1 ? "" : "s"} on leave`, icon: UserX, tone: "text-danger bg-danger/10" },
        ].map((item) => <div key={item.label} className="rounded-xl border border-slate-200 bg-card p-4 shadow-sm dark:border-slate-700"><div className="flex items-start justify-between gap-3"><span className={`grid size-9 place-items-center rounded-lg ${item.tone}`}><item.icon className="size-4" /></span><span className="text-2xl font-bold tracking-tight">{item.value}</span></div><p className="mt-3 text-sm font-semibold">{item.label}</p><p className="mt-0.5 text-xs text-muted-foreground">{item.detail}</p></div>)}
      </div>

      {!isFinalized && <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3 text-sm text-amber-900"><AlertTriangle className="mt-0.5 size-4 shrink-0" /><p><span className="font-semibold">Month is open.</span> Review attendance and finalize it when the records are ready for payroll.</p></div>}

      {/* Grid */}
      {isLoading ? (
        <PageLoader label={`Loading ${periodLabel(period)} attendance…`} />
      ) : !grid?.rows.length ? (
        <div className="rounded-2xl border border-dashed p-10 text-center"><CalendarDays className="mx-auto size-8 text-muted-foreground" /><p className="mt-3 text-sm font-semibold">No employees to show</p><p className="mt-1 text-sm text-muted-foreground">Add employees and assign shifts before recording attendance.</p></div>
      ) : !visibleRows.length ? (
        <div className="rounded-2xl border border-dashed p-10 text-center"><Filter className="mx-auto size-8 text-muted-foreground" /><p className="mt-3 text-sm font-semibold">No matching employees</p><p className="mt-1 text-sm text-muted-foreground">Try another department filter.</p></div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-card shadow-sm dark:border-slate-700">
          <table className="w-full min-w-[760px] border-collapse text-xs">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="sticky left-0 z-10 bg-muted/50 px-3 py-2 text-left font-medium">
                  Employee
                </th>
                {days.map((d) => (
                  <th key={d} className="w-7 px-0 py-2 text-center font-medium text-muted-foreground">
                    {Number(d.slice(-2))}
                  </th>
                ))}
                <th className="px-3 py-2 text-center font-medium">P/L/A</th>
              </tr>
            </thead>
            <tbody>
                {visibleRows.map((row) => (
                <tr key={row.employee.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="sticky left-0 z-10 bg-background px-3 py-1.5 whitespace-nowrap">
                    <span className="font-medium">{row.employee.name}</span>
                    <span className="ml-1 text-muted-foreground">{row.employee.employee_number}</span>
                  </td>
                  {days.map((d) => {
                    const day = row.days[d];
                    const meta = day ? STATUS_META[day.status] : null;
                    const cell = meta && meta.short ? (
                      <span
                        className={`mx-auto flex size-5 items-center justify-center rounded text-[9px] font-bold text-white ${meta.color}`}
                      >
                        {meta.short}
                      </span>
                    ) : (
                      <span className={`mx-auto block size-5 rounded ${meta?.color ?? ""}`} />
                    );
                    const title = `${meta?.label ?? "No record"}${day?.late_minutes ? ` · ${day.late_minutes}m late` : ""}`;

                    return (
                      <td key={d} className="px-0 py-1.5 text-center">
                        {canEditDays ? (
                          <button
                            type="button"
                            title={`${title} — click to edit`}
                            aria-label={`${row.employee.name}, ${d}: ${meta?.label ?? "no record"}`}
                            onClick={() => setCellTarget({
                              employeeId: row.employee.id,
                              employeeName: row.employee.name,
                              date: d,
                              day,
                            })}
                            className="mx-auto block rounded p-0.5 outline-none hover:ring-2 hover:ring-primary/40 focus-visible:ring-2 focus-visible:ring-primary"
                          >
                            {cell}
                          </button>
                        ) : (
                          <span title={title}>{cell}</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="px-3 py-1.5 text-center whitespace-nowrap">
                    <span className="text-fruition-700">{row.summary?.days_present ?? "–"}</span>
                    {" / "}
                    <span className="text-warning">{row.summary?.days_late ?? "–"}</span>
                    {" / "}
                    <span className="text-danger">{row.summary?.days_absent ?? "–"}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        {canEditDays && (
          <span className="font-medium text-slate-600 dark:text-slate-300">
            Click any day to edit it ·
          </span>
        )}
        {Object.entries(STATUS_META).map(([key, meta]) => (
          <span key={key} className="inline-flex items-center gap-1.5">
            <span className={`size-3 rounded ${meta.color}`} /> {meta.label}
          </span>
        ))}
      </div>

      <BulkMarkDialog open={bulkOpen} onOpenChange={setBulkOpen} period={period} rows={visibleRows} />
      <DayCellDialog target={cellTarget} onOpenChange={(open) => { if (!open) setCellTarget(null); }} period={period} />
      <RecordLogDialog open={recordOpen} onOpenChange={setRecordOpen} period={period} employees={employees} />
      <ImportDialog open={importOpen} onOpenChange={setImportOpen} period={period} />
      <ShiftsDialog open={shiftsOpen} onOpenChange={setShiftsOpen} />
      <KiosksDialog open={kiosksOpen} onOpenChange={setKiosksOpen} />
      <AttendanceSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
      <ConfirmDialog
        open={finalizeOpen}
        onOpenChange={setFinalizeOpen}
        title={`Finalize ${periodLabel(period)}?`}
        description="This locks attendance for the month. Logs can no longer be edited, and payroll will use these totals. Continue?"
        confirmLabel="Finalize"
        isPending={finalize.isPending}
        onConfirm={runFinalize}
      />
    </div>
  );
}
