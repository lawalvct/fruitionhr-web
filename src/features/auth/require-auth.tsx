"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { useMe } from "@/features/auth/use-auth";
import { Skeleton } from "@/components/ui/skeleton";

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

  useEffect(() => {
    if (denied) router.replace("/login");
  }, [denied, router]);

  if (isPending) {
    return (
      <div className="flex min-h-screen flex-col gap-4 p-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (denied) return null;

  return <>{children}</>;
}
