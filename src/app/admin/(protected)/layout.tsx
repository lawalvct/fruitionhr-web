"use client";

import { Activity, BriefcaseBusiness, Building2, LayoutDashboard, Newspaper, ShieldCheck, Users } from "lucide-react";
import type { ReactNode } from "react";

import { RequireAuth } from "@/features/auth/require-auth";
import { AppShell, type NavItem } from "@/components/app-shell";

const nav: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/tenants", label: "Companies", icon: Building2 },
  { href: "/users", label: "Users", icon: Users },
  { href: "/careers", label: "Careers", icon: BriefcaseBusiness },
  { href: "/blog", label: "Blog", icon: Newspaper },
  { href: "/administrators", label: "Administrators", icon: ShieldCheck },
  { href: "/activity", label: "Activity log", icon: Activity },
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
