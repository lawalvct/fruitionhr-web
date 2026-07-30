"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronsUpDown, LoaderCircle, LogOut, Menu, Search, UserRound, type LucideIcon } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { useLogout, useMe } from "@/features/auth/use-auth";
import { useCompanyLogoImage } from "@/features/company/use-company";
import { useEmployeeSearch } from "@/features/employees/use-employees";
import { NotificationBell } from "@/features/notifications/notification-bell";
import { useAvatarImage } from "@/features/profile/use-profile";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import { PageTitleProvider } from "@/components/page-title-context";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  permission?: string | string[];
  /** Only show personal ESS destinations when this user has a linked employee record. */
  requiresEmployee?: boolean;
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
          <Link
            href="/profile"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <UserRound className="size-4" />
            Account settings
          </Link>
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

function SidebarBrand({
  title,
  companyName,
  logoUrl,
}: {
  title: string;
  companyName?: string;
  logoUrl?: string | null;
}) {
  const logoSrc = useCompanyLogoImage(logoUrl);

  return (
    <div className="flex h-16 items-center gap-2.5 border-b border-white/10 px-4">
      {logoSrc ? (
        // eslint-disable-next-line @next/next/no-img-element -- authenticated blob URL, not a static asset
        <img
          src={logoSrc}
          alt={companyName ?? "Company logo"}
          className="size-8.5 shrink-0 rounded-lg bg-white object-contain p-0.5"
        />
      ) : (
        <Image
          src="/fruitionhr-logo-icon.svg"
          alt="FruitionHR"
          width={34}
          height={34}
          className="rounded-lg"
          priority
        />
      )}
      <span className="hidden min-w-0 truncate text-[15px] font-extrabold tracking-tight text-white md:block">
        {companyName ?? title}
      </span>
    </div>
  );
}

function EmployeeSearch({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim();
  const isOpen = enabled && normalizedQuery.length >= 2;
  const { data: employees = [], isFetching } = useEmployeeSearch(query, enabled);

  useEffect(() => {
    if (!isOpen) return;
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setQuery("");
      }
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () => document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, [isOpen]);

  const openEmployee = (id: number) => {
    setQuery("");
    router.push(`/employees/${id}`);
  };

  return (
    <div ref={searchRef} className="relative min-w-0 flex-1 sm:max-w-md">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape") setQuery("");
          if (event.key === "Enter" && employees[0]) openEmployee(employees[0].id);
        }}
        placeholder="Search employees..."
        aria-label="Search employees"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={isOpen}
        aria-controls="employee-search-results"
        className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/80 pl-9 pr-9 text-sm outline-none transition-colors placeholder:text-slate-400 focus:border-fruition-400 focus:bg-white focus:ring-2 focus:ring-fruition-500/20"
      />
      {isFetching && <LoaderCircle className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-fruition-600" />}

      {isOpen && (
        <div id="employee-search-results" role="listbox" className="absolute left-0 top-full z-50 mt-2 w-[min(28rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-slate-200 bg-popover p-1 text-popover-foreground shadow-xl ring-1 ring-foreground/5">
          {isFetching ? (
            <p className="px-3 py-4 text-sm text-muted-foreground">Searching employees...</p>
          ) : employees.length === 0 ? (
            <p className="px-3 py-4 text-sm text-muted-foreground">No employees found.</p>
          ) : (
            employees.map((employee) => (
              <button
                key={employee.id}
                type="button"
                role="option"
                aria-selected={false}
                onClick={() => openEmployee(employee.id)}
                className="flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-fruition-50"
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-fruition-100 text-xs font-semibold text-fruition-800">
                  {employee.full_name.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase()}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{employee.full_name}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {employee.employee_number}
                    {employee.current_assignment?.department?.name ? ` / ${employee.current_assignment.department.name}` : ""}
                  </span>
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function routePageTitle(pathname: string, items: NavItem[], fallback: string): string {
  if (pathname === "/employees/new") return "Add employee";
  if (/^\/employees\/[^/]+\/edit$/.test(pathname)) return "Edit employee";
  if (/^\/employees\/[^/]+$/.test(pathname)) return "Employee profile";
  if (/^\/payroll\/[^/]+$/.test(pathname)) return "Payroll run";
  if (pathname === "/settings/organisation") return "Organisation settings";

  const match = [...items]
    .sort((left, right) => right.href.length - left.href.length)
    .find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));

  return match?.label ?? fallback;
}

/* ── App shell ─────────────────────────────────────────────────────────────── */

/**
 * Sidebar + header shell shared by the tenant and admin surfaces.
 * Each surface passes its own nav items and title.
 */
export function AppShell({
  title,
  nav,
  enableEmployeeSearch = false,
  children,
}: {
  title: string;
  nav: NavItem[];
  enableEmployeeSearch?: boolean;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const { data: me } = useMe();
  const avatarSrc = useAvatarImage(me?.avatar_url);
  const permissions = me?.permissions ?? [];
  const [mobileOpen, setMobileOpen] = useState(false);
  const [registeredPageTitle, setRegisteredPageTitle] = useState<string | null>(null);
  const canSearchEmployees = enableEmployeeSearch && (me?.is_super_admin || permissions.includes("employees.view"));

  const visibleNav = nav.filter((item) => {
    if (item.requiresEmployee && !me?.employee) return false;
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
  const pageTitle = registeredPageTitle ?? routePageTitle(pathname, visibleNav, title);

  return (
    <PageTitleProvider onTitleChange={setRegisteredPageTitle}>
    <div className="flex min-h-screen bg-[#f8fafc]">
      {/* Desktop sidebar */}
      <aside className={cn("hidden w-62 shrink-0 flex-col md:flex", sidebarSurface)}>
        <SidebarBrand title={title} companyName={me?.tenant?.name} logoUrl={me?.tenant?.logo_url} />
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
                  {avatarSrc && <AvatarImage src={avatarSrc} alt={me?.name ?? "You"} />}
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
          <SidebarBrand title={title} companyName={me?.tenant?.name} logoUrl={me?.tenant?.logo_url} />
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
          <div className="flex min-w-0 shrink-0 items-center gap-2">
            <button
              type="button"
              aria-label="Open navigation"
              onClick={() => setMobileOpen(true)}
              className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "md:hidden")}
            >
              <Menu className="size-5" />
            </button>
            <h1 className="max-w-40 truncate font-heading text-sm font-semibold text-slate-800 sm:max-w-56 sm:text-base">
              {pageTitle}
            </h1>
          </div>

          {canSearchEmployees && (
            <div className="hidden min-w-0 flex-1 justify-center px-2 sm:flex lg:justify-end lg:px-4">
              <EmployeeSearch enabled={canSearchEmployees} />
            </div>
          )}

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
                    {avatarSrc && <AvatarImage src={avatarSrc} alt={me?.name ?? "You"} />}
                    <AvatarFallback className="bg-fruition-100 text-xs font-semibold text-fruition-800">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden text-sm lg:inline">{me?.name}</span>
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
    </PageTitleProvider>
  );
}
