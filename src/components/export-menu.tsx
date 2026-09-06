"use client";

import { ChevronDown, Download, FileSpreadsheet, FileText, LoaderCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { downloadErrorMessage, downloadFile } from "@/lib/download";
import { cn } from "@/lib/utils";

export type ExportFormat = "xlsx" | "pdf";

const FORMATS: Array<{ format: ExportFormat; label: string; hint: string; icon: typeof FileText }> = [
  { format: "xlsx", label: "Excel", hint: "Spreadsheet for reworking figures", icon: FileSpreadsheet },
  { format: "pdf", label: "PDF", hint: "Print-ready, keeps its layout", icon: FileText },
];

/**
 * One report, two formats. The same request in both cases — only `format`
 * changes — so a report can never be available in one format and missing in
 * the other.
 */
export function ExportMenu({
  label,
  path,
  basename,
  params = {},
  variant = "outline",
  size = "sm",
  className,
  disabled = false,
}: {
  /** What is being downloaded, e.g. "Bank schedule". Used in the button and errors. */
  label: string;
  /** API path below /api/v1, without the format parameter. */
  path: string;
  /** Filename stem used only if the server sends no disposition. */
  basename: string;
  params?: Record<string, string | number | undefined>;
  variant?: "outline" | "ghost" | "default";
  size?: "sm" | "default";
  className?: string;
  disabled?: boolean;
}) {
  const [busy, setBusy] = useState<ExportFormat | null>(null);

  async function run(format: ExportFormat) {
    if (busy) return;

    setBusy(format);
    try {
      await downloadFile(path, `${basename}.${format}`, { ...params, format });
    } catch (error) {
      toast.error(await downloadErrorMessage(error, label));
    } finally {
      setBusy(null);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant={variant}
            size={size}
            disabled={disabled || busy !== null}
            aria-label={`Download ${label}`}
            className={cn("gap-1.5", className)}
          />
        }
      >
        {busy ? <LoaderCircle className="size-4 animate-spin" /> : <Download className="size-4" />}
        <span>{busy ? "Preparing…" : label}</span>
        <ChevronDown className="size-3.5 opacity-60" aria-hidden="true" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-60">
        {FORMATS.map((option) => (
          <DropdownMenuItem key={option.format} onClick={() => void run(option.format)}>
            <option.icon className="size-4 text-muted-foreground" />
            <span className="flex min-w-0 flex-col">
              <span className="font-medium">{option.label}</span>
              <span className="text-xs text-muted-foreground">{option.hint}</span>
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
