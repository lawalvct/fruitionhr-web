"use client";

import {
  Check,
  KeyRound,
  LockKeyhole,
  Plus,
  Search,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  UserCog,
  Users,
} from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { FormDialog } from "@/components/form-dialog";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useMe } from "@/features/auth/use-auth";
import { apiErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { AccessRole, AccessUser, PermissionGroup } from "./types";
import {
  useAccessRoles,
  useAccessUsers,
  useCreateAccessRole,
  useDeleteAccessRole,
  usePermissionGroups,
  useSyncUserRoles,
  useUpdateAccessRole,
} from "./use-access";

type AccessTab = "roles" | "users";

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: number;
  detail: string;
  icon: typeof ShieldCheck;
}) {
  return (
    <Card size="sm">
      <CardContent className="flex items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-fruition-50 text-fruition-700">
          <Icon className="size-4.5" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="mt-0.5 text-xl font-semibold text-foreground">{value}</p>
          <p className="truncate text-xs text-muted-foreground">{detail}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function PermissionChecklist({
  groups,
  selected,
  onToggle,
  disabled = false,
  idPrefix,
}: {
  groups: PermissionGroup[];
  selected: string[];
  onToggle: (permission: string) => void;
  disabled?: boolean;
  idPrefix: string;
}) {
  const selectedSet = useMemo(() => new Set(selected), [selected]);

  return (
    <div className="grid gap-3 xl:grid-cols-2">
      {groups.map((group) => {
        const enabledCount = group.permissions.filter((permission) => selectedSet.has(permission.name)).length;

        return (
          <fieldset key={group.module} className="rounded-xl border border-border bg-background p-3.5">
            <legend className="sr-only">{group.label}</legend>
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="font-heading text-sm font-semibold">{group.label}</p>
              <span className="text-xs text-muted-foreground">
                {enabledCount}/{group.permissions.length}
              </span>
            </div>
            <div className="space-y-1.5">
              {group.permissions.map((permission) => {
                const checked = selectedSet.has(permission.name);
                const inputId = `${idPrefix}-${permission.name.replaceAll(".", "-")}`;

                return (
                  <label
                    key={permission.name}
                    htmlFor={inputId}
                    className={cn(
                      "flex min-h-9 cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
                      checked ? "bg-fruition-50 text-fruition-900" : "hover:bg-muted/70",
                      disabled && "cursor-default opacity-75",
                    )}
                  >
                    <input
                      id={inputId}
                      type="checkbox"
                      checked={checked}
                      disabled={disabled}
                      onChange={() => onToggle(permission.name)}
                      className="size-4 rounded border-border accent-fruition-700"
                    />
                    <span className="min-w-0 flex-1">{permission.label}</span>
                    {checked && <Check className="size-3.5 shrink-0 text-fruition-700" />}
                  </label>
                );
              })}
            </div>
          </fieldset>
        );
      })}
    </div>
  );
}

function NewRoleDialog({
  open,
  onOpenChange,
  groups,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groups: PermissionGroup[];
  onCreated: (role: AccessRole) => void;
}) {
  const createRole = useCreateAccessRole();
  const [name, setName] = useState("");
  const [permissions, setPermissions] = useState<string[]>([]);

  const toggle = (permission: string) => {
    setPermissions((current) =>
      current.includes(permission) ? current.filter((item) => item !== permission) : [...current, permission],
    );
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) {
      toast.error("Enter a role name.");
      return;
    }

    try {
      const role = await createRole.mutateAsync({ name: name.trim(), permissions });
      toast.success(`${role.label} role created.`);
      onOpenChange(false);
      onCreated(role);
    } catch (error) {
      toast.error(apiErrorMessage(error));
    }
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Create a role"
      description="Give this role only the access its users need. You can adjust it later."
      formId="new-access-role-form"
      isPending={createRole.isPending}
    >
      <form id="new-access-role-form" onSubmit={submit} className="space-y-5 py-4">
        <div className="space-y-1.5">
          <label htmlFor="new-role-name" className="text-sm font-medium">
            Role name
          </label>
          <Input
            id="new-role-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Payroll auditor"
            autoFocus
          />
          <p className="text-xs text-muted-foreground">Use a name that clearly describes the person&apos;s responsibility.</p>
        </div>
        <div>
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-sm font-medium">Permissions</p>
            <span className="text-xs text-muted-foreground">{permissions.length} selected</span>
          </div>
          <PermissionChecklist
            groups={groups}
            selected={permissions}
            onToggle={toggle}
            idPrefix="new-role"
          />
        </div>
      </form>
    </FormDialog>
  );
}

function UserRolesDialog({
  user,
  roles,
  onOpenChange,
}: {
  user: AccessUser | null;
  roles: AccessRole[];
  onOpenChange: (open: boolean) => void;
}) {
  if (!user) return null;

  return <UserRolesDialogContent key={user.id} user={user} roles={roles} onOpenChange={onOpenChange} />;
}

function UserRolesDialogContent({
  user,
  roles,
  onOpenChange,
}: {
  user: AccessUser;
  roles: AccessRole[];
  onOpenChange: (open: boolean) => void;
}) {
  const syncRoles = useSyncUserRoles();
  const [roleIds, setRoleIds] = useState<number[]>(() => user.roles.map((role) => role.id));

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (roleIds.length === 0) {
      toast.error("Select at least one role.");
      return;
    }

    try {
      await syncRoles.mutateAsync({ userId: user.id, roleIds });
      toast.success(`${user.name}'s access updated.`);
      onOpenChange(false);
    } catch (error) {
      toast.error(apiErrorMessage(error));
    }
  };

  return (
    <FormDialog
      open
      onOpenChange={onOpenChange}
      title={`Manage ${user.name}`}
      description="Roles combine permissions. A user receives the permissions from every selected role."
      formId="manage-user-roles-form"
      isPending={syncRoles.isPending}
    >
      <form id="manage-user-roles-form" onSubmit={submit} className="space-y-3 py-4">
        {roles.map((role) => {
          const checked = roleIds.includes(role.id);
          return (
            <label
              key={role.id}
              className={cn(
                "flex cursor-pointer gap-3 rounded-xl border p-3.5 transition-colors",
                checked ? "border-fruition-300 bg-fruition-50/70" : "border-border hover:bg-muted/50",
              )}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() =>
                  setRoleIds((current) =>
                    current.includes(role.id) ? current.filter((id) => id !== role.id) : [...current, role.id],
                  )
                }
                className="mt-0.5 size-4 accent-fruition-700"
              />
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{role.label}</span>
                  {role.is_system && <Badge variant="outline">Built-in</Badge>}
                </span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  {role.permissions.length} permission{role.permissions.length === 1 ? "" : "s"}
                </span>
              </span>
            </label>
          );
        })}
      </form>
    </FormDialog>
  );
}

