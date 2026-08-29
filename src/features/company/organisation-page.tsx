"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { ColumnDef } from "@tanstack/react-table";
import {
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Edit,
  IdCard,
  Layers,
  Network,
  Plus,
  Settings2,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
import {
  get,
  useForm,
  type FieldErrors,
  type FieldValues,
  type Path,
  type UseFormRegister,
} from "react-hook-form";
import { z } from "zod";

import { Can } from "@/components/can";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { DataTable } from "@/components/data-table";
import { FormDialog } from "@/components/form-dialog";
import { MoneyText } from "@/components/money-text";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OnboardingPreferences } from "@/features/onboarding/onboarding-preferences";
import { PayrollSettingsCard } from "@/features/payroll/payroll-settings-card";
import { mapLaravelErrorsToForm, nullableNumber } from "@/lib/forms";
import { cn } from "@/lib/utils";
import type {
  Branch,
  CompanyResource,
  Department,
  EmploymentType,
  HolidayCalendar,
  JobGrade,
  Position,
} from "@/features/company/types";
import {
  companyKeys,
  useCompanyOptions,
  useCreateCompanyResource,
  useDeleteCompanyResource,
  useUpdateCompanyResource,
} from "@/features/company/use-company";

const tabGroups = ["Company structure", "Work setup", "Workspace"] as const;

const tabs = [
  { id: "branches", label: "Branches", hint: "Offices and work sites", group: "Company structure", icon: Building2 },
  { id: "departments", label: "Departments", hint: "Teams and reporting lines", group: "Company structure", icon: Network },
  { id: "positions", label: "Positions", hint: "Job titles per department", group: "Company structure", icon: BriefcaseBusiness },
  { id: "grades", label: "Job grades", hint: "Levels and salary bands", group: "Company structure", icon: Layers },
  { id: "employment-types", label: "Employment types", hint: "Full-time, contract, intern", group: "Work setup", icon: IdCard },
  { id: "holidays", label: "Holidays", hint: "Public holiday calendars", group: "Work setup", icon: CalendarDays },
  { id: "preferences", label: "Preferences", hint: "Company profile and defaults", group: "Workspace", icon: Settings2 },
  { id: "features", label: "Features", hint: "Optional payroll modules", group: "Workspace", icon: Sparkles },
] as const;

type TabId = (typeof tabs)[number]["id"];

function boolStatus(value: boolean) {
  return <StatusBadge status={value ? "active" : "draft"} />;
}

function RowActions<TRecord extends { id: number }>({
  record,
  onEdit,
  onDelete,
}: {
  record: TRecord;
  onEdit: (record: TRecord) => void;
  onDelete: (record: TRecord) => void;
}) {
  return (
    <Can permission="company.manage">
      <div className="flex justify-end gap-1">
        <Button type="button" variant="ghost" size="icon-sm" onClick={() => onEdit(record)} aria-label="Edit">
          <Edit className="size-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon-sm" onClick={() => onDelete(record)} aria-label="Delete">
          <Trash2 className="size-4" />
        </Button>
      </div>
    </Can>
  );
}

function Field<TValues extends FieldValues>({
  label,
  name,
  register,
  errors,
  type = "text",
}: {
  label: string;
  name: Path<TValues>;
  register: UseFormRegister<TValues>;
  errors: FieldErrors<TValues>;
  type?: string;
}) {
  const error = get(errors, name)?.message?.toString();

  return (
    <div className="grid gap-2">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        type={type}
        {...register(name, {
          setValueAs: type === "number" ? nullableNumber : undefined,
        })}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

function ActiveField<TValues extends FieldValues>({
  register,
}: {
  register: UseFormRegister<TValues>;
}) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        className="size-4 rounded border-border"
        {...register("is_active" as Path<TValues>)}
      />
      Active
    </label>
  );
}

function RootError({ message }: { message?: string }) {
  return message ? (
    <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{message}</p>
  ) : null;
}

const branchSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  is_active: z.boolean(),
});
type BranchFormValues = z.infer<typeof branchSchema>;
const branchFields = ["name", "code", "address", "city", "state", "is_active"] as const;

