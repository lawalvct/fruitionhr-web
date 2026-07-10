"use client";

import { CalendarClock, ClipboardCheck, LayoutDashboard, Settings, Users } from "lucide-react";
import type { ReactNode } from "react";

import { RequireAuth } from "@/features/auth/require-auth";
import { AppShell, type NavItem } from "@/components/app-shell";

// Nav grows as modules land: Employees, Attendance, Leave, Payroll…
const nav: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/employees", label: "Employees", icon: Users },
  { href: "/attendance", label: "Attendance", icon: CalendarClock },
  { href: "/approvals", label: "Approvals", icon: ClipboardCheck },
  { href: "/settings/organisation", label: "Settings", icon: Settings },
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
