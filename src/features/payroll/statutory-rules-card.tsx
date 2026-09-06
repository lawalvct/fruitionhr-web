"use client";

import { CalendarClock, Landmark, LockKeyhole, Percent, ScrollText, Users } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCan } from "@/features/auth/use-auth";
import { useStatutoryRules, type TaxBand } from "@/features/payroll/use-payroll";
import { cn } from "@/lib/utils";

/** Kobo to naira, no decimals: tax thresholds are always whole naira. */
function naira(kobo: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(kobo / 100);
}

function bandLabel(band: TaxBand) {
  if (band.to === null) return `Above ${naira(band.from)}`;
  if (band.from === 0) return `First ${naira(band.to)}`;
  return `${naira(band.from)} - ${naira(band.to)}`;
}

function monthLabel(period: string) {
  const [year, month] = period.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("en-NG", { month: "long", year: "numeric" });
}

function currentPeriod() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function RateTile({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-xl border bg-muted/30 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 font-heading text-xl font-semibold tabular-nums">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

export function StatutoryRulesCard() {
  const canView = useCan("payroll.view");
  const [period, setPeriod] = useState(currentPeriod());
  const rules = useStatutoryRules(period, canView);

  if (!canView) {
    return (
      <Card>
        <CardContent className="flex items-start gap-3 p-5">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground">
            <LockKeyhole className="size-5" />
          </span>
          <div>
            <h2 className="font-heading font-semibold">Tax and statutory</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              You need View payroll access to see the tax rules applied to payroll.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const data = rules.data;

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <CardHeader className="border-b bg-gradient-to-r from-fruition-50/80 to-transparent dark:from-fruition-950/20">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-fruition-100 text-fruition-800 dark:bg-fruition-900/40 dark:text-fruition-200">
                <ScrollText className="size-5" />
              </span>
              <div className="min-w-0">
                <CardTitle>PAYE and statutory rules</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  The rates payroll will apply. These follow national law, so they are read-only —
                  a change arrives as a new effective-dated rule.
                </p>
              </div>
            </div>
            <label className="flex shrink-0 items-center gap-2 text-sm">
              <span className="text-muted-foreground">Period</span>
              <input
                type="month"
                value={period}
                onChange={(event) => setPeriod(event.target.value || currentPeriod())}
                className="h-9 rounded-md border bg-background px-2 text-sm shadow-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/25"
              />
            </label>
          </div>
        </CardHeader>

        <CardContent className="p-5">
          {rules.isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-5 w-64" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : rules.isError || !data ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                Statutory rules could not be loaded for {monthLabel(period)}.
              </p>
              <Button variant="outline" onClick={() => void rules.refetch()}>
                Retry
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="default">{data.paye.regime}</Badge>
                <span className="text-sm text-muted-foreground">
                  governs {monthLabel(data.period)} — effective {data.paye.effective_from}
                  {data.paye.effective_to ? ` to ${data.paye.effective_to}` : " onward"}
                </span>
              </div>

              <div>
                <h3 className="font-heading font-semibold">Annual tax bands</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Applied to chargeable income — gross pay less allowable deductions and relief.
                </p>
                <div className="mt-3 overflow-x-auto rounded-xl border">
                  <table className="w-full border-collapse text-sm">
                    <thead className="bg-muted/60 text-left text-xs uppercase text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2 font-medium">Chargeable income</th>
                        <th className="px-3 py-2 text-right font-medium">Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.paye.bands.map((band) => (
                        <tr key={`${band.from}-${band.rate}`} className="border-t">
                          <td className="px-3 py-2.5 whitespace-nowrap">{bandLabel(band)}</td>
                          <td
                            className={cn(
                              "px-3 py-2.5 text-right font-medium tabular-nums whitespace-nowrap",
                              band.rate === 0 && "text-fruition-700 dark:text-fruition-300",
                            )}
                          >
                            {band.rate}%
                            {band.rate === 0 && <span className="ml-2 text-xs font-normal">tax free</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h3 className="font-heading font-semibold">Relief and allowable deductions</h3>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {data.paye.relief_mode === "rent" ? (
                    <div className="rounded-xl border bg-muted/30 p-4 sm:col-span-2">
                      <div className="flex items-center gap-2">
                        <Landmark className="size-4 text-fruition-700 dark:text-fruition-300" />
                        <p className="font-medium">Rent relief</p>
                      </div>
                      <p className="mt-1.5 text-sm text-muted-foreground">
                        The lower of {data.paye.relief.rent_relief_percent}% of the rent an employee
                        actually pays and{" "}
                        {data.paye.relief.rent_relief_cap != null && naira(data.paye.relief.rent_relief_cap)} a
                        year. Employees who pay no rent get no relief — record rent on the
                        employee&apos;s statutory details for it to apply.
                      </p>

                      {data.rent_declarations.applicable && data.rent_declarations.total > 0 && (
                        <div className="mt-4 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-start gap-2.5">
                            <Users className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                            <p className="text-sm">
                              <span className="font-medium tabular-nums">
                                {data.rent_declarations.declared} of {data.rent_declarations.total}
                              </span>{" "}
                              active employees have declared rent.
                              {data.rent_declarations.missing > 0 && (
                                <span className="text-muted-foreground">
                                  {" "}
                                  The other {data.rent_declarations.missing} are taxed as
                                  non-renters — correct for homeowners, but worth checking if the
                                  declarations were never collected.
                                </span>
                              )}
                            </p>
                          </div>
                          {data.rent_declarations.missing > 0 && (
                            <Link
                              href="/employees?rent_declared=0"
                              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "shrink-0")}
                            >
                              Review {data.rent_declarations.missing}
                            </Link>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-xl border bg-muted/30 p-4 sm:col-span-2">
                      <div className="flex items-center gap-2">
                        <Landmark className="size-4 text-muted-foreground" />
                        <p className="font-medium">Consolidated Relief Allowance</p>
                      </div>
                      <p className="mt-1.5 text-sm text-muted-foreground">
                        The higher of{" "}
                        {data.paye.relief.cra_min != null && naira(data.paye.relief.cra_min)} and{" "}
                        {data.paye.relief.cra_gross_percent}% of gross income, plus{" "}
                        {data.paye.relief.cra_percent}% of gross income.
                      </p>
                    </div>
                  )}
                  <RateTile
                    label="Pension deductible"
                    value={data.paye.deducts_pension ? "Yes" : "No"}
                    hint="Employee pension comes off before tax"
                  />
                  <RateTile
                    label="NHF deductible"
                    value={data.paye.deducts_nhf ? "Yes" : "No"}
                    hint="NHF comes off before tax"
                  />
                </div>
              </div>

              <div>
                <h3 className="font-heading font-semibold">Other statutory rates</h3>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <RateTile
                    label="Pension (employee)"
                    value={`${data.pension.employee_percent}%`}
                    hint="of pensionable pay"
                  />
                  <RateTile
                    label="Pension (employer)"
                    value={`${data.pension.employer_percent}%`}
                    hint="employer cost"
                  />
                  <RateTile label="NHF" value={`${data.nhf.percent}%`} hint="of basic salary" />
                  <RateTile label="NSITF" value={`${data.nsitf.percent}%`} hint="employer cost, of gross" />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {data && data.paye_schedule.length > 1 && (
        <Card>
          <CardHeader className="border-b">
            <div className="flex items-center gap-2">
              <CalendarClock className="size-4 text-muted-foreground" />
              <CardTitle className="text-base">PAYE history</CardTitle>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Every regime on file. A locked payroll run always reproduces on the law that governed
              its period, never today&apos;s.
            </p>
          </CardHeader>
          <div className="divide-y">
            {data.paye_schedule.map((entry) => (
              <div
                key={entry.effective_from}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
              >
                <div className="flex items-center gap-2">
                  <Percent
                    className={cn(
                      "size-4",
                      entry.is_current ? "text-fruition-700 dark:text-fruition-300" : "text-muted-foreground",
                    )}
                  />
                  <span className="font-medium">{entry.regime}</span>
                  {entry.is_current && <Badge variant="secondary">In effect</Badge>}
                </div>
                <span className="tabular-nums text-muted-foreground">
                  {entry.effective_from} → {entry.effective_to ?? "open"}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
