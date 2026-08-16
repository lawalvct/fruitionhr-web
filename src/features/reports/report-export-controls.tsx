"use client";

import axios from "axios";
import { FileSpreadsheet, FileText, LoaderCircle, Table2, type LucideIcon } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
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

function safeFilename(filename: string, fallback: string): string {
  const leaf = filename.split(/[\\/]/).at(-1)?.replace(/[:*?"<>|]/g, "-").trim();
  return leaf || fallback;
}

function filenameFromDisposition(disposition: string | undefined, fallback: string): string {
  if (!disposition) return fallback;

  const encoded = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  if (encoded) {
    try {
      return safeFilename(decodeURIComponent(encoded.replace(/^"|"$/g, "")), fallback);
    } catch {
      // Fall through to the plain filename or the known-safe fallback.
    }
  }

  const plain = disposition.match(/filename="?([^";]+)"?/i)?.[1];
  return plain ? safeFilename(plain, fallback) : fallback;
}

async function exportErrorMessage(error: unknown, label: string): Promise<string> {
  const fallback = `The ${label} export could not be prepared. Please try again.`;
  if (!axios.isAxiosError(error)) return fallback;

  const payload = error.response?.data;
  if (payload instanceof Blob) {
    try {
      const text = await payload.text();
      const decoded = JSON.parse(text) as { message?: unknown };
      if (typeof decoded.message === "string" && decoded.message.trim() !== "") return decoded.message;
    } catch {
      // A failed file request may return an HTML or empty response; use the safe fallback.
    }
  } else if (payload && typeof payload === "object" && "message" in payload) {
    const message = (payload as { message?: unknown }).message;
    if (typeof message === "string" && message.trim() !== "") return message;
  }

  return fallback;
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
      const query: Record<string, string | number | undefined> = { year, ...filters };
      const params = Object.fromEntries(
        Object.entries(query).filter(([, value]) => value !== undefined && value !== ""),
      );
      const response = await api.get<Blob>(`/api/v1/reports/${module}/export.${config.format}`, {
        params,
        responseType: "blob",
      });
      const fallback = `${module}-report-${year}.${config.format}`;
      const filename = filenameFromDisposition(response.headers["content-disposition"], fallback);
      const url = URL.createObjectURL(response.data);
      const anchor = document.createElement("a");

      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch (error) {
      toast.error(await exportErrorMessage(error, config.label));
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
