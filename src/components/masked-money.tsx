"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

import { MoneyText } from "@/components/money-text";
import { cn } from "@/lib/utils";

/**
 * A money value hidden until the reader asks for it.
 *
 * Salary is visible to whoever holds the permission, but a list of them on
 * screen is readable by anyone walking past. Hiding each amount behind its own
 * click keeps HR able to work in an open office without exposing the whole
 * payroll at a glance.
 *
 * The reveal is intentionally local and unsaved: leaving the page, paginating
 * or filtering re-masks everything, so an amount is never left uncovered.
 */
export function MaskedMoney({
  kobo,
  label,
  className,
}: {
  kobo: number | null | undefined;
  /** Whose figure this is, for screen readers — e.g. "Ada Nwosu". */
  label?: string;
  className?: string;
}) {
  const [revealed, setRevealed] = useState(false);

  if (kobo == null) {
    return <span className="text-muted-foreground">-</span>;
  }

  const action = revealed ? "Hide" : "Show";
  const describedAs = label ? `${action} salary for ${label}` : `${action} amount`;

  return (
    <button
      type="button"
      onClick={() => setRevealed((current) => !current)}
      aria-label={describedAs}
      aria-pressed={revealed}
      title={describedAs}
      className={cn(
        "group inline-flex items-center gap-1.5 rounded-md px-1 py-0.5 whitespace-nowrap",
        "font-medium transition hover:bg-slate-100",
        "focus-visible:ring-2 focus-visible:ring-fruition-500/40 focus-visible:outline-none",
        className,
      )}
    >
      {revealed ? (
        <MoneyText kobo={kobo} />
      ) : (
        // Fixed-width dots so revealing does not jolt the column width.
        <span className="tracking-[0.15em] text-slate-400 select-none" aria-hidden>
          ••••••
        </span>
      )}
      {revealed ? (
        <EyeOff className="size-3.5 shrink-0 text-slate-400 group-hover:text-slate-600" aria-hidden />
      ) : (
        <Eye className="size-3.5 shrink-0 text-slate-400 group-hover:text-slate-600" aria-hidden />
      )}
    </button>
  );
}
