"use client";

import {
  CheckCircle2,
  Clock3,
  CornerUpLeft,
  FileCheck2,
  Filter,
  Inbox,
  Search,
  UserRound,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { apiErrorMessage } from "@/lib/api";
import {
  useApprovalAction,
  useApprovals,
  type ApprovalRequest,
} from "@/features/approvals/use-approvals";

type ApprovalView = "queue" | "mine";
const EMPTY_REQUESTS: ApprovalRequest[] = [];

function moduleLabel(module: string): string {
  return module.replace(/_/g, " ").replace(/^\w/, (character) => character.toUpperCase());
}

function formatDate(value: string | null): string {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

function RequestIcon({ module }: { module: string }) {
  if (module === "leave") return <Clock3 className="size-5" />;
  if (module === "employee") return <UserRound className="size-5" />;
  return <FileCheck2 className="size-5" />;
}

function EmptyState({ view }: { view: ApprovalView }) {
  return (
    <div className="rounded-xl border border-dashed px-5 py-14 text-center">
      <span className="mx-auto grid size-11 place-items-center rounded-lg bg-fruition-50 text-fruition-700">
        <CheckCircle2 className="size-6" />
      </span>
      <p className="mt-3 text-sm font-semibold">{view === "queue" ? "Your approval queue is clear" : "No submitted requests"}</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
        {view === "queue" ? "New requests waiting for your action will appear here." : "Requests you submit through a workflow will be tracked here."}
      </p>
    </div>
  );
}

function PendingCard({ request }: { request: ApprovalRequest }) {
  const action = useApprovalAction();
  const [comments, setComments] = useState("");

  const run = async (nextAction: "approve" | "reject" | "return") => {
    try {
      await action.mutateAsync({ id: request.id, action: nextAction, comments: comments.trim() || undefined });
      toast.success(`Request ${nextAction === "approve" ? "approved" : nextAction === "reject" ? "rejected" : "returned"}.`);
    } catch (error) {
      toast.error(apiErrorMessage(error));
    }
  };

  return (
    <li className="rounded-xl border bg-card shadow-sm">
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
        <div className="flex min-w-0 gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-fruition-50 text-fruition-700">
            <RequestIcon module={request.module} />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold">{moduleLabel(request.module)}</p>
              <span className="text-xs text-muted-foreground">Request #{request.id}</span>
            </div>
            <p className="mt-1 break-words text-base font-medium">{request.record_summary}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Requested by {request.requested_by.name} on {formatDate(request.submitted_at)}
            </p>
          </div>
        </div>
        <StatusBadge status={request.status} />
      </div>

      <div className="border-t bg-muted/20 px-4 py-3 sm:px-5">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span>Current step: <strong className="font-medium text-foreground">{request.current_step?.name ?? "Final review"}</strong></span>
          <span>Approver role: <strong className="font-medium text-foreground">{request.current_step?.approver_role ?? "Owner"}</strong></span>
          {request.actions.length > 0 && <span>{request.actions.length} prior action{request.actions.length === 1 ? "" : "s"}</span>}
        </div>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            className="h-10 min-w-0 flex-1 bg-background"
            placeholder="Add a comment (optional)"
            value={comments}
            onChange={(event) => setComments(event.target.value)}
            aria-label={`Comment for request ${request.id}`}
          />
          <div className="grid grid-cols-1 gap-2 sm:flex">
            <Button className="w-full sm:w-auto" size="sm" disabled={action.isPending} onClick={() => void run("approve")}>
              <CheckCircle2 className="size-4" /> Approve
            </Button>
            <Button className="w-full sm:w-auto" size="sm" variant="destructive" disabled={action.isPending} onClick={() => void run("reject")}>
              <XCircle className="size-4" /> Reject
            </Button>
            <Button className="w-full sm:w-auto" size="sm" variant="outline" disabled={action.isPending} onClick={() => void run("return")}>
              <CornerUpLeft className="size-4" /> Return
            </Button>
          </div>
        </div>
      </div>
    </li>
  );
}

function MyRequestRow({ request }: { request: ApprovalRequest }) {
  return (
    <li className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
          <RequestIcon module={request.module} />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{moduleLabel(request.module)} / {request.record_summary}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Submitted {formatDate(request.submitted_at)}
            {request.current_step ? ` / Awaiting ${request.current_step.name}` : request.completed_at ? ` / Completed ${formatDate(request.completed_at)}` : ""}
          </p>
        </div>
      </div>
      <StatusBadge status={request.status} />
    </li>
  );
}

export function ApprovalsPage() {
  const { data, isLoading } = useApprovals();
  const [view, setView] = useState<ApprovalView>("queue");
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");

  const pendingRequests = data?.pending_for_me ?? EMPTY_REQUESTS;
  const myRequests = data?.my_requests ?? EMPTY_REQUESTS;
  const modules = useMemo(() => Array.from(new Set([...pendingRequests, ...myRequests].map((request) => request.module))).sort(), [myRequests, pendingRequests]);
  const visibleRequests = useMemo(() => {
    const source = view === "queue" ? pendingRequests : myRequests;
    const term = search.trim().toLowerCase();
    return source.filter((request) => {
      const matchesModule = moduleFilter === "all" || request.module === moduleFilter;
      const searchable = `${moduleLabel(request.module)} ${request.record_summary} ${request.requested_by.name}`.toLowerCase();
      return matchesModule && (!term || searchable.includes(term));
    });
  }, [moduleFilter, myRequests, pendingRequests, search, view]);

  const approvedMine = myRequests.filter((request) => request.status === "approved").length;
  const pendingMine = myRequests.filter((request) => request.status === "pending").length;
  const completedMine = myRequests.filter((request) => ["approved", "rejected", "cancelled"].includes(request.status)).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Approvals"
        description="Review requests assigned to you and track the workflows you have submitted."
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Waiting for me", value: pendingRequests.length, detail: "Requests needing action", icon: Inbox, tone: "text-amber-700 bg-amber-50" },
          { label: "My pending", value: pendingMine, detail: "Your submitted workflows", icon: Clock3, tone: "text-blue-700 bg-blue-50" },
          { label: "My approved", value: approvedMine, detail: "Approved submissions", icon: CheckCircle2, tone: "text-fruition-700 bg-fruition-50" },
          { label: "My completed", value: completedMine, detail: "Closed workflows", icon: FileCheck2, tone: "text-slate-700 bg-slate-100" },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border bg-card p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <span className={`grid size-9 place-items-center rounded-lg ${item.tone}`}><item.icon className="size-4" /></span>
              <span className="text-2xl font-bold tracking-tight">{item.value}</span>
            </div>
            <p className="mt-3 text-sm font-semibold">{item.label}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{item.detail}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1" role="tablist" aria-label="Approval views">
        <button type="button" role="tab" aria-selected={view === "queue"} onClick={() => setView("queue")} className={`flex h-10 items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors ${view === "queue" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
          <Inbox className="size-4" /> Review queue <span className="rounded-full bg-muted px-1.5 py-0.5 text-[11px]">{pendingRequests.length}</span>
        </button>
        <button type="button" role="tab" aria-selected={view === "mine"} onClick={() => setView("mine")} className={`flex h-10 items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors ${view === "mine" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
          <UserRound className="size-4" /> My requests <span className="rounded-full bg-muted px-1.5 py-0.5 text-[11px]">{myRequests.length}</span>
        </button>
      </div>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold">{view === "queue" ? "Pending my approval" : "My submitted requests"}</h2>
            <p className="mt-1 text-xs text-muted-foreground">{view === "queue" ? "Take action on the requests currently assigned to your role." : "Follow the status and current step of your own requests."}</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="h-10 pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search requests" aria-label="Search approvals" />
            </div>
            <div className="relative sm:w-40">
              <Filter className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <select className="h-10 w-full rounded-lg border border-slate-300 bg-background pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 dark:border-slate-600" value={moduleFilter} onChange={(event) => setModuleFilter(event.target.value)} aria-label="Filter approvals by module">
                <option value="all">All modules</option>
                {modules.map((module) => <option key={module} value={module}>{moduleLabel(module)}</option>)}
              </select>
            </div>
          </div>
        </div>

        {isLoading ? (
          <Skeleton className="h-56 w-full" />
        ) : visibleRequests.length === 0 ? (
          <EmptyState view={view} />
        ) : view === "queue" ? (
          <ul className="space-y-3">{visibleRequests.map((request) => <PendingCard key={request.id} request={request} />)}</ul>
        ) : (
          <ul className="divide-y rounded-xl border bg-card shadow-sm">{visibleRequests.map((request) => <MyRequestRow key={request.id} request={request} />)}</ul>
        )}
      </section>
    </div>
  );
}
