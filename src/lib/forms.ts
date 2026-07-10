import type { FieldValues, Path, UseFormSetError } from "react-hook-form";

import { apiErrorMessage, isValidationError } from "@/lib/api";

/**
 * Map a Laravel 422 response onto react-hook-form fields.
 *
 * API error keys may be nested (`assignment.branch_id`, `contacts.0.name`)
 * while the form uses flat names — pass `keyMap` to translate. Errors that
 * match no known field land on `root` so the user always sees something.
 */
export function mapLaravelErrorsToForm<TValues extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<TValues>,
  fieldNames: readonly Path<TValues>[],
  keyMap: Record<string, Path<TValues>> = {},
) {
  if (isValidationError(error)) {
    const allowed = new Set<string>(fieldNames);
    const fieldErrors = error.response?.data.errors ?? {};
    let unmapped: string | null = null;

    for (const [field, messages] of Object.entries(fieldErrors)) {
      const target =
        keyMap[field] ?? (allowed.has(field) ? (field as Path<TValues>) : null);

      if (target) {
        setError(target, { message: messages[0] });
      } else {
        unmapped ??= messages[0];
      }
    }

    if (unmapped) {
      setError("root" as Path<TValues>, { message: unmapped });
    }

    return;
  }

  setError("root" as Path<TValues>, { message: apiErrorMessage(error) });
}

/**
 * `setValueAs` for nullable numeric <select> fields. Handles the RHF quirk
 * where an untouched select's default (`null`) is passed back through
 * setValueAs on submit — `Number(null)` would silently become `0`.
 */
export function nullableNumber(value: unknown): number | null {
  if (value === "" || value === null || value === undefined) return null;
  return Number(value);
}