function BranchForm({
  formId,
  record,
  onSubmit,
}: {
  formId: string;
  record: Branch | null;
  onSubmit: (values: BranchFormValues) => Promise<unknown>;
}) {
  const form = useForm<BranchFormValues>({
    resolver: zodResolver(branchSchema),
    values: {
      name: record?.name ?? "",
      code: record?.code ?? "",
      address: record?.address ?? "",
      city: record?.city ?? "",
      state: record?.state ?? "",
      is_active: record?.is_active ?? true,
    },
  });

  return (
    <form
      id={formId}
      className="grid gap-4"
      onSubmit={form.handleSubmit(async (values) => {
        try {
          await onSubmit(values);
        } catch (error) {
          mapLaravelErrorsToForm(error, form.setError, branchFields);
        }
      })}
    >
      <RootError message={form.formState.errors.root?.message} />
      <Field label="Name" name="name" register={form.register} errors={form.formState.errors} />
      <Field label="Code" name="code" register={form.register} errors={form.formState.errors} />
      <Field label="Address" name="address" register={form.register} errors={form.formState.errors} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="City" name="city" register={form.register} errors={form.formState.errors} />
        <Field label="State" name="state" register={form.register} errors={form.formState.errors} />
      </div>
      <ActiveField register={form.register} />
    </form>
  );
}

const departmentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().optional(),
  branch_id: z.number().nullable(),
  parent_id: z.number().nullable(),
  is_active: z.boolean(),
});
type DepartmentFormValues = z.infer<typeof departmentSchema>;
const departmentFields = ["name", "code", "branch_id", "parent_id", "is_active"] as const;

function DepartmentForm({
  formId,
  record,
  branches,
  departments,
  onSubmit,
}: {
  formId: string;
  record: Department | null;
  branches: Branch[];
  departments: Department[];
  onSubmit: (values: DepartmentFormValues) => Promise<unknown>;
}) {
  const form = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentSchema),
    values: {
      name: record?.name ?? "",
      code: record?.code ?? "",
      branch_id: record?.branch_id ?? null,
      parent_id: record?.parent_id ?? null,
      is_active: record?.is_active ?? true,
    },
  });

  return (
    <form
      id={formId}
      className="grid gap-4"
      onSubmit={form.handleSubmit(async (values) => {
        try {
          await onSubmit(values);
        } catch (error) {
          mapLaravelErrorsToForm(error, form.setError, departmentFields);
        }
      })}
    >
      <RootError message={form.formState.errors.root?.message} />
      <Field label="Name" name="name" register={form.register} errors={form.formState.errors} />
      <Field label="Code" name="code" register={form.register} errors={form.formState.errors} />
      <SelectField label="Branch" name="branch_id" register={form.register} errors={form.formState.errors} options={branches} />
      <SelectField
        label="Parent department"
        name="parent_id"
        register={form.register}
        errors={form.formState.errors}
        options={departments.filter((department) => department.id !== record?.id)}
      />
      <ActiveField register={form.register} />
    </form>
  );
}

function SelectField<TValues extends FieldValues>({
  label,
  name,
  register,
  errors,
  options,
}: {
  label: string;
  name: Path<TValues>;
  register: UseFormRegister<TValues>;
  errors: FieldErrors<TValues>;
  options: { id: number; name: string }[];
}) {
  const error = get(errors, name)?.message?.toString();

  return (
    <div className="grid gap-2">
      <Label htmlFor={name}>{label}</Label>
      <select
        id={name}
        className="h-8 rounded-md border bg-background px-2 text-sm"
        {...register(name, { setValueAs: nullableNumber })}
      >
        <option value="">None</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

const gradeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().optional(),
  level: z.number().min(1, "Level is required"),
  min_salary: z.number().nullable(),
  max_salary: z.number().nullable(),
  is_active: z.boolean(),
});
type GradeFormValues = z.infer<typeof gradeSchema>;
const gradeFields = ["name", "code", "level", "min_salary", "max_salary", "is_active"] as const;

