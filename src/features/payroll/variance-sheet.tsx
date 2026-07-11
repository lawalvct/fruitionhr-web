"use client";

import { MoveDown, MoveUp } from "lucide-react";

import { MoneyText } from "@/components/money-text";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useVariance, type VarianceRow } from "@/features/payroll/use-payroll";

const flagStyle: Record<VarianceRow["flag"], string> = {
  new: "bg-info/10 text-info",
  changed: "bg-muted text-muted-foreground",
  removed: "bg-danger/10 text-danger",
};

function Delta({ value }: { value: number }) {
  if (value === 0) return <span className="text-muted-foreground">—</span>;
  const up = value > 0;
  return (
    <span className={`inline-flex items-center gap-0.5 ${up ? "text-fruition-700" : "text-danger"}`}>
      {up ? <MoveUp className="size-3" /> : <MoveDown className="size-3" />}
      <MoneyText kobo={Math.abs(value)} />
    </span>
  );
}

export function VarianceSheet({
  runId,
  open,
  onOpenChange,
}: {
  runId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data, isLoading } = useVariance(runId, open);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>Payroll variance</SheetTitle>
          <SheetDescription>
            {data?.previous_period
              ? `This run vs ${data.previous_period}, per employee.`
              : "No previous period to compare — this is the first run."}
          </SheetDescription>
        </SheetHeader>

        <div className="px-4 pb-6">
          {isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left">
                  <th className="px-3 py-2 font-medium">Employee</th>
                  <th className="px-3 py-2 text-right font-medium">Previous</th>
                  <th className="px-3 py-2 text-right font-medium">Current</th>
                  <th className="px-3 py-2 text-right font-medium">Change</th>
                  <th className="px-3 py-2 text-right font-medium">%</th>
                </tr>
              </thead>
              <tbody>
                {data?.rows.map((row) => (
                  <tr key={row.employee_id} className="border-b last:border-0">
                    <td className="px-3 py-2">
                      {row.name}
                      <span className={`ml-2 rounded px-1.5 py-0.5 text-[10px] font-semibold ${flagStyle[row.flag]}`}>
                        {row.flag}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right"><MoneyText kobo={row.previous_net} /></td>
                    <td className="px-3 py-2 text-right"><MoneyText kobo={row.current_net} /></td>
                    <td className="px-3 py-2 text-right"><Delta value={row.delta} /></td>
                    <td className="px-3 py-2 text-right text-muted-foreground">
                      {row.percent === null ? "—" : `${row.percent}%`}
                    </td>
                  </tr>
                ))}
                {data && (
                  <tr className="border-t-2 bg-muted/30 font-semibold">
                    <td className="px-3 py-2">Total</td>
                    <td className="px-3 py-2 text-right"><MoneyText kobo={data.totals.previous_net} /></td>
                    <td className="px-3 py-2 text-right"><MoneyText kobo={data.totals.current_net} /></td>
                    <td className="px-3 py-2 text-right"><Delta value={data.totals.delta} /></td>
                    <td className="px-3 py-2 text-right">
                      {data.totals.percent === null ? "—" : `${data.totals.percent}%`}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
