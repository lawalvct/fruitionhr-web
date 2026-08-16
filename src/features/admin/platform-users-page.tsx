"use client";

import { BadgeCheck, KeyRound, MailWarning, Search, ShieldCheck, UserCheck, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { apiErrorMessage } from "@/lib/api";
import {
  AdminMetricCard,
  AdminPagination,
  AdminStatusBadge,
  formatAdminDate,
  Identity,
  QueryErrorState,
} from "./admin-ui";
import type { PlatformUser, PlatformUserQuery, PlatformUserStatus } from "./user-types";
import { usePlatformUsers, useResetUserPassword, useVerifyUserEmail } from "./use-platform-users";

const selectClass =
  "h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-700 outline-none focus:border-fruition-400 focus:ring-2 focus:ring-fruition-500/15";

/**
 * Every user on the platform, for support. Two write actions, both aimed at
 * "I cannot sign in": force-verify an email, and issue a temporary password.
 */
export function PlatformUsersPage() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<PlatformUserStatus | "">("");
  const [type, setType] = useState<PlatformUserQuery["type"]>("");
  const [verified, setVerified] = useState<PlatformUserQuery["verified"]>("");
  const [verifying, setVerifying] = useState<PlatformUser | null>(null);
  const [resetting, setResetting] = useState<PlatformUser | null>(null);

  const verifyEmail = useVerifyUserEmail();
  const resetPassword = useResetUserPassword();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const users = usePlatformUsers({ page, search, status, type, verified });
  const rows = users.data?.data ?? [];
  const summary = users.data?.summary;

  const confirmVerify = async () => {
    if (!verifying) return;
    try {
      await verifyEmail.mutateAsync(verifying.id);
      toast.success(`${verifying.name} can now sign in.`);
      setVerifying(null);
    } catch (error) {
      toast.error(apiErrorMessage(error));
    }
  };

  const confirmReset = async () => {
    if (!resetting) return;
    try {
      const result = await resetPassword.mutateAsync(resetting.id);
      toast.success(result.message);
      setResetting(null);
    } catch (error) {
      toast.error(apiErrorMessage(error));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description="Everyone with a FruitionHR account, across every company. Useful when someone cannot sign in."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminMetricCard
          label="Total users"
          value={summary?.total ?? 0}
          detail="Across all companies"
          icon={Users}
          tone="blue"
        />
        <AdminMetricCard
          label="Active"
          value={summary?.active ?? 0}
          detail="Able to sign in"
          icon={UserCheck}
          tone="green"
        />
        <AdminMetricCard
          label="Invited"
          value={summary?.invited ?? 0}
          detail="Yet to set a password"
          icon={BadgeCheck}
          tone="violet"
        />
        <AdminMetricCard
          label="Unverified email"
          value={summary?.unverified ?? 0}
          detail="Blocked until verified"
          icon={MailWarning}
          tone="amber"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-56 flex-1">
          <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search name, email, phone or company"
            className="pl-8"
          />
        </div>

        <select
          className={selectClass}
          value={type}
          onChange={(event) => {
            setType(event.target.value as PlatformUserQuery["type"]);
            setPage(1);
          }}
        >
          <option value="">Everyone</option>
          <option value="tenant">Company users</option>
          <option value="administrator">Platform admins</option>
        </select>

        <select
          className={selectClass}
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as PlatformUserStatus | "");
            setPage(1);
          }}
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="invited">Invited</option>
          <option value="disabled">Disabled</option>
        </select>

        <select
          className={selectClass}
          value={verified}
          onChange={(event) => {
            setVerified(event.target.value as PlatformUserQuery["verified"]);
            setPage(1);
          }}
        >
          <option value="">Any email state</option>
          <option value="1">Verified</option>
          <option value="0">Not verified</option>
        </select>
      </div>

      {users.isError ? (
        <QueryErrorState title="We could not load the users" onRetry={() => users.refetch()} />
      ) : (
        <Card className="overflow-hidden p-0">
          <CardContent className="p-0">
            {users.isPending ? (
              <div className="space-y-3 p-4">
                {Array.from({ length: 6 }).map((_, index) => (
                  <Skeleton key={index} className="h-16 w-full rounded-xl" />
                ))}
              </div>
            ) : rows.length === 0 ? (
              <div className="grid min-h-64 place-items-center p-6 text-center">
                <div>
                  <span className="mx-auto grid size-11 place-items-center rounded-xl bg-slate-50 text-slate-400 ring-1 ring-slate-100">
                    <Users className="size-5" />
                  </span>
                  <p className="mt-3 text-sm font-semibold text-slate-900">No users match</p>
                  <p className="mt-1 text-xs text-slate-500">Try a different search or filter.</p>
                </div>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {rows.map((user) => (
                  <li
                    key={user.id}
                    className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <Identity name={user.name} detail={user.email} />

                    <div className="min-w-0 sm:flex-1 sm:px-4">
                      <p className="truncate text-sm text-slate-900">
                        {user.is_super_admin ? (
                          <span className="inline-flex items-center gap-1 font-medium text-fruition-800">
                            <ShieldCheck className="size-3.5" /> Platform administrator
                          </span>
                        ) : (
                          (user.company?.name ?? "No company")
                        )}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-slate-500">
                        Joined {formatAdminDate(user.created_at)}
                        {user.phone ? ` · ${user.phone}` : ""}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      {!user.is_email_verified && (
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold tracking-wide text-amber-800 uppercase">
                          Unverified
                        </span>
                      )}
                      <AdminStatusBadge status={user.status} />
                      {!user.is_email_verified ? (
                        <Button variant="outline" size="sm" onClick={() => setVerifying(user)}>
                          <BadgeCheck className="size-3.5" /> Verify
                        </Button>
                      ) : (
                        // Only offered once the address is proven — the API
                        // refuses to mail credentials to an unverified inbox.
                        <Button variant="outline" size="sm" onClick={() => setResetting(user)}>
                          <KeyRound className="size-3.5" /> Reset password
                        </Button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <AdminPagination
              meta={users.data?.meta}
              isFetching={users.isFetching}
              onPageChange={setPage}
            />
          </CardContent>
        </Card>
      )}

      <ConfirmDialog
        open={verifying !== null}
        onOpenChange={(open) => !open && setVerifying(null)}
        title="Mark this email as verified?"
        description={
          verifying
            ? `${verifying.name} (${verifying.email}) will be able to sign in without entering a code. Only do this once you are confident the address belongs to them.`
            : ""
        }
        confirmLabel="Mark as verified"
        isPending={verifyEmail.isPending}
        onConfirm={confirmVerify}
      />

      <ConfirmDialog
        open={resetting !== null}
        onOpenChange={(open) => !open && setResetting(null)}
        title="Reset this password?"
        description={
          resetting
            ? `A new temporary password will be emailed to ${resetting.email}. ${resetting.name} will be signed out everywhere and must use the emailed password to get back in. You will not be shown the password.`
            : ""
        }
        confirmLabel="Reset and email password"
        isPending={resetPassword.isPending}
        onConfirm={confirmReset}
      />
    </div>
  );
}
