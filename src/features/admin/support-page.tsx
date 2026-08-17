"use client";

import { Clock, Inbox, Loader2, Search, UserCheck, UserPlus, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { FormDialog } from "@/components/form-dialog";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useMe } from "@/features/auth/use-auth";
import { TicketThread } from "@/features/support/ticket-thread";
import {
  STATUS_LABELS,
  statusTone,
  type TicketStatus,
} from "@/features/support/types";
import { apiErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";
import { AdminMetricCard, formatAdminDate, QueryErrorState } from "./admin-ui";
import {
  useAdminTicket,
  useAdminTickets,
  useAgentReply,
  useAssignTicket,
  useUpdateTicketStatus,
} from "./use-admin-support";

const PRIORITY_TONE: Record<string, string> = {
  urgent: "bg-red-100 text-red-800",
  high: "bg-amber-100 text-amber-800",
  normal: "bg-slate-100 text-slate-600",
  low: "bg-slate-100 text-slate-500",
};

export function AdminSupportPage() {
  const [status, setStatus] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // Set when arriving from a company page ("View their tickets").
  const searchParams = useSearchParams();
  const [tenantId, setTenantId] = useState<number | undefined>(() => {
    const raw = Number(searchParams.get("tenant_id"));
    return Number.isInteger(raw) && raw > 0 ? raw : undefined;
  });
  const companyName = searchParams.get("company");

  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const tickets = useAdminTickets(status, search, tenantId);

  const companyFilter = tenantId !== undefined ? (
    <CompanyFilterChip name={companyName} onClear={() => setTenantId(undefined)} />
  ) : null;
  const rows = tickets.data?.data ?? [];
  const summary = tickets.data?.summary;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Support"
        description="Every company's tickets in one queue. Oldest and most urgent first."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminMetricCard
          label="Open"
          value={summary?.open ?? 0}
          detail="Waiting to be picked up"
          icon={Inbox}
          tone="amber"
        />
        <AdminMetricCard
          label="In progress"
          value={summary?.in_progress ?? 0}
          detail="Being worked on"
          icon={Clock}
          tone="blue"
        />
        <AdminMetricCard
          label="Unassigned"
          value={summary?.unassigned ?? 0}
          detail="Nobody has taken these"
          icon={UserPlus}
          tone="violet"
        />
        <AdminMetricCard
          label="Resolved"
          value={summary?.resolved ?? 0}
          detail="Awaiting close"
          icon={UserCheck}
          tone="green"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-56 flex-1">
          <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search subject or ticket number"
            className="pl-8"
          />
        </div>
        <select
          className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-700"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          <option value="">All tickets</option>
          {(Object.keys(STATUS_LABELS) as TicketStatus[]).map((value) => (
            <option key={value} value={value}>
              {STATUS_LABELS[value]}
            </option>
          ))}
        </select>
        {companyFilter}
      </div>

      {tickets.isError ? (
        <QueryErrorState title="We could not load the queue" onRetry={() => tickets.refetch()} />
      ) : (
        <Card className="overflow-hidden p-0">
          <CardContent className="p-0">
            {tickets.isPending ? (
              <div className="space-y-3 p-4">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Skeleton key={index} className="h-16 w-full rounded-xl" />
                ))}
              </div>
            ) : rows.length === 0 ? (
              <div className="grid min-h-48 place-items-center p-6 text-center">
                <p className="text-sm font-semibold text-slate-900">Nothing in the queue</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {rows.map((ticket) => (
                  <li key={ticket.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(ticket.id)}
                      className="flex w-full flex-col gap-2 px-4 py-4 text-left hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={cn(
                              "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase",
                              statusTone(ticket.status),
                            )}
                          >
                            {STATUS_LABELS[ticket.status]}
                          </span>
                          <span
                            className={cn(
                              "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase",
                              PRIORITY_TONE[ticket.priority] ?? PRIORITY_TONE.normal,
                            )}
                          >
                            {ticket.priority}
                          </span>
                          <span className="truncate text-sm font-semibold text-slate-900">
                            {ticket.subject}
                          </span>
                        </div>
                        <p className="mt-1 truncate text-xs text-slate-500">
                          {ticket.company?.name ?? "Unknown company"} · {ticket.reference} ·
                          opened {formatAdminDate(ticket.created_at)}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs text-slate-400">
                        {ticket.assignee?.name ?? "Unassigned"}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      <AgentTicketDialog id={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  );
}

function AgentTicketDialog({ id, onClose }: { id: number | null; onClose: () => void }) {
  const { data: me } = useMe();
  const ticket = useAdminTicket(id);
  const reply = useAgentReply(id ?? 0);
  const updateStatus = useUpdateTicketStatus(id ?? 0);
  const assign = useAssignTicket(id ?? 0);

  const [body, setBody] = useState("");
  const [internal, setInternal] = useState(false);

  const data = ticket.data;

  const send = async () => {
    if (body.trim().length < 2) return;
    try {
      await reply.mutateAsync({ body, internal });
      toast.success(internal ? "Note added for the team." : "Reply sent to the customer.");
      setBody("");
      setInternal(false);
    } catch (error) {
      toast.error(apiErrorMessage(error));
    }
  };

  return (
    <FormDialog
      open={id !== null}
      onOpenChange={(open) => !open && onClose()}
      title={data?.subject ?? "Ticket"}
      description={
        data ? `${data.reference} · ${data.company?.name ?? "Unknown company"}` : ""
      }
      formId="agent-reply"
      isPending={reply.isPending}
      submitLabel={internal ? "Add internal note" : "Send reply"}
      pendingLabel="Sending..."
    >
      {ticket.isPending || !data ? (
        <div className="space-y-3 py-4">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      ) : (
        <div className="space-y-4 py-4">
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 p-3">
            <select
              className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-sm"
              value={data.status}
              onChange={async (event) => {
                try {
                  await updateStatus.mutateAsync(event.target.value);
                  toast.success("Status updated.");
                } catch (error) {
                  toast.error(apiErrorMessage(error));
                }
              }}
            >
              {(Object.keys(STATUS_LABELS) as TicketStatus[]).map((value) => (
                <option key={value} value={value}>
                  {STATUS_LABELS[value]}
                </option>
              ))}
            </select>

            {data.assignee ? (
              <span className="text-xs text-slate-500">
                Assigned to <strong className="text-slate-700">{data.assignee.name}</strong>
              </span>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={assign.isPending || !me}
                onClick={async () => {
                  try {
                    await assign.mutateAsync(me?.id ?? null);
                    toast.success("Assigned to you.");
                  } catch (error) {
                    toast.error(apiErrorMessage(error));
                  }
                }}
              >
                {assign.isPending ? <Loader2 className="size-3.5 animate-spin" /> : null}
                Assign to me
              </Button>
            )}
          </div>

          <TicketThread messages={data.messages ?? []} />

          <form
            id="agent-reply"
            onSubmit={(event) => {
              event.preventDefault();
              void send();
            }}
            className="space-y-2"
          >
            <Label>{internal ? "Internal note" : "Reply to the customer"}</Label>
            <textarea
              rows={4}
              value={body}
              onChange={(event) => setBody(event.target.value)}
              className={cn(
                "w-full rounded-lg border px-2.5 py-2 text-sm outline-none",
                internal
                  ? "border-amber-300 bg-amber-50 focus-visible:border-amber-400"
                  : "border-input bg-white focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20",
              )}
            />
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={internal}
                onChange={(event) => setInternal(event.target.checked)}
              />
              Internal note — the customer will not see this
            </label>
            {!internal && (
              <p className="text-xs text-slate-500">
                Sending a reply emails the customer and marks the ticket as awaiting them.
              </p>
            )}
          </form>
        </div>
      )}
    </FormDialog>
  );
}

/**
 * Says why the list is short, and gets out of the way.
 *
 * Arriving here from a company page filters the list; without this the missing
 * rows just look like missing data.
 */
function CompanyFilterChip({ name, onClear }: { name: string | null; onClear: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-fruition-50 py-1 pr-1 pl-3 text-xs font-medium text-fruition-900 ring-1 ring-fruition-200">
      {name ? `Only ${name}` : "One company only"}
      <button
        type="button"
        onClick={onClear}
        aria-label="Show all companies"
        className="grid size-5 place-items-center rounded-full text-fruition-700 hover:bg-fruition-100"
      >
        <X className="size-3" />
      </button>
    </span>
  );
}
