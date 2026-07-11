"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { apiErrorMessage } from "@/lib/api";
import { useCreatePayrollRun, usePreflight } from "@/features/payroll/use-payroll";

function currentPeriod() {
  return new Date().toISOString().slice(0, 7);
}

export function NewRunDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (runId: number) => void;
}) {
  const [period, setPeriod] = useState(currentPeriod());
  const preflight = usePreflight(period, open);
  const create = useCreatePayrollRun();

  const run = async () => {
    try {
      const created = await create.mutateAsync(period);
      toast.success("Payroll run started — calculating…");
      onOpenChange(false);
      onCreated(created.id);
    } catch (error) {
      toast.error(apiErrorMessage(error));
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Start a payroll run</SheetTitle>
          <SheetDescription>
            We check that everything is ready before payroll can run.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5 px-4 pb-6">
          <div className="grid gap-2">
            <Label htmlFor="run-period">Period</Label>
            <Input
              id="run-period"
              type="month"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            />
          </div>

          <div>
            <p className="mb-2 text-sm font-medium">Readiness checklist</p>
            {preflight.isLoading ? (
              <p className="text-sm text-muted-foreground">Checking…</p>
            ) : (
              <ul className="space-y-2">
                {preflight.data?.checks.map((check) => (
                  <li key={check.key} className="flex items-start gap-2.5 rounded-lg border p-3">
                    {check.passed ? (
                      <CheckCircle2 className="mt-0.5 size-4.5 shrink-0 text-fruition-600" />
                    ) : (
                      <XCircle className="mt-0.5 size-4.5 shrink-0 text-danger" />
                    )}
                    <div>
                      <p className="text-sm font-medium">{check.label}</p>
                      {check.detail && (
                        <p className="text-xs text-muted-foreground">{check.detail}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <Button
            className="w-full"
            disabled={!preflight.data?.passed || create.isPending}
            onClick={run}
          >
            {create.isPending ? "Starting…" : "Run payroll"}
          </Button>
          {!preflight.data?.passed && !preflight.isLoading && (
            <p className="text-center text-xs text-muted-foreground">
              Resolve the failing checks above to enable this.
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
