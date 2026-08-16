export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "cancelled"
  | "expired";

export type PaymentStatus = "pending" | "successful" | "failed" | "abandoned";

/** All money is integer kobo — format with MoneyText, never divide by hand. */
export interface PlanQuote {
  employees: number;
  billable_seats: number;
  unit_price: number;
  amount: number;
  /** True once headcount passes the plan ceiling — prompt an upgrade. */
  exceeds_ceiling?: boolean;
  ceiling?: number | null;
}

export interface BillingPlan {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  price_per_employee: number;
  billing_interval: "monthly" | "yearly";
  min_employees: number;
  max_employees: number | null;
  trial_days: number;
  features: string[];
  is_active: boolean;
  sort_order: number;
  quote?: PlanQuote;
  subscriptions_count?: number;
}

export interface BillingSubscription {
  id: number;
  status: SubscriptionStatus;
  on_trial: boolean;
  is_usable: boolean;
  trial_ends_at: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancelled_at: string | null;
  ends_at: string | null;
  employee_count: number;
  amount: number;
  plan?: BillingPlan;
}

export interface BillingPayment {
  id: number;
  reference: string;
  gateway: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  employee_count: number;
  paid_at: string | null;
  created_at: string | null;
}

export interface PaymentMethod {
  slug: string;
  label: string;
}

export interface PlansResponse {
  data: BillingPlan[];
  meta: { employees: number; gateways: PaymentMethod[]; currency: string };
}

export interface SubscriptionResponse {
  data: BillingSubscription | null;
  meta: {
    employees: number;
    renewal_quote: PlanQuote | null;
    gateways: PaymentMethod[];
    /** Preselected method when the platform offers more than one. */
    default_gateway?: string | null;
    /** The cheapest plan that fits, when the current one has been outgrown. */
    suggested_plan?: BillingPlan | null;
  };
}
