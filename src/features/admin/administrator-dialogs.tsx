"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm, useWatch, type FieldErrors, type Path, type UseFormRegister } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { FormDialog } from "@/components/form-dialog";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { mapLaravelErrorsToForm } from "@/lib/forms";
import type { PlatformAdministrator } from "./types";
import { RoleSelect } from "./role-select";
import { useCreateAdministrator, usePlatformRoles, useUpdateAdministrator } from "./use-admin";

const baseFields = {
  name: z.string().trim().min(2, "Enter the administrator's name").max(255),
  email: z.email("Enter a valid email address"),
  phone: z.string().trim().max(30).optional(),
  timezone: z.string().trim().max(80).optional(),
};

const createSchema = z
  .object({
    ...baseFields,
    platform_role_id: z.number().int().positive("Choose what this administrator can access"),
    password: z.string().min(8, "Use at least 8 characters"),
    password_confirmation: z.string().min(1, "Confirm the password"),
  })
  .refine((values) => values.password === values.password_confirmation, {
    path: ["password_confirmation"],
    message: "Passwords do not match",
  });

const editSchema = z.object({
  ...baseFields,
  platform_role_id: z.number().int().positive("Choose what this administrator can access"),
});

type CreateValues = z.infer<typeof createSchema>;
type EditValues = z.infer<typeof editSchema>;

const createFields = ["name", "email", "phone", "timezone", "platform_role_id", "password", "password_confirmation"] as const;
const editFields = ["name", "email", "phone", "timezone", "platform_role_id"] as const;

const TIMEZONES: string[] =
  typeof Intl !== "undefined" && "supportedValuesOf" in Intl
    ? (Intl as unknown as { supportedValuesOf: (key: string) => string[] }).supportedValuesOf("timeZone")
    : ["Africa/Lagos", "UTC"];

function Field<TValues extends CreateValues | EditValues>({
  label,
  name,
  type = "text",
  autoComplete,
  register,
  errors,
}: {
  label: string;
  name: Path<TValues>;
  type?: string;
  autoComplete?: string;
  register: UseFormRegister<TValues>;
  errors: FieldErrors<TValues>;
}) {
  const error = (errors as FieldErrors)[name]?.message?.toString();
  return (
    <div className="space-y-1.5">
      <Label htmlFor={`administrator-${name}`}>{label}</Label>
      {/*
        Password fields get the show/hide toggle — the admin is typing a
        temporary password they then read back and share, so seeing it matters.
      */}
      {type === "password" ? (
        <PasswordInput
          id={`administrator-${name}`}
          autoComplete={autoComplete}
          {...register(name)}
        />
      ) : (
        <Input
          id={`administrator-${name}`}
          type={type}
          autoComplete={autoComplete}
          {...register(name)}
        />
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

function TimezoneField<TValues extends CreateValues | EditValues>({
  register,
  errors,
}: {
  register: UseFormRegister<TValues>;
  errors: FieldErrors<TValues>;
}) {
  const name = "timezone" as Path<TValues>;
  const error = (errors as FieldErrors)[name]?.message?.toString();
  return (
    <div className="space-y-1.5">
      <Label htmlFor="administrator-timezone">Timezone</Label>
      <select
        id="administrator-timezone"
        className="h-8 w-full rounded-lg border border-input bg-white px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20"
        {...register(name)}
      >
        <option value="">Use platform default</option>
        {TIMEZONES.map((timezone) => <option key={timezone} value={timezone}>{timezone}</option>)}
      </select>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function CreateAdministratorDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const createAdministrator = useCreateAdministrator();
  const form = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      timezone: "Africa/Lagos",
      platform_role_id: 0,
      password: "",
      password_confirmation: "",
    },
  });
  const roles = usePlatformRoles(open);
  const roleId = useWatch({ control: form.control, name: "platform_role_id" });

  useEffect(() => {
    if (!open) form.reset();
  }, [form, open]);

  const submit = form.handleSubmit(async (values) => {
    try {
      await createAdministrator.mutateAsync({
        name: values.name.trim(),
        email: values.email.trim(),
        phone: values.phone?.trim() || null,
        timezone: values.timezone || null,
        platform_role_id: values.platform_role_id,
        password: values.password,
        password_confirmation: values.password_confirmation,
      });
      toast.success("Administrator created. They can sign in right away.");
      onOpenChange(false);
    } catch (error) {
      mapLaravelErrorsToForm(error, form.setError, createFields);
    }
  });

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Add platform administrator"
      description="Choose what they can reach. They can sign in as soon as you save."
      formId="create-platform-administrator"
      isPending={createAdministrator.isPending}
      submitLabel="Create administrator"
      pendingLabel="Creating..."
    >
      <form id="create-platform-administrator" onSubmit={submit} className="space-y-4 py-4">
        {form.formState.errors.root?.message && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{form.formState.errors.root.message}</p>
        )}
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">
          Administrators work across every company on the platform. Give each person the narrowest access that lets them do their job.
        </div>
        <Field label="Full name" name="name" autoComplete="name" register={form.register} errors={form.formState.errors} />
        <Field label="Email" name="email" type="email" autoComplete="email" register={form.register} errors={form.formState.errors} />
        <Field label="Phone" name="phone" type="tel" autoComplete="tel" register={form.register} errors={form.formState.errors} />
        <TimezoneField register={form.register} errors={form.formState.errors} />
        <RoleSelect
          roles={roles.data?.roles ?? []}
          isPending={roles.isPending}
          value={roleId}
          onChange={(id) => form.setValue("platform_role_id", id, { shouldValidate: true })}
          error={form.formState.errors.platform_role_id?.message}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Temporary password" name="password" type="password" autoComplete="new-password" register={form.register} errors={form.formState.errors} />
          <Field label="Confirm password" name="password_confirmation" type="password" autoComplete="new-password" register={form.register} errors={form.formState.errors} />
        </div>
        <p className="text-xs leading-5 text-slate-500">Share the temporary password securely — it is all they need to sign in. Ask them to change it after their first login.</p>
      </form>
    </FormDialog>
  );
}

