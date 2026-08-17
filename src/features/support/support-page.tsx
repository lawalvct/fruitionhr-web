"use client";

import { LifeBuoy, Loader2, Plus, Send, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { FormDialog } from "@/components/form-dialog";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { apiErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";
import { TicketThread } from "./ticket-thread";
import {
  STATUS_LABELS,
  statusTone,
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  type TicketStatus,
} from "./types";
import { useCloseTicket, useOpenTicket, useReplyToTicket, useTicket, useTickets } from "./use-support";

const selectClass =
  "h-9 w-full rounded-lg border border-input bg-white px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20";

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-NG", { dateStyle: "medium" }).format(new Date(value));
}

export function SupportPage() {
  const [status, setStatus] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [composing, setComposing] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const tickets = useTickets(status, search);
  const rows = tickets.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Support"
        description="Raise a ticket and our team will pick it up. You can follow the whole conversation here."
        actions={
          <Button onClick={() => setComposing(true)}>
            <Plus className="size-4" /> New ticket
          </Button>
        }
      />

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
      </div>

      {tickets.isPending ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState onCompose={() => setComposing(true)} filtered={status !== "" || search !== ""} />
      ) : (
        <Card className="overflow-hidden p-0">
          <CardContent className="p-0">
            <ul className="divide-y divide-slate-100">
              {rows.map((ticket) => (
                <li key={ticket.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(ticket.id)}
                    className="flex w-full flex-col gap-2 px-4 py-4 text-left hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <StatusPill status={ticket.status} />
                        <span className="truncate text-sm font-semibold text-slate-900">
                          {ticket.subject}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-xs text-slate-500">
                        {ticket.reference} · {ticket.category} · opened {formatDate(ticket.created_at)}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-slate-400">
                      {ticket.message_count} message{ticket.message_count === 1 ? "" : "s"}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <NewTicketDialog open={composing} onOpenChange={setComposing} onOpened={setSelectedId} />
      <TicketDrawer id={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  );
}

function StatusPill({ status }: { status: TicketStatus }) {
  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase",
        statusTone(status),
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

function EmptyState({ onCompose, filtered }: { onCompose: () => void; filtered: boolean }) {
  return (
    <Card>
      <CardContent className="grid min-h-56 place-items-center p-6 text-center">
        <div>
          <span className="mx-auto grid size-11 place-items-center rounded-xl bg-fruition-50 text-fruition-700">
            <LifeBuoy className="size-5" />
          </span>
          <p className="mt-3 text-sm font-semibold text-slate-900">
            {filtered ? "No tickets match" : "No tickets yet"}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {filtered
              ? "Try a different search or status."
              : "Stuck on something? Raise a ticket and we will help."}
          </p>
          {!filtered && (
            <Button size="sm" className="mt-4" onClick={onCompose}>
              <Plus className="size-4" /> New ticket
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function NewTicketDialog({
  open,
  onOpenChange,
  onOpened,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpened: (id: number) => void;
}) {
  const openTicket = useOpenTicket();
  const [form, setForm] = useState({
    subject: "",
    body: "",
    category: "other",
    priority: "normal",
  });

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const result = await openTicket.mutateAsync(form);
      toast.success(result.message);
      onOpenChange(false);
      setForm({ subject: "", body: "", category: "other", priority: "normal" });
      onOpened(result.data.id);
    } catch (error) {
      toast.error(apiErrorMessage(error));
    }
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Raise a support ticket"
      description="Tell us what is happening and we will come back to you by email."
      formId="new-ticket"
      isPending={openTicket.isPending}
      submitLabel="Send ticket"
      pendingLabel="Sending..."
    >
      <form id="new-ticket" onSubmit={submit} className="space-y-4 py-4">
        <div className="space-y-1.5">
          <Label>Subject</Label>
          <Input
            value={form.subject}
            onChange={(event) => setForm({ ...form, subject: event.target.value })}
            placeholder="Payroll will not run for August"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>What is it about?</Label>
            <select
              className={selectClass}
              value={form.category}
              onChange={(event) => setForm({ ...form, category: event.target.value })}
            >
              {TICKET_CATEGORIES.map((value) => (
                <option key={value} value={value}>
                  {value.charAt(0).toUpperCase() + value.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>How urgent?</Label>
            <select
              className={selectClass}
              value={form.priority}
              onChange={(event) => setForm({ ...form, priority: event.target.value })}
            >
              {TICKET_PRIORITIES.map((value) => (
                <option key={value} value={value}>
                  {value.charAt(0).toUpperCase() + value.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>What is happening?</Label>
          <textarea
            rows={6}
            value={form.body}
            onChange={(event) => setForm({ ...form, body: event.target.value })}
            placeholder="Include what you were doing, what you expected, and any error message you saw."
            className="w-full rounded-lg border border-input bg-white px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20"
          />
          <p className="text-xs text-slate-500">
            The more detail you give, the faster we can help.
          </p>
        </div>
      </form>
    </FormDialog>
  );
}

function TicketDrawer({ id, onClose }: { id: number | null; onClose: () => void }) {
  const ticket = useTicket(id);
  const reply = useReplyToTicket(id ?? 0);
  const close = useCloseTicket(id ?? 0);
  const [body, setBody] = useState("");

  const data = ticket.data;

  const send = async () => {
    if (body.trim().length < 2) return;
    try {
      await reply.mutateAsync(body);
      setBody("");
    } catch (error) {
      toast.error(apiErrorMessage(error));
    }
  };

  return (
    <FormDialog
      open={id !== null}
      onOpenChange={(open) => !open && onClose()}
      title={data?.subject ?? "Ticket"}
      description={data ? `${data.reference} · ${STATUS_LABELS[data.status]}` : ""}
      formId="ticket-reply"
      isPending={reply.isPending}
      submitLabel={data?.is_closed ? "Closed" : "Send reply"}
      pendingLabel="Sending..."
    >
      {ticket.isPending || !data ? (
        <div className="space-y-3 py-4">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      ) : (
        <div className="space-y-4 py-4">
          <TicketThread messages={data.messages ?? []} />

          {data.is_closed ? (
            <p className="rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-600">
              This ticket is closed. Raise a new one if you need more help.
            </p>
          ) : (
            <form
              id="ticket-reply"
              onSubmit={(event) => {
                event.preventDefault();
                void send();
              }}
              className="space-y-2"
            >
              <Label>Add a reply</Label>
              <textarea
                rows={4}
                value={body}
                onChange={(event) => setBody(event.target.value)}
                className="w-full rounded-lg border border-input bg-white px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20"
              />
              <div className="flex items-center justify-between gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={close.isPending}
                  onClick={async () => {
                    try {
                      await close.mutateAsync();
                      toast.success("Ticket closed. Thanks for letting us know.");
                      onClose();
                    } catch (error) {
                      toast.error(apiErrorMessage(error));
                    }
                  }}
                >
                  {close.isPending ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : null}
                  This is sorted — close it
                </Button>
                <span className="flex items-center gap-1 text-xs text-slate-400">
                  <Send className="size-3" /> We reply by email too
                </span>
              </div>
            </form>
          )}
        </div>
      )}
    </FormDialog>
  );
}
