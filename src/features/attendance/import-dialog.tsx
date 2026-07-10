"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";

import { FormDialog } from "@/components/form-dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { apiErrorMessage } from "@/lib/api";
import { useImportLogs, type ImportResult } from "@/features/attendance/use-attendance";

export function ImportDialog({
  open,
  onOpenChange,
  period,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  period: string;
}) {
  const importLogs = useImportLogs(period);
  const fileRef = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) {
      toast.error("Choose a file.");
      return;
    }
    try {
      const res = await importLogs.mutateAsync(file);
      setResult(res);
      toast.success(`Imported ${res.imported} rows (${res.skipped} skipped).`);
    } catch (error) {
      toast.error(apiErrorMessage(error));
    }
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={(o) => {
        if (!o) setResult(null);
        onOpenChange(o);
      }}
      title="Import attendance"
      description="Upload an xlsx or csv with columns: employee_number, date, clock_in, clock_out."
      formId="import-log-form"
      isPending={importLogs.isPending}
    >
      <form id="import-log-form" onSubmit={submit} className="grid gap-4 py-2">
        <div className="grid gap-2">
          <Label htmlFor="import-file">File</Label>
          <Input id="import-file" type="file" ref={fileRef} accept=".xlsx,.xls,.csv" />
        </div>

        {result && (
          <div className="rounded-md border bg-muted/40 p-3 text-sm">
            <p className="font-medium text-fruition-700">
              Imported {result.imported} · Skipped {result.skipped}
            </p>
            {result.errors.length > 0 && (
              <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto text-xs text-muted-foreground">
                {result.errors.slice(0, 20).map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </form>
    </FormDialog>
  );
}
