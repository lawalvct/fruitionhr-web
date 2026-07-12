"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Download, Eye, FileSpreadsheet, FileText, Pencil, Plus, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Can } from "@/components/can";
import { DataTable } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { Department } from "@/features/company/types";
import { useCompanyOptions } from "@/features/company/use-company";
import { employeeKeys, useEmployeePhoto } from "@/features/employees/use-employees";
import type { Employee } from "@/features/employees/types";
import { api } from "@/lib/api";

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function EmployeeListAvatar({ employee }: { employee: Employee }) {
  const { data: photoBlob } = useEmployeePhoto(employee.photo_url);
  const photoUrl = useMemo(() => (photoBlob ? URL.createObjectURL(photoBlob) : null), [photoBlob]);

  useEffect(() => () => {
    if (photoUrl) URL.revokeObjectURL(photoUrl);
  }, [photoUrl]);

  return (
    <Avatar className="size-9 ring-1 ring-border">
      {photoUrl && <AvatarImage src={photoUrl} alt={employee.full_name} />}
      <AvatarFallback className="text-xs">{initials(employee.full_name)}</AvatarFallback>
    </Avatar>
  );
}

export function EmployeesPage() {
  const [departmentId, setDepartmentId] = useState("");
  const [status, setStatus] = useState("");
  const [exporting, setExporting] = useState<"xlsx" | "pdf" | null>(null);
  const { departments } = useCompanyOptions();

  async function downloadExport(format: "xlsx" | "pdf") {
    setExporting(format);
    try {
      const { data } = await api.get(`/api/v1/employees/export.${format}`, {
        responseType: "blob",
        params: {
          ...(departmentId ? { "filter[department_id]": departmentId } : {}),
          ...(status ? { "filter[employment_status]": status } : {}),
        },
      });
      const url = URL.createObjectURL(data);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `employees.${format}`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast.error(`Employee ${format.toUpperCase()} export failed. Please try again.`);
    } finally {
      setExporting(null);
    }
  }

  const columns = useMemo<ColumnDef<Employee>[]>(
    () => [
      {
        id: "name",
        header: "Name",
        cell: ({ row }) => (
          <Link href={`/employees/${row.original.id}`} className="flex items-center gap-3 hover:underline">
            <EmployeeListAvatar employee={row.original} />
            <span>
              <span className="block font-medium">{row.original.full_name}</span>
              <span className="block text-xs text-muted-foreground">{row.original.official_email ?? row.original.personal_email}</span>
            </span>
          </Link>
        ),
      },
      { accessorKey: "employee_number", header: "Number" },
      {
        id: "department",
        header: "Department",
        cell: ({ row }) => row.original.current_assignment?.department?.name ?? "-",
      },
      {
        id: "position",
        header: "Position",
        cell: ({ row }) => row.original.current_assignment?.position?.title ?? "-",
      },
      {
        accessorKey: "employment_status",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.employment_status} />,
      },
      { accessorKey: "hired_at", header: "Hired" },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end gap-1">
            <Button variant="ghost" size="icon" title={`View ${row.original.full_name}`} aria-label={`View ${row.original.full_name}`} render={<Link href={`/employees/${row.original.id}`} />}>
              <Eye className="size-4" />
            </Button>
            <Can permission="employees.update">
              <Button variant="ghost" size="icon" title={`Edit ${row.original.full_name}`} aria-label={`Edit ${row.original.full_name}`} render={<Link href={`/employees/${row.original.id}/edit`} />}>
                <Pencil className="size-4" />
              </Button>
            </Can>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employees"
        description="Manage employee master records, current assignments, contacts, and statutory details."
        actions={
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="outline" size="sm" disabled={exporting !== null} onClick={() => void downloadExport("xlsx")} title="Download Excel export">
              <FileSpreadsheet className="size-4 text-emerald-600" />
              <span className="hidden sm:inline">Excel</span>
              {exporting === "xlsx" && <Download className="size-3.5 animate-bounce" />}
            </Button>
            <Button type="button" variant="outline" size="sm" disabled={exporting !== null} onClick={() => void downloadExport("pdf")} title="Download PDF export">
              <FileText className="size-4 text-rose-600" />
              <span className="hidden sm:inline">PDF</span>
              {exporting === "pdf" && <Download className="size-3.5 animate-bounce" />}
            </Button>
            <Can permission="employees.create">
              <Button render={<Link href="/employees/new" />}>
                <Plus className="size-4" />
                Add employee
              </Button>
            </Can>
          </div>
        }
      />

      <div className="flex flex-wrap gap-3">
        <select
          value={departmentId}
          onChange={(event) => setDepartmentId(event.target.value)}
          className="h-8 rounded-md border bg-background px-2 text-sm"
          aria-label="Department filter"
        >
          <option value="">All departments</option>
          {(departments.data as Department[] | undefined)?.map((department) => (
            <option key={department.id} value={department.id}>
              {department.name}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="h-8 rounded-md border bg-background px-2 text-sm"
          aria-label="Status filter"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="on_leave">On leave</option>
          <option value="suspended">Suspended</option>
          <option value="exited">Exited</option>
        </select>
      </div>

      <DataTable<Employee>
        columns={columns}
        endpoint="/api/v1/employees"
        queryKey={employeeKeys.all}
        filters={{
          department_id: departmentId,
          employment_status: status,
        }}
        emptyText="No employees match the current filters."
      />

      <div className="hidden items-center gap-2 text-sm text-muted-foreground empty:hidden">
        <Users className="size-4" />
      </div>
    </div>
  );
}
