"use client";

import { Label } from "@/components/ui/label";
import type { PlatformRole } from "./types";

/**
 * Picks the role an administrator holds.
 *
 * Shows what the chosen role actually grants underneath the select — "Support
 * agent" means nothing on its own, and the person assigning it is deciding how
 * much of the platform somebody can see.
 */
export function RoleSelect({
  roles,
  isPending,
  value,
  onChange,
  error,
}: {
  roles: PlatformRole[];
  isPending: boolean;
  value: number;
  onChange: (id: number) => void;
  error?: string;
}) {
  const selected = roles.find((role) => role.id === value);

  return (
    <div className="space-y-1.5">
      <Label htmlFor="platform_role_id">What can they access?</Label>
      <select
        id="platform_role_id"
        value={value || ""}
        disabled={isPending}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-9 w-full rounded-lg border border-input bg-white px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20 disabled:opacity-60"
        aria-invalid={Boolean(error)}
      >
        <option value="" disabled>
          {isPending ? "Loading roles…" : "Choose a role"}
        </option>
        {roles.map((role) => (
          <option key={role.id} value={role.id}>
            {role.name}
          </option>
        ))}
      </select>

      {selected && (
        <p className="text-xs leading-5 text-slate-500">
          {selected.is_owner
            ? "Full run of the platform, including adding administrators and changing what they can reach."
            : selected.description ||
              `Can reach ${new Intl.ListFormat("en-NG", { style: "long", type: "conjunction" }).format(selected.abilities)}.`}
        </p>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
