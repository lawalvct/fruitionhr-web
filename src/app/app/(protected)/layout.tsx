"use client";

import {
  Banknote,
  BriefcaseBusiness,
  CalendarClock,
  CalendarDays,
  ClipboardCheck,
  Clock,
  Gauge,
  HandCoins,
  LayoutDashboard,
  Receipt,
  Settings,
  Timer,
  UserRound,
  Users,
} from "lucide-react";
import type { ReactNode } from "react";

import { RequireAuth } from "@/features/auth/require-auth";
import { AppShell, type NavItem } from "@/components/app-shell";

// Grouped sidebar nav; items are permission-gated per user.
const nav: NavItem[] = [
  { group: "Workspace", href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { group: "Workspace", href: "/approvals", label: "Approvals", icon: ClipboardCheck, permission: "mss.approvals.view" },

  { group: "People", href: "/employees", label: "Employees", icon: Users, permission: "employees.view" },
  { group: "People", href: "/attendance", label: "Attendance", icon: CalendarClock, permission: "attendance.view" },
  { group: "People", href: "/leave", label: "Leave", icon: CalendarDays, permission: "leave.view" },
  { group: "People", href: "/recruitment", label: "Recruitment", icon: BriefcaseBusiness, permission: "recruitment.view" },
  { group: "People", href: "/performance", label: "Performance", icon: Gauge, permission: ["performance.view", "performance.review", "goals.view"] },

  { group: "Money", href: "/payroll", label: "Payroll", icon: Banknote, permission: "payroll.view" },
  { group: "Money", href: "/overtime", label: "Overtime", icon: Timer, permission: "overtime.view" },
  { group: "Money", href: "/loans", label: "Loans & advances", icon: HandCoins, permission: "loans.view" },

  { group: "Company", href: "/settings/organisation", label: "Settings", icon: Settings, permission: "company.view" },

  { group: "My Self-Service", href: "/self-service/profile", label: "My Profile", icon: UserRound, permission: "ess.profile.view", requiresEmployee: true },
  { group: "My Self-Service", href: "/self-service/leave", label: "My Leave", icon: CalendarDays, permission: "ess.leave.view", requiresEmployee: true },
  { group: "My Self-Service", href: "/self-service/attendance", label: "My Attendance", icon: Clock, permission: "ess.attendance.view", requiresEmployee: true },
  { group: "My Self-Service", href: "/self-service/payslips", label: "My Payslips", icon: Receipt, permission: "ess.payslips.view", requiresEmployee: true },
  { group: "My Self-Service", href: "/self-service/loans", label: "My IOU & Loans", icon: HandCoins, permission: "ess.loans.view", requiresEmployee: true },
];

export default function TenantProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <RequireAuth>
      <AppShell title="FruitionHR" nav={nav} enableEmployeeSearch>
        {children}
      </AppShell>
    </RequireAuth>
  );
}
