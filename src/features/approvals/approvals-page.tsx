"use client";

import { CheckCircle2, CornerUpLeft, XCircle } from "lucide-react";
import { useState } from "react";
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

function moduleLabel(module: string): string {
  return module.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

function PendingCard({ request }: { request: ApprovalRequest }) {
  const act = useApprovalAction();
  const [comments, setComments] = useState("");

  const run = async (action: "approve" | "reject" | "return") => {
    try {
      await act.mutateAsync({ id: request.id, action, comments: comments || undefined });
      toast.success(`Request ${action === "approve" ? "approved" : action === "reject" ? "rejected" : "returned"}.`);
    } catch (error) {
      toast.error(apiErrorMessage(error));
    }
  };

  return (
    <li className="rounded-xl border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-medium">
            {moduleLabel(request.module)} — {request.record_summary}
          </p>
          <p className="text-sm text-muted-foreground">
            Requested by {request.requested_by.name}
            {request.current_step ? ` · Step: ${request.current_step.name}` : ""}
          </p>
        </div>
        <StatusBadge status={request.status} />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Input
          placeholder="Comments (optional)"
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          className="min-w-52 flex-1"
        />
        <Button size="sm" disabled={act.isPending} onClick={() => run("approve")}>
          <CheckCircle2 className="size-4" /> Approve
        </Button>
        <Button size="sm" variant="destructive" disabled={act.isPending} onClick={() => run("reject")}>
          <XCircle className="size-4" /> Reject
        </Button>
        <Button size="sm" variant="outline" disabled={act.isPending} onClick={() => run("return")}>
          <CornerUpLeft className="size-4" /> Return
        </Button>
      </div>
    </li>
  );
}

export function ApprovalsPage() {
  const { data, isLoading } = useApprovals();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Approvals"
        description="Requests waiting for your action, and the status of your own requests."
      />

      <section className="space-y-3">
        <h2 className="font-heading text-lg font-semibold">Pending my approval</h2>
        {isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : !data?.pending_for_me.length ? (
          <p className="text-sm text-muted-foreground">Nothing waiting for you. 🎉</p>
        ) : (
          <ul className="space-y-3">
            {data.pending_for_me.map((request) => (
              <PendingCard key={request.id} request={request} />
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-lg font-semibold">My requests</h2>
        {isLoading ? (
          <Skeleton className="h-16 w-full" />
        ) : !data?.my_requests.length ? (
          <p className="text-sm text-muted-foreground">You haven&apos;t submitted any requests yet.</p>
        ) : (
          <ul className="divide-y rounded-xl border">
            {data.my_requests.map((request) => (
              <li key={request.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                <div>
                  <p className="text-sm font-medium">
                    {moduleLabel(request.module)} — {request.record_summary}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Submitted {new Date(request.submitted_at).toLocaleDateString()}
                    {request.current_step ? ` · Awaiting: ${request.current_step.name}` : ""}
                  </p>
                </div>
                <StatusBadge status={request.status} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