function LoadingState() {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="h-24 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
      <div className="h-96 animate-pulse rounded-xl bg-muted" />
    </div>
  );
}

function RoleEditor({
  role,
  groups,
  onDelete,
}: {
  role: AccessRole;
  groups: PermissionGroup[];
  onDelete: (role: AccessRole) => void;
}) {
  const updateRole = useUpdateAccessRole();
  const [name, setName] = useState(role.label);
  const [permissions, setPermissions] = useState<string[]>(role.permissions);

  const permissionsChanged =
    permissions.length !== role.permissions.length ||
    permissions.some((permission) => !role.permissions.includes(permission));
  const nameChanged = name.trim().toLowerCase() !== role.label.toLowerCase();

  const togglePermission = (permission: string) => {
    setPermissions((current) =>
      current.includes(permission) ? current.filter((item) => item !== permission) : [...current, permission],
    );
  };

  const save = async () => {
    if (!name.trim()) {
      toast.error("Enter a role name.");
      return;
    }

    try {
      await updateRole.mutateAsync({
        id: role.id,
        input: { name: name.trim(), permissions },
      });
      toast.success(`${name.trim()} permissions saved.`);
    } catch (error) {
      toast.error(apiErrorMessage(error));
    }
  };

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {role.is_system ? <Badge variant="outline">Built-in role</Badge> : <Badge variant="secondary">Custom role</Badge>}
              <span className="text-xs text-muted-foreground">{permissions.length} permissions selected</span>
            </div>
            <Input
              aria-label="Role name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              disabled={role.is_system}
              className="mt-2 max-w-sm font-heading text-base font-semibold"
            />
          </div>
          <div className="flex shrink-0 gap-2">
            {!role.is_system && (
              <Button type="button" variant="destructive" onClick={() => onDelete(role)}>
                <Trash2 className="size-4" />
                Delete
              </Button>
            )}
            {!role.is_owner && (
              <Button
                type="button"
                onClick={save}
                disabled={updateRole.isPending || (!permissionsChanged && !nameChanged)}
              >
                {updateRole.isPending ? "Saving..." : "Save changes"}
              </Button>
            )}
          </div>
        </div>
        {role.is_owner ? (
          <div className="mt-3 flex gap-2 rounded-lg border border-fruition-200 bg-fruition-50 p-3 text-xs text-fruition-900">
            <LockKeyhole className="mt-0.5 size-3.5 shrink-0" />
            Owner access is protected and always includes every permission.
          </div>
        ) : role.is_system ? (
          <p className="mt-2 text-xs text-muted-foreground">
            The role name is fixed because FruitionHR workflows use it, but you can adjust its permissions.
          </p>
        ) : null}
      </CardHeader>
      <CardContent className="pt-4">
        <PermissionChecklist
          groups={groups}
          selected={permissions}
          onToggle={togglePermission}
          disabled={role.is_owner}
          idPrefix={`edit-role-${role.id}`}
        />
      </CardContent>
    </Card>
  );
}

