"use client";

import Link from "next/link";
import { AlertTriangle, ArrowUpRight, Clock, Lock } from "lucide-react";

import { cn } from "@/lib/utils";
import { useSubscription } from "./use-billing";

function daysUntil(value: string | null): number {
  if (!value) return 0;
  return Math.max(0, Math.ceil((new Date(value).getTime() - Date.now()) / 86_400_000));
}

/**
 * Compact billing status shown under the company name in the sidebar.
 *
 * Always visible while something needs attention, on every page — a company
 * should never discover it is read-only by having a save fail. Renders nothing
 * when the subscription is healthy and nothing needs saying.
 */
export function SubscriptionPill({ collapsed = false }: { collapsed?: boolean }) {
  const { data } = useSubscription();
  const subscription = data?.data;

  if (!subscription) return null;

  const state = resolveState(
    subscription.is_usable,
    subscription.on_trial,
    subscription.status,
    daysUntil(subscription.trial_ends_at),
    Boolean(data?.meta.suggested_plan),
  );

  if (!state) return null;

  // Collapsed rail: a dot is all that fits, but keep it discoverable by title.
  if (collapsed) {
    return (
      <Link
        href="/billing"
        title={state.label}
        className={cn("mx-auto block size-2 rounded-full", state.dot)}
        aria-label={state.label}
      />
    );
  }

  return (
    <Link
      href="/billing"
      className={cn(
        "mt-1 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold transition",
        state.className,
      )}
    >
      {state.icon}
      {state.label}
    </Link>
  );
}

function resolveState(
  isUsable: boolean,
  onTrial: boolean,
  status: string,
  trialDays: number,
  hasSuggestion: boolean,
) {
  if (!isUsable) {
    return {
      label: "Read-only — renew",
      icon: <Lock className="size-3" />,
      className: "bg-red-500/20 text-red-100 hover:bg-red-500/30",
      dot: "bg-red-400",
    };
  }

  if (status === "past_due") {
    return {
      label: "Payment needed",
      icon: <AlertTriangle className="size-3" />,
      className: "bg-amber-400/20 text-amber-100 hover:bg-amber-400/30",
      dot: "bg-amber-300",
    };
  }

  if (onTrial) {
    return {
      label: trialDays === 0 ? "Trial ends today" : `Trial · ${trialDays}d left`,
      icon: <Clock className="size-3" />,
      className: "bg-white/15 text-white/90 hover:bg-white/25",
      dot: "bg-white/70",
    };
  }

  if (hasSuggestion) {
    return {
      label: "Upgrade available",
      icon: <ArrowUpRight className="size-3" />,
      className: "bg-amber-400/20 text-amber-100 hover:bg-amber-400/30",
      dot: "bg-amber-300",
    };
  }

  // Paid and inside the period: nothing worth taking up sidebar space.
  return null;
}
