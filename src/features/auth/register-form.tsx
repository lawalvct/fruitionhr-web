"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useRegister } from "@/features/auth/use-auth";
import { apiErrorMessage, isValidationError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z
  .object({
    company_name: z.string().min(2, "Company name is required"),
    name: z.string().min(2, "Your full name is required"),
    email: z.email("Enter a valid email address"),
    phone: z.string().optional(),
    password: z.string().min(8, "At least 8 characters"),
    password_confirmation: z.string(),
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
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await registerTenant.mutateAsync(values);
      router.replace("/dashboard");
    } catch (error) {
      if (isValidationError(error)) {
        const fieldErrors = error.response?.data.errors ?? {};
        for (const [field, messages] of Object.entries(fieldErrors)) {
          if ((fieldNames as readonly string[]).includes(field)) {
            setError(field as (typeof fieldNames)[number], {
              message: messages[0],
            });
          }
        }
        return;
      }
      setError("root", { message: apiErrorMessage(error) });
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
        <Input id="company_name" placeholder="Acme Industries Ltd" {...register("company_name")} />
        {errors.company_name && (
          <p className="text-sm text-destructive">{errors.company_name.message}</p>
        )}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="name">Your full name</Label>
        <Input id="name" autoComplete="name" {...register("name")} />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="email">Work email</Label>
        <Input id="email" type="email" autoComplete="email" {...register("email")} />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="phone">Phone (optional)</Label>
        <Input id="phone" type="tel" autoComplete="tel" {...register("phone")} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" type="password" autoComplete="new-password" {...register("password")} />
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        )}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="password_confirmation">Confirm password</Label>
        <Input
          id="password_confirmation"
          type="password"
          autoComplete="new-password"
          {...register("password_confirmation")}
        />
        {errors.password_confirmation && (
          <p className="text-sm text-destructive">
            {errors.password_confirmation.message}
          </p>
        )}
      </div>
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Creating your workspace…" : "Create account"}
      </Button>
    </form>
  );
}
