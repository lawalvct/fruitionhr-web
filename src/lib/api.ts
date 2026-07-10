import axios, { AxiosError } from "axios";

/**
 * Axios instance for the FruitionHR API (Sanctum SPA cookie auth).
 *
 * - withCredentials: session + XSRF cookies ride on every request
 * - withXSRFToken: axios echoes the XSRF-TOKEN cookie as X-XSRF-TOKEN
 * - ensureCsrf(): call once before the first mutating request (login/register)
 */
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  withXSRFToken: true,
  headers: { Accept: "application/json" },
});

let csrfReady: Promise<void> | null = null;

export function ensureCsrf(): Promise<void> {
  csrfReady ??= api
    .get("/sanctum/csrf-cookie")
    .then(() => undefined)
    .catch((error) => {
      csrfReady = null;
      throw error;
    });
  return csrfReady;
}

/** Shape of Laravel validation error responses (HTTP 422). */
export interface ValidationErrorPayload {
  message: string;
  errors: Record<string, string[]>;
}

export function isValidationError(
  error: unknown,
): error is AxiosError<ValidationErrorPayload> {
  return axios.isAxiosError(error) && error.response?.status === 422;
}

/** First human-readable message from an API error, for toasts/form banners. */
export function apiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string } | undefined;
    if (data?.message) return data.message;
  }
  return "Something went wrong. Please try again.";
}