function GradeForm({
  formId,
  record,
  onSubmit,
}: {
  formId: string;
  record: JobGrade | null;
  onSubmit: (values: GradeFormValues) => Promise<unknown>;
}) {
  const form = useForm<GradeFormValues>({
    resolver: zodResolver(gradeSchema),
    values: {
      name: record?.name ?? "",
      code: record?.code ?? "",
      level: record?.level ?? 1,
      min_salary: record?.min_salary ?? null,
      max_salary: record?.max_salary ?? null,
      is_active: record?.is_active ?? true,
    },
  });

  return (
    <form
      id={formId}
      className="grid gap-4"
      onSubmit={form.handleSubmit(async (values) => {
        try {
          await onSubmit(values);
        } catch (error) {
          mapLaravelErrorsToForm(error, form.setError, gradeFields);
        }
      })}
    >
      <RootError message={form.formState.errors.root?.message} />
      <Field label="Name" name="name" register={form.register} errors={form.formState.errors} />
      <Field label="Code" name="code" register={form.register} errors={form.formState.errors} />
      <Field label="Level" name="level" type="number" register={form.register} errors={form.formState.errors} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Min salary" name="min_salary" type="number" register={form.register} errors={form.formState.errors} />
        <Field label="Max salary" name="max_salary" type="number" register={form.register} errors={form.formState.errors} />
      </div>
      <ActiveField register={form.register} />
    </form>
  );
}

const positionSchema = z.object({
  title: z.string().min(1, "Title is required"),
  code: z.string().optional(),
  department_id: z.number().nullable(),
  job_grade_id: z.number().nullable(),
  description: z.string().optional(),
  is_active: z.boolean(),
});
type PositionFormValues = z.infer<typeof positionSchema>;
const positionFields = ["title", "code", "department_id", "job_grade_id", "description", "is_active"] as const;

function PositionForm({
  formId,
  record,
  departments,
  jobGrades,
  onSubmit,
}: {
  formId: string;
  record: Position | null;
  departments: Department[];
  jobGrades: JobGrade[];
  onSubmit: (values: PositionFormValues) => Promise<unknown>;
}) {
  const form = useForm<PositionFormValues>({
    resolver: zodResolver(positionSchema),
    values: {
      title: record?.title ?? "",
      code: record?.code ?? "",
      department_id: record?.department_id ?? null,
      job_grade_id: record?.job_grade_id ?? null,
      description: record?.description ?? "",
      is_active: record?.is_active ?? true,
    },
  });

  return (
    <form
      id={formId}
      className="grid gap-4"
      onSubmit={form.handleSubmit(async (values) => {
        try {
          await onSubmit(values);
        } catch (error) {
          mapLaravelErrorsToForm(error, form.setError, positionFields);
        }
      })}
    >
      <RootError message={form.formState.errors.root?.message} />
      <Field label="Title" name="title" register={form.register} errors={form.formState.errors} />
      <Field label="Code" name="code" register={form.register} errors={form.formState.errors} />
      <SelectField label="Department" name="department_id" register={form.register} errors={form.formState.errors} options={departments} />
      <SelectField label="Job grade" name="job_grade_id" register={form.register} errors={form.formState.errors} options={jobGrades} />
      <Field label="Description" name="description" register={form.register} errors={form.formState.errors} />
      <ActiveField register={form.register} />
    </form>
  );
}

const employmentTypeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  is_active: z.boolean(),
});
type EmploymentTypeFormValues = z.infer<typeof employmentTypeSchema>;
const employmentTypeFields = ["name", "is_active"] as const;

