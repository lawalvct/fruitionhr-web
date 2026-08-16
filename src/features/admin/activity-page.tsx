"use client";

import { Activity as ActivityIcon, Globe } from "lucide-react";
import { useState } from "react";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AdminPagination,
  formatAdminDate,
  humanize,
  Identity,
  QueryErrorState,
} from "./admin-ui";
import type { PlatformActivity } from "./types";
import { usePlatformActivity } from "./use-admin";

/**
 * Audit trail of every super-admin action. The dashboard links here from its
 * "recent activity" card, which only shows the latest handful.
 */
export function ActivityPage() {
  const [page, setPage] = useState(1);
  const activity = usePlatformActivity(page);
  const rows = activity.data?.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Activity log"
        description="Every company and administrator change made from the platform console, newest first."
      />

      {activity.isError ? (
        <QueryErrorState title="We could not load the activity log" onRetry={() => activity.refetch()} />
      ) : (
        <Card className="overflow-hidden p-0">
          <CardContent className="p-0">
            {activity.isPending ? (
              <div className="space-y-3 p-4">
                {Array.from({ length: 6 }).map((_, index) => (
                  <Skeleton key={index} className="h-16 w-full rounded-xl" />
                ))}
              </div>
            ) : rows.length === 0 ? (
              <div className="grid min-h-64 place-items-center p-6 text-center">
                <div>
                  <span className="mx-auto grid size-11 place-items-center rounded-xl bg-slate-50 text-slate-400 ring-1 ring-slate-100">
                    <ActivityIcon className="size-5" />
                  </span>
                  <p className="mt-3 text-sm font-semibold text-slate-900">No activity yet</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Company and administrator changes will appear here as they happen.
                  </p>
                </div>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {rows.map((item) => (
                  <ActivityRow key={item.id} item={item} />
                ))}
              </ul>
            )}

            <AdminPagination
              meta={activity.data?.meta}
              isFetching={activity.isFetching}
              onPageChange={setPage}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ActivityRow({ item }: { item: PlatformActivity }) {
  const actorName = item.actor?.name ?? "System";

  return (
    <li className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <Identity
          name={actorName}
          detail={item.actor?.email ?? "Automated platform action"}
        />
      </div>

      <div className="min-w-0 sm:flex-1 sm:px-4">
        <p className="truncate text-sm text-slate-900">
          <span className="font-semibold">{humanize(item.action.replaceAll(".", " "))}</span>
          {item.subject?.label && (
            <>
              {" — "}
              <span className="text-slate-600">{item.subject.label}</span>
            </>
          )}
        </p>
        {item.reason && (
          <p className="mt-0.5 truncate text-xs text-slate-500">Reason: {item.reason}</p>
        )}
      </div>

      <div className="shrink-0 text-left sm:text-right">
        <p className="text-xs font-medium text-slate-700">{formatAdminDate(item.created_at, true)}</p>
        {item.ip_address && (
          <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400 sm:justify-end">
            <Globe className="size-3" /> {item.ip_address}
          </p>
        )}
      </div>
    </li>
  );
}
