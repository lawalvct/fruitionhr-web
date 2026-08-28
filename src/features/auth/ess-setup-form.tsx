"use client";

import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { api, apiErrorMessage, ensureCsrf } from "@/lib/api";

export function EssSetupForm() {
  const params = useSearchParams();
  const email = params.get("email") ?? "";
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const setup = useMutation({
    mutationFn: async () => {
      await ensureCsrf();
      await api.post("/api/v1/ess-invitations/accept", { email, token, password, password_confirmation: confirmation });
    },
  });

  if (setup.isSuccess) {
    return <div className="space-y-4 text-center"><h1 className="text-2xl font-bold">Your ESS account is ready</h1><p className="text-sm text-muted-foreground">Sign in with <strong>{email}</strong> to access your profile, leave, attendance, and payslips.</p><Button render={<Link href="/login" />}>Continue to sign in</Button></div>;
  }

  return (
    <form className="grid gap-4" onSubmit={(event) => { event.preventDefault(); setup.mutate(); }}>
      <div><h1 className="text-2xl font-bold">Set up your employee account</h1><p className="mt-2 text-sm text-muted-foreground">Create a password for {email || "your FruitionHR login"}.</p></div>
      {setup.isError && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{apiErrorMessage(setup.error)}</p>}
      {(!email || !token) && <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">This invitation link is incomplete. Ask HR to resend it.</p>}
      <div className="grid gap-2"><Label htmlFor="password">Password</Label><PasswordInput id="password" autoComplete="new-password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} required /></div>
      <div className="grid gap-2"><Label htmlFor="confirmation">Confirm password</Label><PasswordInput id="confirmation" autoComplete="new-password" minLength={8} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required /></div>
      <Button type="submit" disabled={setup.isPending || !email || !token || password.length < 8 || password !== confirmation}>{setup.isPending ? "Setting up…" : "Set password"}</Button>
      <Link href="/login" className="text-center text-sm text-fruition-700 hover:underline">Back to sign in</Link>
    </form>
  );
}
