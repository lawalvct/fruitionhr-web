"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";

export interface ApprovalAction {
  id: number;
  action: "approve" | "reject" | "return";
  comments: string | null;
  by: string;
  at: string;
}

export interface ApprovalRequest {
  id: number;
  module: string;
  status: "pending" | "approved" | "rejected" | "returned" | "cancelled";
  record_type: string;
  record_id: number;
  record_summary: string;
  record_details: null | {
    kind: "money_request";
    type: "advance" | "loan";
    type_label: string;
    principal: number;
    months: number;
    monthly_installment: number;
    start_period: string;
    reason: string | null;
    employee: { id: number; name: string; number: string } | null;
  };
  requested_by: { id: number; name: string };
  current_step: { id: number; name: string; approver_role: string } | null;
  actions: ApprovalAction[];
  submitted_at: string;
  completed_at: string | null;
}

export const APPROVALS_KEY = ["approvals"] as const;

export function useApprovals(enabled = true) {
  return useQuery({
    queryKey: APPROVALS_KEY,
    enabled,
    queryFn: async () => {
      const { data } = await api.get<{
        data: { pending_for_me: ApprovalRequest[]; my_requests: ApprovalRequest[] };
      }>("/api/v1/approvals");
      return data.data;
    },
  });
}

export function useApprovalAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      action,
      comments,
    }: {
      id: number;
      action: "approve" | "reject" | "return";
      comments?: string;
    }) => {
      const { data } = await api.post<{ data: ApprovalRequest }>(
        `/api/v1/approvals/${id}/${action}`,
        { comments },
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: APPROVALS_KEY });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
