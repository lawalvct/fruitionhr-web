"use client";

import Link from "next/link";
import { ArrowRight, Building2, CheckCircle2, Settings2, Users } from "lucide-react";

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

export default function TenantDashboardPage() {
  const { data: me } = useMe();
  const setupSkipped = me?.tenant?.onboarding_status === "skipped";

  return (
    <div className="grid gap-6">
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
