"use client";

import { LayoutDashboard } from "lucide-react";
import type { ReactNode } from "react";

import { RequireAuth } from "@/features/auth/require-auth";
import { AppShell, type NavItem } from "@/components/app-shell";

// Nav grows as modules land: Employees, Attendance, Leave, Payroll…
const nav: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
];

export default function TenantProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <RequireAuth>
      <AppShell title="FruitionHR" nav={nav}>
        {children}
      </AppShell>
    </RequireAuth>
  );
}