function EmploymentTypeForm({
  formId,
  record,
  onSubmit,
}: {
  formId: string;
  record: EmploymentType | null;
  onSubmit: (values: EmploymentTypeFormValues) => Promise<unknown>;
}) {
  const form = useForm<EmploymentTypeFormValues>({
    resolver: zodResolver(employmentTypeSchema),
    values: { name: record?.name ?? "", is_active: record?.is_active ?? true },
  });

  return (
    <form
      id={formId}
      className="grid gap-4"
      onSubmit={form.handleSubmit(async (values) => {
        try {
          await onSubmit(values);
        } catch (error) {
          mapLaravelErrorsToForm(error, form.setError, employmentTypeFields);
        }
      })}
    >
      <RootError message={form.formState.errors.root?.message} />
      <Field label="Name" name="name" register={form.register} errors={form.formState.errors} />
      <ActiveField register={form.register} />
    </form>
  );
}

const holidaySchema = z.object({
  year: z.number().min(2000),
  name: z.string().min(1, "Name is required"),
  date: z.string().optional(),
  date_name: z.string().optional(),
  is_recurring: z.boolean(),
});
type HolidayFormValues = z.infer<typeof holidaySchema>;
const holidayFields = ["year", "name", "date", "date_name", "is_recurring"] as const;

function HolidayForm({
  formId,
  record,
  onSubmit,
}: {
  formId: string;
  record: HolidayCalendar | null;
  onSubmit: (values: { year: number; name: string; dates: { date: string; name: string; is_recurring: boolean }[] }) => Promise<unknown>;
}) {
  const firstDate = record?.dates?.[0];
  const form = useForm<HolidayFormValues>({
    resolver: zodResolver(holidaySchema),
    values: {
      year: record?.year ?? new Date().getFullYear(),
      name: record?.name ?? "",
      date: firstDate?.date ?? "",
      date_name: firstDate?.name ?? "",
      is_recurring: firstDate?.is_recurring ?? false,
    },
  });

  return (
    <form
      id={formId}
      className="grid gap-4"
      onSubmit={form.handleSubmit(async (values) => {
        try {
          await onSubmit({
            year: values.year,
            name: values.name,
            dates: values.date && values.date_name ? [{ date: values.date, name: values.date_name, is_recurring: values.is_recurring }] : [],
          });
        } catch (error) {
          mapLaravelErrorsToForm(error, form.setError, holidayFields);
        }
      })}
    >
      <RootError message={form.formState.errors.root?.message} />
      <Field label="Year" name="year" type="number" register={form.register} errors={form.formState.errors} />
      <Field label="Calendar name" name="name" register={form.register} errors={form.formState.errors} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Holiday date" name="date" type="date" register={form.register} errors={form.formState.errors} />
        <Field label="Holiday name" name="date_name" register={form.register} errors={form.formState.errors} />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" className="size-4 rounded border-border" {...form.register("is_recurring")} />
        Recurs every year
      </label>
    </form>
  );
}

