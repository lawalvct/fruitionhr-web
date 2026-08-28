"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useResetPassword } from "@/features/auth/use-auth";
import { apiErrorMessage, isValidationError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";

const schema = z
  .object({
    password: z.string().min(8, "Use at least 8 characters"),
    password_confirmation: z.string().min(1, "Confirm your new password"),
  })
  .refine((values) => values.password === values.password_confirmation, {
    path: ["password_confirmation"],
    message: "Passwords do not match",
  });

type FormValues = z.infer<typeof schema>;

export function ResetPasswordForm() {
  const params = useSearchParams();
  const email = params.get("email") ?? "";
  const token = params.get("token") ?? "";
  const reset = useResetPassword();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await reset.mutateAsync({ email, token, ...values });
    } catch (error) {
      if (isValidationError(error)) {
        const fieldErrors = error.response?.data.errors ?? {};
        if (fieldErrors.password) {
          setError("password", { message: fieldErrors.password[0] });
          return;
        }
        // A bad or expired token isn't something the user can fix in this
        // form, so surface it as a banner with the way out.
        setError("root", {
          message: fieldErrors.token?.[0] ?? fieldErrors.email?.[0] ?? apiErrorMessage(error),
        });
        return;
      }
      setError("root", { message: apiErrorMessage(error) });
    }
  });

  if (reset.isSuccess) {
    return (
      <div className="grid gap-4">
        <div className="flex size-11 items-center justify-center rounded-full bg-fruition-50 text-fruition-700">
          <CheckCircle2 className="size-5" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-950">Password updated</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Sign in with your new password{email ? <> using <strong>{email}</strong></> : null}. Any
            other devices already signed in have been signed out.
          </p>
        </div>
        <Button render={<Link href="/login" />}>Continue to sign in</Button>
      </div>
    );
  }

  // Someone who typed the URL by hand, or whose mail client mangled the link.
  if (!email || !token) {
    return (
      <div className="grid gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-950">This link is incomplete</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Open the reset link straight from the email, or request a fresh one.
          </p>
        </div>
        <Button render={<Link href="/forgot-password" />}>Request a new link</Button>
        <Link
          href="/login"
          className="text-center text-sm text-fruition-700 underline-offset-4 hover:underline"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      {errors.root && (
        <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <p>{errors.root.message}</p>
          <Link href="/forgot-password" className="mt-1 inline-block font-medium underline-offset-4 hover:underline">
            Request a new link
          </Link>
        </div>
      )}
      <p className="text-sm text-muted-foreground">
        Choose a new password for <strong className="text-slate-900">{email}</strong>.
      </p>
      <div className="grid gap-2">
        <Label htmlFor="password">New password</Label>
        <PasswordInput
          id="password"
          autoComplete="new-password"
          autoFocus
          {...register("password")}
        />
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        )}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="password_confirmation">Confirm new password</Label>
        <PasswordInput
          id="password_confirmation"
          autoComplete="new-password"
          {...register("password_confirmation")}
        />
        {errors.password_confirmation && (
          <p className="text-sm text-destructive">{errors.password_confirmation.message}</p>
        )}
      </div>
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Updating password..." : "Update password"}
      </Button>
      <Link
        href="/login"
        className="text-center text-sm text-fruition-700 underline-offset-4 hover:underline"
      >
        Back to sign in
      </Link>
    </form>
  );
}
