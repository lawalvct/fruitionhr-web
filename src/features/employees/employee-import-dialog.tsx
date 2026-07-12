"use client";

import { Download, FileSpreadsheet, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { FormDialog } from "@/components/form-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, apiErrorMessage } from "@/lib/api";
import { useImportEmployees, type EmployeeImportResult } from "@/features/employees/use-employees";

export function EmployeeImportDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const formRef = useRef<HTMLFormElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const importEmployees = useImportEmployees();
  const [result, setResult] = useState<EmployeeImportResult | null>(null);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);

  async function downloadTemplate() {
    setDownloadingTemplate(true);
    try {
      const { data } = await api.get("/api/v1/employees/import-template.xlsx", { responseType: "blob" });
      const url = URL.createObjectURL(data);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "employees-import-template.xlsx";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Could not download the employee import template.");
    } finally {
      setDownloadingTemplate(false);
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) {
      toast.error("Choose an Excel or CSV file.");
      return;
    }

    try {
      const response = await importEmployees.mutateAsync(file);
      setResult(response);
      formRef.current?.reset();
      if (response.imported > 0) toast.success(`Imported ${response.imported} employee${response.imported === 1 ? "" : "s"}.`);
      if (response.skipped > 0) toast.warning(`${response.skipped} row${response.skipped === 1 ? " was" : "s were"} skipped.`);
    } catch (error) {
      toast.error(apiErrorMessage(error));
    }
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          setResult(null);
          formRef.current?.reset();
        }
        onOpenChange(nextOpen);
      }}
      title="Import employees"
      description="Upload an Excel or CSV file using the accepted column format. Maximum file size is 5 MB."
      formId="employee-import-form"
      isPending={importEmployees.isPending}
    >
      <form ref={formRef} id="employee-import-form" className="grid gap-5 py-2" onSubmit={submit}>
        <div className="rounded-xl border border-fruition-200 bg-fruition-50/60 p-4">
          <div className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white text-fruition-700 shadow-sm"><FileSpreadsheet className="size-4" /></span>
              <div className="min-w-0 flex-1"><p className="text-sm font-semibold text-foreground">Start with the accepted format</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Includes 3 importable sample rows, tenant reference values, and dependency instructions. Replace or delete samples you do not want to import.</p></div>
          </div>
          <Button className="mt-3 w-full sm:w-auto" type="button" variant="outline" size="sm" disabled={downloadingTemplate} onClick={() => void downloadTemplate()}>
            <Download className="size-4" /> {downloadingTemplate ? "Downloading..." : "Download Excel template"}
          </Button>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="employee-import-file">Excel or CSV file</Label>
          <Input id="employee-import-file" className="h-10 border-slate-300" type="file" ref={fileRef} accept=".xlsx,.xls,.csv" />
          <p className="text-xs text-muted-foreground">Accepted: .xlsx, .xls, and .csv</p>
        </div>

        {result && <div className="rounded-xl border bg-muted/30 p-4 text-sm"><p className="font-semibold text-fruition-700">Imported {result.imported} · Skipped {result.skipped}</p>{result.errors.length > 0 && <ul className="mt-3 max-h-48 space-y-1 overflow-y-auto text-xs text-muted-foreground">{result.errors.slice(0, 50).map((error, index) => <li key={`${index}-${error}`}>{error}</li>)}</ul>}</div>}

        <div className="flex items-center gap-2 text-xs text-muted-foreground"><Upload className="size-4" />Company assignment names or codes must already exist in Settings.</div>
      </form>
    </FormDialog>
  );
}