function ResourceSection<TRecord extends CompanyResource, TInput>({
  title,
  description,
  addLabel,
  emptyText,
  endpoint,
  queryKey,
  columns,
  renderForm,
  getDeleteLabel,
}: {
  title: string;
  description: string;
  addLabel: string;
  emptyText: string;
  endpoint: string;
  queryKey: readonly unknown[];
  columns: (helpers: {
    onEdit: (record: TRecord) => void;
    onDelete: (record: TRecord) => void;
  }) => ColumnDef<TRecord>[];
  renderForm: (props: {
    formId: string;
    record: TRecord | null;
    onSubmit: (values: TInput) => Promise<unknown>;
  }) => ReactNode;
  getDeleteLabel: (record: TRecord) => string;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TRecord | null>(null);
  const [deleting, setDeleting] = useState<TRecord | null>(null);
  const createMutation = useCreateCompanyResource<TInput>(endpoint, queryKey);
  const updateMutation = useUpdateCompanyResource<TInput>(endpoint, queryKey);
  const deleteMutation = useDeleteCompanyResource(endpoint, queryKey);
  const formId = `${title.toLowerCase().replace(/\s+/g, "-")}-form`;

  const tableColumns = useMemo(
    () =>
      columns({
        onEdit: (record) => {
          setEditing(record);
          setOpen(true);
        },
        onDelete: setDeleting,
      }),
    [columns],
  );

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <>
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-lg">{title}</CardTitle>
          <CardDescription className="text-xs">{description}</CardDescription>
          <Can permission="company.manage">
            <CardAction>
              <Button
                type="button"
                onClick={() => {
                  setEditing(null);
                  setOpen(true);
                }}
              >
                <Plus className="size-4" />
                {addLabel}
              </Button>
            </CardAction>
          </Can>
        </CardHeader>
        <CardContent>
          <DataTable<TRecord>
            columns={tableColumns}
            endpoint={endpoint}
            queryKey={queryKey}
            emptyText={emptyText}
          />
        </CardContent>
      </Card>

      <FormDialog
        open={open}
        onOpenChange={setOpen}
        title={editing ? `Edit ${title.toLowerCase()}` : addLabel}
        formId={formId}
        isPending={isPending}
      >
        {renderForm({
          formId,
          record: editing,
          onSubmit: async (values) => {
            if (editing) {
              await updateMutation.mutateAsync({ id: editing.id, input: values });
            } else {
              await createMutation.mutateAsync(values);
            }
            setOpen(false);
            setEditing(null);
          },
        })}
      </FormDialog>

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(value) => !value && setDeleting(null)}
        description={deleting ? `Delete ${getDeleteLabel(deleting)}? This cannot be undone.` : ""}
        isPending={deleteMutation.isPending}
        onConfirm={async () => {
          if (!deleting) return;
          await deleteMutation.mutateAsync(deleting.id);
          setDeleting(null);
        }}
      />
    </>
  );
}

