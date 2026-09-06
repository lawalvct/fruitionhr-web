import axios from "axios";

import { api } from "@/lib/api";

/**
 * Authenticated file downloads.
 *
 * Downloads go through axios rather than a plain `<a href>` so they carry the
 * session the same way every other API call does, and so a failure surfaces as
 * a readable message instead of a raw error page in a new tab.
 */

function safeFilename(filename: string, fallback: string): string {
  const leaf = filename.split(/[\\/]/).at(-1)?.replace(/[:*?"<>|]/g, "-").trim();
  return leaf || fallback;
}

/** Prefer the server's filename: it knows the period, employee and format. */
export function filenameFromDisposition(disposition: string | undefined, fallback: string): string {
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

/**
 * A failed download returns a Blob, not JSON, so the server's message has to be
 * read back out of it before it can be shown to anyone.
 */
export async function downloadErrorMessage(error: unknown, label: string): Promise<string> {
  const fallback = `The ${label} download could not be prepared. Please try again.`;
  if (!axios.isAxiosError(error)) return fallback;

  const payload = error.response?.data;

  if (payload instanceof Blob) {
    try {
      const decoded = JSON.parse(await payload.text()) as { message?: unknown };
      if (typeof decoded.message === "string" && decoded.message.trim() !== "") return decoded.message;
    } catch {
      // A failed file request may return HTML or an empty body; use the fallback.
    }
  } else if (payload && typeof payload === "object" && "message" in payload) {
    const message = (payload as { message?: unknown }).message;
    if (typeof message === "string" && message.trim() !== "") return message;
  }

  return fallback;
}

/**
 * Fetch a file from the API and hand it to the browser.
 *
 * @param path     API path below `/api/v1`, e.g. `/payroll-runs/5/bank-schedule`
 * @param fallback filename to use when the response carries no disposition
 */
export async function downloadFile(
  path: string,
  fallback: string,
  params: Record<string, string | number | undefined> = {},
): Promise<void> {
  const query = Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== ""),
  );

  const response = await api.get<Blob>(`/api/v1${path}`, { params: query, responseType: "blob" });
  const filename = filenameFromDisposition(response.headers["content-disposition"], fallback);
  const url = URL.createObjectURL(response.data);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
