"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { MailCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useForgotPassword } from "@/features/auth/use-auth";
import { apiErrorMessage, isValidationError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({
  email: z.email("Enter a valid email address"),
});

type FormValues = z.infer<typeof schema>;

export function ForgotPasswordForm() {
  const forgot = useForgotPassword();

  const {
    register,
    handleSubmit,
    getValues,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await forgot.mutateAsync(values.email);
    } catch (error) {
      if (isValidationError(error)) {
        const message = error.response?.data.errors?.email?.[0];
        if (message) {
          setError("email", { message });
          return;
        }
      }
      setError("root", { message: apiErrorMessage(error) });
    }
  });

  // The API cannot tell us whether the address exists, so neither can this
  // screen — the same confirmation shows either way, by design.
  if (forgot.isSuccess) {
    return (
      <div className="grid gap-4">
        <div className="flex size-11 items-center justify-center rounded-full bg-fruition-50 text-fruition-700">
          <MailCheck className="size-5" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-950">Check your email</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{forgot.data}</p>
        </div>
        <p className="text-sm leading-6 text-muted-foreground">
          The link expires in 60 minutes. Nothing arrived? Wait a minute, then{" "}
          <button
            type="button"
            onClick={() => forgot.mutate(getValues("email"))}
            className="font-medium text-fruition-700 underline-offset-4 hover:underline"
          >
            send it again
          </button>
          .
        </p>
        <Button variant="outline" render={<Link href="/login" />}>
          Back to sign in
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      {errors.root && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {errors.root.message}
        </p>
      )}
      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          autoFocus
          placeholder="you@company.com"
          {...register("email")}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Sending link..." : "Send reset link"}
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
