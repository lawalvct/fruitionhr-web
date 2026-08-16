import 'server-only';

export interface PublicPlan {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  /** Integer kobo, per employee, per billing interval. */
  price_per_employee: number;
  billing_interval: 'monthly' | 'yearly';
  min_employees: number;
  max_employees?: number | null;
  trial_days: number;
  features: string[];
  sort_order: number;
}

function apiUrl(path: string): string {
  const base = process.env.API_INTERNAL_URL
    ?? process.env.NEXT_PUBLIC_API_URL
    ?? 'http://localhost:8010';

  return new URL(path, base.endsWith('/') ? base : `${base}/`).toString();
}

/**
 * The live price list.
 *
 * Returns null when the API cannot be reached. Callers must render a
 * "contact us" state rather than falling back to hardcoded numbers — showing
 * a price we might no longer charge is worse than showing none.
 */
export async function getPublicPlans(): Promise<PublicPlan[] | null> {
  try {
    const response = await fetch(apiUrl('/api/v1/plans'), {
      // Read live, matching the careers and blog pages. Caching at build time
      // would bake in whatever the API said during the build — including the
      // "unavailable" state if it happened to be down.
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) return null;

    const payload = await response.json() as { data: PublicPlan[] };

    return payload.data ?? [];
  } catch {
    return null;
  }
}

/** Kobo → "₦1,500". Whole naira: plan prices are never fractional in practice. */
export function formatPlanPrice(kobo: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: kobo % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(kobo / 100);
}

/** "Up to 25 employees", "5–25 employees", or "Unlimited employees". */
export function seatRange(plan: PublicPlan): string {
  // `?? null` on purpose: an absent key and an explicit null both mean
  // "no ceiling", and a strict === null check would print "undefined".
  const max = plan.max_employees ?? null;

  if (max === null) {
    return plan.min_employees > 1
      ? `From ${plan.min_employees} employees, no upper limit`
      : 'Unlimited employees';
  }

  return plan.min_employees > 1
    ? `${plan.min_employees}–${max} employees`
    : `Up to ${max} employees`;
}
