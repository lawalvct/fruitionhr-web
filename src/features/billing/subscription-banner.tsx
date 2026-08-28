"use client";

import Link from "next/link";
import { Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSubscriptionStatus } from "./use-billing";

/**
 * Full-width notice for the one case that actually blocks work: the workspace
 * has gone read-only and writes are being refused with 402.
 *
 * Everything softer — trial countdown, payment due, upgrade available — lives
 * in the sidebar pill instead, so ordinary days are not spent under a banner.
 */
export function SubscriptionBanner() {
  // Reads the ungated status endpoint, not the full subscription: a user
  // without billing.view still has to be told why their saves are failing.
  const { data: subscription } = useSubscriptionStatus();

  if (!subscription) return null;

  // Locked out of writing — the most urgent case.
  if (!subscription.is_usable) {
    return (
      <Notice
        tone="danger"
        icon={<Lock className="size-4" />}
        title="Your workspace is read-only"
        body="Your subscription has ended. You can still view and export everything, but changes are paused until you renew."
        action={{ href: "/billing", label: "Renew now" }}
      />
    );
  }

  return null;
}

function Notice({
  tone,
  icon,
  title,
  body,
  action,
}: {
  tone: "danger" | "warning";
  icon: React.ReactNode;
  title: string;
  body: string;
  action: { href: string; label: string };
}) {
  return (
    <div
      className={cn(
        "mb-4 flex flex-col gap-3 rounded-xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
        tone === "danger"
          ? "border-red-200 bg-red-50"
          : "border-amber-200 bg-amber-50",
      )}
    >
      <div className="flex items-start gap-2.5">
        <span
          className={cn(
            "mt-0.5 shrink-0",
            tone === "danger" ? "text-red-600" : "text-amber-600",
          )}
        >
          {icon}
        </span>
        <div className="min-w-0">
          <p
            className={cn(
              "text-sm font-semibold",
              tone === "danger" ? "text-red-900" : "text-amber-900",
            )}
          >
            {title}
          </p>
          <p
            className={cn(
              "mt-0.5 text-xs leading-5",
              tone === "danger" ? "text-red-800/90" : "text-amber-800/90",
            )}
          >
            {body}
          </p>
        </div>
      </div>

      <Button
        size="sm"
        className={cn(
          "shrink-0",
          tone === "danger"
            ? "bg-red-600 text-white hover:bg-red-700"
            : "bg-amber-600 text-white hover:bg-amber-700",
        )}
        render={<Link href={action.href} />}
      >
        {action.label}
      </Button>
    </div>
  );
}
