"use client";

import type { ReactNode } from "react";

import { useCan } from "@/features/auth/use-auth";

/**
 * Permission-gated rendering. UX only — the API enforces authorization.
 *
 *     <Can permission="payroll.approve"><ApproveButton /></Can>
 */
export function Can({
  permission,
  children,
  fallback = null,
}: {
  permission: string;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return useCan(permission) ? <>{children}</> : <>{fallback}</>;
}