export function EditAdministratorDialog({
  administrator,
  onOpenChange,
}: {
  administrator: PlatformAdministrator | null;
  onOpenChange: (open: boolean) => void;
}) {
  if (!administrator) return null;
  return (
    <EditAdministratorDialogContent
      key={administrator.id}
      administrator={administrator}
      onOpenChange={onOpenChange}
    />
  );
}

function EditAdministratorDialogContent({
  administrator,
  onOpenChange,
}: {
  administrator: PlatformAdministrator;
  onOpenChange: (open: boolean) => void;
}) {
  const updateAdministrator = useUpdateAdministrator(administrator.id);
  const form = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      name: administrator.name,
      email: administrator.email,
      phone: administrator.phone ?? "",
      timezone: administrator.timezone ?? "",
      platform_role_id: administrator.platform_role?.id ?? 0,
    },
  });
  const roles = usePlatformRoles();
  const roleId = useWatch({ control: form.control, name: "platform_role_id" });

  const submit = form.handleSubmit(async (values) => {
    try {
      await updateAdministrator.mutateAsync({
        name: values.name.trim(),
        email: values.email.trim(),
        phone: values.phone?.trim() || null,
        timezone: values.timezone || null,
        platform_role_id: values.platform_role_id,
      });
      toast.success(`${values.name.trim()}'s details were updated.`);
      onOpenChange(false);
    } catch (error) {
      mapLaravelErrorsToForm(error, form.setError, editFields);
    }
  });

  return (
    <FormDialog
      open
      onOpenChange={onOpenChange}
      title={`Edit ${administrator.name}`}
      description="Update their details, or change what they can reach."
      formId="edit-platform-administrator"
      isPending={updateAdministrator.isPending}
      submitLabel="Save changes"
    >
      <form id="edit-platform-administrator" onSubmit={submit} className="space-y-4 py-4">
        {form.formState.errors.root?.message && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{form.formState.errors.root.message}</p>
        )}
        <Field label="Full name" name="name" autoComplete="name" register={form.register} errors={form.formState.errors} />
        <Field label="Email" name="email" type="email" autoComplete="email" register={form.register} errors={form.formState.errors} />
        <Field label="Phone" name="phone" type="tel" autoComplete="tel" register={form.register} errors={form.formState.errors} />
        <TimezoneField register={form.register} errors={form.formState.errors} />
        <RoleSelect
          roles={roles.data?.roles ?? []}
          isPending={roles.isPending}
          value={roleId}
          onChange={(id) => form.setValue("platform_role_id", id, { shouldValidate: true })}
          error={form.formState.errors.platform_role_id?.message}
        />
      </form>
    </FormDialog>
  );
}
