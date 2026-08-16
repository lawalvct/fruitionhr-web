import { Suspense } from "react";

import { PaymentCallbackPage } from "@/features/billing/payment-callback-page";

export const metadata = { title: "Confirming payment" };

export default function BillingCallbackRoute() {
  // useSearchParams needs a Suspense boundary during prerender.
  return (
    <Suspense fallback={null}>
      <PaymentCallbackPage />
    </Suspense>
  );
}