export function AccessControlPage() {
  const { data: me, isLoading: meLoading } = useMe();
  const canManage = me?.permissions?.includes("roles.manage") ?? false;
  const rolesQuery = useAccessRoles(canManage);
  const permissionsQuery = usePermissionGroups(canManage);
  const usersQuery = useAccessUsers(canManage);
  const deleteRole = useDeleteAccessRole();

  const roles = useMemo(() => rolesQuery.data ?? [], [rolesQuery.data]);
  const groups = useMemo(() => permissionsQuery.data ?? [], [permissionsQuery.data]);
  const users = useMemo(() => usersQuery.data ?? [], [usersQuery.data]);

  const [activeTab, setActiveTab] = useState<AccessTab>("roles");
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [newRoleOpen, setNewRoleOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AccessRole | null>(null);
  const [selectedUser, setSelectedUser] = useState<AccessUser | null>(null);
  const [userSearch, setUserSearch] = useState("");

  const selectedRole = roles.find((role) => role.id === selectedRoleId) ?? roles[0] ?? null;

  const filteredUsers = useMemo(() => {
    const search = userSearch.trim().toLowerCase();
    if (!search) return users;
    return users.filter((user) =>
      [user.name, user.email, user.employee?.employee_number, ...user.roles.map((role) => role.label)]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(search)),
    );
  }, [userSearch, users]);

  if (meLoading) {
    return <LoadingState />;
  }

  if (!canManage) {
    return (
      <div className="space-y-6">
        <PageHeader title="Access control" description="Manage company roles and user permissions." />
        <Card className="mx-auto max-w-xl">
          <CardContent className="flex flex-col items-center py-12 text-center">
            <span className="grid size-12 place-items-center rounded-2xl bg-amber-50 text-amber-700">
              <ShieldAlert className="size-5" />
            </span>
            <h2 className="mt-4 font-heading text-lg font-semibold">Access restricted</h2>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              You need the Manage roles permission to view or change company access.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isLoading = rolesQuery.isLoading || permissionsQuery.isLoading || usersQuery.isLoading;
  const hasError = rolesQuery.isError || permissionsQuery.isError || usersQuery.isError;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Access control"
        description="Decide what each role can do, then assign the right roles to your workspace users."
        actions={
          <Button type="button" onClick={() => setNewRoleOpen(true)}>
            <Plus className="size-4" />
            New role
          </Button>
        }
      />

      {isLoading ? (
        <LoadingState />
      ) : hasError ? (
        <Card>
          <CardContent className="py-10 text-center">
            <ShieldAlert className="mx-auto size-6 text-destructive" />
            <p className="mt-3 font-medium">Access settings could not be loaded.</p>
            <p className="mt-1 text-sm text-muted-foreground">Refresh the page to try again.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Roles" value={roles.length} detail="Built-in and custom roles" icon={ShieldCheck} />
            <MetricCard
              label="Custom roles"
              value={roles.filter((role) => !role.is_system).length}
              detail="Created for your company"
              icon={KeyRound}
            />
            <MetricCard label="Workspace users" value={users.length} detail="Accounts with company access" icon={Users} />
            <MetricCard
              label="Permissions"
              value={groups.reduce((count, group) => count + group.permissions.length, 0)}
              detail="Available access controls"
              icon={LockKeyhole}
            />
          </div>

          <div className="flex w-fit rounded-xl border bg-muted/50 p-1">
            <button
              type="button"
              onClick={() => setActiveTab("roles")}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium transition",
                activeTab === "roles" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              Roles & permissions
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("users")}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium transition",
                activeTab === "users" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              User access
            </button>
          </div>

          {activeTab === "roles" ? (
            <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
              <Card className="h-fit">
                <CardHeader className="border-b">
                  <CardTitle>Company roles</CardTitle>
                  <p className="text-xs text-muted-foreground">Choose a role to review its access.</p>
                </CardHeader>
                <div className="space-y-1.5 p-2">
                  {roles.map((role) => (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => setSelectedRoleId(role.id)}
                      className={cn(
                        "w-full rounded-xl border px-3 py-3 text-left transition-colors",
                        selectedRole?.id === role.id
                          ? "border-fruition-300 bg-fruition-50/70"
                          : "border-transparent hover:bg-muted/60",
                      )}
                    >
                      <span className="flex items-center justify-between gap-3">
                        <span className="truncate font-medium">{role.label}</span>
                        {role.is_owner ? (
                          <LockKeyhole className="size-3.5 shrink-0 text-fruition-700" />
                        ) : role.is_system ? (
                          <Badge variant="outline">Built-in</Badge>
                        ) : (
                          <Badge variant="secondary">Custom</Badge>
                        )}
                      </span>
                      <span className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{role.user_count} users</span>
                        <span>{role.permissions.length} permissions</span>
                      </span>
                    </button>
                  ))}
                </div>
              </Card>

              {selectedRole && (
                <RoleEditor key={selectedRole.id} role={selectedRole} groups={groups} onDelete={setDeleteTarget} />
              )}
            </div>
          ) : (
            <Card>
              <CardHeader className="border-b">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle>User access</CardTitle>
                    <p className="mt-1 text-xs text-muted-foreground">Assign one or more roles to each workspace user.</p>
                  </div>
                  <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={userSearch}
                      onChange={(event) => setUserSearch(event.target.value)}
                      placeholder="Search users or roles"
                      className="pl-9"
                    />
                  </div>
                </div>
              </CardHeader>
              <div className="divide-y">
                {filteredUsers.map((user) => (
                  <div key={user.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center">
                    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-fruition-100 text-sm font-semibold text-fruition-800">
                      {user.name
                        .split(" ")
                        .slice(0, 2)
                        .map((part) => part[0])
                        .join("")
                        .toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-medium">{user.name}</p>
                        {user.is_current_user && <Badge variant="outline">You</Badge>}
                        <Badge variant={user.status === "active" ? "secondary" : "outline"}>{user.status}</Badge>
                      </div>
                      <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {user.roles.length > 0 ? (
                          user.roles.map((role) => (
                            <Badge key={role.id} variant="outline">
                              {role.label}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-destructive">No role assigned</span>
                        )}
                      </div>
                    </div>
                    {user.is_current_user ? (
                      <p className="text-xs text-muted-foreground sm:max-w-36 sm:text-right">
                        Another owner must change your access.
                      </p>
                    ) : (
                      <Button type="button" variant="outline" onClick={() => setSelectedUser(user)}>
                        <UserCog className="size-4" />
                        Manage roles
                      </Button>
                    )}
                  </div>
                ))}
                {filteredUsers.length === 0 && (
                  <div className="px-4 py-12 text-center text-sm text-muted-foreground">No users match your search.</div>
                )}
              </div>
            </Card>
          )}
        </>
      )}

      <NewRoleDialog
        key={newRoleOpen ? "new-role-open" : "new-role-closed"}
        open={newRoleOpen}
        onOpenChange={setNewRoleOpen}
        groups={groups}
        onCreated={(role) => {
          setSelectedRoleId(role.id);
          setActiveTab("roles");
        }}
      />

      <UserRolesDialog user={selectedUser} roles={roles} onOpenChange={(open) => !open && setSelectedUser(null)} />

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete custom role?"
        description={
          deleteTarget
            ? `Delete ${deleteTarget.label}? Roles assigned to users must be reassigned before they can be deleted.`
            : ""
        }
        isPending={deleteRole.isPending}
        onConfirm={async () => {
          if (!deleteTarget) return;
          try {
            await deleteRole.mutateAsync(deleteTarget.id);
            toast.success(`${deleteTarget.label} deleted.`);
            setDeleteTarget(null);
            setSelectedRoleId(null);
          } catch (error) {
            toast.error(apiErrorMessage(error));
          }
        }}
      />
    </div>
  );
}
