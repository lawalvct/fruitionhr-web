"use client";

import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  QrCode,
  Receipt,
  Send,
  UserRound,
  UserX,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { MoneyText } from "@/components/money-text";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { apiErrorMessage } from "@/lib/api";
import { useEmployeePhoto } from "@/features/employees/use-employees";
import { QrScanDialog } from "@/features/self-service/qr-scan-dialog";
import {
  useApplySelfLeave,
  useClockIn,
  useClockOut,
  useKioskClock,
  useProfileUpdateRequests,
  useSelfAttendance,
  useSelfLeaveBalances,
  useSelfLeaveRequests,
  useSelfLeaveTypes,
  useSelfPayslips,
  useSelfProfile,
  useSubmitProfileUpdate,
  useTodayAttendance,
  type ProfileUpdateInput,
} from "@/features/self-service/use-self-service";

const PROFILE_FIELDS = [
  { key: "personal_email", label: "Personal email", type: "email" },
  { key: "phone", label: "Phone", type: "text" },
  { key: "marital_status", label: "Marital status", type: "text" },
  { key: "city", label: "City", type: "text" },
  { key: "state", label: "State", type: "text" },
  { key: "address", label: "Address", type: "text" },
] as const satisfies { key: keyof ProfileUpdateInput; label: string; type: string }[];

const PROFILE_FIELD_LABELS: Record<string, string> = Object.fromEntries(
  PROFILE_FIELDS.map((field) => [field.key, field.label]),
);

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-NG", { dateStyle: "medium" }).format(new Date(value));
}

