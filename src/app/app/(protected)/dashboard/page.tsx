"use client";

import { useMe } from "@/features/auth/use-auth";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function TenantDashboardPage() {
  const { data: me } = useMe();

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome, {me?.name?.split(" ")[0]}
        </h1>
        <p className="text-muted-foreground">
          {me?.tenant?.name} — company dashboard
        </p>
      </div>

      {/* Setup checklist (Ballie-style guided onboarding) lands here next. */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Company setup</CardTitle>
            <CardDescription>
              Branches, departments, positions &amp; grades — coming next.
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Employees</CardTitle>
            <CardDescription>
              Add or import your employee records.
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payroll</CardTitle>
            <CardDescription>
              Salary components, statutory setup &amp; payroll runs.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
