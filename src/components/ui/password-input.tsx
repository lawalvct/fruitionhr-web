"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

/**
 * Password field with a show/hide toggle.
 *
 * Drop-in for `<Input type="password" />` — it forwards every prop, including
 * the `ref`/`onChange` that react-hook-form's `register()` spreads in, so
 * `{...register("password")}` keeps working unchanged.
 *
 * The toggle is a real button rather than an icon on a div: it stays reachable
 * by keyboard, and `type="button"` keeps it from submitting the form it sits
 * in. Visibility always resets to hidden on mount, so a revealed password is
 * never restored on a re-render or a fresh page view.
 */
function PasswordInput({
  className,
  disabled,
  ...props
}: Omit<React.ComponentProps<typeof Input>, "type">) {
  const [visible, setVisible] = React.useState(false);

  return (
    <div className="relative">
      <Input
        {...props}
        // After the spread on purpose: a caller passing `type` (a generic
        // <Field type="password"> wrapper, say) must not clobber the toggle.
        type={visible ? "text" : "password"}
        // Room for the toggle so a long password never runs under the icon.
        className={cn("pr-9", className)}
        disabled={disabled}
      />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        disabled={disabled}
        // The label is the action, not the state — screen readers announce
        // "Show password" while it is hidden, which is what pressing it does.
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        // Not a form control of its own: keep it out of the accessible name of
        // the input and out of password-manager heuristics.
        tabIndex={disabled ? -1 : 0}
        className="absolute inset-y-0 right-0 flex w-9 items-center justify-center rounded-r-lg text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
      >
        {visible ? (
          <EyeOff className="size-4" aria-hidden="true" />
        ) : (
          <Eye className="size-4" aria-hidden="true" />
        )}
      </button>
    </div>
  );
}

export { PasswordInput };
