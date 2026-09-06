"use client";

import { FileSpreadsheet, FileText, LoaderCircle, Table2, type LucideIcon } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { downloadErrorMessage, downloadFile } from "@/lib/download";
import { cn } from "@/lib/utils";
import type { ReportModule } from "./types";

type ExportFormat = "pdf" | "xlsx" | "csv";

interface ExportFormatConfig {
  format: ExportFormat;
  label: string;
  accessibleLabel: string;
  icon: LucideIcon;
}

const EXPORT_FORMATS: ExportFormatConfig[] = [
  { format: "pdf", label: "PDF", accessibleLabel: "PDF document", icon: FileText },
  { format: "xlsx", label: "Excel", accessibleLabel: "Excel workbook", icon: FileSpreadsheet },
  { format: "csv", label: "CSV", accessibleLabel: "CSV file", icon: Table2 },
];

interface ReportExportControlsProps {
  module: ReportModule;
  year: number;
  filters?: Record<string, string | number | undefined>;
  className?: string;
}

export function ReportExportControls({
  module,
  year,
  filters = {},
  className,
}: ReportExportControlsProps) {
  const downloadInProgress = useRef(false);
  const [activeFormat, setActiveFormat] = useState<ExportFormat | null>(null);

  async function download(config: ExportFormatConfig): Promise<void> {
    if (downloadInProgress.current) return;

    downloadInProgress.current = true;
    setActiveFormat(config.format);

    try {
      await downloadFile(
        `/reports/${module}/export.${config.format}`,
        `${module}-report-${year}.${config.format}`,
        { year, ...filters },
      );
    } catch (error) {
      toast.error(await downloadErrorMessage(error, config.label));
    } finally {
      downloadInProgress.current = false;
      setActiveFormat(null);
    }
  }

  return (
    <div
      role="group"
      aria-label="Export report"
      className={cn("inline-flex h-8 shrink-0 items-center gap-0.5 rounded-lg border border-border bg-background p-0.5", className)}
    >
      {EXPORT_FORMATS.map((config) => {
        const Icon = activeFormat === config.format ? LoaderCircle : config.icon;
        const isActive = activeFormat === config.format;

        return (
          <Button
            key={config.format}
            type="button"
            variant="ghost"
            size="xs"
            className="h-7 rounded-md px-2 text-[11px]"
            disabled={activeFormat !== null}
            aria-label={`Export report as ${config.accessibleLabel}`}
            aria-busy={isActive}
            title={`Export ${config.label}`}
            onClick={() => void download(config)}
          >
            <Icon
              className={cn("size-3.5", !isActive && "hidden sm:block", isActive && "animate-spin")}
              aria-hidden="true"
            />
            <span>{isActive ? `${config.label}…` : config.label}</span>
          </Button>
        );
      })}
      <span className="sr-only" aria-live="polite">
        {activeFormat ? `Preparing ${EXPORT_FORMATS.find((item) => item.format === activeFormat)?.label} export` : ""}
      </span>
    </div>
  );
}
