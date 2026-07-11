"use client";

import { Banknote, CalendarClock, CalendarDays, ClipboardCheck, LayoutDashboard, Settings, UserRound, Users } from "lucide-react";
import type { ReactNode } from "react";

import { RequireAuth } from "@/features/auth/require-auth";
import { AppShell, type NavItem } from "@/components/app-shell";

// Nav grows as modules land: Employees, Attendance, Leave, Payroll…
import { BriefcaseBusiness, Gauge } from 'lucide-react';

const nav: NavItem[] = [
  { href: '/recruitment', label: 'Recruitment', icon: BriefcaseBusiness, permission: 'recruitment.view' },
  { href: '/performance', label: 'Performance', icon: Gauge, permission: ['performance.view', 'performance.review', 'goals.view'] },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/self-service", label: "Self-service", icon: UserRound, permission: "ess.profile.view" },
  { href: "/employees", label: "Employees", icon: Users, permission: "employees.view" },
  { href: "/attendance", label: "Attendance", icon: CalendarClock, permission: "attendance.view" },
  { href: "/leave", label: "Leave", icon: CalendarDays, permission: "leave.view" },
  { href: "/payroll", label: "Payroll", icon: Banknote, permission: "payroll.view" },
  { href: "/approvals", label: "Approvals", icon: ClipboardCheck, permission: "mss.approvals.view" },
  { href: "/settings/organisation", label: "Settings", icon: Settings, permission: "company.view" },
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
