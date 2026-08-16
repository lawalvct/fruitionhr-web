"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, RefreshCw, XCircle } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MoneyText } from "@/components/money-text";
import { apiErrorMessage } from "@/lib/api";
import type { BillingPayment } from "./types";
import { useVerifyPayment } from "./use-billing";

/**
 * Where the gateway sends the customer's browser back to.
 *
 * Paystack returns `reference` (and `trxref`); Nomba returns `orderReference`.
 * Whichever arrives is only a lookup key — the API re-checks the charge with
 * the gateway server-side, because this query string is user-controlled.
 *
 * This screen is the one someone lands on straight after being charged, so it
 * must never dead-end: a failure here is recoverable by retrying, and the
 * money is safe regardless because the payment is settled server-side by
 * webhook or by the scheduled reconciliation sweep.
 */
export function PaymentCallbackPage() {
  const params = useSearchParams();
  const verify = useVerifyPayment();
  const [payment, setPayment] = useState<BillingPayment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  const reference =
    params.get("reference") ?? params.get("trxref") ?? params.get("orderReference");

  // Derived, not state: a missing reference is knowable at render time.
  const failure = reference ? error : "We could not tell which payment this was for.";

  const runVerify = useCallback(async () => {
    if (!reference) return;

    setError(null);
    try {
      setPayment((await verify.mutateAsync(reference)).data);
    } catch (cause) {
      setError(apiErrorMessage(cause));
    }
    // verify is stable for this page load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reference]);

  useEffect(() => {
    if (started.current || !reference) return;
    started.current = true;
    void runVerify();
    // Runs once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const succeeded = payment?.status === "successful";
  const checking = verify.isPending;

  return (
    <div className="mx-auto grid min-h-[60vh] w-full max-w-lg place-items-center px-4">
      <Card className="w-full">
        <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
          {checking ? (
            <>
              <Loader2 className="size-8 animate-spin text-fruition-600" />
              <p className="text-base font-semibold text-slate-900">
                Confirming your payment
              </p>
              <p className="text-sm text-slate-600">
                This takes a moment. Please do not close the page.
              </p>
            </>
          ) : succeeded ? (
            <>
              <CheckCircle2 className="size-10 text-fruition-600" />
              <p className="text-lg font-semibold text-slate-900">Payment confirmed</p>
              <p className="text-sm text-slate-600">
                <MoneyText kobo={payment.amount} /> received. Your subscription is active.
              </p>
              <Button className="mt-2" render={<Link href="/billing" />}>
                Back to billing
              </Button>
            </>
          ) : failure ? (
            <>
              <XCircle className="size-10 text-amber-600" />
              <p className="text-lg font-semibold text-slate-900">
                We could not confirm this yet
              </p>
              <p className="text-sm text-slate-600">{failure}</p>
              <p className="mt-1 text-xs text-slate-500">
                If you completed payment, it is safe — we reconcile with the payment
                provider automatically and your plan will activate shortly.
              </p>
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                {reference && (
                  <Button onClick={() => void runVerify()}>
                    <RefreshCw className="size-4" /> Try again
                  </Button>
                )}
                <Button variant="outline" render={<Link href="/billing" />}>
                  Back to billing
                </Button>
              </div>
            </>
          ) : (
            <>
              <XCircle className="size-10 text-red-600" />
              <p className="text-lg font-semibold text-slate-900">Payment not completed</p>
              <p className="text-sm text-slate-600">
                The provider did not confirm this charge. You have not been billed.
              </p>
              <div className="mt-2 flex flex-wrap justify-center gap-2">
                <Button onClick={() => void runVerify()}>
                  <RefreshCw className="size-4" /> Check again
                </Button>
                <Button variant="outline" render={<Link href="/billing" />}>
                  Back to billing
                </Button>
              </div>
            </>
          )}

          {reference && <p className="mt-2 font-mono text-xs text-slate-400">{reference}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