export function OrganisationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const activeTab: TabId = tabs.some((tab) => tab.id === requestedTab)
    ? requestedTab as TabId
    : "branches";
  const options = useCompanyOptions();

  function selectTab(id: TabId) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", id);
    router.replace(`/settings/organisation?${params.toString()}`, { scroll: false });
  }

  const branches = options.branches.data ?? [];
  const departments = options.departments.data ?? [];
  const jobGrades = options.jobGrades.data ?? [];

  const branchColumns = useMemo(
    () =>
      ({ onEdit, onDelete }: { onEdit: (record: Branch) => void; onDelete: (record: Branch) => void }): ColumnDef<Branch>[] => [
        { accessorKey: "name", header: "Name" },
        { accessorKey: "code", header: "Code" },
        { accessorKey: "city", header: "City" },
        { accessorKey: "state", header: "State" },
        { id: "status", header: "Status", cell: ({ row }) => boolStatus(row.original.is_active) },
        { id: "actions", enableSorting: false, cell: ({ row }) => <RowActions record={row.original} onEdit={onEdit} onDelete={onDelete} /> },
      ],
    [],
  );

  const departmentColumns = useMemo(
    () =>
      ({ onEdit, onDelete }: { onEdit: (record: Department) => void; onDelete: (record: Department) => void }): ColumnDef<Department>[] => [
        { accessorKey: "name", header: "Name" },
        { accessorKey: "code", header: "Code" },
        { id: "branch", header: "Branch", cell: ({ row }) => row.original.branch?.name ?? "-" },
        { id: "parent", header: "Parent", cell: ({ row }) => row.original.parent?.name ?? "-" },
        { id: "status", header: "Status", cell: ({ row }) => boolStatus(row.original.is_active) },
        { id: "actions", enableSorting: false, cell: ({ row }) => <RowActions record={row.original} onEdit={onEdit} onDelete={onDelete} /> },
      ],
    [],
  );

  const positionColumns = useMemo(
    () =>
      ({ onEdit, onDelete }: { onEdit: (record: Position) => void; onDelete: (record: Position) => void }): ColumnDef<Position>[] => [
        { accessorKey: "title", header: "Title" },
        { accessorKey: "code", header: "Code" },
        { id: "department", header: "Department", cell: ({ row }) => row.original.department?.name ?? "-" },
        { id: "job_grade", header: "Grade", cell: ({ row }) => row.original.job_grade?.name ?? "-" },
        { id: "status", header: "Status", cell: ({ row }) => boolStatus(row.original.is_active) },
        { id: "actions", enableSorting: false, cell: ({ row }) => <RowActions record={row.original} onEdit={onEdit} onDelete={onDelete} /> },
      ],
    [],
  );

  const gradeColumns = useMemo(
    () =>
      ({ onEdit, onDelete }: { onEdit: (record: JobGrade) => void; onDelete: (record: JobGrade) => void }): ColumnDef<JobGrade>[] => [
        { accessorKey: "name", header: "Name" },
        { accessorKey: "code", header: "Code" },
        { accessorKey: "level", header: "Level" },
        { id: "min_salary", header: "Min salary", cell: ({ row }) => <MoneyText kobo={row.original.min_salary} /> },
        { id: "max_salary", header: "Max salary", cell: ({ row }) => <MoneyText kobo={row.original.max_salary} /> },
        { id: "status", header: "Status", cell: ({ row }) => boolStatus(row.original.is_active) },
        { id: "actions", enableSorting: false, cell: ({ row }) => <RowActions record={row.original} onEdit={onEdit} onDelete={onDelete} /> },
      ],
    [],
  );

  const employmentColumns = useMemo(
    () =>
      ({ onEdit, onDelete }: { onEdit: (record: EmploymentType) => void; onDelete: (record: EmploymentType) => void }): ColumnDef<EmploymentType>[] => [
        { accessorKey: "name", header: "Name" },
        { id: "status", header: "Status", cell: ({ row }) => boolStatus(row.original.is_active) },
        { id: "actions", enableSorting: false, cell: ({ row }) => <RowActions record={row.original} onEdit={onEdit} onDelete={onDelete} /> },
      ],
    [],
  );

  const holidayColumns = useMemo(
    () =>
      ({ onEdit, onDelete }: { onEdit: (record: HolidayCalendar) => void; onDelete: (record: HolidayCalendar) => void }): ColumnDef<HolidayCalendar>[] => [
        { accessorKey: "name", header: "Name" },
        { accessorKey: "year", header: "Year" },
        { id: "dates", header: "Dates", cell: ({ row }) => row.original.dates?.length ?? 0 },
        { id: "actions", enableSorting: false, cell: ({ row }) => <RowActions record={row.original} onEdit={onEdit} onDelete={onDelete} /> },
      ],
    [],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Organisation settings"
        description="Manage company structure, work defaults, and the master data used across employee records, attendance, leave, and payroll."
      />

      <div className="grid gap-5 lg:grid-cols-[248px_minmax(0,1fr)] lg:items-start">
        <nav aria-label="Settings sections">
          {/* Compact scroller on small screens */}
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 lg:hidden">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                aria-current={activeTab === tab.id ? "page" : undefined}
                onClick={() => selectTab(tab.id)}
                className={cn(
                  "inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-3 py-2 text-sm font-medium transition-colors",
                  activeTab === tab.id
                    ? "border-fruition-300 bg-fruition-50 text-fruition-900"
                    : "border-border bg-card text-muted-foreground hover:text-foreground",
                )}
              >
                <tab.icon className="size-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Grouped rail on desktop */}
          <div className="hidden space-y-5 lg:block">
            {tabGroups.map((group) => (
              <div key={group}>
                <p className="px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{group}</p>
                <div className="mt-2 space-y-1">
                  {tabs
                    .filter((tab) => tab.group === group)
                    .map((tab) => {
                      const isActive = activeTab === tab.id;

                      return (
                        <button
                          key={tab.id}
                          type="button"
                          aria-current={isActive ? "page" : undefined}
                          onClick={() => selectTab(tab.id)}
                          className={cn(
                            "flex w-full items-start gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors",
                            isActive
                              ? "border-fruition-300 bg-fruition-50/70"
                              : "border-transparent hover:bg-muted/60",
                          )}
                        >
                          <tab.icon
                            className={cn(
                              "mt-0.5 size-4 shrink-0",
                              isActive ? "text-fruition-700" : "text-muted-foreground",
                            )}
                          />
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium">{tab.label}</span>
                            <span className="block truncate text-xs text-muted-foreground">{tab.hint}</span>
                          </span>
                        </button>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
        </nav>

        <div className="min-w-0 space-y-6">
          {activeTab === "branches" && (
            <ResourceSection<Branch, BranchFormValues>
              title="Branches"
              description="Physical offices and sites employees are assigned to."
              emptyText="No branches yet. Add your first office or site."
              addLabel="Add branch"
              endpoint="/api/v1/branches"
              queryKey={companyKeys.branches}
              columns={branchColumns}
              getDeleteLabel={(record) => record.name}
              renderForm={({ formId, record, onSubmit }) => <BranchForm formId={formId} record={record} onSubmit={onSubmit} />}
            />
          )}

          {activeTab === "departments" && (
            <ResourceSection<Department, DepartmentFormValues>
              title="Departments"
              description="Teams inside the company. A department can sit under a parent department."
              emptyText="No departments yet. Add one to group your teams."
              addLabel="Add department"
              endpoint="/api/v1/departments"
              queryKey={companyKeys.departments}
              columns={departmentColumns}
              getDeleteLabel={(record) => record.name}
              renderForm={({ formId, record, onSubmit }) => (
                <DepartmentForm formId={formId} record={record} branches={branches} departments={departments} onSubmit={onSubmit} />
              )}
            />
          )}

          {activeTab === "positions" && (
            <ResourceSection<Position, PositionFormValues>
              title="Positions"
              description="Job titles employees hold, each tied to a department and grade."
              emptyText="No positions yet. Add the job titles your teams hire for."
              addLabel="Add position"
              endpoint="/api/v1/positions"
              queryKey={companyKeys.positions}
              columns={positionColumns}
              getDeleteLabel={(record) => record.title}
              renderForm={({ formId, record, onSubmit }) => (
                <PositionForm formId={formId} record={record} departments={departments} jobGrades={jobGrades} onSubmit={onSubmit} />
              )}
            />
          )}

          {activeTab === "grades" && (
            <ResourceSection<JobGrade, GradeFormValues>
              title="Job grades"
              description="Levels and salary bands used to place positions on a pay scale."
              emptyText="No job grades yet. Add a grade to define a salary band."
              addLabel="Add grade"
              endpoint="/api/v1/job-grades"
              queryKey={companyKeys.jobGrades}
              columns={gradeColumns}
              getDeleteLabel={(record) => record.name}
              renderForm={({ formId, record, onSubmit }) => <GradeForm formId={formId} record={record} onSubmit={onSubmit} />}
            />
          )}

          {activeTab === "employment-types" && (
            <ResourceSection<EmploymentType, EmploymentTypeFormValues>
              title="Employment types"
              description="Contract categories applied to employee records, such as full-time or contract."
              emptyText="No employment types yet. Add one to categorise contracts."
              addLabel="Add type"
              endpoint="/api/v1/employment-types"
              queryKey={companyKeys.employmentTypes}
              columns={employmentColumns}
              getDeleteLabel={(record) => record.name}
              renderForm={({ formId, record, onSubmit }) => <EmploymentTypeForm formId={formId} record={record} onSubmit={onSubmit} />}
            />
          )}

          {activeTab === "holidays" && (
            <ResourceSection<HolidayCalendar, { year: number; name: string; dates: { date: string; name: string; is_recurring: boolean }[] }>
              title="Holiday calendars"
              description="Public holidays that attendance and leave calculations skip over."
              emptyText="No holiday calendars yet. Add one for the current year."
              addLabel="Add calendar"
              endpoint="/api/v1/holiday-calendars"
              queryKey={companyKeys.holidayCalendars}
              columns={holidayColumns}
              getDeleteLabel={(record) => record.name}
              renderForm={({ formId, record, onSubmit }) => <HolidayForm formId={formId} record={record} onSubmit={onSubmit} />}
            />
          )}

          {activeTab === "preferences" && <OnboardingPreferences />}
          {activeTab === "features" && <PayrollSettingsCard />}
        </div>
      </div>
    </div>
  );
}
