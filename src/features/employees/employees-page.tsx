"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Plus, Users } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { Can } from "@/components/can";
import { DataTable } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { Department } from "@/features/company/types";
import { useCompanyOptions } from "@/features/company/use-company";
import { employeeKeys } from "@/features/employees/use-employees";
import type { Employee } from "@/features/employees/types";

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function EmployeesPage() {
  const [departmentId, setDepartmentId] = useState("");
  const [status, setStatus] = useState("");
  const { departments } = useCompanyOptions();

  const columns = useMemo<ColumnDef<Employee>[]>(
    () => [
      {
        id: "name",
        header: "Name",
        cell: ({ row }) => (
          <Link href={`/employees/${row.original.id}`} className="flex items-center gap-3 hover:underline">
            <Avatar className="size-8">
              <AvatarFallback className="text-xs">{initials(row.original.full_name)}</AvatarFallback>
            </Avatar>
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
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employees"
        description="Manage employee master records, current assignments, contacts, and statutory details."
        actions={
          <Can permission="employees.create">
            <Button render={<Link href="/employees/new" />}>
              <Plus className="size-4" />
              Add employee
            </Button>
          </Can>
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
