"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { authDestination, useRegister } from "@/features/auth/use-auth";
import { mapLaravelErrorsToForm } from "@/lib/forms";
import { legalLink } from "@/lib/site";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";

const schema = z
  .object({
    company_name: z.string().min(2, "Company name is required"),
    name: z.string().min(2, "Your full name is required"),
    email: z.email("Enter a valid email address"),
    phone: z.string().optional(),
    password: z.string().min(8, "At least 8 characters"),
    password_confirmation: z.string(),
    accept_terms: z.boolean().refine((v) => v === true, {
      message: "Please accept the Terms of Service and Privacy Policy",
    }),
  })
  .refine((v) => v.password === v.password_confirmation, {
    message: "Passwords do not match",
    path: ["password_confirmation"],
  });

type FormValues = z.infer<typeof schema>;

const fieldNames = [
  "company_name",
  "name",
  "email",
  "phone",
  "password",
  "password_confirmation",
] as const;

export function RegisterForm() {
  const router = useRouter();
  const registerTenant = useRegister();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { accept_terms: false },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      // accept_terms is a client-side gate only; the API has no field for it.
      const me = await registerTenant.mutateAsync({
        company_name: values.company_name,
        name: values.name,
        email: values.email,
        phone: values.phone,
        password: values.password,
        password_confirmation: values.password_confirmation,
      });
      router.replace(authDestination(me));
    } catch (error) {
      mapLaravelErrorsToForm(error, setError, fieldNames);
    }
  });

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      {errors.root && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {errors.root.message}
        </p>
      )}
      <div className="grid gap-2">
        <Label htmlFor="company_name">Company name</Label>
        <Input
          id="company_name"
          placeholder="Acme Industries Ltd"
          {...register("company_name")}
        />
        {errors.company_name && (
          <p className="text-sm text-destructive">{errors.company_name.message}</p>
        )}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="name">Your full name</Label>
        <Input
          id="name"
          autoComplete="name"
          placeholder="Ada Okafor"
          {...register("name")}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="email">Work email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          {...register("email")}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="phone">Phone (optional)</Label>
        <Input
          id="phone"
          type="tel"
          autoComplete="tel"
          placeholder="+234 801 234 5678"
          {...register("phone")}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="password">Password</Label>
        <PasswordInput
          id="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          {...register("password")}
        />
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        )}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="password_confirmation">Confirm password</Label>
        <PasswordInput
          id="password_confirmation"
          autoComplete="new-password"
          placeholder="Repeat your password"
          {...register("password_confirmation")}
        />
        {errors.password_confirmation && (
          <p className="text-sm text-destructive">
            {errors.password_confirmation.message}
          </p>
        )}
      </div>
      <div className="grid gap-2">
        <label
          htmlFor="accept_terms"
          className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-3 text-sm leading-6 text-slate-700"
        >
          <input
            id="accept_terms"
            type="checkbox"
            className="mt-1 size-4 shrink-0 accent-fruition-700"
            aria-invalid={Boolean(errors.accept_terms)}
            {...register("accept_terms")}
          />
          <span>
            I have read and agree to the{" "}
            <a
              href={legalLink.terms}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-fruition-700 underline underline-offset-4"
            >
              Terms of Service
            </a>{" "}
            and{" "}
            <a
              href={legalLink.privacy}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-fruition-700 underline underline-offset-4"
            >
              Privacy Policy
            </a>
            .
          </span>
        </label>
        {errors.accept_terms && (
          <p className="text-sm text-destructive">
            {errors.accept_terms.message}
          </p>
        )}
      </div>
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Creating your workspace..." : "Create account"}
      </Button>
    </form>
  );
}
