"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, MailCheck, RefreshCw } from "lucide-react";

import { authDestination, useMe, useResendVerificationCode, useVerifyEmail } from "@/features/auth/use-auth";
import { apiErrorMessage, isValidationError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function VerificationPage() {
  const router = useRouter();
  const { data: me, isPending } = useMe();
  const verify = useVerifyEmail();
  const resend = useResendVerificationCode();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(60);

  useEffect(() => {
    if (!isPending && !me) router.replace("/login");
    else if (me?.is_email_verified) router.replace(authDestination(me));
  }, [isPending, me, router]);

  useEffect(() => {
    if (seconds <= 0) return;
    const timer = window.setInterval(() => setSeconds((value) => value - 1), 1000);
    return () => window.clearInterval(timer);
  }, [seconds]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    try {
      const updated = await verify.mutateAsync(code);
      router.replace(authDestination(updated));
    } catch (requestError) {
      if (isValidationError(requestError)) {
        setError(requestError.response?.data.errors?.code?.[0] ?? "Check the code and try again.");
      } else setError(apiErrorMessage(requestError));
    }
  }

  async function resendCode() {
    setError(null);
    try {
      await resend.mutateAsync();
      setSeconds(60);
    } catch (requestError) {
      setError(apiErrorMessage(requestError));
    }
  }

  if (isPending || !me || me.is_email_verified) {
    return <div className="grid min-h-screen place-items-center"><Loader2 className="size-6 animate-spin text-primary" /></div>;
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4 py-10">
      <section className="w-full max-w-md border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex size-11 items-center justify-center rounded-md bg-emerald-50 text-emerald-700">
          <MailCheck className="size-6" />
        </div>
        <h1 className="mt-5 text-2xl font-bold text-slate-950">Verify your work email</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          We sent a six-digit code to <span className="font-medium text-slate-900">{me.email}</span>. It expires in 10 minutes.
        </p>

        <form onSubmit={submit} className="mt-6 grid gap-4">
          <Input
            aria-label="Verification code"
            autoComplete="one-time-code"
            inputMode="numeric"
            maxLength={6}
            placeholder="000000"
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
            className="h-12 text-center text-xl font-semibold tracking-[0.35em]"
          />
          {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={code.length !== 6 || verify.isPending} className="w-full">
            {verify.isPending ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
            Verify email
          </Button>
        </form>

        <div className="mt-5 flex items-center justify-between border-t pt-5 text-sm">
          <span className="text-slate-500">Didn&apos;t receive it?</span>
          <Button type="button" variant="ghost" size="sm" disabled={seconds > 0 || resend.isPending} onClick={resendCode}>
            <RefreshCw className={resend.isPending ? "size-4 animate-spin" : "size-4"} />
            {seconds > 0 ? `Resend in ${seconds}s` : "Resend code"}
          </Button>
        </div>
      </section>
    </main>
  );
}
