"use client";

import { Lock, Pencil, Plus, Trash2, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { FormDialog } from "@/components/form-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { apiErrorMessage } from "@/lib/api";
import type { PlatformAbility } from "@/types/auth";
import type { PlatformAbilityOption, PlatformRole } from "./types";
import {
  useCreatePlatformRole,
  useDeletePlatformRole,
  usePlatformRoles,
  useUpdatePlatformRole,
} from "./use-admin";

/**
 * Defining what platform staff can reach.
 *
 * Roles are named rather than per-person tick boxes, so "Support agent" is
 * defined once and every agent moves together when it changes.
 */
export function PlatformRolesCard() {
  const roles = usePlatformRoles();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<PlatformRole | null>(null);
  const [deleting, setDeleting] = useState<PlatformRole | null>(null);
  const deleteRole = useDeletePlatformRole();

  const abilities = roles.data?.abilities ?? [];

  return (
    <Card>
      <CardContent className="p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Access levels</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              What each kind of administrator can reach. Change a role and everyone holding it moves with it.
            </p>
          </div>
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus className="size-4" /> New role
          </Button>
        </div>

        {roles.isPending ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {(roles.data?.roles ?? []).map((role) => (
              <li key={role.id} className="flex flex-wrap items-start justify-between gap-3 px-4 py-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900">{role.name}</span>
                    {role.is_system && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold tracking-wide text-slate-600 uppercase">
                        <Lock className="size-2.5" /> Built in
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                      <Users className="size-3" />
                      {role.administrators_count ?? 0}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    {role.description || "No description."}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {role.abilities.map((ability) => (
                      <span
                        key={ability}
                        className="rounded-md bg-fruition-50 px-2 py-0.5 text-[11px] font-medium text-fruition-800"
                      >
                        {abilities.find((option) => option.key === ability)?.label ?? ability}
                      </span>
                    ))}
                  </div>
                </div>

                {!role.is_system && (
                  <div className="flex shrink-0 gap-1">
                    <Button variant="ghost" size="sm" onClick={() => setEditing(role)}>
                      <Pencil className="size-3.5" /> Edit
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setDeleting(role)}>
                      <Trash2 className="size-3.5" /> Delete
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      <RoleDialog
        key={editing?.id ?? "new"}
        open={creating || editing !== null}
        role={editing}
        abilities={abilities}
        onOpenChange={(open) => {
          if (!open) {
            setCreating(false);
            setEditing(null);
          }
        }}
      />

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`Delete ${deleting?.name}?`}
        description="Administrators holding this role must be moved to another one first."
        confirmLabel="Delete role"
        isPending={deleteRole.isPending}
        onConfirm={async () => {
          if (!deleting) return;
          try {
            await deleteRole.mutateAsync(deleting.id);
            toast.success(`${deleting.name} deleted.`);
            setDeleting(null);
          } catch (error) {
            toast.error(apiErrorMessage(error));
          }
        }}
      />
    </Card>
  );
}

function RoleDialog({
  open,
  role,
  abilities,
  onOpenChange,
}: {
  open: boolean;
  /** null when creating. */
  role: PlatformRole | null;
  abilities: PlatformAbilityOption[];
  onOpenChange: (open: boolean) => void;
}) {
  const create = useCreatePlatformRole();
  const update = useUpdatePlatformRole(role?.id ?? 0);
  const [name, setName] = useState(role?.name ?? "");
  const [description, setDescription] = useState(role?.description ?? "");
  const [selected, setSelected] = useState<PlatformAbility[]>(role?.abilities ?? []);

  const isPending = create.isPending || update.isPending;

  const toggle = (ability: PlatformAbility) => {
    setSelected((current) =>
      current.includes(ability) ? current.filter((item) => item !== ability) : [...current, ability],
    );
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const payload = { name: name.trim(), description: description.trim() || null, abilities: selected };

    try {
      if (role) {
        await update.mutateAsync(payload);
        toast.success(`${payload.name} updated. Anyone holding it sees the change straight away.`);
      } else {
        await create.mutateAsync(payload);
        toast.success(`${payload.name} created.`);
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(apiErrorMessage(error));
    }
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={role ? `Edit ${role.name}` : "New access level"}
      description="Pick the sections this role can reach. Everything else stays out of reach, in the sidebar and in the API."
      formId="platform-role"
      isPending={isPending}
      submitLabel={role ? "Save role" : "Create role"}
      pendingLabel="Saving..."
    >
      <form id="platform-role" onSubmit={submit} className="space-y-4 py-4">
        <div className="space-y-1.5">
          <Label htmlFor="role-name">Name</Label>
          <Input
            id="role-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Support agent"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="role-description">Description</Label>
          <Input
            id="role-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Works the support queue and looks up users to help them."
          />
        </div>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-slate-900">Sections</legend>
          <div className="space-y-1.5">
            {abilities.map((ability) => (
              <label
                key={ability.key}
                className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 px-3 py-2.5 hover:bg-slate-50"
              >
                <input
                  type="checkbox"
                  className="mt-0.5 size-4 shrink-0 accent-fruition-700"
                  checked={selected.includes(ability.key)}
                  onChange={() => toggle(ability.key)}
                />
                <span>
                  <span className="block text-sm font-medium text-slate-900">{ability.label}</span>
                  <span className="mt-0.5 block text-xs leading-5 text-slate-500">{ability.description}</span>
                </span>
              </label>
            ))}
          </div>
          {selected.length === 0 && (
            <p className="text-xs text-amber-700">Choose at least one section, or the role grants nothing.</p>
          )}
        </fieldset>
      </form>
    </FormDialog>
  );
}
