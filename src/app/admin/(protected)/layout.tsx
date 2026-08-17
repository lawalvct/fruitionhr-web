"use client";

import { Activity, BriefcaseBusiness, Building2, CreditCard, LayoutDashboard, LifeBuoy, Newspaper, ShieldCheck, Users } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { RequireAuth } from "@/features/auth/require-auth";
import { AppShell, type NavItem } from "@/components/app-shell";
import { PageLoader } from "@/components/page-loader";
import { useMe } from "@/features/auth/use-auth";
import { abilityForPath, adminHomeDestination, hasAbility } from "@/features/admin/admin-access";
import type { PlatformAbility } from "@/types/auth";

/**
 * The sidebar. Each entry names the ability it needs, so a support agent and a
 * blog editor see two different consoles — see features/admin/admin-access.
 */
const nav: (NavItem & { ability: PlatformAbility })[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, ability: "dashboard" },
  { href: "/tenants", label: "Companies", icon: Building2, ability: "tenants" },
  { href: "/users", label: "Users", icon: Users, ability: "users" },
  { href: "/support", label: "Support", icon: LifeBuoy, ability: "support" },
  { href: "/billing", label: "Billing", icon: CreditCard, ability: "billing" },
  { href: "/careers", label: "Careers", icon: BriefcaseBusiness, ability: "careers" },
  { href: "/blog", label: "Blog", icon: Newspaper, ability: "blog" },
  { href: "/administrators", label: "Administrators", icon: ShieldCheck, ability: "administrators" },
  { href: "/activity", label: "Activity log", icon: Activity, ability: "activity" },
];

export default function AdminProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <RequireAuth superAdminOnly>
      <AdminConsole>{children}</AdminConsole>
    </RequireAuth>
  );
}

/**
 * Renders the console the current administrator is entitled to.
 *
 * Separate from the layout so it sits inside RequireAuth — by the time this
 * runs the profile has loaded and we know which sections to draw.
 */
function AdminConsole({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: me } = useMe();

  const required = abilityForPath(pathname);
  // Only a gated section can be refused; ungated pages (/profile) are fine.
  const refused = required !== null && me != null && !hasAbility(me, required);
  const home = adminHomeDestination(me);

  useEffect(() => {
    if (refused) router.replace(home);
  }, [home, refused, router]);

  if (refused) {
    return <div className="min-h-screen"><PageLoader label="Taking you somewhere you can work…" /></div>;
  }

  return (
    <AppShell title="FruitionHR Admin" nav={nav.filter((item) => hasAbility(me, item.ability))}>
      {children}
    </AppShell>
  );
}