function currentPeriod() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function shiftPeriod(period: string, delta: number): string {
  const [year, month] = period.split("-").map(Number);
  const date = new Date(year, month - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function periodLabel(period: string): string {
  const [year, month] = period.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("en-NG", { month: "long", year: "numeric" });
}

function initials(name?: string) {
  return (name ?? "?")
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof CalendarDays;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-dashed px-5 py-12 text-center">
      <span className="mx-auto grid size-10 place-items-center rounded-lg bg-fruition-50 text-fruition-700">
        <Icon className="size-5" />
      </span>
      <p className="mt-3 text-sm font-semibold">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function StatTile({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number | string;
  icon: typeof CalendarDays;
  tone: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <span className={`grid size-9 place-items-center rounded-lg ${tone}`}>
          <Icon className="size-4" />
        </span>
        <span className="text-2xl font-bold tracking-tight">{value}</span>
      </div>
      <p className="mt-3 text-sm font-semibold">{label}</p>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  min,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  min?: string;
  required?: boolean;
}) {
  const id = `ess-${label.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} value={value} min={min} required={required} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}

function ProfileTab() {
  const { data: profile, isLoading } = useSelfProfile();
  const { data: requests } = useProfileUpdateRequests();
  const submit = useSubmitProfileUpdate();
  const { data: photoBlob } = useEmployeePhoto(profile?.photo_url);
  const photoUrl = useMemo(() => (photoBlob ? URL.createObjectURL(photoBlob) : null), [photoBlob]);

  useEffect(() => {
    return () => {
      if (photoUrl) URL.revokeObjectURL(photoUrl);
    };
  }, [photoUrl]);

  const [form, setForm] = useState<ProfileUpdateInput>({});

  const values = {
    personal_email: form.personal_email ?? profile?.personal_email ?? "",
    phone: form.phone ?? profile?.phone ?? "",
    marital_status: form.marital_status ?? profile?.marital_status ?? "",
    address: form.address ?? profile?.address ?? "",
    city: form.city ?? profile?.city ?? "",
    state: form.state ?? profile?.state ?? "",
  };

  const hasPendingRequest = requests?.some((request) => request.status === "pending") ?? false;
  const hasChanges = profile
    ? PROFILE_FIELDS.some(({ key }) => values[key] !== (profile[key] ?? ""))
    : false;

  const submitUpdate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!hasChanges) return;

    try {
      await submit.mutateAsync({
        personal_email: values.personal_email || null,
        phone: values.phone || null,
        marital_status: values.marital_status || null,
        address: values.address || null,
        city: values.city || null,
        state: values.state || null,
      });
      toast.success("Profile update submitted for approval.");
      setForm({});
    } catch (error) {
      toast.error(apiErrorMessage(error));
    }
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 xl:grid-cols-[1fr_24rem]">
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-72 w-full" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!profile) {
    return (
      <EmptyState
        icon={UserRound}
        title="No employee profile linked"
        description="No employee profile is linked to your user account. Contact HR if this looks wrong."
      />
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_24rem]">
      <section className="space-y-4">
        <Card>
          <CardHeader className="flex items-center gap-4 space-y-0">
            <Avatar size="lg" className="size-14 border-2 border-background shadow-sm">
              {photoUrl && <AvatarImage src={photoUrl} alt={profile.full_name} />}
              <AvatarFallback>{initials(profile.full_name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <CardTitle className="truncate">{profile.full_name}</CardTitle>
              <p className="mt-0.5 text-xs text-muted-foreground">{profile.employee_number}</p>
            </div>
            <StatusBadge status={profile.employment_status} />
          </CardHeader>
          <CardContent>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">Department</dt>
                <dd className="font-medium">{profile.current_assignment?.department?.name ?? "-"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Position</dt>
                <dd className="font-medium">{profile.current_assignment?.position?.title ?? "-"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Official email</dt>
                <dd className="font-medium">{profile.official_email ?? "-"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Hired</dt>
                <dd className="font-medium">{formatDate(profile.hired_at)}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <form onSubmit={submitUpdate} className="space-y-4 rounded-xl border bg-card p-4 shadow-sm">
          <div>
            <h2 className="text-sm font-semibold">Request a profile update</h2>
            <p className="mt-1 text-xs text-muted-foreground">Changes are sent to HR for approval before they take effect.</p>
          </div>

          {hasPendingRequest && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
              <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
              <span>You already have a profile update request awaiting approval.</span>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            {PROFILE_FIELDS.map(({ key, label, type }) => (
              <Field
                key={key}
                label={label}
                type={type}
                value={values[key]}
                onChange={(value) => setForm((prev) => ({ ...prev, [key]: value }))}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={submit.isPending || !hasChanges}>
              <Send className="size-4" />
              Request update
            </Button>
            {hasChanges && (
              <Button type="button" variant="outline" onClick={() => setForm({})}>
                Discard
              </Button>
            )}
          </div>
        </form>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Update requests</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {requests?.length ? (
            requests.map((request) => (
              <div key={request.id} className="rounded-lg border p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">{formatDate(request.submitted_at)}</span>
                  <StatusBadge status={request.status} />
                </div>
                <div className="space-y-1 text-xs">
                  {Object.entries(request.requested_values).map(([key, newValue]) => (
                    <p key={key} className="text-muted-foreground">
                      <span className="font-medium text-foreground">{PROFILE_FIELD_LABELS[key] ?? key}: </span>
                      <span className="line-through">{request.current_values[key] || "—"}</span>
                      {" → "}
                      <span className="text-foreground">{newValue || "—"}</span>
                    </p>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <EmptyState icon={Send} title="No update requests yet" description="Submitted profile changes will appear here." />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function LeaveTab() {
  const year = new Date().getFullYear();
  const { data: types } = useSelfLeaveTypes();
  const { data: requests, isLoading } = useSelfLeaveRequests();
  const { data: balances } = useSelfLeaveBalances(year);
  const apply = useApplySelfLeave(year);

  const [leaveTypeId, setLeaveTypeId] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [reason, setReason] = useState("");

  const selectedBalance = balances?.find((balance) => String(balance.leave_type.id) === leaveTypeId);
  const pendingCount = requests?.filter((request) => request.status === "pending").length ?? 0;
  const daysRemaining = balances?.reduce((total, balance) => total + balance.remaining, 0) ?? 0;
  const daysTaken = balances?.reduce((total, balance) => total + balance.taken, 0) ?? 0;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!leaveTypeId || !start || !end) {
      toast.error("Choose a leave type and date range.");
      return;
    }
    if (end < start) {
      toast.error("End date can't be before the start date.");
      return;
    }

    try {
      await apply.mutateAsync({
        leave_type_id: Number(leaveTypeId),
        start_date: start,
        end_date: end,
        reason: reason || undefined,
      });
      toast.success("Leave request submitted for approval.");
      setLeaveTypeId("");
      setStart("");
      setEnd("");
      setReason("");
    } catch (error) {
      toast.error(apiErrorMessage(error));
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile label="Days remaining" value={daysRemaining} icon={CalendarDays} tone="text-fruition-700 bg-fruition-50" />
        <StatTile label="Days taken" value={daysTaken} icon={CheckCircle2} tone="text-blue-700 bg-blue-50" />
        <StatTile label="Pending requests" value={pendingCount} icon={Clock} tone="text-amber-700 bg-amber-50" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[22rem_1fr]">
        <section className="space-y-4">
          <form onSubmit={submit} className="space-y-4 rounded-xl border bg-card p-4 shadow-sm">
            <h2 className="text-sm font-semibold">Apply for leave</h2>
            <div className="grid gap-2">
              <Label htmlFor="ess-leave-type">Leave type</Label>
              <select
                id="ess-leave-type"
                className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                value={leaveTypeId}
                onChange={(event) => setLeaveTypeId(event.target.value)}
              >
                <option value="">Select</option>
                {types?.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
              {selectedBalance && (
                <p className={`text-xs ${selectedBalance.remaining > 0 ? "text-muted-foreground" : "text-destructive"}`}>
                  {selectedBalance.remaining} day(s) remaining in {year}
                </p>
              )}
            </div>
            <Field label="Start date" type="date" value={start} onChange={setStart} />
            <Field label="End date" type="date" min={start || undefined} value={end} onChange={setEnd} />
            <Field label="Reason" value={reason} onChange={setReason} />
            <Button type="submit" disabled={apply.isPending}>
              <CalendarDays className="size-4" />
              Apply
            </Button>
          </form>

          <Card>
            <CardHeader>
              <CardTitle>Balances</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {balances?.length ? (
                balances.map((balance) => (
                  <div key={balance.id} className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm">
                    <span className="font-medium">{balance.leave_type.name}</span>
                    <span className={balance.remaining > 0 ? "" : "text-destructive"}>{balance.remaining} day(s)</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No balances for {year} yet.</p>
              )}
            </CardContent>
          </Card>
        </section>

        <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
          {isLoading ? (
            <div className="space-y-2 p-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : requests?.length ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left">
                  <th className="px-4 py-3 font-medium">Leave type</th>
                  <th className="px-4 py-3 font-medium">Dates</th>
                  <th className="px-4 py-3 font-medium">Days</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => (
                  <tr key={request.id} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-3">{request.leave_type?.name ?? "-"}</td>
                    <td className="px-4 py-3">{formatDate(request.start_date)} - {formatDate(request.end_date)}</td>
                    <td className="px-4 py-3">{request.days}</td>
                    <td className="px-4 py-3"><StatusBadge status={request.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-2">
              <EmptyState icon={CalendarDays} title="No leave requests yet" description="Requests you submit will appear here with their approval status." />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function workedDuration(clockIn: string, clockOut: string): string {
  const toMinutes = (value: string) => {
    const [h, m] = value.split(":").map(Number);
    return h * 60 + m;
  };

  let minutes = toMinutes(clockOut) - toMinutes(clockIn);
  if (minutes < 0) minutes += 24 * 60; // overnight shift

  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

function ClockWidget() {
  const { data: today, isLoading } = useTodayAttendance();
  const clockIn = useClockIn();
  const clockOut = useClockOut();
  const kioskClock = useKioskClock();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const kioskToken = searchParams.get("kiosk_token") ?? undefined;
  const [scanOpen, setScanOpen] = useState(false);
  const processedKioskToken = useRef<string | null>(null);

  const state = today?.state ?? "not_clocked_in";

  const handleClockIn = useCallback(async (token?: string) => {
    try {
      await clockIn.mutateAsync(token);
      toast.success("Clocked in.");
      if (kioskToken) router.replace(pathname, { scroll: false });
    } catch (error) {
      toast.error(apiErrorMessage(error));
    }
  }, [clockIn, kioskToken, pathname, router]);

  const handleClockOut = useCallback(async (token?: string) => {
    try {
      await clockOut.mutateAsync(token);
      toast.success("Clocked out.");
    } catch (error) {
      toast.error(apiErrorMessage(error));
    }
  }, [clockOut]);

  const handleScan = useCallback(async (token: string) => {
    try {
      const result = await kioskClock.mutateAsync(token);
      toast.success(result.state === "clocked_out" ? "Clocked out." : "Clocked in.");
    } catch (error) {
      toast.error(apiErrorMessage(error));
    }
  }, [kioskClock]);

  useEffect(() => {
    if (isLoading || !today || !kioskToken || processedKioskToken.current === kioskToken) return;

    processedKioskToken.current = kioskToken;
    void handleScan(kioskToken).finally(() => router.replace(pathname, { scroll: false }));
  }, [handleScan, isLoading, kioskToken, pathname, router, today]);

  if (isLoading) {
    return <Skeleton className="h-20 w-full" />;
  }

  if (today?.self_clock_enabled === false && today?.kiosk_scanning_enabled === false) {
    return (
      <div className="flex items-center gap-3 rounded-xl border bg-card p-4 shadow-sm">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
          <Clock className="size-4" />
        </span>
        <p className="text-sm text-muted-foreground">
          Employee clock-in and QR kiosk scanning are disabled by your organisation. Ask HR how attendance is recorded.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="grid size-9 place-items-center rounded-lg bg-fruition-50 text-fruition-700">
          <Clock className="size-4" />
        </span>
        <div>
          {state === "not_clocked_in" && <p className="text-sm font-semibold">You haven&apos;t clocked in today.</p>}
          {state === "clocked_in" && (
            <p className="text-sm font-semibold">
              Clocked in at {today?.clock_in}
              {today?.status === "late" && <span className="ml-1.5 font-normal text-amber-700">· {today.late_minutes} min late</span>}
            </p>
          )}
          {state === "clocked_out" && today?.clock_in && today.clock_out && (
            <p className="text-sm font-semibold">
              Clocked out at {today.clock_out} · worked {workedDuration(today.clock_in, today.clock_out)}
            </p>
          )}
          {today?.kiosk && <p className="mt-0.5 text-xs text-muted-foreground">via {today.kiosk} kiosk</p>}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {state !== "clocked_out" && today?.kiosk_scanning_enabled !== false && (
          <Button variant="outline" onClick={() => setScanOpen(true)}>
            <QrCode className="size-4" />
            Scan QR
          </Button>
        )}
        {state === "not_clocked_in" && today?.self_clock_enabled !== false && (
          <Button onClick={() => void handleClockIn(kioskToken)} disabled={clockIn.isPending}>
            <Clock className="size-4" />
            Clock In
          </Button>
        )}
        {state === "clocked_in" && today?.self_clock_enabled !== false && (
          <Button variant="outline" onClick={() => void handleClockOut()} disabled={clockOut.isPending}>
            <Clock className="size-4" />
            Clock Out
          </Button>
        )}
      </div>

      <QrScanDialog open={scanOpen} onOpenChange={setScanOpen} onScan={handleScan} />
    </div>
  );
}

function AttendanceTab() {
  const [period, setPeriod] = useState(currentPeriod());
  const { data, isLoading } = useSelfAttendance(period);

  const totals = data?.summary;
  const dayRows = useMemo(
    () => Object.entries(data?.days ?? {}).sort(([a], [b]) => a.localeCompare(b)),
    [data?.days],
  );

  return (
    <div className="space-y-4">
      <Suspense fallback={<Skeleton className="h-20 w-full" />}>
        <ClockWidget />
      </Suspense>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-4 shadow-sm">
        <Button variant="outline" size="icon-sm" onClick={() => setPeriod(shiftPeriod(period, -1))} aria-label="Previous month">
          <ChevronLeft className="size-4" />
        </Button>
        <div className="min-w-32 text-center">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Period</p>
          <p className="text-sm font-semibold">{periodLabel(period)}</p>
        </div>
        <Button variant="outline" size="icon-sm" onClick={() => setPeriod(shiftPeriod(period, 1))} aria-label="Next month">
          <ChevronRight className="size-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setPeriod(currentPeriod())} disabled={period === currentPeriod()}>
          Today
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Present" value={totals?.days_present ?? 0} icon={CheckCircle2} tone="text-fruition-700 bg-fruition-50" />
        <StatTile label="Late" value={totals?.days_late ?? 0} icon={Clock} tone="text-amber-700 bg-amber-50" />
        <StatTile label="Absent" value={totals?.days_absent ?? 0} icon={UserX} tone="text-red-700 bg-red-50" />
        <StatTile label="On leave" value={totals?.days_on_leave ?? 0} icon={CalendarDays} tone="text-blue-700 bg-blue-50" />
      </div>

      <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
        {isLoading ? (
          <div className="space-y-2 p-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : dayRows.length ? (
          <div className="max-h-112 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted/50">
                <tr className="border-b text-left">
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Late</th>
                  <th className="px-4 py-3 font-medium">Overtime</th>
                </tr>
              </thead>
              <tbody>
                {dayRows.map(([date, day]) => (
                  <tr key={date} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-3">{formatDate(date)}</td>
                    <td className="px-4 py-3"><StatusBadge status={day.status} /></td>
                    <td className="px-4 py-3">{day.late_minutes} min</td>
                    <td className="px-4 py-3">{day.overtime_minutes} min</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-2">
            <EmptyState icon={Clock} title="No attendance data" description="Attendance records for this period will appear here once available." />
          </div>
        )}
      </section>
    </div>
  );
}

function PayslipsTab() {
  const { data, isLoading } = useSelfPayslips();

  return (
    <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
      {isLoading ? (
        <div className="space-y-2 p-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : data?.length ? (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="px-4 py-3 font-medium">Period</th>
              <th className="px-4 py-3 font-medium">Gross</th>
              <th className="px-4 py-3 font-medium">Deductions</th>
              <th className="px-4 py-3 font-medium">Net</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">PDF</th>
            </tr>
          </thead>
          <tbody>
            {data.map((payslip) => (
              <tr key={payslip.id} className="border-b last:border-0 hover:bg-muted/20">
                <td className="px-4 py-3">{payslip.period}</td>
                <td className="px-4 py-3"><MoneyText kobo={payslip.gross} /></td>
                <td className="px-4 py-3"><MoneyText kobo={payslip.total_deductions} /></td>
                <td className="px-4 py-3 font-medium"><MoneyText kobo={payslip.net} /></td>
                <td className="px-4 py-3"><StatusBadge status={payslip.status} /></td>
                <td className="px-4 py-3 text-right">
                  <Button type="button" variant="outline" size="sm" render={<a href={payslip.download_url} />}>
                    <Download className="size-4" />
                    Download
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="p-2">
          <EmptyState icon={Receipt} title="No payslips yet" description="Payslips will appear here after your first payroll run is processed." />
        </div>
      )}
    </section>
  );
}

export function SelfServiceProfilePage() {
  return (
    <div className="space-y-6">
      <PageHeader title="My profile" description="View your employee record and request updates to your details." />
      <ProfileTab />
    </div>
  );
}

export function SelfServiceLeavePage() {
  return (
    <div className="space-y-6">
      <PageHeader title="My leave" description="Apply for leave and track your balances and requests." />
      <LeaveTab />
    </div>
  );
}

export function SelfServiceAttendancePage() {
  return (
    <div className="space-y-6">
      <PageHeader title="My attendance" description="Check your daily attendance and monthly summary." />
      <AttendanceTab />
    </div>
  );
}

export function SelfServicePayslipsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="My payslips" description="View and download your payslips." />
      <PayslipsTab />
    </div>
  );
}
