"use client";

import { Building2, LayoutDashboard } from "lucide-react";
import type { ReactNode } from "react";

import { RequireAuth } from "@/features/auth/require-auth";
import { AppShell, type NavItem } from "@/components/app-shell";

const nav: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/tenants", label: "Companies", icon: Building2 },
];

export default function AdminProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <RequireAuth superAdminOnly>
      <AppShell title="FruitionHR Admin" nav={nav}>
        {children}
      </AppShell>
    </RequireAuth>
  );
}
