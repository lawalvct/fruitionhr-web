"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { useMe } from "@/features/auth/use-auth";
import { PageLoader } from "@/components/page-loader";

/**
 * Client-side auth guard for protected layouts. Guests are bounced to /login
 * (host-relative, so it works on both the app and admin surfaces).
 *
 * UX only — the API rejects unauthenticated requests regardless.
 */
export function RequireAuth({
  children,
  superAdminOnly = false,
}: {
  children: ReactNode;
  superAdminOnly?: boolean;
}) {
  const router = useRouter();
  const { data: me, isPending } = useMe();

  const denied = !isPending && (!me || (superAdminOnly && !me.is_super_admin));
  const activationPath = !isPending && me && !superAdminOnly
    ? !me.is_email_verified
      ? "/verify-email"
      : me.roles?.includes("owner") &&
          me.tenant?.onboarding_status !== "completed" &&
          me.tenant?.onboarding_status !== "skipped"
        ? "/onboarding"
        : null
    : null;

  useEffect(() => {
    if (denied) router.replace("/login");
    else if (activationPath) router.replace(activationPath);
  }, [activationPath, denied, router]);

  if (isPending) {
    return <div className="min-h-screen"><PageLoader label="Preparing your workspace…" /></div>;
  }

  if (denied || activationPath) return null;

  return <>{children}</>;
}
