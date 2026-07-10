import type { FieldValues, Path, UseFormSetError } from "react-hook-form";

import { apiErrorMessage, isValidationError } from "@/lib/api";

export function mapLaravelErrorsToForm<TValues extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<TValues>,
  fieldNames: readonly Path<TValues>[],
) {
  if (isValidationError(error)) {
    const allowed = new Set<string>(fieldNames);
    const fieldErrors = error.response?.data.errors ?? {};

    for (const [field, messages] of Object.entries(fieldErrors)) {
      if (allowed.has(field)) {
        setError(field as Path<TValues>, { message: messages[0] });
      }
    }

    return;
  }

  setError("root" as Path<TValues>, { message: apiErrorMessage(error) });
}
