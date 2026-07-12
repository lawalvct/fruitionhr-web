"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronsUpDown, LogOut, Menu, type LucideIcon } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { useLogout, useMe } from "@/features/auth/use-auth";
import { NotificationBell } from "@/features/notifications/notification-bell";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  permission?: string | string[];
  /** Optional section label; consecutive items with the same group are bundled. */
  group?: string;
}

/* ── Profile menu (self-contained; used in header and sidebar card) ───────── */

function ProfileMenu({
  direction,
  trigger,
}: {
  direction: "up" | "down";
  trigger: (props: { open: boolean; toggle: () => void }) => ReactNode;
}) {
  const { data: me } = useMe();
  const logout = useLogout();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      {trigger({ open, toggle: () => setOpen((value) => !value) })}

      {open && (
        <div
          role="menu"
          className={cn(
            "absolute z-50 w-56 rounded-xl border bg-popover p-1 text-popover-foreground shadow-lg ring-1 ring-foreground/5",
            direction === "down"
              ? "right-0 top-full mt-1.5"
              : "bottom-full left-0 mb-2 w-[calc(100%-0px)] min-w-52",
          )}
        >
          <div className="px-2.5 py-2">
            <p className="truncate text-sm font-medium">{me?.name}</p>
            <p className="truncate text-xs text-muted-foreground">{me?.email}</p>
          </div>
          <div className="my-1 h-px bg-border" />
          <button
            type="button"
            role="menuitem"
            disabled={logout.isPending}
            onClick={() => {
              setOpen(false);
              logout.mutate();
            }}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors hover:bg-danger/10 hover:text-danger disabled:opacity-50"
          >
            <LogOut className="size-4" />
            {logout.isPending ? "Signing out…" : "Sign out"}
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Sidebar nav (shared between desktop aside and mobile sheet) ──────────── */

function SidebarNav({
  items,
  pathname,
  onNavigate,
}: {
  items: NavItem[];
  pathname: string;
  onNavigate?: () => void;
}) {
  // Bundle consecutive items sharing a group label.
  const sections: { group?: string; items: NavItem[] }[] = [];
  for (const item of items) {
    const last = sections[sections.length - 1];
    if (last && last.group === item.group) last.items.push(item);
    else sections.push({ group: item.group, items: [item] });
  }

  return (
    <nav className="flex flex-1 flex-col gap-4 overflow-y-auto px-3 py-4">
      {sections.map((section, index) => (
        <div key={section.group ?? `section-${index}`} className="grid gap-0.5">
          {section.group && (
            <p className="px-3 pb-1.5 text-[10px] font-semibold tracking-[0.14em] text-fruition-100/40 uppercase">
              {section.group}
            </p>
          )}
          {section.items.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "group relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
                  active
                    ? "bg-white/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                    : "text-fruition-100/65 hover:bg-white/5 hover:text-white",
                )}
              >
                {/* active indicator bar */}
                <span
                  className={cn(
                    "absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-fruition-400 shadow-[0_0_10px_rgba(74,222,128,0.55)] transition-opacity duration-150",
                    active ? "opacity-100" : "opacity-0",
                  )}
                />
                <item.icon
                  className={cn(
                    "size-4 transition-colors",
                    active ? "text-fruition-300" : "text-fruition-100/50 group-hover:text-fruition-200",
                  )}
                />
                {item.label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

function SidebarBrand({ title, companyName }: { title: string; companyName?: string }) {
  return (
    <div className="flex h-16 items-center gap-2.5 border-b border-white/10 px-4">
      <Image
        src="/fruitionhr-logo-icon.svg"
        alt="FruitionHR"
        width={34}
        height={34}
        className="rounded-lg"
        priority
      />
      <span className="hidden min-w-0 truncate text-[15px] font-extrabold tracking-tight text-white md:block">
        {companyName ?? title}
      </span>
    </div>
  );
}

/* ── App shell ─────────────────────────────────────────────────────────────── */

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
  const permissions = me?.permissions ?? [];
  const [mobileOpen, setMobileOpen] = useState(false);

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

  const role = me?.roles?.[0]?.replace(/_/g, " ");

  const sidebarSurface =
    "bg-linear-180 from-fruition-900 to-fruition-950 text-fruition-100";

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      {/* Desktop sidebar */}
      <aside className={cn("hidden w-62 shrink-0 flex-col md:flex", sidebarSurface)}>
        <SidebarBrand title={title} companyName={me?.tenant?.name} />
        <SidebarNav items={visibleNav} pathname={pathname} />

        {/* user card */}
        <div className="border-t border-white/10 p-3">
          <ProfileMenu
            direction="up"
            trigger={({ open, toggle }) => (
              <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={open}
                onClick={toggle}
                className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors duration-150 hover:bg-white/5"
              >
                <Avatar className="size-8 ring-2 ring-fruition-400/40">
                  <AvatarFallback className="bg-fruition-700 text-xs font-semibold text-white">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-white">
                    {me?.name}
                  </span>
                  <span className="block truncate text-xs capitalize text-fruition-100/50">
                    {role ?? me?.email}
                  </span>
                </span>
                <ChevronsUpDown className="size-3.5 shrink-0 text-fruition-100/40" />
              </button>
            )}
          />
        </div>
      </aside>

      {/* Mobile nav sheet */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          className={cn("w-72 gap-0 border-white/10 p-0", sidebarSurface)}
        >
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarBrand title={title} companyName={me?.tenant?.name} />
          <SidebarNav
            items={visibleNav}
            pathname={pathname}
            onNavigate={() => setMobileOpen(false)}
          />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Sticky glass header */}
        <header className="sticky top-0 z-40 flex h-14 items-center justify-between gap-3 border-b border-slate-200/70 bg-white/80 px-4 backdrop-blur-md sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              aria-label="Open navigation"
              onClick={() => setMobileOpen(true)}
              className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "md:hidden")}
            >
              <Menu className="size-5" />
            </button>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-800">
                {me?.tenant?.name ?? title}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <NotificationBell />
            <ProfileMenu
              direction="down"
              trigger={({ open, toggle }) => (
                <button
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded={open}
                  onClick={toggle}
                  className={cn(buttonVariants({ variant: "ghost" }), "gap-2 px-2")}
                >
                  <Avatar className="size-7">
                    <AvatarFallback className="bg-fruition-100 text-xs font-semibold text-fruition-800">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden text-sm sm:inline">{me?.name}</span>
                </button>
              )}
            />
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
        <footer className="border-t border-slate-200/70 bg-white/70 px-4 py-4 text-center text-xs text-slate-400 sm:px-6 lg:px-8">
          <span className="font-semibold text-slate-500">FruitionHR</span>
          <span className="mx-2">|</span>
          <span>All rights reserved</span>
          <span className="mx-2">|</span>
          <span>Version 1.0.0</span>
        </footer>
      </div>
    </div>
  );
}
