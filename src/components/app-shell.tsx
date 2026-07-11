"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, type LucideIcon } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { useLogout, useMe } from "@/features/auth/use-auth";
import { NotificationBell } from "@/features/notifications/notification-bell";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  permission?: string | string[];
}

/**
 * Sidebar + header shell shared by the tenant and admin surfaces.
 * Each surface passes its own nav items and title.
 */
export function AppShell({
  title,
  nav,
  children,
}: {
  title: string;
  nav: NavItem[];
  children: ReactNode;
}) {
  const pathname = usePathname();
  const { data: me } = useMe();
  const logout = useLogout();
  const permissions = me?.permissions ?? [];

  // Self-contained profile menu (plain React — reliable regardless of the
  // dropdown primitive) with click-outside to close.
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [menuOpen]);

  const visibleNav = nav.filter((item) => {
    if (!item.permission || me?.is_super_admin) return true;
    const required = Array.isArray(item.permission) ? item.permission : [item.permission];
    return required.some((permission) => permissions.includes(permission));
  });

  const initials = (me?.name ?? "?")
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 flex-col bg-sidebar text-sidebar-foreground md:flex">
        <div className="flex h-14 items-center border-b border-sidebar-border px-4 font-semibold text-white">
          {title}
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-2">
          {visibleNav.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/75 hover:bg-white/10 hover:text-white",
                )}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b px-4">
          <div className="text-sm text-muted-foreground">
            {me?.tenant?.name}
          </div>
          <div className="flex items-center gap-1">
            <NotificationBell />
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((open) => !open)}
                className={cn(buttonVariants({ variant: "ghost" }), "gap-2 px-2")}
              >
                <Avatar className="size-7">
                  <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                </Avatar>
                <span className="hidden text-sm sm:inline">{me?.name}</span>
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-full z-50 mt-1 w-52 rounded-lg border bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10"
                >
                  <div className="truncate px-2 py-1.5 text-sm text-muted-foreground">
                    {me?.email}
                  </div>
                  <div className="my-1 h-px bg-border" />
                  <button
                    type="button"
                    role="menuitem"
                    disabled={logout.isPending}
                    onClick={() => {
                      setMenuOpen(false);
                      logout.mutate();
                    }}
                    className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
                  >
                    <LogOut className="size-4" />
                    {logout.isPending ? "Signing out…" : "Sign out"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
