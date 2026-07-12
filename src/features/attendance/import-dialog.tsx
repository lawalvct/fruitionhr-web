"use client";

import { Download, FileSpreadsheet, Info, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { FormDialog } from "@/components/form-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, apiErrorMessage } from "@/lib/api";
import { useImportLogs, type ImportResult } from "@/features/attendance/use-attendance";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

export function ImportDialog({
  open,
  onOpenChange,
  period,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  period: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const importLogs = useImportLogs(period);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState<number | null>(null);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);

  const resetForm = () => {
    formRef.current?.reset();
    setFileName("");
    setFileSize(null);
  };

  const downloadTemplate = async () => {
    setDownloadingTemplate(true);
    try {
      const { data } = await api.get("/api/v1/attendance/import-template.xlsx", {
        params: { period },
        responseType: "blob",
      });
      const url = URL.createObjectURL(data);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `attendance-${period}-import-template.xlsx`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Could not download the attendance template.");
    } finally {
      setDownloadingTemplate(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) {
      toast.error("Choose an Excel or CSV file.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error("The file must be 5 MB or smaller.");
      return;
    }

    try {
      const res = await importLogs.mutateAsync(file);
      setResult(res);
      resetForm();
      if (res.imported > 0) {
        toast.success(`Imported ${res.imported} attendance row${res.imported === 1 ? "" : "s"}.`);
      }
      if (res.skipped > 0) {
        toast.warning(`${res.skipped} row${res.skipped === 1 ? " was" : "s were"} skipped.`);
      }
    } catch (error) {
      toast.error(apiErrorMessage(error));
    }
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          setResult(null);
          resetForm();
        }
        onOpenChange(nextOpen);
      }}
      title="Import attendance"
      description={`Upload attendance records for ${period} using the provided Excel template or CSV format.`}
      formId="import-log-form"
      isPending={importLogs.isPending}
    >
      <form ref={formRef} id="import-log-form" onSubmit={submit} className="grid gap-5 py-2">
        <div className="rounded-xl border border-fruition-200 bg-fruition-50/60 p-4">
          <div className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white text-fruition-700 shadow-sm">
              <FileSpreadsheet className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">Start with the accepted format</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                The workbook includes sample attendance rows, your employee reference list, and import instructions.
              </p>
            </div>
          </div>
          <Button
            className="mt-3 w-full sm:w-auto"
            type="button"
            variant="outline"
            size="sm"
            disabled={downloadingTemplate}
            onClick={() => void downloadTemplate()}
          >
            <Download className="size-4" />
            {downloadingTemplate ? "Downloading..." : "Download Excel template"}
          </Button>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="import-file">Excel or CSV file</Label>
          <Input
            id="import-file"
            className="h-10 border-slate-300"
            type="file"
            ref={fileRef}
            accept=".xlsx,.xls,.csv"
            onChange={(event) => {
              const file = event.target.files?.[0];
              setResult(null);
              setFileName(file?.name ?? "");
              setFileSize(file?.size ?? null);
            }}
          />
          {fileName ? (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <FileSpreadsheet className="size-3.5 text-fruition-700" />
              <span className="min-w-0 truncate font-medium text-foreground">{fileName}</span>
              {fileSize !== null && <span>({(fileSize / 1024 / 1024).toFixed(2)} MB)</span>}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">Accepted: .xlsx, .xls, and .csv. Maximum size: 5 MB.</p>
          )}
        </div>

        <div className="rounded-xl border bg-muted/30 p-4">
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <Info className="mt-0.5 size-4 shrink-0 text-fruition-700" />
            <div>
              <p className="font-semibold text-foreground">Required columns</p>
              <p className="mt-1 leading-5">
                Use <code className="rounded bg-background px-1 py-0.5 font-mono text-[11px]">employee_number</code>,
                <code className="ml-1 rounded bg-background px-1 py-0.5 font-mono text-[11px]">date</code>,
                <code className="ml-1 rounded bg-background px-1 py-0.5 font-mono text-[11px]">clock_in</code>, and
                <code className="ml-1 rounded bg-background px-1 py-0.5 font-mono text-[11px]">clock_out</code>.
                Leave either clock time blank when unavailable.
              </p>
            </div>
          </div>
        </div>

        {result && (
          <div className="rounded-xl border bg-muted/30 p-4 text-sm">
            <p className="font-semibold text-fruition-700">
              Imported {result.imported} / Skipped {result.skipped}
            </p>
            {result.errors.length > 0 && (
              <ul className="mt-3 max-h-48 space-y-1 overflow-y-auto text-xs text-muted-foreground">
                {result.errors.slice(0, 50).map((error, index) => (
                  <li key={`${index}-${error}`}>{error}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Upload className="size-4" />
          Employee numbers must already exist in your employee records.
        </div>
      </form>
    </FormDialog>
  );
}
