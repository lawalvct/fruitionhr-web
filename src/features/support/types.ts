export type TicketStatus =
  | "open"
  | "in_progress"
  | "waiting_on_customer"
  | "resolved"
  | "closed";

export type TicketPriority = "low" | "normal" | "high" | "urgent";

export const TICKET_CATEGORIES = [
  "payroll",
  "billing",
  "attendance",
  "account",
  "technical",
  "other",
] as const;

export const TICKET_PRIORITIES: TicketPriority[] = ["low", "normal", "high", "urgent"];

export interface TicketMessage {
  id: number;
  body: string;
  author_type: "customer" | "agent";
  /** Agent-only note. The tenant API never returns these. */
  is_internal: boolean;
  author?: { id: number; name: string } | null;
  created_at: string | null;
}

export interface SupportTicket {
  id: number;
  reference: string;
  subject: string;
  category: string;
  priority: TicketPriority;
  status: TicketStatus;
  is_closed: boolean;
  message_count: number;
  opened_by?: { id: number; name: string; email: string } | null;
  assignee?: { id: number; name: string } | null;
  company?: { id: number; name: string } | null;
  last_customer_reply_at: string | null;
  last_agent_reply_at: string | null;
  resolved_at: string | null;
  created_at: string | null;
  messages?: TicketMessage[];
}

export interface TicketSummary {
  open: number;
  in_progress: number;
  waiting_on_customer: number;
  resolved: number;
  unassigned: number;
}

/** Shared labels so both surfaces describe a status the same way. */
export const STATUS_LABELS: Record<TicketStatus, string> = {
  open: "Open",
  in_progress: "In progress",
  waiting_on_customer: "Awaiting your reply",
  resolved: "Resolved",
  closed: "Closed",
};

export function statusTone(status: TicketStatus): string {
  switch (status) {
    case "open":
      return "bg-amber-50 text-amber-800";
    case "in_progress":
      return "bg-blue-50 text-blue-700";
    case "waiting_on_customer":
      return "bg-violet-50 text-violet-700";
    case "resolved":
      return "bg-fruition-50 text-fruition-800";
    default:
      return "bg-slate-100 text-slate-600";
  }
}
