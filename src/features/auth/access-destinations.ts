import type { Me } from "@/types/auth";

/** Permissions that make the management dashboard useful to the current user. */
export const DASHBOARD_PERMISSIONS: string[] = [
  "employees.view",
  "attendance.view",
  "leave.view",
  "payroll.view",
  "performance.view",
  "mss.approvals.view",
];

function hasPermission(me: Me, permission: string): boolean {
  return Boolean(me.is_super_admin || me.permissions?.includes(permission));
}

export function canAccessTenantDashboard(me: Me): boolean {
  return Boolean(
    me.is_super_admin || DASHBOARD_PERMISSIONS.some((permission) => hasPermission(me, permission)),
  );
}

/** Finds the most useful authorized landing page for a tenant user. */
export function tenantHomeDestination(me: Me): string {
  if (canAccessTenantDashboard(me)) return "/dashboard";

  const destinations: Array<{
    href: string;
    permission: string;
    requiresEmployee?: boolean;
  }> = [
    { href: "/self-service/profile", permission: "ess.profile.view", requiresEmployee: true },
    { href: "/self-service/leave", permission: "ess.leave.view", requiresEmployee: true },
    { href: "/self-service/attendance", permission: "ess.attendance.view", requiresEmployee: true },
    { href: "/self-service/payslips", permission: "ess.payslips.view", requiresEmployee: true },
    { href: "/self-service/loans", permission: "ess.loans.view", requiresEmployee: true },
    { href: "/reports", permission: "reports.view" },
    { href: "/approvals", permission: "mss.approvals.view" },
    { href: "/employees", permission: "employees.view" },
    { href: "/attendance", permission: "attendance.view" },
    { href: "/leave", permission: "leave.view" },
    { href: "/recruitment", permission: "recruitment.view" },
    { href: "/performance", permission: "performance.view" },
    { href: "/performance", permission: "performance.review" },
    { href: "/performance", permission: "goals.view" },
    { href: "/payroll", permission: "payroll.view" },
    { href: "/overtime", permission: "overtime.view" },
    { href: "/loans", permission: "loans.view" },
    { href: "/settings/organisation", permission: "company.view" },
    { href: "/settings/access", permission: "roles.manage" },
  ];

  return (
    destinations.find(
      (destination) =>
        (!destination.requiresEmployee || Boolean(me.employee)) &&
        hasPermission(me, destination.permission),
    )?.href ?? "/profile"
  );
}
