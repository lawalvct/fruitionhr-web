"use client";

import { CheckCircle2, Pencil, Plus, Search, ShieldCheck, ShieldOff, UserCog } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useMe } from "@/features/auth/use-auth";
import { apiErrorMessage } from "@/lib/api";
import {
  AdminPagination,
  AdminStatusBadge,
  formatAdminDate,
  Identity,
  QueryErrorState,
  ReasonDialog,
} from "./admin-ui";
import { CreateAdministratorDialog, EditAdministratorDialog } from "./administrator-dialogs";
import { PlatformRolesCard } from "./platform-roles-card";
import type { PlatformAdministrator } from "./types";
import { useActivateAdministrator, useAdministrators, useDisableAdministrator } from "./use-admin";

const selectClass =
  "h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-700 outline-none focus:border-fruition-400 focus:ring-2 focus:ring-fruition-500/15";

export function AdministratorsPage() {
  const { data: me } = useMe();
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<PlatformAdministrator["status"] | "">("");
  const [sort, setSort] = useState("name");
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<PlatformAdministrator | null>(null);
  const [disabling, setDisabling] = useState<PlatformAdministrator | null>(null);
  const [activating, setActivating] = useState<PlatformAdministrator | null>(null);
  const disableAdministrator = useDisableAdministrator(disabling?.id ?? 0);
  const activateAdministrator = useActivateAdministrator(activating?.id ?? 0);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const administrators = useAdministrators({ page, search, status, sort });
  const rows = administrators.data?.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Administrators"
        description="Manage the trusted FruitionHR team members who can operate the entire platform."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" /> Add administrator
          </Button>
        }
      />

      <section className="flex gap-3 rounded-xl border border-blue-200 bg-blue-50/70 px-4 py-3.5 text-sm text-blue-900">
        <ShieldCheck className="mt-0.5 size-4 shrink-0" />
        <div>
          <p className="font-semibold">Access follows the role</p>
          <p className="mt-1 text-xs leading-5 text-blue-800/75">
            Each administrator reaches only the sections their role allows. Owners can reach everything, including adding
            administrators and deciding what they can access. Roles inside a company are separate and do not apply here.
          </p>
        </div>
      </section>

      <Card className="border-slate-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <CardContent className="p-0">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search name or email"
                aria-label="Search administrators"
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value as PlatformAdministrator["status"] | "");
                  setPage(1);
                }}
                className={selectClass}
                aria-label="Filter administrators by status"
              >
                <option value="">All statuses</option>
                <option value="active">Active</option>
                <option value="disabled">Disabled</option>
              </select>
              <select
                value={sort}
                onChange={(event) => {
                  setSort(event.target.value);
                  setPage(1);
                }}
                className={selectClass}
                aria-label="Sort administrators"
              >
                <option value="name">Name A–Z</option>
                <option value="-name">Name Z–A</option>
                <option value="-created_at">Newest first</option>
                <option value="created_at">Oldest first</option>
              </select>
            </div>
          </div>

          {administrators.isError ? (
            <div className="p-4"><QueryErrorState title="Administrators could not be loaded" onRetry={() => void administrators.refetch()} /></div>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="min-w-[900px] w-full border-collapse text-sm">
                  <thead className="bg-slate-50/80 text-left text-[11px] tracking-wide text-slate-500 uppercase">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Administrator</th>
                      <th className="px-4 py-3 font-semibold">Access</th>
                      <th className="px-4 py-3 font-semibold">Account</th>
                      <th className="px-4 py-3 font-semibold">Email verification</th>
                      <th className="px-4 py-3 font-semibold">Timezone</th>
                      <th className="px-4 py-3 font-semibold">Added</th>
                      <th className="px-4 py-3"><span className="sr-only">Actions</span></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {administrators.isLoading
                      ? Array.from({ length: 5 }).map((_, index) => (
                          <tr key={index}>
                            {Array.from({ length: 7 }).map((__, cell) => <td key={cell} className="px-4 py-4"><Skeleton className="h-5 max-w-36" /></td>)}
                          </tr>
                        ))
                      : rows.map((administrator) => {
                          const isCurrent = administrator.id === me?.id;
                          return (
                            <tr key={administrator.id} className="transition-colors hover:bg-slate-50/70">
                              <td className="px-4 py-3.5">
                                <Identity
                                  name={administrator.name}
                                  detail={<>{administrator.email}{isCurrent ? " · You" : ""}</>}
                                />
                              </td>
                              <td className="px-4 py-3.5"><RoleBadge administrator={administrator} /></td>
                              <td className="px-4 py-3.5"><AdminStatusBadge status={administrator.status} /></td>
                              <td className="px-4 py-3.5">
                                <AdminStatusBadge status={administrator.is_email_verified ? "verified" : "unverified"} />
                              </td>
                              <td className="px-4 py-3.5 text-slate-600">{administrator.timezone ?? "Platform default"}</td>
                              <td className="whitespace-nowrap px-4 py-3.5 text-slate-600">{formatAdminDate(administrator.created_at)}</td>
                              <td className="px-4 py-3.5">
                                <div className="flex justify-end gap-1">
                                  <Button variant="ghost" size="icon" aria-label={`Edit ${administrator.name}`} onClick={() => setEditing(administrator)}>
                                    <Pencil className="size-4" />
                                  </Button>
                                  {administrator.status === "active" && !isCurrent && (
                                    <Button variant="ghost" size="icon" className="text-red-600 hover:bg-red-50 hover:text-red-700" aria-label={`Disable ${administrator.name}`} onClick={() => setDisabling(administrator)}>
                                      <ShieldOff className="size-4" />
                                    </Button>
                                  )}
                                  {administrator.status === "disabled" && (
                                    <Button variant="ghost" size="icon" className="text-fruition-700" aria-label={`Activate ${administrator.name}`} onClick={() => setActivating(administrator)}>
                                      <CheckCircle2 className="size-4" />
                                    </Button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                  </tbody>
                </table>
              </div>

              <div className="divide-y divide-slate-100 md:hidden">
                {administrators.isLoading
                  ? Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="m-4 h-32" />)
                  : rows.map((administrator) => {
                      const isCurrent = administrator.id === me?.id;
                      return (
                        <div key={administrator.id} className="p-4">
                          <Identity name={administrator.name} detail={<>{administrator.email}{isCurrent ? " · You" : ""}</>} />
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <RoleBadge administrator={administrator} />
                            <AdminStatusBadge status={administrator.status} />
                            <AdminStatusBadge status={administrator.is_email_verified ? "verified" : "unverified"} />
                          </div>
                          <div className="mt-3 flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => setEditing(administrator)}>
                              <Pencil className="size-3.5" /> Edit
                            </Button>
                            {administrator.status === "active" && !isCurrent && (
                              <Button variant="destructive" size="sm" onClick={() => setDisabling(administrator)}>
                                <ShieldOff className="size-3.5" /> Disable
                              </Button>
                            )}
                            {administrator.status === "disabled" && (
                              <Button size="sm" onClick={() => setActivating(administrator)}>
                                <CheckCircle2 className="size-3.5" /> Activate
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
              </div>

              {!administrators.isLoading && rows.length === 0 && (
                <div className="grid min-h-64 place-items-center p-6 text-center">
                  <div>
                    <span className="mx-auto grid size-11 place-items-center rounded-xl bg-slate-100 text-slate-500"><UserCog className="size-5" /></span>
                    <p className="mt-3 text-sm font-semibold text-slate-900">No administrators found</p>
                    <p className="mt-1 text-xs text-slate-500">Try changing the search or status filter.</p>
                  </div>
                </div>
              )}

              <AdminPagination meta={administrators.data?.meta} isFetching={administrators.isFetching} onPageChange={setPage} />
            </>
          )}
        </CardContent>
      </Card>

      <PlatformRolesCard />

      <CreateAdministratorDialog open={createOpen} onOpenChange={setCreateOpen} />
      <EditAdministratorDialog administrator={editing} onOpenChange={(open) => !open && setEditing(null)} />
      <ReasonDialog
        open={disabling !== null}
        onOpenChange={(open) => !open && setDisabling(null)}
        title="Disable administrator"
        description="Their active sessions will end and they will no longer be able to access the platform console."
        subject={disabling?.name ?? "this administrator"}
        actionLabel="Disable"
        isPending={disableAdministrator.isPending}
        onConfirm={async (reason) => {
          if (!disabling) return;
          try {
            await disableAdministrator.mutateAsync(reason);
            toast.success(`${disabling.name} has been disabled.`);
            setDisabling(null);
          } catch (error) {
            toast.error(apiErrorMessage(error));
          }
        }}
      />
      <ConfirmDialog
        open={activating !== null}
        onOpenChange={(open) => !open && setActivating(null)}
        title="Activate administrator?"
        description={activating ? `${activating.name} will be able to sign in again, with whatever their role allows.` : ""}
        confirmLabel="Activate"
        isPending={activateAdministrator.isPending}
        onConfirm={async () => {
          if (!activating) return;
          try {
            await activateAdministrator.mutateAsync();
            toast.success(`${activating.name} is active again.`);
            setActivating(null);
          } catch (error) {
            toast.error(apiErrorMessage(error));
          }
        }}
      />
    </div>
  );
}

/**
 * What this administrator can reach, at a glance.
 *
 * Owners are called out because they are the only ones who can hand out access
 * — the distinction that matters most when scanning this list.
 */
function RoleBadge({ administrator }: { administrator: PlatformAdministrator }) {
  const role = administrator.platform_role;

  if (!role) {
    return (
      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
        No access
      </span>
    );
  }

  return (
    <span
      className={
        role.is_owner
          ? "rounded-full bg-fruition-700 px-2 py-0.5 text-[11px] font-semibold text-white"
          : "rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700"
      }
    >
      {role.name}
    </span>
  );
}
