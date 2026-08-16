"use client";

import { CheckCircle2, KeyRound, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { apiErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  usePaymentGateways,
  useUpdatePaymentGateways,
  type GatewayRow,
} from "./use-admin-billing";

/**
 * Which payment methods companies are offered.
 *
 * A gateway needs two things to go live: API credentials (set on the server,
 * not here) and this switch. Showing both states separately means an admin can
 * see *why* something cannot be turned on.
 */
export function PaymentGatewaysCard() {
  const gateways = usePaymentGateways();
  const update = useUpdatePaymentGateways();
  const [pendingSlug, setPendingSlug] = useState<string | null>(null);

  const rows = gateways.data?.data ?? [];
  const enabled = rows.filter((row) => row.enabled).map((row) => row.slug);
  const current = gateways.data?.meta.default ?? null;

  const save = async (next: string[], nextDefault: string | null, slug: string) => {
    setPendingSlug(slug);
    try {
      const result = await update.mutateAsync({ enabled: next, default: nextDefault });
      toast.success(result.message);
    } catch (error) {
      toast.error(apiErrorMessage(error));
    } finally {
      setPendingSlug(null);
    }
  };

  const toggle = (row: GatewayRow) => {
    const next = row.enabled
      ? enabled.filter((slug) => slug !== row.slug)
      : [...enabled, row.slug];

    // Dropping the current default means picking a new one.
    const nextDefault = next.includes(current ?? "") ? current : (next[0] ?? null);

    void save(next, nextDefault, row.slug);
  };

  const makeDefault = (row: GatewayRow) => void save(enabled, row.slug, row.slug);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Payment methods</CardTitle>
        <p className="mt-1 text-sm text-slate-600">
          Choose what companies can pay with. Switch on both and they pick at checkout.
        </p>
      </CardHeader>

      <CardContent className="space-y-3">
        {gateways.isPending ? (
          <>
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </>
        ) : (
          rows.map((row) => (
            <div
              key={row.slug}
              className={cn(
                "flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4",
                row.enabled ? "border-fruition-200 bg-fruition-50/50" : "border-slate-200",
              )}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-900">{row.label}</span>
                  {row.is_default && row.enabled && (
                    <span className="rounded-full bg-fruition-600 px-2 py-0.5 text-[10px] font-bold tracking-wide text-white uppercase">
                      Default
                    </span>
                  )}
                </div>
                <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                  {row.configured ? (
                    <>
                      <CheckCircle2 className="size-3.5 text-fruition-600" /> API keys in place
                    </>
                  ) : (
                    <>
                      <KeyRound className="size-3.5 text-amber-600" /> No API keys — add them on
                      the server before switching on
                    </>
                  )}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {row.enabled && !row.is_default && (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={update.isPending}
                    onClick={() => makeDefault(row)}
                  >
                    Make default
                  </Button>
                )}
                <Button
                  variant={row.enabled ? "outline" : "default"}
                  size="sm"
                  disabled={update.isPending || (!row.enabled && !row.configured)}
                  onClick={() => toggle(row)}
                >
                  {pendingSlug === row.slug && update.isPending && (
                    <Loader2 className="size-3.5 animate-spin" />
                  )}
                  {row.enabled ? "Switch off" : "Switch on"}
                </Button>
              </div>
            </div>
          ))
        )}

        <p className="text-xs text-slate-500">
          At least one method must stay on, otherwise no company can pay.
        </p>
      </CardContent>
    </Card>
  );
}
