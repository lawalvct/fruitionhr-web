"use client";

import { Dialog } from "@base-ui/react/dialog";
import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";
import { ArrowRight, Building2, Check, CheckCircle2, PartyPopper, Settings2, Users, X } from "lucide-react";

import { useMe } from "@/features/auth/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const setupAreas = [
  {
    title: "Company structure",
    description: "Review branches, departments, positions, grades, and calendars.",
    href: "/settings/organisation",
    icon: Building2,
  },
  {
    title: "Employees",
    description: "Add your first employee or build the team directory.",
    href: "/employees",
    icon: Users,
  },
  {
    title: "Payroll readiness",
    description: "Review salary components and statutory configuration.",
    href: "/payroll",
    icon: Settings2,
  },
];

type WelcomeKind = "completed" | "skipped";

const confetti = [
  { x: -190, y: -150, r: -160, color: "#22c55e", delay: 0 },
  { x: -145, y: -205, r: 130, color: "#f59e0b", delay: 40 },
  { x: -95, y: -170, r: -90, color: "#2563eb", delay: 90 },
  { x: -45, y: -220, r: 180, color: "#86efac", delay: 20 },
  { x: 10, y: -185, r: -130, color: "#ef4444", delay: 120 },
  { x: 65, y: -225, r: 150, color: "#fbbf24", delay: 55 },
  { x: 115, y: -175, r: -180, color: "#3b82f6", delay: 100 },
  { x: 175, y: -205, r: 110, color: "#16a34a", delay: 10 },
  { x: -175, y: -85, r: 140, color: "#60a5fa", delay: 135 },
  { x: -120, y: -120, r: -120, color: "#f97316", delay: 75 },
  { x: -65, y: -100, r: 170, color: "#4ade80", delay: 150 },
  { x: 45, y: -115, r: -150, color: "#facc15", delay: 115 },
  { x: 105, y: -90, r: 120, color: "#ec4899", delay: 160 },
  { x: 165, y: -125, r: -170, color: "#22c55e", delay: 65 },
];

function OnboardingWelcome({ firstName, companyName }: { firstName?: string; companyName?: string }) {
  const [kind, setKind] = useState<WelcomeKind | null>(null);

  useEffect(() => {
    const url = new URL(window.location.href);
    const welcome = url.searchParams.get("welcome");

    if (welcome !== "completed" && welcome !== "skipped") return;

    url.searchParams.delete("welcome");
    window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
    queueMicrotask(() => setKind(welcome));
  }, []);

  const completed = kind === "completed";

  return (
    <Dialog.Root open={kind !== null} onOpenChange={(open) => !open && setKind(null)}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-fruition-950/45 backdrop-blur-[2px] data-open:animate-in data-open:fade-in-0" />
        <Dialog.Popup className="welcome-dialog fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-lg border border-fruition-100 bg-white shadow-2xl outline-none">
          <Dialog.Close aria-label="Close welcome message" className="absolute right-3 top-3 z-20 grid size-8 place-items-center rounded-md text-white/70 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
            <X className="size-4" />
          </Dialog.Close>

          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-20 z-10 flex justify-center">
            {confetti.map((piece, index) => (
              <span
                key={index}
                className="welcome-confetti absolute h-3 w-1.5 rounded-[1px]"
                style={{
                  "--confetti-x": piece.x + "px",
                  "--confetti-y": piece.y + "px",
                  "--confetti-r": piece.r + "deg",
                  "--confetti-color": piece.color,
                  "--confetti-delay": piece.delay + "ms",
                } as CSSProperties}
              />
            ))}
          </div>

          <div className="relative bg-fruition-950 px-6 pb-16 pt-12 text-center text-white sm:px-10">
            <div className="welcome-celebration-icon relative mx-auto grid size-20 place-items-center rounded-full border-4 border-white/20 bg-fruition-500 shadow-lg shadow-fruition-950/30">
              {completed ? <PartyPopper className="size-9" /> : <Check className="size-10" strokeWidth={3} />}
            </div>
          </div>

          <div className="relative -mt-8 px-6 pb-7 text-center sm:px-10 sm:pb-9">
            <div className="mx-auto max-w-sm rounded-md bg-white px-2 pt-6">
              <p className="text-xs font-semibold uppercase text-fruition-700">
                {completed ? "Setup complete" : "Workspace ready"}
              </p>
              <Dialog.Title className="mt-2 text-2xl font-bold text-slate-950 sm:text-3xl">
                Welcome to FruitionHR{firstName ? ", " + firstName : ""}!
              </Dialog.Title>
              <Dialog.Description className="mt-3 text-sm leading-6 text-slate-600">
                {completed
                  ? (companyName ?? "Your company") + " is ready. Your starter records are in place, and you can begin building your team."
                  : (companyName ?? "Your workspace") + " is ready to explore. We added sensible starter records, and you can finish the remaining details anytime."}
              </Dialog.Description>
            </div>

            <div className="mt-6 flex flex-col-reverse justify-center gap-2 sm:flex-row">
              {!completed && (
                <Dialog.Close render={<Button variant="outline" render={<Link href="/onboarding" />} />}>
                  Complete setup
                </Dialog.Close>
              )}
              <Dialog.Close render={<Button size="lg" />}>
                Explore dashboard <ArrowRight className="size-4" />
              </Dialog.Close>
            </div>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export default function TenantDashboardPage() {
  const { data: me } = useMe();
  const setupSkipped = me?.tenant?.onboarding_status === "skipped";

  return (
    <div className="grid gap-6">
      <OnboardingWelcome
        firstName={me?.name?.split(" ")[0]}
        companyName={me?.tenant?.name}
      />

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome, {me?.name?.split(" ")[0]}
        </h1>
        <p className="text-muted-foreground">{me?.tenant?.name} company dashboard</p>
      </div>

      {setupSkipped && (
        <section className="border border-amber-200 bg-amber-50/60 p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-amber-800">Setup paused</p>
              <h2 className="mt-1 text-lg font-semibold text-slate-950">Finish configuring your workspace</h2>
              <p className="mt-1 max-w-2xl text-sm text-slate-600">
                Starter records are ready. Add your company preferences when convenient.
              </p>
            </div>
            <Button render={<Link href="/onboarding" />}>
              Continue setup <ArrowRight className="size-4" />
            </Button>
          </div>
        </section>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {setupAreas.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.title}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Icon className="size-5 text-emerald-700" />
                  <CheckCircle2 className="size-4 text-slate-300" />
                </div>
                <CardTitle className="text-base">
                  <Link href={item.href} className="hover:text-primary">{item.title}</Link>
                </CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </CardHeader>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
