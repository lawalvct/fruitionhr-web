"use client";

import { CalendarDays, Download, FileText, Send } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { MoneyText } from "@/components/money-text";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiErrorMessage } from "@/lib/api";
import {
  useApplySelfLeave,
  useProfileUpdateRequests,
  useSelfAttendance,
  useSelfLeaveBalances,
  useSelfLeaveRequests,
  useSelfLeaveTypes,
  useSelfPayslips,
  useSelfProfile,
  useSubmitProfileUpdate,
  type ProfileUpdateInput,
} from "@/features/self-service/use-self-service";

type TabId = "profile" | "leave" | "attendance" | "payslips";

const tabs: { id: TabId; label: string }[] = [
  { id: "profile", label: "Profile" },
  { id: "leave", label: "Leave" },
  { id: "attendance", label: "Attendance" },
  { id: "payslips", label: "Payslips" },
];

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-NG", { dateStyle: "medium" }).format(new Date(value));
}

function currentPeriod() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  const id = `ess-${label.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}

function ProfileTab() {
  const { data: profile, isLoading } = useSelfProfile();
  const { data: requests } = useProfileUpdateRequests();
  const submit = useSubmitProfileUpdate();

  const [form, setForm] = useState<ProfileUpdateInput>({});

  const values = {
    personal_email: form.personal_email ?? profile?.personal_email ?? "",
    phone: form.phone ?? profile?.phone ?? "",
    marital_status: form.marital_status ?? profile?.marital_status ?? "",
    address: form.address ?? profile?.address ?? "",
    city: form.city ?? profile?.city ?? "",
    state: form.state ?? profile?.state ?? "",
  };

  const submitUpdate = async (event: React.FormEvent) => {
    event.preventDefault();

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

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading profile...</p>;
  if (!profile) return <p className="text-sm text-muted-foreground">No employee profile is linked to your user account.</p>;

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_24rem]">
      <section className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>{profile.full_name}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">Employee number</dt>
                <dd className="font-medium">{profile.employee_number}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Status</dt>
                <dd>
                  <StatusBadge status={profile.employment_status} />
                </dd>
              </div>
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

        <form onSubmit={submitUpdate} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Personal email" type="email" value={values.personal_email} onChange={(value) => setForm((prev) => ({ ...prev, personal_email: value }))} />
            <Field label="Phone" value={values.phone} onChange={(value) => setForm((prev) => ({ ...prev, phone: value }))} />
            <Field label="Marital status" value={values.marital_status} onChange={(value) => setForm((prev) => ({ ...prev, marital_status: value }))} />
            <Field label="City" value={values.city} onChange={(value) => setForm((prev) => ({ ...prev, city: value }))} />
            <Field label="State" value={values.state} onChange={(value) => setForm((prev) => ({ ...prev, state: value }))} />
            <Field label="Address" value={values.address} onChange={(value) => setForm((prev) => ({ ...prev, address: value }))} />
          </div>
          <Button type="submit" disabled={submit.isPending}>
            <Send className="size-4" />
            Request update
          </Button>
        </form>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Update requests</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {requests?.length ? (
            requests.map((request) => (
              <div key={request.id} className="rounded-md border p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">{formatDate(request.submitted_at)}</span>
                  <StatusBadge status={request.status} />
                </div>
                <p className="text-xs text-muted-foreground">
                  {Object.keys(request.requested_values).join(", ")}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No profile update requests yet.</p>
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

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!leaveTypeId || !start || !end) {
      toast.error("Choose a leave type and date range.");
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
    <div className="grid gap-4 xl:grid-cols-[22rem_1fr]">
      <section className="space-y-4">
        <form onSubmit={submit} className="space-y-4 rounded-lg border p-4">
          <div className="grid gap-2">
            <Label htmlFor="ess-leave-type">Leave type</Label>
            <select
              id="ess-leave-type"
              className="h-8 rounded-md border bg-background px-2 text-sm"
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
          </div>
          <Field label="Start date" type="date" value={start} onChange={setStart} />
          <Field label="End date" type="date" value={end} onChange={setEnd} />
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
                  <span>{balance.remaining} day(s)</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No balances for {year} yet.</p>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="overflow-hidden rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-left">
            <tr>
              <th className="px-4 py-2 font-medium">Leave type</th>
              <th className="px-4 py-2 font-medium">Dates</th>
              <th className="px-4 py-2 font-medium">Days</th>
              <th className="px-4 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td className="px-4 py-6 text-muted-foreground" colSpan={4}>Loading leave requests...</td></tr>
            ) : requests?.length ? (
              requests.map((request) => (
                <tr key={request.id} className="border-t">
                  <td className="px-4 py-3">{request.leave_type?.name ?? "-"}</td>
                  <td className="px-4 py-3">{formatDate(request.start_date)} - {formatDate(request.end_date)}</td>
                  <td className="px-4 py-3">{request.days}</td>
                  <td className="px-4 py-3"><StatusBadge status={request.status} /></td>
                </tr>
              ))
            ) : (
              <tr><td className="px-4 py-6 text-muted-foreground" colSpan={4}>No leave requests yet.</td></tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function AttendanceTab() {
  const [period, setPeriod] = useState(currentPeriod());
  const { data, isLoading } = useSelfAttendance(period);

  const totals = data?.summary;
  const dayRows = useMemo(() => Object.entries(data?.days ?? {}).slice(0, 12), [data?.days]);

  return (
    <div className="space-y-4">
      <div className="flex max-w-xs items-end gap-2">
        <Field label="Period" type="month" value={period} onChange={setPeriod} />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Card size="sm"><CardContent>Present: <span className="font-semibold">{totals?.days_present ?? "-"}</span></CardContent></Card>
        <Card size="sm"><CardContent>Late: <span className="font-semibold">{totals?.days_late ?? "-"}</span></CardContent></Card>
        <Card size="sm"><CardContent>Absent: <span className="font-semibold">{totals?.days_absent ?? "-"}</span></CardContent></Card>
      </div>
      <section className="overflow-hidden rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-left">
            <tr>
              <th className="px-4 py-2 font-medium">Date</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">Late</th>
              <th className="px-4 py-2 font-medium">Overtime</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td className="px-4 py-6 text-muted-foreground" colSpan={4}>Loading attendance...</td></tr>
            ) : dayRows.length ? (
              dayRows.map(([date, day]) => (
                <tr key={date} className="border-t">
                  <td className="px-4 py-3">{formatDate(date)}</td>
                  <td className="px-4 py-3"><StatusBadge status={day.status} /></td>
                  <td className="px-4 py-3">{day.late_minutes} min</td>
                  <td className="px-4 py-3">{day.overtime_minutes} min</td>
                </tr>
              ))
            ) : (
              <tr><td className="px-4 py-6 text-muted-foreground" colSpan={4}>No attendance data.</td></tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function PayslipsTab() {
  const { data, isLoading } = useSelfPayslips();

  return (
    <section className="overflow-hidden rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-muted/60 text-left">
          <tr>
            <th className="px-4 py-2 font-medium">Period</th>
            <th className="px-4 py-2 font-medium">Gross</th>
            <th className="px-4 py-2 font-medium">Deductions</th>
            <th className="px-4 py-2 font-medium">Net</th>
            <th className="px-4 py-2 font-medium">Status</th>
            <th className="px-4 py-2 text-right font-medium">PDF</th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr><td className="px-4 py-6 text-muted-foreground" colSpan={6}>Loading payslips...</td></tr>
          ) : data?.length ? (
            data.map((payslip) => (
              <tr key={payslip.id} className="border-t">
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
            ))
          ) : (
            <tr><td className="px-4 py-6 text-muted-foreground" colSpan={6}>No payslips available yet.</td></tr>
          )}
        </tbody>
      </table>
    </section>
  );
}

export function SelfServicePage() {
  const [activeTab, setActiveTab] = useState<TabId>("profile");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Self-service"
        description="View your employee record, request updates, apply for leave, check attendance, and download payslips."
        actions={<FileText className="size-5 text-muted-foreground" />}
      />

      <div className="flex gap-1 overflow-x-auto border-b">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium ${
              activeTab === tab.id
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "profile" && <ProfileTab />}
      {activeTab === "leave" && <LeaveTab />}
      {activeTab === "attendance" && <AttendanceTab />}
      {activeTab === "payslips" && <PayslipsTab />}
    </div>
  );
}
